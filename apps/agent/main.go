package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	_ "net/http/pprof"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"

	stlib "github.com/eduardooliveira/stLib/core"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/eduardooliveira/stLib/core/runtime"
)

func main() {
	if err := run(); err != nil {
		log.Fatalf("fatal error: %v", err)
	}
}

func run() error {
	if initErr := runtime.GetInitError(); initErr != nil {
		log.Fatalf("config initialization failed: %v", initErr)
	}

	zapLogger, err := logger.InitLogger(runtime.Cfg.Core.Log.EnableFile, runtime.Cfg.Core.Log.Path)
	if err != nil {
		return fmt.Errorf("logger initialization failed: %w", err)
	}
	defer func() {
		if err := zapLogger.Sync(); err != nil {
			log.Printf("failed to sync logger: %v", err)
		}
	}()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	g, gCtx := errgroup.WithContext(ctx)

	pprofAddr := runtime.Cfg.Core.PprofAddr
	if pprofAddr == "" {
		pprofAddr = "localhost:6060"
	}

	pprofServer := &http.Server{
		Addr:    pprofAddr,
		Handler: http.DefaultServeMux,
	}

	g.Go(func() error {
		zapLogger.Info("starting pprof server", zap.String("addr", pprofAddr))
		if err := pprofServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			return fmt.Errorf("pprof server failed: %w", err)
		}
		return nil
	})

	g.Go(func() error {
		return stlib.Run(gCtx, zapLogger)
	})

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	defer signal.Stop(sigChan)

	g.Go(func() error {
		select {
		case sig := <-sigChan:
			zapLogger.Info("received shutdown signal", zap.String("signal", sig.String()))
			cancel()
			return nil
		case <-gCtx.Done():
			return nil
		}
	})

	g.Go(func() error {
		<-gCtx.Done()
		zapLogger.Info("shutting down pprof server")

		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer shutdownCancel()

		if err := pprofServer.Shutdown(shutdownCtx); err != nil {
			return fmt.Errorf("pprof shutdown failed: %w", err)
		}

		zapLogger.Info("pprof server stopped")
		return nil
	})

	if err := g.Wait(); err != nil {
		zapLogger.Error("application error", zap.Error(err))
		return err
	}

	zapLogger.Info("application shutdown complete")
	return nil
}
