package events

import (
	"encoding/json"
	"fmt"
	"io"
)

type Message struct {
	Event string `json:"event"`
	Data  any    `json:"data"`
	ID    string `json:"id"`
	Retry int    `json:"retry"`
}

func (m *Message) WriteToSSE(w io.Writer) error {
	if m.Event != "" {
		if _, err := fmt.Fprintf(w, "event: %s\n", m.Event); err != nil {
			return err
		}
	}

	if m.ID != "" {
		if _, err := fmt.Fprintf(w, "id: %s\n", m.ID); err != nil {
			return err
		}
	}

	if m.Retry > 0 {
		if _, err := fmt.Fprintf(w, "retry: %d\n", m.Retry); err != nil {
			return err
		}
	}

	if m.Data != nil {
		var dataBytes []byte
		var err error

		switch v := m.Data.(type) {
		case string:
			dataBytes = []byte(v)
		case []byte:
			dataBytes = v
		default:
			dataBytes, err = json.Marshal(v)
			if err != nil {
				return fmt.Errorf("failed to marshal data: %w", err)
			}
		}

		if _, err := fmt.Fprintf(w, "data: %s\n", dataBytes); err != nil {
			return err
		}
	}

	if _, err := fmt.Fprint(w, "\n"); err != nil {
		return err
	}

	return nil
}
