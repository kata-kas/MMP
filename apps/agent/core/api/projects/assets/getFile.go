package assets

import (
	"errors"
	"net/http"
	"path"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/eduardooliveira/stLib/core/utils"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func GetFile(c echo.Context) error {
	project, err := database.GetProject(c.Param("uuid"))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, err.Error())
		}
		logger.GetLogger().Error("failed to get project", zap.String("uuid", c.Param("uuid")), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	asset, err := database.GetProjectAsset(project.UUID, c.Param("id"))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, err.Error())
		}
		logger.GetLogger().Error("failed to get project asset", zap.String("project_uuid", project.UUID), zap.String("asset_id", c.Param("id")), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	var assetPath string
	if asset.Origin == "fs" {
		assetPath = utils.ToLibPath(path.Join(project.FullPath(), asset.Name))
	} else {
		assetPath = utils.ToAssetsPath(project.UUID, asset.Name)
	}

	if c.QueryParam("download") != "" {
		return c.Attachment(assetPath, asset.Name)

	}

	return c.Inline(assetPath, asset.Name)
}
