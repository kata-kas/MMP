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
	q := DB.Where("ID = ?", id)
	if deep {
		q = q.Preload("NestedAssets.NestedAssets")
	}
	return asset, q.First(&asset).Error
}

func GetAssetRoots(deep bool) ([]*entities.Asset, error) {
	var assets []*entities.Asset
	q := DB.Where(&entities.Asset{NodeKind: entities.NodeKindRoot})
	if deep {
		q = q.Preload("NestedAssets.NestedAssets")
	}
	return assets, q.Order("Label ASC").Find(&assets).Error
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
		Find(&assets).Error

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
	q := DB.Model(&entities.Asset{})

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
