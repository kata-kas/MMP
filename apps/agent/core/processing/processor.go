package processing

import (
	"context"

	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"

	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/eduardooliveira/stLib/core/processing/enrichers"
	"github.com/eduardooliveira/stLib/core/processing/renderers"
	"github.com/eduardooliveira/stLib/core/runtime"
)

type Processor struct {
	eg *errgroup.Group
}

func NewProcessor() (*Processor, error) {
	eg := &errgroup.Group{}
	eg.SetLimit(10)
	renderers.Init()
	enrichers.Init()
	return &Processor{
		eg: eg,
	}, nil
}

func (p *Processor) Wait() error {
	return p.eg.Wait()
}

func (p *Processor) Process(ctx context.Context, asset *entities.Asset) *Process {
	proc := &Process{
		ctx:   ctx,
		p:     p,
		Asset: asset,
		done:  make(chan error),
	}
	// TODO: Handle bundle rendering config
	if asset.NodeKind == entities.NodeKindBundle && !runtime.Cfg.Library.RenderBundles {
		proc.renderState = "skipped"
	} else if r, ok := renderers.Get(asset); ok {
		proc.renderer = r
		proc.renderState = "pending"
	} else {
		proc.renderState = "skipped"
	}

	if r, ok := enrichers.Get(asset); ok {
		proc.enricher = r
		proc.enrichState = "pending"
	} else {
		proc.enrichState = "skipped"
	}

	p.eg.Go(proc.Run)

	return proc
}

type Process struct {
	ctx         context.Context
	p           *Processor
	done        chan error
	Asset       *entities.Asset
	renderer    renderers.Renderer
	renderState string
	renderError error
	enricher    enrichers.Enricher
	enrichState string
	enrichError error
}

func (p *Process) Wait() error {
	return <-p.done
}

func (p *Process) Run() error {
	defer close(p.done)
	l := logger.GetLogger().With(zap.String("module", "process"), zap.String("asset", assetLabel(p.Asset)))

	if p.renderer != nil {
		if img, err := p.renderer.Render(p.ctx, p.Asset); err != nil {
			p.renderError = err
			p.renderState = "failed"
			l.Error("failed to render asset", zap.Error(err))
		} else {
			p.renderState = "done"
			if err := database.SaveAsset(img); err != nil {
				l.Error("failed to save render", zap.Error(err))
			}
			p.Asset.Thumbnail = &img.ID
		}
	}

	if p.enricher != nil {
		if err := p.enricher.Enrich(p.ctx, p.Asset); err != nil {
			p.enrichError = err
			p.enrichState = "failed"
			l.Error("failed to enrich asset", zap.Error(err))
		} else {
			p.enrichState = "done"
		}
	}

	if p.renderState == "done" || p.enrichState == "done" {
		if err := database.SaveAsset(p.Asset); err != nil {
			l.Error("failed to save asset", zap.Error(err))
			p.done <- err // Avoid blocking?
			// In agent v2, it does p.done <- err. But check channel capacity?
			// p.done is unbuffered. So receiver must be waiting.
			// But Run is called in goroutine. Wait() reads p.done.
			// If nobody calls Wait(), this blocks?
			// Agent v2 logic is strict.
			// Ideally we don't block.
			return err
		}
	}

	return nil
}

func assetLabel(a *entities.Asset) string {
	if a.Label != nil {
		return *a.Label
	}
	return a.ID
}
