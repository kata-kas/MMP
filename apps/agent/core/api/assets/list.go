package assets

import (
	"errors"
	"net/http"
	"strconv"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func listRoots(c echo.Context) error {
	deep := c.QueryParam("deep") == "true"

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

	assets, totalPages, err := database.GetAssetRootsPaginated(deep, page, perPage)
	if err != nil {
		logger.GetLogger().Error("failed to get root assets", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, map[string]any{
		"assets":      assets,
		"total_pages": totalPages,
		"page":        page + 1,
		"per_page":    perPage,
	})
}

func listNested(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, errors.New("missing asset id"))
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

	assets, totalPages, err := database.GetNestedAssets(id, page, perPage)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, err.Error())
		}
		logger.GetLogger().Error("failed to get nested assets", zap.String("asset_id", id), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, map[string]any{
		"assets":      assets,
		"total_pages": totalPages,
		"page":        page + 1,
		"per_page":    perPage,
	})
}
