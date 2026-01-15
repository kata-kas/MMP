package events

import (
	"context"
	"net/http"
	"time"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

const (
	connectDelay    = 500 * time.Millisecond
	heartbeatPeriod = 30 * time.Second
)

func index(c echo.Context) error {
	c.Response().Header().Set(echo.HeaderContentType, "text/event-stream")
	c.Response().Header().Set(echo.HeaderCacheControl, "no-cache")
	c.Response().Header().Set(echo.HeaderConnection, "keep-alive")
	c.Response().WriteHeader(http.StatusOK)

	sessionID := uuid.New().String()
	log := logger.GetLogger().With(
		zap.String("session_id", sessionID),
		zap.String("remote_addr", c.RealIP()),
	)

	sender := NewSSESender(c.Response())
	ctx := c.Request().Context()

	eventChan, unregister := RegisterSession(sessionID)
	defer unregister()

	if err := sendConnectMessage(ctx, sender, sessionID, log); err != nil {
		log.Error("failed to send connect message", zap.Error(err))
		return err
	}

	heartbeat := time.NewTicker(heartbeatPeriod)
	defer heartbeat.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Debug("client disconnected")
			return nil

		case event, ok := <-eventChan:
			if !ok {
				log.Debug("event stream closed by server")
				return nil
			}
			if err := sender.send(event); err != nil {
				log.Error("failed to send event",
					zap.String("event", event.Event),
					zap.Error(err))
				return err
			}

		case <-heartbeat.C:
			if err := sender.send(&Message{Event: "heartbeat"}); err != nil {
				log.Debug("heartbeat failed, client likely disconnected", zap.Error(err))
				return err
			}
		}
	}
}

func sendConnectMessage(ctx context.Context, sender *SSESender, sessionID string, log *zap.Logger) error {
	timer := time.NewTimer(connectDelay)
	defer timer.Stop()

	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-timer.C:
		return sender.send(&Message{
			Event: "connect",
			Data: map[string]string{
				"session_id": sessionID,
			},
		})
	}
}
