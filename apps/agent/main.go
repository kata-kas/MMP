package main

import (
	"context"
	"log"
	"net/http"
	_ "net/http/pprof"
	"os"
	"os/signal"
	"syscall"

	"go.uber.org/zap"

	stlib "github.com/eduardooliveira/stLib/core"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/eduardooliveira/stLib/core/runtime"
)

func main() {
	go func() {
		http.ListenAndServe("localhost:8080", nil)
	}()

	if initErr := runtime.GetInitError(); initErr != nil {
		log.Fatalf("config initialization error: %v", initErr)
	}

	zapLogger, err := logger.InitLogger(runtime.Cfg.Core.Log.EnableFile, runtime.Cfg.Core.Log.Path)
	if err != nil {
		log.Fatalf("failed to initialize logger: %v", err)
	}
	defer zapLogger.Sync()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		sig := <-sigChan
		zapLogger.Info("received shutdown signal", zap.String("signal", sig.String()))
		cancel()
	}()

	if err := stlib.Run(ctx, zapLogger); err != nil {
		zapLogger.Fatal("application error", zap.Error(err))
	}

	zapLogger.Info("application shutdown complete")
}
