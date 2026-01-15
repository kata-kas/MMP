package entities

import (
	"crypto/md5"
	"encoding/hex"
	"path/filepath"
	"slices"
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

type LibFS interface {
	IsBundle(path string) bool
	Kind() string
}

// NewAsset creates a new asset with optional filesystem context
func NewAsset(fsName, root, path string, isDir bool, parent *Asset) *Asset {
	return NewAssetWithFS(nil, fsName, root, path, isDir, parent)
}

// NewAssetWithFS creates a new asset with filesystem context for bundle detection
func NewAssetWithFS(fs LibFS, fsName, root, path string, isDir bool, parent *Asset) *Asset {
	ext := filepath.Ext(path)
	id := generateAssetID(fsName, root, path)

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

	// Determine asset type and kind
	asset.NodeKind, asset.FSKind, asset.Kind = determineAssetType(path, isDir, parent, fs, ext, fsName)

	return asset
}

func generateAssetID(fsName, root, path string) string {
	data := []byte(filepath.Join(fsName, root, path))
	md5Hash := md5.Sum(data)
	return hex.EncodeToString(md5Hash[:])
}

func determineAssetType(path string, isDir bool, parent *Asset, fs LibFS, ext, fsName string) (NodeKind, string, *string) {
	// Bundle detection
	if fs != nil && fs.IsBundle(path) {
		return NodeKindBundle, "bundle", utils.Ptr("bundle")
	}

	// Asset inside a bundle
	if fs != nil && fs.Kind() == "bundle" {
		kind := inferKindFromExtension(ext)
		return NodeKindBundled, "bundle", kind
	}

	// Directory handling
	if isDir {
		if parent == nil {
			label := fsName
			if label == "" {
				label = filepath.Base(path)
			}
			return NodeKindRoot, "local", utils.Ptr("dir")
		}
		return NodeKindDir, "local", utils.Ptr("dir")
	}

	// File handling
	kind := inferKindFromExtension(ext)
	return NodeKindFile, "local", kind
}

func inferKindFromExtension(ext string) *string {
	if ext == "" {
		return nil
	}

	extMap := map[string][]string{
		"image":  {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg"},
		"model":  {".stl", ".3mf", ".obj", ".ply"},
		"slice":  {".gcode"},
		"source": {".stp", ".step", ".ste", ".fbx", ".f3d", ".f3z", ".iam", ".ipt"},
	}

	extLower := strings.ToLower(ext)
	for kind, exts := range extMap {
		if slices.Contains(exts, extLower) {
			return utils.Ptr(kind)
		}
	}

	return nil
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
