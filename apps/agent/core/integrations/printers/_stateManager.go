package printers

import (
	"github.com/duke-git/lancet/v2/maputil"
	models "github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/integrations/klipper"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

type Publisher interface {
	Start() error
	Close()
	Produce() ([]*models.PrinterStatus, error)
	OnNewSub()
}

type stateManager struct {
	printer     *models.Printer
	publisher   Publisher
	subscribers *maputil.ConcurrentMap[string, *subscriber]
	sub         chan *subscriber
	unSub       chan string
	done        chan struct{}
}

type subscriber struct {
	id     string
	status chan *models.PrinterStatus
}

func (s *stateManager) managerRoutine() {
	defer logger.GetLogger().Debug("manager routine goodbye", zap.String("printer_name", s.printer.Name))
	for {
		select {

		case sub := <-s.sub:
			s.subscribers.Set(sub.id, sub)
			go s.publisher.OnNewSub()
			logger.GetLogger().Debug("subscriber added", zap.String("printer_name", s.printer.Name))

		case id := <-s.unSub:
			s.subscribers.Delete(id)
			logger.GetLogger().Debug("subscriber removed", zap.String("printer_name", s.printer.Name))
			len := 0
			s.subscribers.Range(func(_ string, _ *subscriber) bool {
				len++
				return true
			})
			if len == 0 {
				stateManagers.Delete(s.printer.UUID)
				close(s.done)
			}

		case <-s.done:
			s.publisher.Close()
			s.subscribers.Range(func(_ string, sub *subscriber) bool {
				close(sub.status)
				return true
			})
			stateManagers.Delete(s.printer.UUID)
			return

		default:
			statusList, err := s.publisher.Produce()
			if err != nil {
				close(s.done)
				continue
			}
			for _, status := range statusList {
				s.subscribers.Range(func(_ string, sub *subscriber) bool {
					select {
					case sub.status <- status:
					default:
						logger.GetLogger().Warn("status channel full", zap.String("printer_name", s.printer.Name))
					}
					return true
				})
			}
		}
	}
}

var stateManagers = maputil.NewConcurrentMap[string, *stateManager](100)

func GetStateManager(p *models.Printer) (<-chan *models.PrinterStatus, func(), error) {
	sub := &subscriber{
		id:     uuid.New().String(),
		status: make(chan *models.PrinterStatus, 10),
	}
	sm, ok := stateManagers.Get(p.UUID)
	if !ok {
		var publisher Publisher
		if p.Type == "klipper" {
			publisher = klipper.GetStatePublisher(p)

		}
		if err := publisher.Start(); err != nil {
			return nil, nil, err
		}

		sm = &stateManager{
			printer:     p,
			publisher:   publisher,
			sub:         make(chan *subscriber),
			unSub:       make(chan string),
			done:        make(chan struct{}),
			subscribers: maputil.NewConcurrentMap[string, *subscriber](10),
		}

		stateManagers.Set(p.UUID, sm)

		go sm.managerRoutine()
	}
	sm.sub <- sub

	return sub.status, func() {
		sm.unSub <- sub.id
	}, nil
}
