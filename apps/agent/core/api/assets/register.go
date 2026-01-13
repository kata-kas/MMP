package assets

import (
	"github.com/labstack/echo/v4"
)

var group *echo.Group

func Register(e *echo.Group) {
	group = e
	group.GET("", listRoots)
	group.GET("/search", search)
	group.GET("/:id", get)
	group.GET("/:id/nested", listNested)
	group.GET("/:id/file", getFile)
	group.POST("", create)
	group.POST("/:id", update)
	group.DELETE("/:id", delete)
}
