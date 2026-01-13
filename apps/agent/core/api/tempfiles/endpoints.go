package tempfiles

import (
	"net/http"
	"os"
	"path/filepath"

	"go.uber.org/zap"

	"github.com/duke-git/lancet/v2/maputil"
	"github.com/eduardooliveira/stLib/core/data/database"
	models "github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/eduardooliveira/stLib/core/runtime"
	"github.com/eduardooliveira/stLib/core/state"
	"github.com/eduardooliveira/stLib/core/utils"
	"github.com/labstack/echo/v4"
)

func index(c echo.Context) error {
	return c.JSON(http.StatusOK, maputil.Values[string, *models.TempFile](state.TempFiles))
}

func move(c echo.Context) error {
	uuid := c.Param("uuid")

	if uuid == "" {
		return c.NoContent(http.StatusBadRequest)
	}

	_, ok := state.TempFiles[uuid]

	if !ok {
		return c.NoContent(http.StatusNotFound)
	}

	tempFile := &models.TempFile{}

	if err := c.Bind(tempFile); err != nil {
		logger.GetLogger().Error("failed to bind temp file", zap.Error(err))
		return c.NoContent(http.StatusBadRequest)
	}

	if uuid != tempFile.UUID {
		return c.NoContent(http.StatusBadRequest)
	}

	if tempFile.AssetID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "asset_id is required")
	}

	parentAsset, err := database.GetAsset(tempFile.AssetID, false)
	if err != nil {
		logger.GetLogger().Error("failed to get parent asset", zap.String("asset_id", tempFile.AssetID), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Build destination path
	var dst string
	if parentAsset.Path != nil {
		dst = utils.ToLibPath(filepath.Join(parentAsset.Root, *parentAsset.Path, tempFile.Name))
	} else {
		dst = utils.ToLibPath(filepath.Join(parentAsset.Root, tempFile.Name))
	}

	err = utils.Move(filepath.Clean(filepath.Join(runtime.GetDataPath(), "temp", tempFile.Name)), dst, false)
	if err != nil {
		logger.GetLogger().Error("error moving temp file", zap.String("uuid", uuid), zap.String("name", tempFile.Name), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Create new asset
	var assetPath string
	if parentAsset.Path != nil {
		assetPath = filepath.Join(*parentAsset.Path, tempFile.Name)
	} else {
		assetPath = tempFile.Name
	}

	newAsset := models.NewAsset("default", parentAsset.Root, assetPath, false, &parentAsset)
	if err := database.InsertAsset(newAsset); err != nil {
		logger.GetLogger().Error("failed to create asset from temp file", zap.String("uuid", uuid), zap.String("name", tempFile.Name), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	delete(state.TempFiles, uuid)
	return c.NoContent(http.StatusOK)
}

func deleteTempFile(c echo.Context) error {

	uuid := c.Param("uuid")

	if uuid == "" {
		return c.NoContent(http.StatusBadRequest)
	}

	tempFile, ok := state.TempFiles[uuid]

	if !ok {
		return c.NoContent(http.StatusNotFound)
	}

	err := os.Remove(filepath.Join(runtime.GetDataPath(), "temp", tempFile.Name))
	if err != nil {
		return c.NoContent(http.StatusInternalServerError)
	}

	delete(state.TempFiles, uuid)

	return c.NoContent(http.StatusOK)
}
