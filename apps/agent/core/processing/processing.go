package processing

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/processing/discovery"
	"github.com/eduardooliveira/stLib/core/runtime"
)

func ProcessFolder(ctx context.Context, root string, logger *zap.Logger) error {
	tempPath := filepath.Clean(filepath.Join(runtime.GetDataPath(), "assets"))
	if _, err := os.Stat(tempPath); os.IsNotExist(err) {
		err := os.MkdirAll(tempPath, os.ModePerm)
		if err != nil {
			return fmt.Errorf("failed to create assets directory: %w", err)
		}
	}

	// Use new asset discovery
	discoverer := discovery.NewAssetDiscoverer(ctx, logger)
	if err := discoverer.DiscoverFS(root); err != nil {
		return fmt.Errorf("failed to discover assets: %w", err)
	}

	logger.Info("asset discovery finished")
	return nil
}
