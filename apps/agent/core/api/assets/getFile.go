package assets

import (
	"errors"
	"net/http"
	"path/filepath"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/eduardooliveira/stLib/core/runtime"
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

	if asset.Path == nil {
		return echo.NewHTTPError(http.StatusBadRequest, errors.New("asset has no path"))
	}

	// Build full file path
	assetPath := filepath.Join(runtime.Cfg.Library.Path, *asset.Path)

	fileName := filepath.Base(*asset.Path)
	if asset.Label != nil {
		fileName = *asset.Label
		if asset.Extension != nil {
			fileName += *asset.Extension
		}
	}

	if c.QueryParam("download") != "" {
		return c.Attachment(assetPath, fileName)
	}

	return c.Inline(assetPath, fileName)
}
