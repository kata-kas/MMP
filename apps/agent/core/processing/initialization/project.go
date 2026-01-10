package initialization

import (
	"context"
	"errors"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/eduardooliveira/stLib/core/processing/discovery"
	"github.com/eduardooliveira/stLib/core/processing/types"
	"github.com/eduardooliveira/stLib/core/utils"
	"golang.org/x/sync/errgroup"
)

type ProjectIniter struct {
	ctx                context.Context
	processableProject types.ProcessableProject
	assetDiscoverer    discovery.AssetDiscoverer
	persistOnFinish    bool
}

func NewProjectIniter(processableProject types.ProcessableProject) *ProjectIniter {
	return &ProjectIniter{
		processableProject: processableProject,
	}
}

func (pd *ProjectIniter) WithContext(ctx context.Context) *ProjectIniter {
	pd.ctx = ctx
	return pd
}

func (pd *ProjectIniter) WithProject(project entities.Project) *ProjectIniter {
	pd.processableProject.Project = &project
	return pd
}

func (pd *ProjectIniter) WithAssetDiscoverer(ad discovery.AssetDiscoverer) *ProjectIniter {
	pd.assetDiscoverer = ad
	return pd
}

func (pd *ProjectIniter) PersistOnFinish() *ProjectIniter {
	pd.persistOnFinish = true
	return pd
}

func (pd *ProjectIniter) Init() (*types.ProcessableProject, error) {
	pd.LoadProject()

	if pd.assetDiscoverer == nil {
		return nil, errors.New("asset discoverer not set")
	}
	assets, err := pd.assetDiscoverer.Discover(pd.processableProject.Path)
	if err != nil {
		logger.GetLogger().Error("failed to discover assets", zap.String("path", pd.processableProject.Path), zap.Error(err))
		return nil, err
	}
	logger.GetLogger().Debug("assets discovered", zap.Int("count", len(assets)), zap.String("path", pd.processableProject.Path))

	outChans := make([]<-chan []*types.ProcessableAsset, 0)
	eg := errgroup.Group{}

	for _, a := range assets {
		a.Project = pd.processableProject.Project //TODO: make asset self-contained
		c, runner := utils.Jobber(NewAssetIniter(a).Init)
		outChans = append(outChans, c)
		eg.Go(runner)
	}

	out := utils.MergeWait(outChans...)

	for pas := range out {
		for _, pa := range pas {
			if pa.Asset.AssetType == "image" {
				if pd.processableProject.Project.DefaultImageID == "" || pa.Origin == "fs" {
					pd.processableProject.Project.DefaultImageID = pa.Asset.ID
				}
			}
		}
	}

	if pd.persistOnFinish {
		if err := database.InsertProject(pd.processableProject.Project); err != nil {
			logger.GetLogger().Error("failed to insert project", zap.String("project_uuid", pd.processableProject.Project.UUID), zap.Error(err))
			return nil, err
		}
	}

	return &pd.processableProject, nil
}

func (pd *ProjectIniter) Project() *entities.Project {
	return pd.processableProject.Project
}

func (pd *ProjectIniter) LoadProject() {
	if pd.processableProject.Project != nil {
		return
	}

	pd.processableProject.Project = entities.NewProjectFromPath(pd.processableProject.Path)
	if p, err := database.GetProjectByPathAndName(pd.processableProject.Project.Path, pd.processableProject.Project.Name); err == nil {
		pd.processableProject.Project = p
	} else {
		pd.processableProject.Project.Tags = append(pd.processableProject.Project.Tags, entities.StringsToTags(utils.PathToTags(pd.processableProject.Project.Path))...)
	}
}
