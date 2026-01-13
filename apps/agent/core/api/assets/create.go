package assets

import (
	"errors"
	"net/http"
	"path/filepath"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/downloader/tools"
	"github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/eduardooliveira/stLib/core/runtime"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func create(c echo.Context) error {
	var asset entities.Asset
	if err := c.Bind(&asset); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	form, err := c.MultipartForm()
	if err != nil {
		logger.GetLogger().Error("failed to parse multipart form", zap.Error(err))
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}

	files := form.File["files"]
	if len(files) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, errors.New("no files provided"))
	}

	// Determine parent asset
	var parentAsset *entities.Asset
	if asset.ParentID != nil {
		parent, err := database.GetAsset(*asset.ParentID, false)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return echo.NewHTTPError(http.StatusNotFound, "parent asset not found")
			}
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		parentAsset = &parent
	} else {
		// Creating root asset - use library path
		parentAsset = nil
	}

	// Save uploaded files
	for _, fileHeader := range files {
		src, err := fileHeader.Open()
		if err != nil {
			logger.GetLogger().Error("failed to open uploaded file", zap.String("filename", fileHeader.Filename), zap.Error(err))
			continue
		}

		var targetPath string
		if parentAsset != nil && parentAsset.Path != nil {
			targetPath = filepath.Join(runtime.Cfg.Library.Path, *parentAsset.Path, fileHeader.Filename)
		} else {
			targetPath = filepath.Join(runtime.Cfg.Library.Path, fileHeader.Filename)
		}

		if err := tools.SaveFile(targetPath, src); err != nil {
			src.Close()
			logger.GetLogger().Error("failed to save file", zap.String("path", targetPath), zap.Error(err))
			continue
		}
		src.Close()

		// Create asset entity
		var assetPath string
		if parentAsset != nil && parentAsset.Path != nil {
			assetPath = filepath.Join(*parentAsset.Path, fileHeader.Filename)
		} else {
			assetPath = fileHeader.Filename
		}

		newAsset := entities.NewAsset("default", runtime.Cfg.Library.Path, assetPath, false, parentAsset)
		if err := database.InsertAsset(newAsset); err != nil {
			logger.GetLogger().Error("failed to insert asset", zap.String("filename", fileHeader.Filename), zap.Error(err))
			continue
		}
	}

	return c.NoContent(http.StatusCreated)
}
