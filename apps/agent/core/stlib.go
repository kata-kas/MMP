package stlib

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"time"

	"go.uber.org/zap"

	assettypes "github.com/eduardooliveira/stLib/core/api/assetTypes"
	"github.com/eduardooliveira/stLib/core/api/projects"
	"github.com/eduardooliveira/stLib/core/api/system"
	"github.com/eduardooliveira/stLib/core/api/tags"
	"github.com/eduardooliveira/stLib/core/api/tempfiles"
	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/downloader"
	"github.com/eduardooliveira/stLib/core/events"
	"github.com/eduardooliveira/stLib/core/integrations/printers"
	"github.com/eduardooliveira/stLib/core/integrations/slicer"
	"github.com/eduardooliveira/stLib/core/processing"
	"github.com/eduardooliveira/stLib/core/runtime"
	"github.com/eduardooliveira/stLib/core/state"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func Run(ctx context.Context, logger *zap.Logger) error {
	if err := database.InitDatabase(logger); err != nil {
		return fmt.Errorf("failed to initialize database: %w", err)
	}

	if err := state.LoadAssetTypes(); err != nil {
		return fmt.Errorf("failed to load asset types: %w", err)
	}

	discoveryCtx, discoveryCancel := context.WithCancel(ctx)
	defer discoveryCancel()

	discoveryErrChan := make(chan error, 1)
	go func() {
		if err := processing.ProcessFolder(discoveryCtx, runtime.Cfg.Library.Path, logger); err != nil {
			discoveryErrChan <- fmt.Errorf("error discovering projects: %w", err)
			return
		}
		logger.Info("discovery finished")
	}()

	tempDiscoveryErrChan := make(chan error, 1)
	go func() {
		if err := processing.RunTempDiscovery(logger); err != nil {
			tempDiscoveryErrChan <- fmt.Errorf("error running temp discovery: %w", err)
		}
	}()

	if err := state.LoadPrinters(); err != nil {
		return fmt.Errorf("failed to load printers: %w", err)
	}

	logger.Info("starting server", zap.Int("port", runtime.Cfg.Server.Port))
	e := echo.New()
	e.Use(middleware.CORS())
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	slicer.Register(e.Group(""))

	api := e.Group("/api")
	events.Register(api.Group("/events"))
	projects.Register(api.Group("/projects"))
	tags.Register(api.Group("/tags"))
	tempfiles.Register(api.Group("/tempfiles"))
	printers.Register(api.Group("/printers"))
	downloader.Register(api.Group("/downloader"))
	system.Register(api.Group("/system"))
	assettypes.Register(api.Group("/assettypes"))

	serverAddr := fmt.Sprintf(":%d", runtime.Cfg.Server.Port)
	server := &http.Server{
		Addr:    serverAddr,
		Handler: e,
	}

	serverErrChan := make(chan error, 1)
	go func() {
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErrChan <- fmt.Errorf("server error: %w", err)
		}
	}()

	select {
	case err := <-discoveryErrChan:
		logger.Error("discovery error", zap.Error(err))
		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer shutdownCancel()
		server.Shutdown(shutdownCtx)
		return err
	case err := <-tempDiscoveryErrChan:
		logger.Error("temp discovery error", zap.Error(err))
	case err := <-serverErrChan:
		return err
	case <-ctx.Done():
		logger.Info("shutting down server")
		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer shutdownCancel()
		if err := server.Shutdown(shutdownCtx); err != nil {
			return fmt.Errorf("server shutdown error: %w", err)
		}
		logger.Info("server shutdown complete")
		return nil
	}

	return nil
}
