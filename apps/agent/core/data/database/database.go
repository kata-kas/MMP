package database

import (
	"fmt"
	"path"
	"time"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/runtime"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDatabase(logger *zap.Logger) error {
	const maxRetries = 5
	const baseDelay = time.Second

	dbPath := path.Join(runtime.GetDataPath(), "data.db")
	var err error

	for attempt := 1; attempt <= maxRetries; attempt++ {
		DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
			TranslateError: true,
		})
		if err == nil {
			if attempt > 1 {
				logger.Info("database connection successful after retries", zap.Int("attempt", attempt))
			}
			break
		}

		if attempt < maxRetries {
			delay := baseDelay * time.Duration(attempt)
			logger.Warn("database connection failed, retrying",
				zap.Int("attempt", attempt),
				zap.Int("max_retries", maxRetries),
				zap.Duration("retry_delay", delay),
				zap.Error(err),
			)
			time.Sleep(delay)
		}
	}

	if err != nil {
		return fmt.Errorf("failed to connect database after %d attempts: %w", maxRetries, err)
	}

	if err = initTags(); err != nil {
		return fmt.Errorf("failed to initialize tags: %w", err)
	}

	if err = initAssets(); err != nil {
		return fmt.Errorf("failed to initialize assets: %w", err)
	}

	return nil
}
