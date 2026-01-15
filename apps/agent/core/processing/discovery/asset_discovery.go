package discovery

import (
	"context"
	"fmt"
	"io/fs"
	"path/filepath"
	"strings"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/libfs"
	"github.com/eduardooliveira/stLib/core/runtime"
)

type AssetProcessor interface {
	Process(ctx context.Context, asset *entities.Asset)
}

type RecursiveAssetDiscoverer struct {
	ctx       context.Context
	logger    *zap.Logger
	processor AssetProcessor
}

func NewAssetDiscoverer(ctx context.Context, logger *zap.Logger, processor AssetProcessor) *RecursiveAssetDiscoverer {
	return &RecursiveAssetDiscoverer{
		ctx:       ctx,
		logger:    logger,
		processor: processor,
	}
}

func (d *RecursiveAssetDiscoverer) DiscoverFS(currFS libfs.LibFS) error {
	fsName := currFS.GetName()

	// Mark all assets in this filesystem as unseen
	if err := database.SetDirtyFS(fsName); err != nil {
		d.logger.Warn("failed to set dirty FS", zap.Error(err))
	}

	// Discover recursively
	_, err := d.discoverPath(currFS, ".", nil)
	if err != nil {
		return fmt.Errorf("failed to discover filesystem: %w", err)
	}

	// Delete unseen assets
	if err := database.DeleteUnseenInFS(fsName); err != nil {
		d.logger.Warn("failed to delete unseen assets", zap.Error(err))
	}

	return nil
}

func (d *RecursiveAssetDiscoverer) discoverPath(currFS libfs.LibFS, path string, parent *entities.Asset) (*entities.Asset, error) {
	pathInfo, err := fs.Stat(currFS, path)
	if err != nil {
		return nil, err
	}

	isDir := pathInfo.IsDir()
	isBundle := libfs.IsBundle(path)

	// Create asset using filesystem
	asset := entities.NewAssetWithFS(currFS, currFS.GetName(), currFS.GetRoot(), path, isDir, parent)
	seen := true
	asset.SeenOnScan = &seen

	// Save asset
	if err := database.SaveAsset(asset); err != nil {
		d.logger.Warn("failed to save asset", zap.String("path", path), zap.Error(err))
	} else {
		d.logger.Debug("discovered asset", zap.String("path", path), zap.String("node_kind", string(asset.NodeKind)))
	}

	// If directory or bundle, discover children
	if isDir || isBundle {
		innerFS := currFS
		var files []fs.DirEntry

		if isBundle {
			// Get bundle filesystem
			bundleFS, err := libfs.GetBundleFS(d.ctx, currFS, *asset)
			if err != nil {
				d.logger.Warn("failed to create bundle filesystem", zap.String("path", path), zap.Error(err))
				return asset, nil
			}
			innerFS = bundleFS
			files, err = fs.ReadDir(innerFS, ".")
			if err != nil {
				d.logger.Warn("failed to read bundle contents", zap.String("path", path), zap.Error(err))
				return asset, nil
			}
			path = "."
		} else {
			files, err = fs.ReadDir(currFS, path)
			if err != nil {
				return asset, err
			}
		}

		for _, file := range files {
			if shouldSkipFile(file.Name()) {
				continue
			}

			childPath := filepath.Join(path, file.Name())
			if path == "." {
				childPath = file.Name()
			}

			_, err := d.discoverPath(innerFS, childPath, asset)
			if err != nil {
				d.logger.Warn("failed to discover child", zap.String("path", childPath), zap.Error(err))
				continue
			}
		}
	}
	if !pathInfo.IsDir() || (!libfs.IsBundle(path) || runtime.Cfg.Library.RenderBundles) {
		d.processor.Process(d.ctx, asset)
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
