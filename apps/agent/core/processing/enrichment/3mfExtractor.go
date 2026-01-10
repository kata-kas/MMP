package enrichment

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"slices"
	"strings"

	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/eduardooliveira/stLib/core/processing/types"
	"github.com/eduardooliveira/stLib/core/state"
	"github.com/eduardooliveira/stLib/core/utils"
	"go.uber.org/zap"
)

type mfExtractor struct{}

func New3MFExtractor() *mfExtractor {
	return &mfExtractor{}
}

func (me *mfExtractor) Extract(e types.ProcessableAsset) ([]*Extracted, error) {
	rtn := make([]*Extracted, 0)
	baseName := fmt.Sprintf("%s.e", e.Asset.ID)
	path := utils.ToLibPath(filepath.Join(e.Project.FullPath(), e.Asset.Name))

	archive, err := zip.OpenReader(path)
	if err != nil {
		logger.GetLogger().Error("failed to open 3MF archive", zap.String("path", path), zap.Error(err))
		return nil, err
	}
	defer archive.Close()

	utils.CreateAssetsFolder(e.Project.UUID)

	for i, f := range archive.File {
		ext := filepath.Ext(f.Name)
		if !slices.Contains(state.AssetTypes["image"].Extensions, ext) {
			continue
		}

		if strings.Contains(f.Name, ".thumbnails/") {
			continue
		}
		dstName := fmt.Sprintf("%s%d%s", baseName, i, ext)
		dstFile, err := os.OpenFile(utils.ToAssetsPath(e.Asset.ProjectUUID, dstName), os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
		if err != nil {
			logger.GetLogger().Warn("failed to create destination file", zap.String("dst_name", dstName), zap.Error(err))
			continue
		}
		defer dstFile.Close()

		fileInArchive, err := f.Open()
		if err != nil {
			logger.GetLogger().Warn("failed to open file in archive", zap.String("file_name", f.Name), zap.Error(err))
			continue
		}
		defer fileInArchive.Close()

		if _, err := io.Copy(dstFile, fileInArchive); err != nil {
			logger.GetLogger().Warn("failed to copy file from archive", zap.String("file_name", f.Name), zap.Error(err))
			continue
		}
		rtn = append(rtn, &Extracted{
			File:  dstName,
			Label: f.Name,
		})

	}

	return rtn, nil
}
