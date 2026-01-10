package events

import (
	"errors"
	"sync"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/logger"
)

type session struct {
	ID            string
	Out           chan *Message
	subscriptions map[string]struct{}
}

type stateType struct {
	sessions      map[string]*session
	subscriptions map[string]map[string]*session
	publishers    map[string]Publisher
	globalLock    sync.Mutex
}

type Publisher interface {
	Start() error
	Stop() error
	OnNewSub() error
	Read() chan *Message
}

var state *stateType

func init() {
	state = &stateType{
		sessions:      make(map[string]*session),
		subscriptions: make(map[string]map[string]*session),
		publishers:    make(map[string]Publisher),
		globalLock:    sync.Mutex{},
	}
}

func RegisterSession(id string) (chan *Message, func()) {
	state.globalLock.Lock()
	defer state.globalLock.Unlock()
	state.sessions[id] = &session{
		ID:            id,
		Out:           make(chan *Message, 100),
		subscriptions: make(map[string]struct{}, 0),
	}
	return state.sessions[id].Out, func() {
		state.globalLock.Lock()
		defer state.globalLock.Unlock()

		for topic := range state.sessions[id].subscriptions {
			delete(state.subscriptions[topic], id)
			if len(state.subscriptions[topic]) == 0 {
				delete(state.subscriptions, topic)

				delete(state.publishers, topic)
			}
		}
		delete(state.sessions, id)
	}
}

func Subscribe(sessionId string, topic string, publisher Publisher) error {
	state.globalLock.Lock()
	defer state.globalLock.Unlock()

	sess, ok := state.sessions[sessionId]
	if !ok {
		logger.GetLogger().Warn("session not found", zap.String("session_id", sessionId))
		return errors.New("session not found")
	}

	_, ok = state.publishers[topic]
	if !ok {
		err := publisher.Start()
		if err != nil {
			logger.GetLogger().Error("failed to start topic publisher", zap.String("topic", topic), zap.Error(err))
			return err
		}
		state.publishers[topic] = publisher
	}

	if _, ok := state.subscriptions[topic]; !ok {
		state.subscriptions[topic] = make(map[string]*session, 0)
		state.subscriptions[topic][sess.ID] = sess
		go runSubscription(topic)
	} else {
		state.subscriptions[topic][sess.ID] = sess
	}

	state.sessions[sessionId].subscriptions[topic] = struct{}{}

	state.publishers[topic].OnNewSub()
	return nil
}

func UnSubscribe(sessionId string, topic string) {
	state.globalLock.Lock()
	defer state.globalLock.Unlock()

	_, ok := state.subscriptions[topic]
	if !ok {

		return
	}
	delete(state.subscriptions[topic], sessionId)

	delete(state.sessions[sessionId].subscriptions, topic)

	if len(state.subscriptions[topic]) == 0 {
		delete(state.subscriptions, topic)
		pub, ok := state.publishers[topic]
		if ok {
			if err := pub.Stop(); err != nil {
				logger.GetLogger().Error("failed to stop publisher", zap.String("topic", topic), zap.Error(err))
			}
			delete(state.publishers, topic)
		}
	}
}

func runSubscription(topic string) {
	publisher, ok := state.publishers[topic]
	if !ok {
		logger.GetLogger().Warn("publisher not found", zap.String("topic", topic))
		return
	}
	for msg := range publisher.Read() {
		subCount := 0

		for _, sess := range state.subscriptions[topic] {
			subCount++
			sess.Out <- msg

		}

		if subCount == 0 {
			logger.GetLogger().Info("no subscribers found for topic, stopping publisher", zap.String("topic", topic))
			err := publisher.Stop()
			if err != nil {
				logger.GetLogger().Error("failed to stop publisher", zap.String("topic", topic), zap.Error(err))
			}
			return
		}
	}
	state.globalLock.Lock()
	defer state.globalLock.Unlock()
	delete(state.publishers, topic)

	for _, sess := range state.subscriptions[topic] {
		delete(sess.subscriptions, topic)
	}

	delete(state.subscriptions, topic)
}
