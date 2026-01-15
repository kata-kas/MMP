package database

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"path/filepath"
	"time"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/eduardooliveira/stLib/core/runtime"
)

func MigrateToUnifiedAssetModel() error {
	log := logger.GetLogger()
	log.Info("Starting migration to unified asset model")

	// Step 1: Create new assets table with new schema
	log.Info("Step 1: Creating new assets table")
	if err := DB.AutoMigrate(&entities.Asset{}); err != nil {
		return fmt.Errorf("failed to create assets table: %w", err)
	}

	// Check if migration already completed (assets exist)
	var existingAssetCount int64
	if err := DB.Model(&entities.Asset{}).Count(&existingAssetCount).Error; err == nil && existingAssetCount > 0 {
		log.Info("Assets already exist, skipping migration", zap.Int64("asset_count", existingAssetCount))
		return nil
	}

	// Step 2: Migrate Projects to root Assets
	log.Info("Step 2: Migrating projects to root assets")
	var oldProjects []entities.Project
	if err := DB.Find(&oldProjects).Error; err != nil {
		return fmt.Errorf("failed to load projects: %w", err)
	}

	if len(oldProjects) == 0 {
		log.Info("No projects to migrate")
		return nil
	}

	libraryPath := runtime.Cfg.Library.Path
	projectMap := make(map[string]*entities.Asset) // old UUID -> new Asset

	for _, project := range oldProjects {
		// Calculate new ID using MD5 of filesystem path
		projectPath := filepath.Join(project.Path, project.Name)
		data := []byte(filepath.Join("default", libraryPath, projectPath))
		md5Hash := md5.Sum(data)
		newID := hex.EncodeToString(md5Hash[:])

		rootAsset := &entities.Asset{
			ID:          newID,
			Label:       &project.Name,
			Description: &project.Description,
			Path:        &projectPath,
			Root:        libraryPath,
			FSKind:      "local",
			FSName:      "default",
			NodeKind:    entities.NodeKindRoot,
			Properties:  make(entities.Properties),
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		if project.ExternalLink != "" {
			rootAsset.Properties["external_link"] = project.ExternalLink
		}

		// Check if asset already exists (by ID)
		var existingAsset entities.Asset
		if err := DB.Where("id = ?", newID).First(&existingAsset).Error; err == nil {
			log.Debug("Root asset already exists, skipping", zap.String("project", project.Name), zap.String("asset_id", newID))
			projectMap[project.UUID] = &existingAsset
			continue
		}

		if err := DB.Create(rootAsset).Error; err != nil {
			log.Warn("Failed to create root asset", zap.String("project", project.Name), zap.Error(err))
			continue
		}

		// Migrate tags
		if len(project.Tags) > 0 {
			var tags []*entities.Tag
			for _, tag := range project.Tags {
				tags = append(tags, tag)
			}
			if err := DB.Model(rootAsset).Association("Tags").Replace(tags); err != nil {
				log.Warn("Failed to migrate tags", zap.String("project", project.Name), zap.Error(err))
			}
		}

		projectMap[project.UUID] = rootAsset
		log.Info("Migrated project to root asset", zap.String("project", project.Name), zap.String("asset_id", newID))
	}

	// Step 3: Migrate ProjectAssets to nested Assets
	log.Info("Step 3: Migrating project assets to nested assets")
	var oldAssets []entities.ProjectAsset
	if err := DB.Find(&oldAssets).Error; err != nil {
		return fmt.Errorf("failed to load project assets: %w", err)
	}

	for _, oldAsset := range oldAssets {
		parentAsset, exists := projectMap[oldAsset.ProjectUUID]
		if !exists {
			log.Warn("Parent project not found for asset", zap.String("asset_id", oldAsset.ID), zap.String("project_uuid", oldAsset.ProjectUUID))
			continue
		}

		// Calculate new ID using MD5
		assetPath := filepath.Join(*parentAsset.Path, oldAsset.Name)
		data := []byte(filepath.Join("default", libraryPath, assetPath))
		md5Hash := md5.Sum(data)
		newID := hex.EncodeToString(md5Hash[:])

		parentID := parentAsset.ID
		newAsset := &entities.Asset{
			ID:         newID,
			Label:      &oldAsset.Label,
			Path:       &assetPath,
			Root:       libraryPath,
			FSKind:     "local",
			FSName:     "default",
			Extension:  &oldAsset.Extension,
			Kind:       &oldAsset.AssetType,
			NodeKind:   entities.NodeKindFile,
			ParentID:   &parentID,
			Thumbnail:  nil,
			Properties: make(entities.Properties),
			CreatedAt:  oldAsset.ModTime,
			UpdatedAt:  oldAsset.ModTime,
		}

		// Copy properties
		if oldAsset.Properties != nil {
			for k, v := range oldAsset.Properties {
				newAsset.Properties[k] = v
			}
		}

		// Copy image ID to thumbnail if exists
		if oldAsset.ImageID != "" {
			newAsset.Thumbnail = &oldAsset.ImageID
		}

		// Copy size if available
		if oldAsset.Size > 0 {
			newAsset.Properties["size"] = oldAsset.Size
		}

		// Check if asset already exists
		var existingAsset entities.Asset
		if err := DB.Where("id = ?", newID).First(&existingAsset).Error; err == nil {
			log.Debug("Nested asset already exists, skipping", zap.String("asset", oldAsset.Name), zap.String("asset_id", newID))
			continue
		}

		if err := DB.Create(newAsset).Error; err != nil {
			log.Warn("Failed to create nested asset", zap.String("asset", oldAsset.Name), zap.Error(err))
			continue
		}

		log.Debug("Migrated project asset", zap.String("old_id", oldAsset.ID), zap.String("new_id", newID))
	}

	// Step 4: Update asset_tags junction table (already done via GORM associations above)
	log.Info("Step 4: Tags migration completed during asset creation")

	// Step 5: Drop old tables (commented out for safety - uncomment after verification)
	log.Info("Step 5: Migration complete. Old tables preserved for rollback.")
	log.Info("To complete migration, manually drop old tables after verification:")
	log.Info("  - DROP TABLE project_assets;")
	log.Info("  - DROP TABLE project_tags;")
	log.Info("  - DROP TABLE projects;")

	return nil
}
