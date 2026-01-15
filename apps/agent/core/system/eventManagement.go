package system

import (
	"context"
	"sync"
	"sync/atomic"
	"time"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/events"
	"github.com/eduardooliveira/stLib/core/logger"
)

type systemEvent struct {
	Name  string `json:"name"`
	State any    `json:"state"`
}

type eventManagement struct {
	mu  sync.Mutex
	out chan *events.Message
}

func (em *eventManagement) Start(ctx context.Context) error {
	em.mu.Lock()
	if em.out != nil {
		em.mu.Unlock()
		return nil
	}
	out := make(chan *events.Message, 100)
	em.out = out
	em.mu.Unlock()

	eventName := "system.state"
	go func() {
		defer func() {
			em.mu.Lock()
			if em.out == out {
				em.out = nil
			}
			em.mu.Unlock()
			close(out)
		}()

		for {
			select {
			case <-ctx.Done():
				return
			case m := <-systemEvents:
				select {
				case out <- &events.Message{
					Event: eventName,
					Data:  m,
				}:
					logger.GetLogger().Debug("system event sent", zap.String("event_name", eventName))
				default:
					logger.GetLogger().Warn("system event channel full", zap.String("event_name", eventName))
				}
			}
		}
	}()
	return nil
}
func (em *eventManagement) Stop() error {
	return nil
}
func (em *eventManagement) OnNewSubscriber() error {
	return nil
}

func (em *eventManagement) Messages() <-chan *events.Message {
	em.mu.Lock()
	out := em.out
	em.mu.Unlock()
	return out
}

var (
	eventManager *eventManagement
	systemEvents chan *systemEvent
	droppedCount int64
	lastLogTime  int64
	logInterval  = int64(5 * time.Second) // Log at most once every 5 seconds
)

func GetEventPublisher() *eventManagement {
	return eventManager
}

func init() {
	eventManager = &eventManagement{}
	systemEvents = make(chan *systemEvent, 1000) // Increased buffer size
	lastLogTime = time.Now().UnixNano()
}

func Publish(name string, data any) {
	select {
	case systemEvents <- &systemEvent{
		Name:  name,
		State: data,
	}:
	default:
		atomic.AddInt64(&droppedCount, 1)
		now := time.Now().UnixNano()
		lastTime := atomic.LoadInt64(&lastLogTime)
		if now-lastTime > logInterval {
			if atomic.CompareAndSwapInt64(&lastLogTime, lastTime, now) {
				count := atomic.SwapInt64(&droppedCount, 0)
				logger.GetLogger().Warn("dropped system events",
					zap.String("event_name", name),
					zap.Int64("count", count),
				)
			}
		}
	}
}
