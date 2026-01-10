package tags

import (
	"net/http"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/labstack/echo/v4"
)

func index(c echo.Context) error {
	rtn, err := database.GetTags()
	if err != nil {
		logger.GetLogger().Error("failed to get tags", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, rtn)
}
