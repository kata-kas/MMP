package enrichment

import (
	"errors"
	"fmt"
	"os"
	"path"
	"path/filepath"
	"strings"

	"go.uber.org/zap"

	"github.com/Maker-Management-Platform/fauxgl"
	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/eduardooliveira/stLib/core/processing/types"
	"github.com/eduardooliveira/stLib/core/runtime"
	"github.com/eduardooliveira/stLib/core/system"
	"github.com/eduardooliveira/stLib/core/utils"
	"github.com/nfnt/resize"
)

type stlRenderer struct {
	scale  int
	width  int
	height int
	fovy   float64
	near   float64
	far    float64

	eye    fauxgl.Vector
	center fauxgl.Vector
	up     fauxgl.Vector
	light  fauxgl.Vector
	color  fauxgl.Color
}

func NewSTLRenderer() *stlRenderer {
	return &stlRenderer{
		scale:  1,    // optional supersampling
		width:  1920, // output width in pixels
		height: 1080, // output height in pixels
		fovy:   30,   // vertical field of view in degrees
		near:   1,    // near clipping plane
		far:    10,   // far clipping plane

		eye:    fauxgl.V(-3, -3, -0.75),                        // camera position
		center: fauxgl.V(0, -0.07, 0),                          // view center position
		up:     fauxgl.V(0, 0, 1),                              // up vector
		light:  fauxgl.V(-0.75, -5, 0.25).Normalize(),          // light direction
		color:  fauxgl.HexColor(runtime.Cfg.Render.ModelColor), // object color
	}
}

func (s *stlRenderer) Render(job types.ProcessableAsset) (string, error) {
	renderName := fmt.Sprintf("%s.r.png", job.Asset.ID)
	renderSavePath := utils.ToAssetsPath(job.Asset.ProjectUUID, renderName)

	if _, err := os.Stat(renderSavePath); err == nil {
		return renderName, errors.New("already exists")
	}

	system.Publish("render", job.Asset.Name)

	mesh, err := fauxgl.LoadSTL(utils.ToLibPath(path.Join(job.Project.FullPath(), job.Asset.Name)))
	if err != nil {
		logger.GetLogger().Error("failed to load STL file", zap.String("name", job.Asset.Name), zap.Error(err))
		return "", err
	}

	// fit mesh in a bi-unit cube centered at the origin
	mesh.BiUnitCube()

	// smooth the normals
	mesh.SmoothNormalsThreshold(fauxgl.Radians(30))

	// create a rendering context
	context := fauxgl.NewContext(s.width*s.scale, s.height*s.scale)
	context.ClearColorBufferWith(fauxgl.HexColor(runtime.Cfg.Render.BackgroundColor))

	// create transformation matrix and light direction
	aspect := float64(s.width) / float64(s.height)
	matrix := fauxgl.LookAt(s.eye, s.center, s.up).Perspective(s.fovy, aspect, s.near, s.far)

	// use builtin phong shader
	shader := fauxgl.NewPhongShader(matrix, s.light, s.eye)
	shader.ObjectColor = s.color
	context.Shader = shader

	// render
	context.DrawMesh(mesh)

	// downsample image for antialiasing
	image := context.Image()
	image = resize.Resize(uint(s.width), uint(s.height), image, resize.Bilinear)

	utils.CreateAssetsFolder(job.Project.UUID)

	if err := fauxgl.SavePNG(renderSavePath, image); err != nil {
		return "", err
	}

	// Create Asset entity for rendered image and link to model
	if err := s.createRenderedImageAsset(job, renderName, renderSavePath); err != nil {
		logger.GetLogger().Warn("failed to create rendered image asset", zap.String("render_name", renderName), zap.Error(err))
	}

	return renderName, nil
}

func (s *stlRenderer) createRenderedImageAsset(job types.ProcessableAsset, renderName, renderPath string) error {
	projectPath := filepath.Join(job.Project.Path, job.Project.Name)
	assetPath := filepath.Join(projectPath, job.Asset.Name)
	modelAssetID := calculateAssetID("default", runtime.Cfg.Library.Path, assetPath)

	modelAsset, err := database.GetAsset(modelAssetID, false)
	if err != nil {
		logger.GetLogger().Debug("model asset not found, skipping thumbnail link", zap.String("model_id", modelAssetID), zap.Error(err))
		return nil
	}

	// Calculate Asset ID for rendered image
	// Rendered images are stored in assets folder, use a special path format
	renderAssetPath := filepath.Join("_assets", job.Project.UUID, renderName)
	renderAssetID := calculateAssetID("default", runtime.Cfg.Library.Path, renderAssetPath)

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

	// Store the actual file path in properties for file access
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
