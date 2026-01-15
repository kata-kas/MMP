package klipper

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"strings"
	"sync"

	"go.uber.org/zap"

	"github.com/duke-git/lancet/v2/maputil"
	models "github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/events"
	printerModels "github.com/eduardooliveira/stLib/core/integrations/models"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/gorilla/websocket"
)

type statePublisher struct {
	mu       sync.Mutex
	printer  *KlipperPrinter
	onNewSub chan struct{}
	conn     *websocket.Conn
	messages chan *events.Message
}

func GetStatePublisher(printer *models.Printer) *statePublisher {
	kp := &KlipperPrinter{printer}
	return &statePublisher{
		printer:  kp,
		onNewSub: make(chan struct{}, 1),
	}
}

func (p *statePublisher) Start(ctx context.Context) error {
	u, err := url.Parse(p.printer.Address)
	if err != nil {
		logger.GetLogger().Error("failed to parse printer address", zap.String("address", p.printer.Address), zap.Error(err))
		return err
	}

	u.Scheme = "ws"
	u.Path = "/websocket"

	logger.GetLogger().Info("connecting to klipper", zap.String("url", u.String()))
	conn, _, err := websocket.DefaultDialer.Dial(u.String(), nil)
	if err != nil {
		logger.GetLogger().Error("failed to dial websocket", zap.String("url", u.String()), zap.Error(err))
		return err
	}

	msgs := make(chan *events.Message, 10)
	p.mu.Lock()
	p.conn = conn
	p.messages = msgs
	p.mu.Unlock()

	_ = conn.WriteMessage(websocket.TextMessage, []byte("{\"jsonrpc\":\"2.0\",\"method\":\"printer.objects.subscribe\",\"params\":{\"objects\":{\"heaters\":null,\"idle_timeout\":null,\"print_stats\":null,\"display_status\":null,\"heater_bed\":null,\"fan\":null,\"heater_fan toolhead_cooling_fan\":null,\"extruder\":null}},\"id\":1}"))

	go p.onNewSubscriberLoop(ctx, conn)
	go p.readLoop(ctx, conn, msgs)

	return nil
}

func (p *statePublisher) Messages() <-chan *events.Message {
	p.mu.Lock()
	ch := p.messages
	p.mu.Unlock()
	return ch
}

func (p *statePublisher) readLoop(ctx context.Context, conn *websocket.Conn, out chan *events.Message) {
	defer close(out)

	eventName := fmt.Sprintf("printer.update.%s", p.printer.UUID)

	for {
		select {
		case <-ctx.Done():
			return
		default:
			_, message, err := conn.ReadMessage()
			if err != nil {
				logger.GetLogger().Error("websocket read error", zap.String("printer_uuid", p.printer.UUID), zap.Error(err))
				return
			}

			kpStatusString := string(message)
			if strings.Contains(kpStatusString, "notify_proc_stat_update") {
				continue
			}

			if strings.Contains(kpStatusString, "notify_status_update") {
				select {
				case out <- &events.Message{
					Event: eventName,
					Data:  p.parseNotifyStatusUpdate(message),
				}:
				default:
					logger.GetLogger().Warn("status update channel full", zap.String("printer_uuid", p.printer.UUID))
				}
			}
			if strings.Contains(kpStatusString, "result") {
				logger.GetLogger().Debug("klipper status update", zap.String("printer_uuid", p.printer.UUID))
				select {
				case out <- &events.Message{
					Event: eventName,
					Data:  p.parseResult(message),
				}:
				default:
					logger.GetLogger().Warn("status update channel full", zap.String("printer_uuid", p.printer.UUID))
				}
			}
		}
	}
}

