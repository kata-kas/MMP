package enrichers

import (
	"context"
	"strings"

	"github.com/eduardooliveira/stLib/core/entities"
)

type Enricher interface {
	Enrich(ctx context.Context, asset *entities.Asset) error
}

var enrichers = map[string]Enricher{}

func Init() error {
	enrichers[".gcode"] = &gCodeEnricher{}
	enrichers[".3mf"] = &mfEnricher{}
	return nil
}

func Get(asset *entities.Asset) (Enricher, bool) {
	if asset.Extension == nil {
		return nil, false
	}
	enricher, ok := enrichers[strings.ToLower(*asset.Extension)]
	return enricher, ok
}
