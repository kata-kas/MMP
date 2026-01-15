package assets

import (
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/libfs"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/gabriel-vasile/mimetype"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func getFile(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, errors.New("missing asset id"))
	}

	asset, err := database.GetAsset(id, false)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, err.Error())
		}
		logger.GetLogger().Error("failed to get asset", zap.String("asset_id", id), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	isBundledAsset := asset.FSKind == "bundle" || asset.NodeKind == "bundled"
	if isBundledAsset && asset.ParentID != nil && asset.Parent == nil {
		if err := database.LoadParents(&asset, 10); err != nil {
			logger.GetLogger().Warn("failed to load parent for bundle asset",
				zap.String("asset_id", id),
				zap.String("fs_kind", asset.FSKind),
				zap.String("fs_name", asset.FSName),
				zap.Error(err))
		}
	}

	var filePath string
	if renderPath, ok := asset.Properties["render_path"].(string); ok && renderPath != "" {
		filePath = renderPath
	} else if asset.Path == nil {
		logger.GetLogger().Error("asset has no path", zap.String("asset_id", id), zap.String("fs_kind", asset.FSKind), zap.String("fs_name", asset.FSName))
		return echo.NewHTTPError(http.StatusBadRequest, errors.New("asset has no path"))
	} else {
		fs, err := libfs.GetAssetFS(c.Request().Context(), asset)
		if err != nil {
			logger.GetLogger().Error("failed to get asset filesystem", zap.String("asset_id", id), zap.String("fs_kind", asset.FSKind), zap.String("fs_name", asset.FSName), zap.String("path", *asset.Path), zap.Error(err))
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}

		filePath := *asset.Path
		if asset.FSKind == "bundle" || asset.NodeKind == "bundled" {
			filePath = filepath.ToSlash(filepath.Clean(filePath))
			if len(filePath) > 0 && filePath[0] == '/' {
				filePath = filePath[1:]
			}
			strings.TrimPrefix(filePath, "./")
		}

		file, err := fs.Open(filePath)
		if err != nil {
			logger.GetLogger().Error("failed to open asset file",
				zap.String("asset_id", id),
				zap.String("original_path", *asset.Path),
				zap.String("normalized_path", filePath),
				zap.String("fs_kind", asset.FSKind),
				zap.Error(err))
			return echo.NewHTTPError(http.StatusNotFound, err.Error())
		}
		defer file.Close()

		fileInfo, err := file.Stat()
		if err != nil {
			logger.GetLogger().Error("failed to stat asset file", zap.String("asset_id", id), zap.Error(err))
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}

		fileName := filepath.Base(*asset.Path)
		if asset.Label != nil {
			fileName = *asset.Label
			if asset.Extension != nil {
				fileName += *asset.Extension
			}
		}

		content, err := io.ReadAll(file)
		if err != nil {
			logger.GetLogger().Error("failed to read asset file", zap.String("asset_id", id), zap.Error(err))
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}

		mtype := mimetype.Detect(content)
		contentType := mtype.String()

		c.Response().Header().Set("Content-Type", contentType)
		c.Response().Header().Set("Content-Length", strconv.FormatInt(fileInfo.Size(), 10))

		if c.QueryParam("download") != "" {
			c.Response().Header().Set("Content-Disposition", "attachment; filename="+fileName)
		} else {
			c.Response().Header().Set("Content-Disposition", "inline; filename="+fileName)
		}

		return c.Blob(http.StatusOK, contentType, content)
	}

	file, err := os.Open(filePath)
	if err != nil {
		logger.GetLogger().Error("failed to open rendered image file", zap.String("asset_id", id), zap.String("path", filePath), zap.Error(err))
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}
	defer file.Close()

	fileInfo, err := file.Stat()
	if err != nil {
		logger.GetLogger().Error("failed to stat asset file", zap.String("asset_id", id), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	fileName := filepath.Base(filePath)
	if asset.Label != nil {
		fileName = *asset.Label
		if asset.Extension != nil {
			fileName += *asset.Extension
		}
	}

	content, err := io.ReadAll(file)
	if err != nil {
		logger.GetLogger().Error("failed to read asset file", zap.String("asset_id", id), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	mtype := mimetype.Detect(content)
	contentType := mtype.String()

	// Set headers
	c.Response().Header().Set("Content-Type", contentType)
	c.Response().Header().Set("Content-Length", strconv.FormatInt(fileInfo.Size(), 10))

	if c.QueryParam("download") != "" {
		c.Response().Header().Set("Content-Disposition", "attachment; filename="+fileName)
	} else {
		c.Response().Header().Set("Content-Disposition", "inline; filename="+fileName)
	}

	return c.Blob(http.StatusOK, contentType, content)
}
