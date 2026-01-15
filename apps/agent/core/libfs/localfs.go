package libfs

import (
	"io"
	"io/fs"
	"os"
	"path/filepath"

	"github.com/eduardooliveira/stLib/core/runtime"
)

type localFS struct {
	config       runtime.FileSystem
	fs           fs.FS
	discovarable bool
}

func newLocalFS(cfg runtime.FileSystem) LibFS {
	return &localFS{
		config:       cfg,
		fs:           os.DirFS(cfg.Path),
		discovarable: true,
	}
}

func (fs *localFS) IsDiscovarable() bool {
	return fs.discovarable
}

func (fs *localFS) SetDiscovarable(d bool) {
	fs.discovarable = d
}

func (fs *localFS) GetFS() fs.FS {
	return fs.fs
}

func (fs *localFS) GetName() string {
	return fs.config.Name
}

func (fs *localFS) GetLocation() string {
	return fs.config.Path
}

func (fs *localFS) GetRoot() string {
	return fs.config.Path
}

func (fs *localFS) Kind() string {
	return "local"
}

func (fs *localFS) Open(name string) (fs.File, error) {
	return fs.fs.Open(name)
}

func (fs *localFS) Writable() bool {
	return true
}

func (fs *localFS) Create(name string) (io.WriteCloser, error) {
	if filepath.Base(name) != "." {
		if err := os.MkdirAll(filepath.Join(fs.config.Path, filepath.Dir(name)), 0755); err != nil {
			return nil, err
		}
	}
	return os.Create(filepath.Join(fs.config.Path, name))
}

func (fs *localFS) Mkdir(name string) error {
	return os.MkdirAll(filepath.Join(fs.config.Path, name), 0755)
}

func (fs *localFS) Remove(name string) error {
	return os.RemoveAll(filepath.Join(fs.config.Path, name))
}

func (fs *localFS) IsBundle(path string) bool {
	return IsBundle(path)
}
