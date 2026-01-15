package processing

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"

	"github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/libfs"
	"github.com/eduardooliveira/stLib/core/processing/discovery"
	"github.com/eduardooliveira/stLib/core/runtime"
)

type ProcessorWrapper struct {
	p *Processor
}

func (pw *ProcessorWrapper) Process(ctx context.Context, asset *entities.Asset) {
	pw.p.Process(ctx, asset)
}

func ScanFS(ctx context.Context, logger *zap.Logger) error {
	tempPath := filepath.Clean(filepath.Join(runtime.GetDataPath(), "assets"))
	if _, err := os.Stat(tempPath); os.IsNotExist(err) {
		err := os.MkdirAll(tempPath, os.ModePerm)
		if err != nil {
			return fmt.Errorf("failed to create assets directory: %w", err)
		}
	}

	proc, err := NewProcessor()
	if err != nil {
		return fmt.Errorf("failed to initialize processor: %w", err)
	}

	discoverer := discovery.NewAssetDiscoverer(ctx, logger, &ProcessorWrapper{p: proc})

	eg, _ := errgroup.WithContext(ctx)
	for _, ffs := range libfs.GetFSs() {
		f := ffs
		eg.Go(func() error {
			if err := discoverer.DiscoverFS(f); err != nil {
				logger.Error("failed to discover assets", zap.String("fs", f.GetName()), zap.Error(err))
				return err
			}
			return nil
		})
	}

	if err := eg.Wait(); err != nil {
		return fmt.Errorf("discovery cycle finished with errors: %w", err)
	}

	if err := proc.Wait(); err != nil {
		logger.Error("processing errors", zap.Error(err))
	}

	logger.Info("asset discovery finished")
	return nil
}
