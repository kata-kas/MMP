package assets

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/eduardooliveira/stLib/core/utils"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func Delete(c echo.Context) error {

	id := c.Param("id")

	if id == "" {
		return c.NoContent(http.StatusBadRequest)
	}
	asset, err := database.GetAsset(id)

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, err.Error())
		}
		logger.GetLogger().Error("failed to get asset", zap.String("id", id), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	project, err := database.GetProject(c.Param("uuid"))
	if err != nil {
		logger.GetLogger().Error("failed to get project", zap.String("uuid", c.Param("uuid")), zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	if project.UUID != asset.ProjectUUID {
		return echo.NewHTTPError(http.StatusBadRequest, errors.New("project uuid mismatch"))
	}

	err = os.Remove(utils.ToLibPath(filepath.Join(project.FullPath(), asset.Name)))
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err)
	}

	if err := database.DeleteAsset(id); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err)
	}

	if asset.ImageID != "" && asset.ID != asset.ImageID {

		var image *entities.ProjectAsset

		if image, err = database.GetAsset(asset.ImageID); err != nil && err != gorm.ErrRecordNotFound {
			fmt.Println(err)
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}

		if image != nil {
			err = os.Remove(utils.ToAssetsPath(asset.ProjectUUID, image.Name))
			if err != nil {
				return echo.NewHTTPError(http.StatusInternalServerError, err)
			}

			if err := database.DeleteAsset(image.ID); err != nil {
				return echo.NewHTTPError(http.StatusInternalServerError, err)
			}
		}
	}

	return c.NoContent(http.StatusOK)
}
