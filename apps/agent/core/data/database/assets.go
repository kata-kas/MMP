package database

import (
	"errors"
	"fmt"
	"math"

	"github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/system"
	"gorm.io/gorm"
)

const assetEvent = "system.state.asset.event"

func initAssets() error {
	return DB.AutoMigrate(&entities.Asset{})
}

func SaveAsset(a *entities.Asset) error {
	if err := DB.Omit("NestedAssets").Save(a).Error; err != nil {
		return err
	}
	publishAssetEvent(a, "update")
	return nil
}

func InsertAsset(a *entities.Asset) error {
	if err := DB.Omit("NestedAssets").Create(a).Error; err != nil {
		return err
	}
	publishAssetEvent(a, "new")
	return nil
}

func GetAsset(id string, deep bool) (entities.Asset, error) {
	var asset entities.Asset
	q := DB.Where("ID = ?", id).Preload("Tags")
	if deep {
		q = q.Preload("NestedAssets.NestedAssets").
			Preload("NestedAssets.Tags").
			Preload("NestedAssets.NestedAssets.Tags")
	}
	return asset, q.First(&asset).Error
}

func GetAssetRoots(deep bool) ([]*entities.Asset, error) {
	var assets []*entities.Asset
	var rootIDs []string
	if err := DB.Model(&entities.Asset{}).
		Select("id").
		Where("node_kind = ?", entities.NodeKindRoot).
		Scan(&rootIDs).Error; err != nil {
		return assets, err
	}

	// The filesystem discovery creates an artificial root asset with path ".".
	// Consumers generally want to see what's *inside* it, not the "." node itself.
	q := DB.Where("parent_id IN ?", rootIDs).Preload("Tags")
	if deep {
		q = q.Preload("NestedAssets.NestedAssets").
			Preload("NestedAssets.Tags").
			Preload("NestedAssets.NestedAssets.Tags")
	}
	err := q.Order("Label ASC").Find(&assets).Error
	if err != nil {
		return assets, err
	}

	// Batch update thumbnails for assets without them
	assetIDs := make([]string, 0, len(assets))
	for _, asset := range assets {
		if asset.Thumbnail == nil {
			assetIDs = append(assetIDs, asset.ID)
		}
	}

	if len(assetIDs) > 0 {
		thumbnails := findThumbnailsForAssets(assetIDs)
		for i, asset := range assets {
			if thumbID, ok := thumbnails[asset.ID]; ok {
				assets[i].Thumbnail = &thumbID
				_ = DB.Model(&entities.Asset{ID: asset.ID}).Update("thumbnail", thumbID).Error
			}
		}
	}

	return assets, nil
}

func GetAssetRootsPaginated(deep bool, page, perPage int) ([]*entities.Asset, int, error) {
	var assets []*entities.Asset
	var totalRows int64

	var rootIDs []string
	if err := DB.Model(&entities.Asset{}).
		Select("id").
		Where("node_kind = ?", entities.NodeKindRoot).
		Scan(&rootIDs).Error; err != nil {
		return nil, 0, err
	}

	q := DB.Model(&entities.Asset{}).Where("parent_id IN ?", rootIDs)
	if err := q.Count(&totalRows).Error; err != nil {
		return nil, 0, err
	}

	totalPages := int(math.Ceil(float64(totalRows) / float64(perPage)))

	query := DB.Where("parent_id IN ?", rootIDs).Preload("Tags")
	if deep {
		query = query.Preload("NestedAssets.NestedAssets").
			Preload("NestedAssets.Tags").
			Preload("NestedAssets.NestedAssets.Tags")
	}
	err := query.Order("Label ASC").
		Offset(page * perPage).
		Limit(perPage).
		Find(&assets).Error
	if err != nil {
		return nil, 0, err
	}

	// Batch update thumbnails for assets without them
	assetIDs := make([]string, 0, len(assets))
	for _, asset := range assets {
		if asset.Thumbnail == nil {
			assetIDs = append(assetIDs, asset.ID)
		}
	}

	if len(assetIDs) > 0 {
		thumbnails := findThumbnailsForAssets(assetIDs)
		for i, asset := range assets {
			if thumbID, ok := thumbnails[asset.ID]; ok {
				assets[i].Thumbnail = &thumbID
				_ = DB.Model(&entities.Asset{ID: asset.ID}).Update("thumbnail", thumbID).Error
			}
		}
	}

	return assets, totalPages, nil
}

