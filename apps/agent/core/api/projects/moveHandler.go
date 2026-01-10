package projects

import (
	"errors"
	"net/http"
	"path/filepath"

	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/eduardooliveira/stLib/core/utils"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

func moveHandler(c echo.Context) error {
	pproject := &entities.Project{}

	if err := c.Bind(pproject); err != nil {
		logger.GetLogger().Error("failed to bind project", zap.Error(err))
		return c.NoContent(http.StatusBadRequest)
	}

	if pproject.UUID != c.Param("uuid") {
		return c.NoContent(http.StatusBadRequest)
	}

	project, err := database.GetProject(pproject.UUID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, err.Error())
		}
		logger.GetLogger().Error("failed to get project", zap.String("uuid", pproject.UUID), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	pproject.Path = filepath.Clean(pproject.Path)
	pproject.Name = project.Name
	err = utils.Move(project.FullPath(), pproject.FullPath(), true)

	if err != nil {
		logger.GetLogger().Error("failed to move project", zap.String("from", project.FullPath()), zap.String("to", pproject.FullPath()), zap.Error(err))
		return c.NoContent(http.StatusInternalServerError)
	}

	project.Path = filepath.Clean(pproject.Path)

	err = database.UpdateProject(project)

	if err != nil {
		logger.GetLogger().Error("failed to update project", zap.String("uuid", project.UUID), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, struct {
		UUID string `json:"uuid"`
		Path string `json:"path"`
	}{project.UUID, project.Path})
}
