package renderers

import (
	"context"
	"strings"

	"github.com/eduardooliveira/stLib/core/entities"
)

type Renderer interface {
	Render(ctx context.Context, asset *entities.Asset) (*entities.Asset, error)
}

var (
	renderers = make(map[string]Renderer)
)

func Register(ext string, r Renderer) {
	renderers[ext] = r
}

func Get(asset *entities.Asset) (Renderer, bool) {
	if asset.Extension == nil {
		return nil, false
	}
	r, ok := renderers[strings.ToLower(*asset.Extension)]
	return r, ok
}

func Init() {
	Register(".stl", NewSTLRenderer())
	Register(".gcode", &gCodeRenderer{})
}
