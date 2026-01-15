package enrichment

import (
	"bufio"
	"bytes"
	"crypto/md5"
	"crypto/sha1"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"image"
	"image/png"
	"os"
	"path"
	"path/filepath"
	"strconv"
	"strings"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/eduardooliveira/stLib/core/processing/types"
	"github.com/eduardooliveira/stLib/core/runtime"
	"github.com/eduardooliveira/stLib/core/system"
	"github.com/eduardooliveira/stLib/core/utils"
)

type gcodeRenderer struct{}

func NewGCodeRenderer() *gcodeRenderer {
	return &gcodeRenderer{}
}

type tmpImg struct {
	Height int
	Width  int
	Data   []byte
}

func (g *gcodeRenderer) Render(job types.ProcessableAsset) (string, error) {
	imgName := fmt.Sprintf("%s.r.png", job.Asset.ID)
	imgPath := utils.ToAssetsPath(job.Asset.ProjectUUID, imgName)
	if _, err := os.Stat(imgPath); err == nil {
		return imgName, errors.New("already exists")
	}
	system.Publish("render", job.Asset.Name)

	path := utils.ToLibPath(path.Join(job.Project.FullPath(), job.Asset.Name))
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	image := &tmpImg{
		Height: 0,
		Width:  0,
	}

	scanner := bufio.NewScanner(f)

	for scanner.Scan() {
		if strings.HasPrefix(strings.TrimSpace(scanner.Text()), ";") {
			line := strings.Trim(scanner.Text(), " ;")

			if strings.HasPrefix(line, "thumbnail begin") {

				header := strings.Split(line, " ")
				length, err := strconv.Atoi(header[3])
				if err != nil {
					return "", err
				}
				i, err := g.parseThumbnail(scanner, header[2], length)
				if err != nil {
					return "", err
				}
				if i.Width > image.Width || i.Height > image.Height {
					image = i
				}

			}

		}
	}

	if err := scanner.Err(); err != nil {
		return "", errors.Join(err, errors.New("error reading gcode"))
	}

	if image.Data != nil {

		utils.CreateAssetsFolder(job.Project.UUID)

		h := sha1.New()
		_, err = h.Write(image.Data)
		if err != nil {
			return "", err
		}

		f, err := g.storeImage(image, imgPath)
		if err != nil {
			return "", err
		}
		defer f.Close()

		// Create Asset entity for rendered image and link to model
		if err := g.createRenderedImageAsset(job, imgName, imgPath); err != nil {
			logger.GetLogger().Warn("failed to create rendered image asset", zap.String("render_name", imgName), zap.Error(err))
		}

		return imgName, nil

	}
	return "", errors.New("no thumbnail found")
}

func (g *gcodeRenderer) createRenderedImageAsset(job types.ProcessableAsset, renderName, renderPath string) error {
	// Find the model Asset by calculating its ID from path
	// Path format matches migration: projectPath/assetName relative to library root
	projectPath := filepath.Join(job.Project.Path, job.Project.Name)
	assetPath := filepath.Join(projectPath, job.Asset.Name)
	modelAssetID := calculateAssetID("default", runtime.Cfg.Library.Path, assetPath)

	modelAsset, err := database.GetAsset(modelAssetID, false)
	if err != nil {
		logger.GetLogger().Debug("model asset not found, skipping thumbnail link", zap.String("model_id", modelAssetID), zap.Error(err))
		return nil
	}

	// Calculate Asset ID for rendered image
	renderAssetPath := filepath.Join("_assets", job.Project.UUID, renderName)
	renderAssetID := calculateAssetID("default", runtime.Cfg.Library.Path, renderAssetPath)

	// Check if rendered image asset already exists
	_, err = database.GetAsset(renderAssetID, false)
	if err == nil {
		// Asset exists, just link it
		if modelAsset.Thumbnail == nil {
			modelAsset.Thumbnail = &renderAssetID
			return database.SaveAsset(&modelAsset)
		}
		return nil
	}

	// Create new Asset entity for rendered image
	ext := filepath.Ext(renderName)
	label := strings.TrimSuffix(renderName, ext)
	kind := "image"

	renderAsset := &entities.Asset{
		ID:         renderAssetID,
		Label:      &label,
		Path:       &renderAssetPath,
		Root:       runtime.Cfg.Library.Path,
		FSKind:     "local",
		FSName:     "default",
		Extension:  &ext,
		Kind:       &kind,
		NodeKind:   entities.NodeKindFile,
		ParentID:   modelAsset.ParentID,
		Properties: make(entities.Properties),
	}

	renderAsset.Properties["render_path"] = renderPath
	renderAsset.Properties["origin"] = "render"

	if err := database.InsertAsset(renderAsset); err != nil {
		return fmt.Errorf("failed to insert rendered image asset: %w", err)
	}

	// Link to model
	if modelAsset.Thumbnail == nil {
		modelAsset.Thumbnail = &renderAssetID
		return database.SaveAsset(&modelAsset)
	}

	return nil
}

func calculateAssetID(fsName, root, path string) string {
	data := []byte(filepath.Join(fsName, root, path))
	md5Hash := md5.Sum(data)
	return hex.EncodeToString(md5Hash[:])
}

func (g *gcodeRenderer) parseThumbnail(scanner *bufio.Scanner, size string, length int) (*tmpImg, error) {
	sb := strings.Builder{}
	for scanner.Scan() {
		line := strings.Trim(scanner.Text(), " ;")
		if strings.HasPrefix(line, "thumbnail end") {
			break
		}
		sb.WriteString(line)

	}
	if sb.Len() != length {
		return nil, errors.New("thumbnail length mismatch")
	}

	b, err := base64.StdEncoding.DecodeString(sb.String())
	if err != nil {
		return nil, err
	}

	dimensions := strings.Split(size, "x")

	img := &tmpImg{
		Data: b,
	}
	img.Height, err = strconv.Atoi(dimensions[0])
	if err != nil {
		return nil, err
	}

	img.Width, err = strconv.Atoi(dimensions[0])
	if err != nil {
		return nil, err
	}
	return img, nil
}

func (g *gcodeRenderer) storeImage(img *tmpImg, path string) (*os.File, error) {
	i, _, err := image.Decode(bytes.NewReader(img.Data))
	if err != nil {
		return nil, err
	}
	out, _ := os.Create(path)

	err = png.Encode(out, i)

	if err != nil {
		return nil, err
	}
	return out, nil
}
