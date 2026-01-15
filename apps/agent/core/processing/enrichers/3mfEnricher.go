package enrichers

import (
	"context"
	"fmt"
	"io"
	"io/fs"
	"path/filepath"
	"slices"
	"strings"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/libfs"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/eduardooliveira/stLib/core/utils"
)

type mfEnricher struct{}

var imageExts = []string{".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg"}

func (m *mfEnricher) Enrich(ctx context.Context, asset *entities.Asset) error {
	if asset.NodeKind != entities.NodeKindBundle {
		return nil
	}

	if asset.Extension == nil || strings.ToLower(*asset.Extension) != ".3mf" {
		return nil
	}

	genFS, err := libfs.GetLibFS("generated")
	if err != nil {
		return fmt.Errorf("failed to get generated fs: %w", err)
	}

	bundleFS, err := libfs.GetAssetFS(ctx, *asset)
	if err != nil {
		return fmt.Errorf("failed to open bundle: %w", err)
	}

	extractedCount := 0
	err = fs.WalkDir(bundleFS.GetFS(), ".", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if d.IsDir() {
			return nil
		}

		if strings.Contains(path, ".thumbnails/") {
			return nil
		}

		ext := filepath.Ext(path)
		if !slices.Contains(imageExts, strings.ToLower(ext)) {
			return nil
		}

		extractedCount++
		baseName := fmt.Sprintf("%s.e%d%s", asset.ID, extractedCount, ext)
		dstPath := baseName

		writer, err := genFS.Create(dstPath)
		if err != nil {
			logger.GetLogger().Warn("failed to create extracted file", zap.String("path", dstPath), zap.Error(err))
			return nil
		}
		defer writer.Close()

		srcFile, err := bundleFS.Open(path)
		if err != nil {
			logger.GetLogger().Warn("failed to open file in bundle", zap.String("path", path), zap.Error(err))
			return nil
		}
		defer srcFile.Close()

		if _, err := io.Copy(writer, srcFile); err != nil {
			logger.GetLogger().Warn("failed to copy file from bundle", zap.String("path", path), zap.Error(err))
			return nil
		}

		extractedAsset := entities.NewAsset(genFS.GetName(), genFS.GetRoot(), dstPath, false, asset)
		extractedAsset.Label = utils.Ptr(strings.TrimSuffix(filepath.Base(path), ext))

		if err := database.InsertAsset(extractedAsset); err != nil {
			logger.GetLogger().Warn("failed to insert extracted asset", zap.String("path", dstPath), zap.Error(err))
		}

		return nil
	})

	if err != nil {
		return fmt.Errorf("error walking bundle: %w", err)
	}

	if extractedCount > 0 {
		logger.GetLogger().Info("extracted images from 3MF", zap.String("asset", asset.ID), zap.Int("count", extractedCount))
	}

	return nil
}
