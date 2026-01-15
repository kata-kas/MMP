package stlib

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"time"

	assettypes "github.com/eduardooliveira/stLib/core/api/assetTypes"
	"github.com/eduardooliveira/stLib/core/api/assets"
	"github.com/eduardooliveira/stLib/core/api/system"
	"github.com/eduardooliveira/stLib/core/api/tags"
	"github.com/eduardooliveira/stLib/core/api/tempfiles"
	"github.com/eduardooliveira/stLib/core/downloader"
	"github.com/eduardooliveira/stLib/core/events"
	"github.com/eduardooliveira/stLib/core/integrations/printers"
	"github.com/eduardooliveira/stLib/core/integrations/slicer"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"

	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/libfs"
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

	if err := libfs.LoadFSs(); err != nil {
		return fmt.Errorf("failed to load filesystems: %w", err)
	}

	if err := state.LoadAssetTypes(); err != nil {
		return fmt.Errorf("failed to load asset types: %w", err)
	}

	if err := state.LoadPrinters(); err != nil {
		return fmt.Errorf("failed to load printers: %w", err)
	}

	e := echo.New()
	e.Use(middleware.CORS())
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	slicer.Register(e.Group(""))

	api := e.Group("/api")
	events.Register(api.Group("/events"))
	assets.Register(api.Group("/assets"))
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

	g, gCtx := errgroup.WithContext(ctx)

	g.Go(func() error {
		logger.Info("starting filesystem discovery")
		if err := processing.ScanFS(gCtx, logger); err != nil {
			return fmt.Errorf("filesystem discovery failed: %w", err)
		}
		logger.Info("filesystem discovery completed")
		return nil
	})

	g.Go(func() error {
		logger.Info("starting temp file discovery")
		if err := processing.RunTempDiscovery(logger); err != nil {
			return fmt.Errorf("temp discovery failed: %w", err)
		}
		logger.Info("temp file discovery completed")
		return nil
	})

	g.Go(func() error {
		logger.Info("starting server", zap.Int("port", runtime.Cfg.Server.Port))
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			return fmt.Errorf("server error: %w", err)
		}
		return nil
	})

	g.Go(func() error {
		<-gCtx.Done()
		logger.Info("shutdown signal received")
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := server.Shutdown(shutdownCtx); err != nil {
			return fmt.Errorf("server shutdown failed: %w", err)
		}
		logger.Info("server shutdown complete")
		return nil
	})
	if err := g.Wait(); err != nil {
		logger.Error("service error", zap.Error(err))
		return err
	}

	return nil
}
