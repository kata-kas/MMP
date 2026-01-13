package entities

import (
	"crypto/md5"
	"encoding/hex"
	"path/filepath"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/eduardooliveira/stLib/core/utils"
)

type NodeKind string

const (
	NodeKindRoot    NodeKind = "root"
	NodeKindFile    NodeKind = "file"
	NodeKindDir     NodeKind = "dir"
	NodeKindBundle  NodeKind = "bundle"
	NodeKindBundled NodeKind = "bundled"
)

type Asset struct {
	ID           string     `json:"id" gorm:"primaryKey"`
	Label        *string    `json:"label"`
	Description  *string    `json:"description,omitempty"`
	Path         *string    `json:"path,omitempty"`
	Root         string     `json:"root"`
	FSKind       string     `json:"fs_kind"` // "local" for now
	FSName       string     `json:"fs_name"` // filesystem name
	Extension    *string    `json:"extension,omitempty"`
	Kind         *string    `json:"kind,omitempty"` // asset type: "model", "image", "dir", etc.
	NodeKind     NodeKind   `json:"node_kind"`
	ParentID     *string    `json:"parent_id,omitempty"`
	Parent       *Asset     `json:"-" gorm:"foreignKey:ParentID"`
	NestedAssets []*Asset   `json:"nested_assets,omitempty" gorm:"foreignKey:ParentID;constraint:OnDelete:CASCADE;"`
	Thumbnail    *string    `json:"thumbnail,omitempty"`
	SeenOnScan   *bool      `json:"seen_on_scan,omitempty"`
	Properties   Properties `json:"properties,omitempty" gorm:"type:json"`
	Tags         []*Tag     `json:"tags,omitempty" gorm:"many2many:asset_tags"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

func NewAsset(fsName, root, path string, isDir bool, parent *Asset) *Asset {
	ext := filepath.Ext(path)

	data := []byte(filepath.Join(fsName, root, path))
	md5Hash := md5.Sum(data)
	id := hex.EncodeToString(md5Hash[:])

	asset := &Asset{
		ID:         id,
		Path:       utils.Ptr(path),
		Root:       root,
		FSName:     fsName,
		FSKind:     "local",
		Label:      utils.Ptr(strings.TrimSuffix(filepath.Base(path), ext)),
		Extension:  utils.Ptr(ext),
		Properties: make(Properties),
	}

	if parent != nil {
		asset.Parent = parent
		asset.ParentID = &parent.ID
	}

	if isDir {
		if parent == nil {
			asset.NodeKind = NodeKindRoot
			if fsName != "" {
				asset.Label = utils.Ptr(fsName)
			}
		} else {
			asset.NodeKind = NodeKindDir
		}
		asset.Kind = utils.Ptr("dir")
	} else {
		asset.NodeKind = NodeKindFile
	}

	return asset
}

func (a *Asset) bubbleThumbnail(tx *gorm.DB) error {
	if a.Thumbnail == nil || a.ParentID == nil {
		return nil
	}

	var parent Asset
	if err := tx.Model(&Asset{}).Where("ID = ?", *a.ParentID).First(&parent).Error; err != nil {
		return err
	}

	if parent.Thumbnail == nil {
		parent.Thumbnail = a.Thumbnail
		if err := tx.Save(&parent).Error; err != nil {
			return err
		}
	}

	return nil
}

func (a *Asset) AfterSave(tx *gorm.DB) error {
	if a.ID == "" {
		return nil
	}
	return a.bubbleThumbnail(tx)
}
