package projects

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

func setMainImageHandler(c echo.Context) error {
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

	if pproject.DefaultImageID != project.DefaultImageID {
		project.DefaultImageID = pproject.DefaultImageID
	}

	err = database.UpdateProject(project)

	if err != nil {
		logger.GetLogger().Error("failed to update project", zap.String("uuid", project.UUID), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, struct {
		UUID string `json:"uuid"`
		Path string `json:"path"`
	}{project.UUID, project.DefaultImageID})
}
