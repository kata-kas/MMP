package system

import (
	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/events"
	"github.com/eduardooliveira/stLib/core/logger"
)

type systemEvent struct {
	Name  string `json:"name"`
	State any    `json:"state"`
}

type eventManagement struct {
}

func (em *eventManagement) Start() error {
	return nil
}
func (em *eventManagement) Stop() error {
	return nil
}
func (em *eventManagement) OnNewSub() error {
	return nil
}

func (em *eventManagement) Read() chan *events.Message {
	rtn := make(chan *events.Message, 1)
	eventName := "system.state"
	go func() {
		for {
			m := <-systemEvents
			select {
			case rtn <- &events.Message{
				Event: eventName,
				Data:  m,
			}:
				logger.GetLogger().Debug("system event sent", zap.String("event_name", eventName))
			default:
				logger.GetLogger().Warn("system event channel full", zap.String("event_name", eventName))
			}
		}
	}()

	return rtn
}

var eventManager *eventManagement
var systemEvents chan *systemEvent

func GetEventPublisher() *eventManagement {
	return eventManager
}

func init() {
	eventManager = &eventManagement{}
	systemEvents = make(chan *systemEvent, 100)
}

func Publish(name string, data any) {
	select {
	case systemEvents <- &systemEvent{
		Name:  name,
		State: data,
	}:
	default:
		logger.GetLogger().Warn("dropped system event", zap.String("event_name", name))
	}
}
