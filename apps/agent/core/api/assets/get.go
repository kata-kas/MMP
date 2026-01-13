package assets

import (
	"errors"
	"net/http"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func get(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, errors.New("missing asset id"))
	}

	deep := c.QueryParam("deep") == "true"
	asset, err := database.GetAsset(id, deep)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, err.Error())
		}
		logger.GetLogger().Error("failed to get asset", zap.String("asset_id", id), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, asset)
}
