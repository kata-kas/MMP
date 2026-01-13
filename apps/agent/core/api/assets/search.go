package assets

import (
	"net/http"
	"strings"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/labstack/echo/v4"
)

func search(c echo.Context) error {
	label := c.QueryParam("name")
	tagsStr := c.QueryParam("tags")

	var tags []string
	if tagsStr != "" {
		// Parse comma-separated tags
		for _, tag := range strings.Split(tagsStr, ",") {
			tag = strings.TrimSpace(tag)
			if tag != "" {
				tags = append(tags, tag)
			}
		}
	}

	assets, err := database.SearchAssets(label, tags)
	if err != nil {
		logger.GetLogger().Error("failed to search assets", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, assets)
}
