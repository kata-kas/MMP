package assets

import (
	"errors"
	"net/http"
	"os"
	"path/filepath"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/eduardooliveira/stLib/core/runtime"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func delete(c echo.Context) error {
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

	// Delete file from filesystem if it exists
	if asset.Path != nil {
		filePath := filepath.Join(runtime.Cfg.Library.Path, *asset.Path)
		if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
			logger.GetLogger().Warn("failed to remove file", zap.String("path", filePath), zap.Error(err))
		}
	}

	// Delete asset from database (cascade will handle nested assets)
	if err := database.DeleteAsset(id); err != nil {
		logger.GetLogger().Error("failed to delete asset", zap.String("asset_id", id), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.NoContent(http.StatusOK)
}
