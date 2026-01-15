package database

import (
	"database/sql"
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

	if err := configureSqlite(DB); err != nil {
		return fmt.Errorf("failed to configure sqlite: %w", err)
	}

	if err = initTags(); err != nil {
		return fmt.Errorf("failed to initialize tags: %w", err)
	}

	if err = initAssets(); err != nil {
		return fmt.Errorf("failed to initialize assets: %w", err)
	}

	// Check if migration is needed (old projects table exists)
	var count int64
	if err = DB.Raw("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='projects'").Scan(&count).Error; err == nil && count > 0 {
		// Check if there are any projects to migrate
		var projectCount int64
		if err = DB.Raw("SELECT COUNT(*) FROM projects").Scan(&projectCount).Error; err == nil && projectCount > 0 {
			logger.Info("Detected existing projects table, running migration to unified asset model")
			if err = MigrateToUnifiedAssetModel(); err != nil {
				logger.Error("Migration failed", zap.Error(err))
				return fmt.Errorf("migration failed: %w", err)
			}
			logger.Info("Migration to unified asset model completed successfully")
		}
	}

	return nil
}

func configureSqlite(db *gorm.DB) error {
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}

	sqlDB.SetMaxOpenConns(1)
	sqlDB.SetMaxIdleConns(1)
	sqlDB.SetConnMaxLifetime(0)

	if err := db.Exec("PRAGMA journal_mode=WAL;").Error; err != nil {
		return err
	}
	if err := db.Exec("PRAGMA synchronous=NORMAL;").Error; err != nil {
		return err
	}
	if err := db.Exec("PRAGMA busy_timeout=5000;").Error; err != nil {
		return err
	}
	if err := db.Exec("PRAGMA foreign_keys=ON;").Error; err != nil {
		return err
	}

	var one sql.NullInt64
	return db.Raw("SELECT 1").Scan(&one).Error
}
