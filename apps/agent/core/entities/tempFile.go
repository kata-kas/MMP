package entities

import "github.com/google/uuid"

type TempFile struct {
	UUID    string   `json:"uuid" toml:"uuid" form:"uuid" query:"uuid"`
	Name    string   `json:"name" toml:"name" form:"name" query:"name"`
	AssetID string   `json:"asset_id" toml:"asset_id" form:"asset_id" query:"asset_id"` // Parent asset ID to move file to
	Matches []string `json:"matches" toml:"matches" form:"matches" query:"matches"`
}

func NewTempFile(fileName string) (*TempFile, error) {
	return &TempFile{
		UUID:    uuid.New().String(),
		Name:    fileName,
		Matches: make([]string, 0),
	}, nil
}

func (tp *TempFile) AddMatch(match string) {
	for _, s := range tp.Matches {
		if s == match {
			return
		}
	}
	tp.Matches = append(tp.Matches, match)
}
