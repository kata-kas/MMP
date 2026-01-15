package events

import (
	"context"
	"fmt"
	"sync"
	"time"

	"go.uber.org/zap"
)

const (
	sessionBufferSize = 100
	sendTimeout       = 100 * time.Millisecond
)

type session struct {
	id            string
	out           chan *Message
	subscriptions map[string]struct{}
}

type topicState struct {
	publisher   Publisher
	subscribers map[string]*session
	cancel      context.CancelFunc
}

type Manager struct {
	sessions sync.Map // string -> *session
	topics   sync.Map // string -> *topicState
	log      *zap.Logger
}

type Publisher interface {
	Start(context.Context) error
	Stop() error
	OnNewSubscriber() error
	Messages() <-chan *Message
}

func NewManager(log *zap.Logger) *Manager {
	return &Manager{log: log}
}

func (m *Manager) RegisterSession(id string) (<-chan *Message, func()) {
	sess := &session{
		id:            id,
		out:           make(chan *Message, sessionBufferSize),
		subscriptions: make(map[string]struct{}),
	}

	m.sessions.Store(id, sess)

	unregister := func() {
		m.sessions.Delete(id)

		for topic := range sess.subscriptions {
			m.unsubscribe(id, topic)
		}

		close(sess.out)
	}

	return sess.out, unregister
}

func (m *Manager) Subscribe(sessionID, topic string, publisher Publisher) error {
	sessVal, ok := m.sessions.Load(sessionID)
	if !ok {
		return fmt.Errorf("session %s not found", sessionID)
	}
	sess := sessVal.(*session)

	ts, loaded := m.topics.LoadOrStore(topic, &topicState{
		publisher:   publisher,
		subscribers: make(map[string]*session),
	})
	topicState := ts.(*topicState)

	if !loaded {
		ctx, cancel := context.WithCancel(context.Background())
		topicState.cancel = cancel

		if err := publisher.Start(ctx); err != nil {
			m.topics.Delete(topic)
			cancel()
			return fmt.Errorf("failed to start publisher for %s: %w", topic, err)
		}

		go m.runPublisher(ctx, topic, topicState)
	}

	topicState.subscribers[sessionID] = sess
	sess.subscriptions[topic] = struct{}{}

	go func() {
		if err := publisher.OnNewSubscriber(); err != nil {
			m.log.Error("OnNewSubscriber failed",
				zap.String("topic", topic),
				zap.Error(err))
		}
	}()

	return nil
}

func (m *Manager) Unsubscribe(sessionID, topic string) {
	m.unsubscribe(sessionID, topic)
}

func (m *Manager) unsubscribe(sessionID, topic string) {
	tsVal, ok := m.topics.Load(topic)
	if !ok {
		return
	}
	ts := tsVal.(*topicState)

	delete(ts.subscribers, sessionID)

	if sessVal, ok := m.sessions.Load(sessionID); ok {
		sess := sessVal.(*session)
		delete(sess.subscriptions, topic)
	}

	if len(ts.subscribers) == 0 {
		m.topics.Delete(topic)
		ts.cancel()

		if err := ts.publisher.Stop(); err != nil {
			m.log.Error("failed to stop publisher",
				zap.String("topic", topic),
				zap.Error(err))
		}
	}
}

func (m *Manager) runPublisher(ctx context.Context, topic string, ts *topicState) {
	defer func() {
		m.topics.Delete(topic)

		for _, sess := range ts.subscribers {
			delete(sess.subscriptions, topic)
		}
	}()

	for {
		select {
		case <-ctx.Done():
			m.log.Debug("publisher stopped", zap.String("topic", topic))
			return

		case msg, ok := <-ts.publisher.Messages():
			if !ok {
				m.log.Info("publisher closed", zap.String("topic", topic))
				return
			}

			if len(ts.subscribers) == 0 {
				m.log.Debug("no subscribers, stopping publisher",
					zap.String("topic", topic))
				return
			}

			m.broadcast(topic, ts, msg)
		}
	}
}

func (m *Manager) broadcast(topic string, ts *topicState, msg *Message) {
	for id, sess := range ts.subscribers {
		select {
		case sess.out <- msg:
		case <-time.After(sendTimeout):
			m.log.Warn("subscriber slow, skipping message",
				zap.String("topic", topic),
				zap.String("session_id", id))
		}
	}
}
