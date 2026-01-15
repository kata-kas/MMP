package assets

import (
	"net/http"
	"strconv"
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

	page := 0
	if pageStr := c.QueryParam("page"); pageStr != "" {
		var err error
		page, err = strconv.Atoi(pageStr)
		if err != nil || page < 1 {
			page = 1
		}
		page-- // Convert to 0-based
	}

	perPage := 20
	if perPageStr := c.QueryParam("per_page"); perPageStr != "" {
		var err error
		perPage, err = strconv.Atoi(perPageStr)
		if err != nil || perPage < 1 {
			perPage = 20
		}
	}

	assets, totalPages, err := database.SearchAssetsPaginated(label, tags, page, perPage)
	if err != nil {
		logger.GetLogger().Error("failed to search assets", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, map[string]any{
		"assets":      assets,
		"total_pages": totalPages,
		"page":        page + 1,
		"per_page":    perPage,
	})
}
