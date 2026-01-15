package libfs

import (
	"errors"
	"io"
	"io/fs"
	"os"
	"path/filepath"

	"github.com/eduardooliveira/stLib/core/runtime"
	"github.com/go-git/go-git/v5"
)

type gitFS struct {
	config       runtime.FileSystem
	repo         *git.Repository
	worktree     *git.Worktree
	rootPath     string
	discovarable bool
}

func newGitFS(cfg runtime.FileSystem) (LibFS, error) {
	repoPath := cfg.Path
	if path, ok := cfg.Config["path"].(string); ok && path != "" {
		repoPath = path
	}

	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		return nil, err
	}

	worktree, err := repo.Worktree()
	if err != nil {
		return nil, err
	}

	return &gitFS{
		config:       cfg,
		repo:         repo,
		worktree:     worktree,
		rootPath:     repoPath,
		discovarable: true,
	}, nil
}

func (fs *gitFS) IsDiscovarable() bool {
	return fs.discovarable
}

func (fs *gitFS) SetDiscovarable(d bool) {
	fs.discovarable = d
}

func (fs *gitFS) GetFS() fs.FS {
	return os.DirFS(fs.rootPath)
}

func (fs *gitFS) GetName() string {
	return fs.config.Name
}

func (fs *gitFS) GetLocation() string {
	if path, ok := fs.config.Config["path"].(string); ok && path != "" {
		return path
	}
	return fs.config.Path
}

func (fs *gitFS) GetRoot() string {
	return fs.rootPath
}

func (fs *gitFS) Kind() string {
	return "git"
}

func (fs *gitFS) Open(name string) (fs.File, error) {
	fullPath := filepath.Join(fs.rootPath, name)
	return os.Open(fullPath)
}

func (fs *gitFS) Writable() bool {
	return false
}

func (fs *gitFS) Create(name string) (io.WriteCloser, error) {
	return nil, errors.New("write not supported on git filesystem")
}

func (fs *gitFS) Mkdir(name string) error {
	return errors.New("mkdir not supported on git filesystem")
}

func (fs *gitFS) Remove(name string) error {
	return errors.New("remove not supported on git filesystem")
}

func (fs *gitFS) IsBundle(path string) bool {
	return IsBundle(path)
}