func GetNestedAssets(parentID string, page, perPage int) ([]*entities.Asset, int, error) {
	var assets []*entities.Asset
	var totalRows int64

	filter := entities.Asset{ParentID: &parentID}
	if err := DB.Model(&entities.Asset{}).Where(&filter).Count(&totalRows).Error; err != nil {
		return nil, 0, err
	}

	totalPages := int(math.Ceil(float64(totalRows) / float64(perPage)))

	err := DB.Where(&filter).
		Offset(page * perPage).
		Limit(perPage).
		Order("Label ASC").
		Preload("Tags").
		Find(&assets).Error

	// Batch update thumbnails for directories/bundles without them
	assetIDs := make([]string, 0, len(assets))
	for _, asset := range assets {
		if (asset.NodeKind == entities.NodeKindDir || asset.NodeKind == entities.NodeKindRoot || asset.NodeKind == entities.NodeKindBundle) && asset.Thumbnail == nil {
			assetIDs = append(assetIDs, asset.ID)
		}
	}

	if len(assetIDs) > 0 {
		thumbnails := findThumbnailsForAssets(assetIDs)
		for i, asset := range assets {
			if thumbID, ok := thumbnails[asset.ID]; ok {
				assets[i].Thumbnail = &thumbID
				_ = DB.Model(&entities.Asset{ID: asset.ID}).Update("thumbnail", thumbID).Error
			}
		}
	}

	return assets, totalPages, err
}

func LoadParents(a *entities.Asset, depth int, fields ...string) error {
	if depth == 0 {
		return errors.New("depth must be greater than 0")
	}

	parentChain := "Parent"
	for i := 0; i < depth; i++ {
		parentChain += ".Parent"
	}

	q := DB.Model(a).Preload(parentChain, func(db *gorm.DB) *gorm.DB {
		if len(fields) > 0 {
			fields = append(fields, "ParentID")
			return db.Select(fields)
		}
		return db
	})

	return q.Find(a).Error
}

func SearchAssets(label string, tags []string) ([]*entities.Asset, error) {
	var assets []*entities.Asset
	q := DB.Model(&entities.Asset{}).Preload("Tags")

	if label != "" {
		q = q.Where("Label LIKE ?", fmt.Sprintf("%%%s%%", label))
	}

	if len(tags) > 0 {
		q = q.Joins("JOIN asset_tags ON asset_tags.asset_id = assets.id").
			Joins("JOIN tags ON tags.value = asset_tags.tag_value").
			Where("tags.value IN ?", tags).
			Group("assets.id")
	}

	return assets, q.Find(&assets).Error
}

func SearchAssetsPaginated(label string, tags []string, page, perPage int) ([]*entities.Asset, int, error) {
	var assets []*entities.Asset
	var totalRows int64

	baseQuery := DB.Model(&entities.Asset{}).Preload("Tags")

	if label != "" {
		baseQuery = baseQuery.Where("Label LIKE ?", fmt.Sprintf("%%%s%%", label))
	}

	if len(tags) > 0 {
		baseQuery = baseQuery.Joins("JOIN asset_tags ON asset_tags.asset_id = assets.id").
			Joins("JOIN tags ON tags.value = asset_tags.tag_value").
			Where("tags.value IN ?", tags).
			Group("assets.id")
	}

	// Count total results
	countQuery := baseQuery
	if err := countQuery.Count(&totalRows).Error; err != nil {
		return nil, 0, err
	}

	totalPages := int(math.Ceil(float64(totalRows) / float64(perPage)))

	// Get paginated results
	query := baseQuery
	if err := query.
		Offset(page * perPage).
		Limit(perPage).
		Order("Label ASC").
		Find(&assets).Error; err != nil {
		return nil, 0, err
	}

	return assets, totalPages, nil
}

func DeleteAsset(id string) error {
	return DB.Where("ID = ?", id).Delete(&entities.Asset{}).Error
}

func UpdateAssetThumbnail(a *entities.Asset, thumbnailID string) error {
	if err := DB.Model(&entities.Asset{ID: a.ID}).Update("thumbnail", thumbnailID).Error; err != nil {
		return err
	}
	publishAssetEvent(a, "update")
	return nil
}

