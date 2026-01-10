package tools

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/eduardooliveira/stLib/core/processing/initialization"
	"github.com/eduardooliveira/stLib/core/processing/types"
	"github.com/eduardooliveira/stLib/core/utils"
)

func DownloadAsset(name string, project *entities.Project, client *http.Client, req *http.Request) ([]*types.ProcessableAsset, error) {
	out, err := os.Create(utils.ToLibPath(filepath.Join(project.FullPath(), name)))
	if err != nil {
		return nil, err
	}
	defer out.Close()

	logger.GetLogger().Info("downloading asset", zap.String("name", name), zap.String("project_uuid", project.UUID))

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("bad status: %s", resp.Status)
	}

	_, err = io.Copy(out, resp.Body)
	if err != nil {
		return nil, err
	}
	return initialization.NewAssetIniter(&types.ProcessableAsset{
		Name:    name,
		Project: project,
		Origin:  "fs",
	}).Init()
}

func SaveFile(dst string, f io.Reader) error {
	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, f)
	if err != nil {
		return err
	}

	return nil
}
