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
	"github.com/eduardooliveira/stLib/core/utils"
)

func DownloadAsset(name string, parentAsset *entities.Asset, client *http.Client, req *http.Request) (*entities.Asset, error) {
	var filePath string
	if parentAsset.Path != nil {
		filePath = filepath.Join(parentAsset.Root, *parentAsset.Path, name)
	} else {
		filePath = filepath.Join(parentAsset.Root, name)
	}

	out, err := os.Create(utils.ToLibPath(filePath))
	if err != nil {
		return nil, err
	}
	defer out.Close()

	logger.GetLogger().Info("downloading asset", zap.String("name", name), zap.String("parent_asset_id", parentAsset.ID))

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

	// Create asset entity
	var assetPath string
	if parentAsset.Path != nil {
		assetPath = filepath.Join(*parentAsset.Path, name)
	} else {
		assetPath = name
	}

	newAsset := entities.NewAsset("default", parentAsset.Root, assetPath, false, parentAsset)
	return newAsset, nil
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
