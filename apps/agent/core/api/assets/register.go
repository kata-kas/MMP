package assets

import (
	"github.com/labstack/echo/v4"
)

var group *echo.Group

func Register(e *echo.Group) {
	group = e
	group.GET("", listRoots)
	group.GET("/search", search)
	group.GET("/:id/file", getFile)
	group.GET("/:id/nested", listNested)
	group.GET("/:id", get)
	group.POST("", create)
	group.PUT("/:id", update)
	group.PATCH("/:id", update)
	group.DELETE("/:id", delete)
}
