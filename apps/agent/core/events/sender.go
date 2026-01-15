package events

import (
	"net/http"
)

type SSESender struct {
	w       http.ResponseWriter
	flusher http.Flusher
}

func NewSSESender(w http.ResponseWriter) *SSESender {
	flusher, _ := w.(http.Flusher)
	return &SSESender{w: w, flusher: flusher}
}

func (s *SSESender) send(msg *Message) error {
	if err := msg.WriteToSSE(s.w); err != nil {
		return err
	}
	if s.flusher != nil {
		s.flusher.Flush()
	}
	return nil
}