func (p *statePublisher) onNewSubscriberLoop(ctx context.Context, conn *websocket.Conn) {
	for {
		select {
		case <-ctx.Done():
			return
		case <-p.onNewSub:
			_ = conn.WriteMessage(websocket.TextMessage, []byte("{\"jsonrpc\": \"2.0\",\"method\": \"printer.objects.query\",\"params\": {\"objects\": {\"extruder\": null,\"heater_bed\": null, \"print_stats\":null, \"display_status\": null}},\"id\": 2}"))
		}
	}
}

func (p *statePublisher) OnNewSubscriber() error {
	select {
	case p.onNewSub <- struct{}{}:
	default:
	}
	return nil
}

func (p *statePublisher) Stop() error {
	logger.GetLogger().Debug("stopping state publisher", zap.String("printer_uuid", p.printer.UUID))
	p.mu.Lock()
	conn := p.conn
	p.conn = nil
	p.mu.Unlock()
	if conn != nil {
		_ = conn.Close()
	}
	return nil
}

func addToStatus(name string, state map[string]any, status map[string]*models.PrinterStatus) {

	switch name {
	case "heater_bed":
		status["bed"] = &models.PrinterStatus{
			Name:  "bed",
			State: &printerModels.TemperatureStatus{},
		}
		handleThermalValue("bed", state, status)
	case "extruder":
		status["extruder"] = &models.PrinterStatus{
			Name:  "extruder",
			State: &printerModels.TemperatureStatus{},
		}
		handleThermalValue("extruder", state, status)
	case "print_stats":
		var ok bool
		_, ok = status["job_status"]
		if !ok {
			status["job_status"] = &models.PrinterStatus{
				Name:  "job_status",
				State: &printerModels.JobStatus{},
			}
		}
		current := status["job_status"].State.(*printerModels.JobStatus)
		if v, ok := state["total_duration"].(float64); ok {
			current.TotalDuration = v
		}
		if v, ok := state["filename"].(string); ok {
			current.FileName = v
		}
	case "display_status":
		var ok bool
		_, ok = status["job_status"]
		if !ok {
			status["job_status"] = &models.PrinterStatus{
				Name:  "job_status",
				State: &printerModels.JobStatus{},
			}
		}
		current := status["job_status"].State.(*printerModels.JobStatus)
		if v, ok := state["message"].(string); ok {
			current.Message = v
		}
		if v, ok := state["progress"].(float64); ok {
			current.Progress = v
		}

	}

}

func handleThermalValue(key string, values map[string]any, status map[string]*models.PrinterStatus) {
	if v, ok := values["temperature"].(float64); ok {
		status[key].State.(*printerModels.TemperatureStatus).Temperature = v
	}
	if v, ok := values["target"].(float64); ok {
		status[key].State.(*printerModels.TemperatureStatus).Target = v
	}
	if v, ok := values["power"].(float64); ok {
		status[key].State.(*printerModels.TemperatureStatus).Power = v
	}
}

func (p *statePublisher) parseNotifyStatusUpdate(message []byte) []*models.PrinterStatus {
	var kpStatusUpdate *statusUpdate
	err := json.Unmarshal(message, &kpStatusUpdate)
	if err != nil {
		logger.GetLogger().Error("failed to parse notify status update", zap.String("printer_uuid", p.printer.UUID), zap.Error(err))
		return nil
	}

	status := make(map[string]*models.PrinterStatus, 0)
	for _, p := range kpStatusUpdate.Params {
		if param, ok := p.(map[string]any); ok {
			for k, v := range param {
				addToStatus(k, v.(map[string]any), status)
			}
		}
	}
	return maputil.Values(status)
}

func (p *statePublisher) parseResult(message []byte) []*models.PrinterStatus {
	var pkResult *result
	err := json.Unmarshal(message, &pkResult)
	if err != nil {
		logger.GetLogger().Error("failed to parse result", zap.String("printer_uuid", p.printer.UUID), zap.Error(err))
		return nil
	}

	status := make(map[string]*models.PrinterStatus, 0)
	for k, v := range pkResult.Result.Status {
		addToStatus(k, v, status)
	}
	return maputil.Values(status)
}
