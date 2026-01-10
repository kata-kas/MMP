package projects

import (
	"encoding/json"
	"errors"
	"net/http"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/eduardooliveira/stLib/core/utils"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func save(c echo.Context) error {
	form, err := c.MultipartForm()
	if err != nil {
		logger.GetLogger().Error("failed to parse multipart form", zap.Error(err))
		return c.NoContent(http.StatusBadRequest)
	}

	projectPayload := form.Value["payload"]
	if len(projectPayload) != 1 {
		logger.GetLogger().Warn("unexpected number of payloads", zap.Int("count", len(projectPayload)))
		return echo.NewHTTPError(http.StatusBadRequest, errors.New("more payloads than expected"))
	}

	pproject := &entities.Project{}

	err = json.Unmarshal([]byte(projectPayload[0]), pproject)
	if err != nil {
		logger.GetLogger().Error("failed to unmarshal project payload", zap.Error(err))
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if err := c.Bind(pproject); err != nil {
		logger.GetLogger().Error("failed to bind project", zap.Error(err))
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if pproject.UUID != c.Param("uuid") {
		return echo.NewHTTPError(http.StatusBadRequest, errors.New("parameter mismatch"))
	}

	project, err := database.GetProject(c.Param("uuid"))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, err.Error())
		}
		logger.GetLogger().Error("failed to get project", zap.String("uuid", c.Param("uuid")), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	if pproject.Name != project.Name {

		err := utils.Move(project.FullPath(), pproject.FullPath(), true)

		if err != nil {
			logger.GetLogger().Error("failed to move project", zap.String("from", project.FullPath()), zap.String("to", pproject.FullPath()), zap.Error(err))
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
	}

	err = database.UpdateProject(pproject)

	if err != nil {
		logger.GetLogger().Error("failed to update project", zap.String("uuid", pproject.UUID), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, pproject)
}
