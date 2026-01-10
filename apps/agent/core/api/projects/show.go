package projects

import (
	"errors"
	"net/http"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func show(c echo.Context) error {
	uuid := c.Param("uuid")
	rtn, err := database.GetProject(uuid)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, err.Error())
		}
		logger.GetLogger().Error("failed to get project", zap.String("uuid", uuid), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, rtn)
}
