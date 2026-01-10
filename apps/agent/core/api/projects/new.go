package projects

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/eduardooliveira/stLib/core/processing/discovery"
	"github.com/eduardooliveira/stLib/core/processing/initialization"
	"github.com/eduardooliveira/stLib/core/processing/types"
	"github.com/eduardooliveira/stLib/core/utils"
	"github.com/labstack/echo/v4"
)

type CreateProject struct {
	Name             string          `json:"name"`
	Description      string          `json:"description"`
	DefaultImageName string          `json:"default_image_name"`
	Tags             []*entities.Tag `json:"tags"`
}

func new(c echo.Context) error {

	form, err := c.MultipartForm()
	if err != nil {
		logger.GetLogger().Error("failed to parse multipart form", zap.Error(err))
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	files := form.File["files"]

	if len(files) == 0 {
		logger.GetLogger().Warn("no files in upload request")
		return echo.NewHTTPError(http.StatusBadRequest, errors.New("no files uploaded").Error())
	}

	projectPayload := form.Value["payload"]
	if len(projectPayload) != 1 {
		logger.GetLogger().Warn("unexpected number of payloads", zap.Int("count", len(projectPayload)))
		return echo.NewHTTPError(http.StatusBadRequest, errors.New("more payloads than expected").Error())
	}

	createProject := &CreateProject{}
	err = json.Unmarshal([]byte(projectPayload[0]), createProject)
	if err != nil {
		logger.GetLogger().Error("failed to unmarshal project payload", zap.Error(err))
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	projectFolder := filepath.Clean(createProject.Name)

	path := utils.ToLibPath(projectFolder)
	if err := utils.CreateFolder(path); err != nil {
		logger.GetLogger().Error("failed to create project folder", zap.String("path", path), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	for _, file := range files {
		src, err := file.Open()
		if err != nil {
			logger.GetLogger().Error("failed to open uploaded file", zap.String("filename", file.Filename), zap.Error(err))
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		defer src.Close()

		dst, err := os.Create(filepath.Join(path, file.Filename))
		if err != nil {
			logger.GetLogger().Error("failed to create destination file", zap.String("filename", file.Filename), zap.Error(err))
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		defer dst.Close()

		if _, err = io.Copy(dst, src); err != nil {
			logger.GetLogger().Error("failed to copy file", zap.String("filename", file.Filename), zap.Error(err))
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}

	}

	pp, err := initialization.NewProjectIniter(types.ProcessableProject{
		Path: projectFolder,
	}).WithAssetDiscoverer(discovery.FlatAssetDiscoverer{}).
		Init()
	if err != nil {
		logger.GetLogger().Error("failed to initialize project", zap.String("folder", projectFolder), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	project := pp.Project

	project.Description = createProject.Description
	project.Tags = createProject.Tags

	if err = database.UpdateProject(project); err != nil {
		logger.GetLogger().Error("failed to update project", zap.String("uuid", project.UUID), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, struct {
		UUID string `json:"uuid"`
	}{project.UUID})
}
