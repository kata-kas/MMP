package events

import (
	"net/http"
	"time"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

func index(c echo.Context) error {
	c.Response().Header().Set(echo.HeaderContentType, "text/event-stream")
	c.Response().WriteHeader(http.StatusOK)
	uuid := uuid.New().String()

	//uuid := "batata"
	sender := NewSSESender(c.Response())

	go func() {

		time.Sleep(500 * time.Millisecond)
		err := sender.send(&Message{
			Event: "connect",
			Data: map[string]string{
				"uuid": uuid,
			},
		})
		if err != nil {
			logger.GetLogger().Error("failed to send connect message", zap.String("session_uuid", uuid), zap.Error(err))
		}
	}()

	eventChan, unregister := RegisterSession(uuid)

	for {
		select {
		case <-c.Request().Context().Done():
			unregister()
			return nil
		case s, ok := <-eventChan:
			if !ok {
				logger.GetLogger().Debug("event channel closed, closing client", zap.String("session_uuid", uuid))
				close(eventChan)
				return nil
			}
			err := sender.send(s)
			if err != nil {
				logger.GetLogger().Error("failed to send event", zap.String("session_uuid", uuid), zap.String("event", s.Event), zap.Error(err))
				return err
			}
		}
	}
}
