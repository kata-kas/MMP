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

type updateAssetRequest struct {
	Label       *string             `json:"label"`
	Description *string             `json:"description,omitempty"`
	Properties  entities.Properties `json:"properties,omitempty"`
	Tags        *[]*entities.Tag    `json:"tags,omitempty"`
}

func update(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, errors.New("missing asset id"))
	}

	var req updateAssetRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// Verify asset exists
	existing, err := database.GetAsset(id, false)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, err.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Update allowed fields
	if req.Label != nil {
		existing.Label = req.Label
	}
	if req.Description != nil {
		existing.Description = req.Description
	}
	if req.Properties != nil {
		existing.Properties = req.Properties
	}

	if err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Omit("NestedAssets").Save(&existing).Error; err != nil {
			return err
		}

		if req.Tags != nil {
			if err := database.EnsureTags(tx, *req.Tags); err != nil {
				return err
			}
			if err := tx.Model(&existing).Association("Tags").Replace(*req.Tags); err != nil {
				return err
			}
			existing.Tags = *req.Tags
		}

		return nil
	}); err != nil {
		logger.GetLogger().Error("failed to update asset", zap.String("asset_id", id), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	if err := database.DB.Preload("Tags").First(&existing, "id = ?", id).Error; err != nil {
		logger.GetLogger().Warn("failed to reload updated asset tags", zap.String("asset_id", id), zap.Error(err))
	}

	return c.JSON(http.StatusOK, existing)
}
