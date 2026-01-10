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
	"github.com/eduardooliveira/stLib/core/processing/initialization"
	"github.com/eduardooliveira/stLib/core/processing/types"
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

	project, err := database.GetProject(tempFile.ProjectUUID)

	if err != nil {
		logger.GetLogger().Error("failed to get project", zap.String("uuid", tempFile.ProjectUUID), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	dst := utils.ToLibPath(filepath.Join(project.FullPath(), tempFile.Name))

	err = utils.Move(filepath.Clean(filepath.Join(runtime.GetDataPath(), "temp", tempFile.Name)), dst, false)

	if err != nil {
		logger.GetLogger().Error("error moving temp file", zap.String("uuid", uuid), zap.String("name", tempFile.Name), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	_, err = initialization.NewAssetIniter(&types.ProcessableAsset{
		Name:    tempFile.Name,
		Project: project,
		Origin:  "fs",
	}).Init()

	if err != nil {
		logger.GetLogger().Error("failed to initialize asset from temp file", zap.String("uuid", uuid), zap.String("name", tempFile.Name), zap.Error(err))
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
