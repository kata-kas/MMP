package processing

import (
	"fmt"
	"os"
	"path"
	"path/filepath"
	"strings"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/data/database"
	models "github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/runtime"
	"github.com/eduardooliveira/stLib/core/state"
)

func RunTempDiscovery(logger *zap.Logger) error {
	logger.Info("discovering temp files")

	tempPath := filepath.Clean(path.Join(runtime.GetDataPath(), "temp"))
	if _, err := os.Stat(tempPath); os.IsNotExist(err) {
		err := os.MkdirAll(tempPath, os.ModePerm)
		if err != nil {
			return fmt.Errorf("failed to create temp directory: %w", err)
		}
	}

	entries, err := os.ReadDir(tempPath)
	if err != nil {
		return fmt.Errorf("failed to read temp directory: %w", err)
	}

	for _, e := range entries {
		blacklisted := false
		for _, blacklist := range runtime.Cfg.Library.Blacklist {
			if strings.HasSuffix(e.Name(), blacklist) {
				blacklisted = true
				break
			}
		}
		if blacklisted {
			continue
		}
		logger.Debug("discovering temp file", zap.String("name", e.Name()))
		tempFile, err := DiscoverTempFile(e.Name(), logger)
		if err != nil {
			logger.Warn("error discovering temp file", zap.String("name", e.Name()), zap.Error(err))
			continue
		}
		state.TempFiles[tempFile.UUID] = tempFile
	}

	return nil
}

func DiscoverTempFile(name string, logger *zap.Logger) (*models.TempFile, error) {
	tempFile, err := models.NewTempFile(name)
	if err != nil {
		return nil, err
	}

	token := strings.Split(strings.ToLower(name), "_")[0]

	projects, err := database.GetProjects()
	if err != nil {
		logger.Error("failed to get projects", zap.Error(err))
		return nil, err
	}

	for _, p := range projects {
		if strings.Contains(strings.ToLower(p.Name), token) {
			tempFile.AddMatch(p.UUID)
		}
		for _, tag := range p.Tags {
			if strings.Contains(strings.ToLower(tag.Value), token) {
				tempFile.AddMatch(p.UUID)
			}
		}
	}
	return tempFile, nil
}
