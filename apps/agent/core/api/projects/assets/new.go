package assets

import (
	"errors"
	"fmt"
	"net/http"
	"path/filepath"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/downloader/tools"
	"github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/eduardooliveira/stLib/core/processing/initialization"
	"github.com/eduardooliveira/stLib/core/processing/types"
	"github.com/eduardooliveira/stLib/core/utils"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func New(c echo.Context) error {

	pAsset := &entities.ProjectAsset{}

	if err := c.Bind(pAsset); err != nil {
		return c.NoContent(http.StatusBadRequest)
	}

	form, err := c.MultipartForm()
	if err != nil {
		logger.GetLogger().Error("failed to parse multipart form", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err)
	}

	files := form.File["files"]

	if len(files) == 0 {
		logger.GetLogger().Warn("no files in upload request")
		return c.NoContent(http.StatusBadRequest)
	}

	project, err := database.GetProject(pAsset.ProjectUUID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, err.Error())
		}
		logger.GetLogger().Error("failed to get project", zap.String("uuid", pAsset.ProjectUUID), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	path := utils.ToLibPath(fmt.Sprintf("%s/%s", project.FullPath(), pAsset.Name))

	src, err := files[0].Open()
	if err != nil {
		logger.GetLogger().Error("failed to open uploaded file", zap.String("filename", files[0].Filename), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err)
	}
	defer src.Close()
	if err = tools.SaveFile(filepath.Join(path, files[0].Filename), src); err != nil {
		logger.GetLogger().Error("failed to save file", zap.String("path", path), zap.String("filename", files[0].Filename), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	_, err = initialization.NewAssetIniter(&types.ProcessableAsset{
		Name:    files[0].Filename,
		Project: project,
		Origin:  "fs",
	}).Init()

	if err != nil {
		logger.GetLogger().Error("failed to initialize asset", zap.String("filename", files[0].Filename), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.NoContent(http.StatusCreated)
}
