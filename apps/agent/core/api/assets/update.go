package assets

import (
	"errors"
	"net/http"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func update(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, errors.New("missing asset id"))
	}

	var asset entities.Asset
	if err := c.Bind(&asset); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	asset.ID = id

	// Verify asset exists
	existing, err := database.GetAsset(id, false)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, err.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Update allowed fields
	if asset.Label != nil {
		existing.Label = asset.Label
	}
	if asset.Description != nil {
		existing.Description = asset.Description
	}
	if asset.Properties != nil {
		existing.Properties = asset.Properties
	}

	// Update tags if provided
	if len(asset.Tags) > 0 {
		existing.Tags = asset.Tags
	}

	if err := database.SaveAsset(&existing); err != nil {
		logger.GetLogger().Error("failed to update asset", zap.String("asset_id", id), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, existing)
}
