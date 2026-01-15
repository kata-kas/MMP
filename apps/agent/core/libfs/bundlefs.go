package libfs

import (
	"context"
	"errors"
	"io"
	"io/fs"
	"os"
	"path/filepath"

	"github.com/eduardooliveira/stLib/core/entities"
	"github.com/mholt/archiver/v4"
)

type bundleFS struct {
	fs             fs.FS
	parentFS       LibFS
	bundleLocation string
	name           string
	root           string
}

// getFileSystemByName retrieves a filesystem by name from the registry
func getFileSystemByName(fsName string) (LibFS, error) {
	if f, ok := fileSystems[fsName]; ok {
		return f, nil
	}
	return nil, errors.New("file system not found")
}

func resolveBundleFS(ctx context.Context, asset entities.Asset) (LibFS, error) {
	if asset.FSKind == "bundle" {
		return resolveParentFS(ctx, asset)
	}
	return getFileSystemByName(asset.FSName)
}

func resolveParentFS(ctx context.Context, asset entities.Asset) (LibFS, error) {
	if asset.FSKind != "bundle" {
		return getFileSystemByName(asset.FSName)
	}

	// Get the parent asset
	parentNode, err := getParentAsset(asset)
	if err != nil {
		// If parent not loaded but ParentID exists, try to load it
		if asset.ParentID != nil && asset.Parent == nil {
			return nil, errors.New("parent asset not loaded - need to load parent chain")
		}
		return nil, err
	}

	// Traverse up to find root filesystem
	rootAsset, err := traverseToRoot(asset.Root, parentNode)
	if err != nil {
		return nil, err
	}

	// Recursively resolve parent filesystem
	parentFS, err := resolveParentFS(ctx, *rootAsset)
	if err != nil {
		return nil, err
	}

	return newBundleFS(ctx, parentFS, *rootAsset)
}

func getParentAsset(asset entities.Asset) (*entities.Asset, error) {
	if asset.Parent != nil {
		return asset.Parent, nil
	}
	if asset.ParentID != nil {
		return nil, errors.New("parent asset not loaded")
	}
	return nil, errors.New("no parent asset")
}

func traverseToRoot(rootID string, node *entities.Asset) (*entities.Asset, error) {
	current := node
	for current.ID != rootID && current.ParentID != nil {
		if current.Parent != nil {
			current = current.Parent
		} else {
			return nil, errors.New("parent chain incomplete")
		}
	}
	return current, nil
}

func newBundleFS(ctx context.Context, parentFS LibFS, asset entities.Asset) (LibFS, error) {
	path := ""
	if asset.Path != nil {
		path = *asset.Path
	}
	base := filepath.Base(path)

	if err := validateBundleExtension(base); err != nil {
		return nil, err
	}

	bundlePath, err := prepareBundlePath(ctx, parentFS, path, base)
	if err != nil {
		return nil, err
	}

	return openBundleFileSystem(ctx, bundlePath, parentFS, base, asset.ID)
}

func validateBundleExtension(filename string) error {
	ext := filepath.Ext(filename)
	switch ext {
	case ".zip", ".rar", ".7z", ".tar", ".3mf":
		return nil
	default:
		return errors.New("unsupported bundle type")
	}
}

func prepareBundlePath(ctx context.Context, parentFS LibFS, path, base string) (string, error) {
	if parentFS.Kind() == "local" {
		return filepath.Join(parentFS.GetLocation(), path), nil
	}

	// For non-local filesystems, cache the file
	cacheFS, err := GetLibFS("cache")
	if err != nil {
		return "", err
	}

	// Create cache key based on filesystem name and path
	cacheKey := filepath.Join(parentFS.GetName(), filepath.Dir(path), base)
	cachePath := filepath.Join(cacheFS.GetLocation(), cacheKey)

	// Ensure cache directory exists
	cacheDir := filepath.Dir(cachePath)
	if err := os.MkdirAll(cacheDir, 0755); err != nil {
		return "", err
	}

	// Check if already exists in cache
	if _, err := os.Stat(cachePath); err != nil {
		if errors.Is(err, os.ErrNotExist) {
			if err := cacheFile(parentFS, path, cachePath); err != nil {
				return "", err
			}
		} else {
			return "", err
		}
	}

	return cachePath, nil
}

func cacheFile(parentFS LibFS, srcPath string, destPath string) error {
	reader, err := parentFS.Open(srcPath)
	if err != nil {
		return err
	}
	defer reader.Close()

	writer, err := os.Create(destPath)
	if err != nil {
		return err
	}
	defer writer.Close()

	_, err = io.Copy(writer, reader)
	return err
}

func openBundleFileSystem(ctx context.Context, bundlePath string, parentFS LibFS, name, rootID string) (LibFS, error) {
	file, err := os.Open(bundlePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	bfs, err := archiver.FileSystem(ctx, bundlePath, file)
	if err != nil {
		return nil, err
	}

	return &bundleFS{
		fs:             bfs,
		parentFS:       parentFS,
		bundleLocation: bundlePath,
		name:           name,
		root:           rootID,
	}, nil
}

func (fs *bundleFS) GetFS() fs.FS {
	return fs.fs
}

func (fs *bundleFS) GetName() string {
	return fs.name
}

func (fs *bundleFS) GetLocation() string {
	return fs.bundleLocation
}

func (fs *bundleFS) GetRoot() string {
	return fs.root
}

func (fs *bundleFS) Kind() string {
	return "bundle"
}

func (fs *bundleFS) Open(name string) (fs.File, error) {
	return fs.fs.Open(name)
}

func (fs *bundleFS) Writable() bool {
	return false
}

func (fs *bundleFS) Create(name string) (io.WriteCloser, error) {
	return nil, errors.New("write not supported on bundle filesystem")
}

func (fs *bundleFS) Mkdir(name string) error {
	return errors.New("mkdir not supported on bundle filesystem")
}

func (fs *bundleFS) Remove(name string) error {
	return errors.New("remove not supported on bundle filesystem")
}

func (fs *bundleFS) IsBundle(path string) bool {
	return IsBundle(path)
}

func (fs *bundleFS) IsDiscovarable() bool {
	return false
}

func (fs *bundleFS) SetDiscovarable(d bool) {
}