func UpdateAssetProperties(a *entities.Asset, properties entities.Properties) error {
	if err := DB.Model(&entities.Asset{ID: a.ID}).Update("properties", properties).Error; err != nil {
		return err
	}
	publishAssetEvent(a, "update")
	return nil
}

func SetDirtyFS(fsName string) error {
	return DB.Model(&entities.Asset{}).Where("fs_name = ?", fsName).Update("seen_on_scan", false).Error
}

func DeleteUnseenInFS(fsName string) error {
	seen := false
	return DB.Where("fs_name = ? AND seen_on_scan = ?", fsName, seen).Delete(&entities.Asset{}).Error
}

func findThumbnailsForAssets(assetIDs []string) map[string]string {
	if len(assetIDs) == 0 {
		return make(map[string]string)
	}

	thumbnails := make(map[string]string)

	// Strategy 1: Find direct child images
	var directImages []struct {
		ParentID string
		ID       string
	}
	DB.Table("assets").
		Select("parent_id, id").
		Where("parent_id IN ? AND kind = ?", assetIDs, "image").
		Order("parent_id ASC, label ASC").
		Scan(&directImages)

	for _, img := range directImages {
		if _, exists := thumbnails[img.ParentID]; !exists {
			thumbnails[img.ParentID] = img.ID
		}
	}

	// Strategy 2: For remaining assets, check if they're models and find rendered images
	remainingIDs := make([]string, 0)
	for _, id := range assetIDs {
		if _, found := thumbnails[id]; !found {
			remainingIDs = append(remainingIDs, id)
		}
	}

	if len(remainingIDs) > 0 {
		var modelAssets []entities.Asset
		DB.Select("id, kind, parent_id, fs_name").
			Where("id IN ? AND kind = ?", remainingIDs, "model").
			Find(&modelAssets)

		for _, model := range modelAssets {
			if thumbID := findRenderedImage(model.ID, model); thumbID != nil {
				thumbnails[model.ID] = *thumbID
			}
		}
	}

	// Strategy 3: Inherit from children with thumbnails
	for _, id := range assetIDs {
		if _, found := thumbnails[id]; !found {
			if thumbID := findChildThumbnail(id); thumbID != nil {
				thumbnails[id] = *thumbID
			}
		}
	}

	return thumbnails
}

func findRenderedImage(assetID string, asset entities.Asset) *string {
	var img entities.Asset
	renderPattern := fmt.Sprintf("%s.r.png", assetID)
	renderPatternLike := fmt.Sprintf("%%%s.r.png", assetID)

	// Try parent directory first
	if asset.ParentID != nil {
		err := DB.Select("id").
			Where("parent_id = ? AND kind = ? AND (label = ? OR label LIKE ? OR path LIKE ?)",
				*asset.ParentID, "image", renderPattern, renderPatternLike, fmt.Sprintf("%%/%s", renderPattern)).
			Order("label ASC").
			First(&img).Error
		if err == nil {
			return &img.ID
		}
	}

	// Try same filesystem
	err := DB.Select("id").
		Where("kind = ? AND fs_name = ? AND (label = ? OR label LIKE ? OR path LIKE ?)",
			"image", asset.FSName, renderPattern, renderPatternLike, fmt.Sprintf("%%/%s", renderPattern)).
		Order("label ASC").
		First(&img).Error
	if err == nil {
		return &img.ID
	}

	// Try globally
	err = DB.Select("id").
		Where("kind = ? AND (label = ? OR label LIKE ? OR path LIKE ?)",
			"image", renderPattern, renderPatternLike, fmt.Sprintf("%%/%s", renderPattern)).
		Order("label ASC").
		First(&img).Error
	if err == nil {
		return &img.ID
	}

	return nil
}

func findChildThumbnail(parentID string) *string {
	var child entities.Asset
	err := DB.Select("thumbnail").
		Where("parent_id = ? AND thumbnail IS NOT NULL", parentID).
		Order("label ASC").
		First(&child).Error
	if err == nil && child.Thumbnail != nil {
		return child.Thumbnail
	}
	return nil
}

func publishAssetEvent(a *entities.Asset, eventType string) {
	payload := map[string]any{
		"assetID": a.ID,
		"type":    eventType,
	}
	if a.Label != nil {
		payload["assetLabel"] = *a.Label
	}
	if a.ParentID != nil {
		payload["parentID"] = *a.ParentID
	}
	system.Publish(assetEvent, payload)
}
