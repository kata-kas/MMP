package libfs

import (
	"context"
	"errors"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"slices"

	"github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/runtime"
)

type LibFS interface {
	GetFS() fs.FS
	GetName() string
	GetLocation() string
	GetRoot() string
	Kind() string
	Open(name string) (fs.File, error)
	Writable() bool
	Create(name string) (io.WriteCloser, error)
	Mkdir(name string) error
	Remove(name string) error
	IsBundle(path string) bool
	IsDiscovarable() bool
	SetDiscovarable(bool)
}

var (
	fileSystems   = make(map[string]LibFS)
	defaultFSName = ""
	bundleExts    = []string{".zip", ".rar", ".7z", ".tar", ".3mf"}
)

func LoadFSs() error {
	if len(runtime.Cfg.Library.FileSystems) == 0 {
		// Fallback to old path if no filesystems are configured
		if runtime.Cfg.Library.Path != "" {
			defaultFSName = "default"
			fileSystems[defaultFSName] = newLocalFS(runtime.FileSystem{
				Name:    defaultFSName,
				Path:    runtime.Cfg.Library.Path,
				Kind:    "local",
				Default: true,
			})
		} else {
			return errors.New("no file systems configured")
		}
	} else {
		for _, cfgFS := range runtime.Cfg.Library.FileSystems {
			var fs LibFS
			var err error
			switch cfgFS.Kind {
			case "local":
				fs = newLocalFS(cfgFS)
			case "git":
				fs, err = newGitFS(cfgFS)
				if err != nil {
					return err
				}
			default:
				return errors.New("unsupported filesystem kind: " + cfgFS.Kind)
			}
			fileSystems[cfgFS.Name] = fs
			if defaultFSName == "" || cfgFS.Default {
				defaultFSName = cfgFS.Name
			}
		}
	}

	// Create cache filesystem
	if _, ok := fileSystems["cache"]; !ok {
		cachePath := filepath.Join(runtime.GetDataPath(), "cache")
		if err := createFolder(cachePath); err != nil {
			return err
		}
		fileSystems["cache"] = newLocalFS(runtime.FileSystem{
			Name: "cache",
			Path: cachePath,
			Kind: "local",
		})
		fileSystems["cache"].SetDiscovarable(false)
	}

	// Create generated filesystem
	if _, ok := fileSystems["generated"]; !ok {
		generatedPath := filepath.Join(runtime.GetDataPath(), "generated")
		if err := createFolder(generatedPath); err != nil {
			return err
		}
		fileSystems["generated"] = newLocalFS(runtime.FileSystem{
			Name: "generated",
			Path: generatedPath,
			Kind: "local",
		})
		fileSystems["generated"].SetDiscovarable(false)
	}

	// Create temp filesystem
	if _, ok := fileSystems["temp"]; !ok {
		tempPath := filepath.Join(runtime.GetDataPath(), "temp")
		if err := createFolder(tempPath); err != nil {
			return err
		}
		fileSystems["temp"] = newLocalFS(runtime.FileSystem{
			Name: "temp",
			Path: tempPath,
			Kind: "local",
		})
		fileSystems["temp"].SetDiscovarable(false)
	}

	return nil
}

func GetDefaultFS() LibFS {
	return fileSystems[defaultFSName]
}

func GetAssetFS(ctx context.Context, asset entities.Asset) (LibFS, error) {
	if asset.FSKind == "bundle" {
		return resolveBundleFS(ctx, asset)
	}

	if f, ok := fileSystems[asset.FSName]; ok {
		return f, nil
	}

	return nil, errors.New("file system not found")
}

func GetLibFS(name string) (LibFS, error) {
	if _, ok := fileSystems[name]; !ok {
		return nil, errors.New("file system not found")
	}
	return fileSystems[name], nil
}

func GetFSs() map[string]LibFS {
	rtn := make(map[string]LibFS)
	for k, v := range fileSystems {
		if v.IsDiscovarable() {
			rtn[k] = v
		}
	}
	return rtn
}

func IsBundle(path string) bool {
	return slices.Contains(bundleExts, filepath.Ext(path))
}

func GetBundleFS(ctx context.Context, parentFS LibFS, asset entities.Asset) (LibFS, error) {
	return newBundleFS(ctx, parentFS, asset)
}

func createFolder(path string) error {
	_, err := os.Stat(path)
	if os.IsNotExist(err) {
		return os.MkdirAll(path, 0755)
	}
	return err
}
