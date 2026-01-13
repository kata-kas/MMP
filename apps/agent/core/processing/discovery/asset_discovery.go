package discovery

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/runtime"
)

type RecursiveAssetDiscoverer struct {
	ctx    context.Context
	logger *zap.Logger
}

func NewAssetDiscoverer(ctx context.Context, logger *zap.Logger) *RecursiveAssetDiscoverer {
	return &RecursiveAssetDiscoverer{
		ctx:    ctx,
		logger: logger,
	}
}

func (d *RecursiveAssetDiscoverer) DiscoverFS(root string) error {
	fsName := "default"
	fsRoot := root

	// Mark all assets in this filesystem as unseen
	if err := database.SetDirtyFS(fsName); err != nil {
		d.logger.Warn("failed to set dirty FS", zap.Error(err))
	}

	// Discover recursively
	_, err := d.discoverPath(fsName, fsRoot, "", nil)
	if err != nil {
		return fmt.Errorf("failed to discover filesystem: %w", err)
	}

	// Delete unseen assets
	if err := database.DeleteUnseenInFS(fsName); err != nil {
		d.logger.Warn("failed to delete unseen assets", zap.Error(err))
	}

	return nil
}

func (d *RecursiveAssetDiscoverer) discoverPath(fsName, fsRoot, relPath string, parent *entities.Asset) (*entities.Asset, error) {
	fullPath := filepath.Join(fsRoot, relPath)
	if relPath == "" {
		fullPath = fsRoot
	}

	info, err := os.Stat(fullPath)
	if err != nil {
		return nil, err
	}

	// Create asset
	asset := entities.NewAsset(fsName, fsRoot, relPath, info.IsDir(), parent)
	seen := true
	asset.SeenOnScan = &seen

	// Save asset
	if err := database.SaveAsset(asset); err != nil {
		d.logger.Warn("failed to save asset", zap.String("path", relPath), zap.Error(err))
	} else {
		d.logger.Debug("discovered asset", zap.String("path", relPath), zap.String("node_kind", string(asset.NodeKind)))
	}

	// If directory, discover children
	if info.IsDir() {
		entries, err := os.ReadDir(fullPath)
		if err != nil {
			return asset, err
		}

		for _, entry := range entries {
			if shouldSkipFile(entry.Name()) {
				continue
			}

			childPath := filepath.Join(relPath, entry.Name())
			if relPath == "" {
				childPath = entry.Name()
			}

			_, err := d.discoverPath(fsName, fsRoot, childPath, asset)
			if err != nil {
				d.logger.Warn("failed to discover child", zap.String("path", childPath), zap.Error(err))
				continue
			}
		}
	}

	return asset, nil
}

func shouldSkipFile(name string) bool {
	if strings.HasPrefix(name, ".") {
		if runtime.Cfg.Library.IgnoreDotFiles {
			return true
		}
	}

	for _, blacklist := range runtime.Cfg.Library.Blacklist {
		if strings.HasSuffix(name, blacklist) {
			return true
		}
	}

	return false
}
