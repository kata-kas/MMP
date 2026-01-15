package events

import (
	"sync"

	"github.com/eduardooliveira/stLib/core/logger"
)

var (
	defaultManagerOnce sync.Once
	defaultManager     *Manager
)

func DefaultManager() *Manager {
	defaultManagerOnce.Do(func() {
		defaultManager = NewManager(logger.GetLogger().Named("events"))
	})
	return defaultManager
}

func RegisterSession(id string) (<-chan *Message, func()) {
	return DefaultManager().RegisterSession(id)
}

func Subscribe(sessionID, topic string, publisher Publisher) error {
	return DefaultManager().Subscribe(sessionID, topic, publisher)
}

func UnSubscribe(sessionID, topic string) {
	DefaultManager().Unsubscribe(sessionID, topic)
}

func Unsubscribe(sessionID, topic string) {
	DefaultManager().Unsubscribe(sessionID, topic)
}
