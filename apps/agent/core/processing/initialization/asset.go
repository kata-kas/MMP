package initialization

import (
	"context"

	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/eduardooliveira/stLib/core/processing/enrichment"
	"github.com/eduardooliveira/stLib/core/processing/types"
	"github.com/eduardooliveira/stLib/core/state"
	"go.uber.org/zap"
)

type AssetIniter struct {
	ctx context.Context
	pa  *types.ProcessableAsset
}

func NewAssetIniter(pa *types.ProcessableAsset) *AssetIniter {
	return &AssetIniter{
		pa: pa,
	}
}

func (ai *AssetIniter) Init() ([]*types.ProcessableAsset, error) {

	if a, err := database.GetAssetByProjectAndName(ai.pa.Project.UUID, ai.pa.Name); err == nil && a.ID != "" {
		ai.pa.Asset = a
	} else {
		ai.pa.Asset, err = entities.NewProjectAsset2(ai.pa.Name, ai.pa.Label, ai.pa.Project, ai.pa.Origin)
		if err != nil {
			logger.GetLogger().Error("failed to create project asset", zap.String("name", ai.pa.Name), zap.Error(err))
			return nil, err
		}
	}

	if err := ai.processType(); err != nil {
		logger.GetLogger().Error("failed to process asset type", zap.String("name", ai.pa.Name), zap.Error(err))
		return nil, err
	}

	nestedAssets, err := enrichment.EnrichAsset(ai.ctx, ai.pa)
	if err != nil {
		logger.GetLogger().Warn("asset enrichment error", zap.String("name", ai.pa.Name), zap.Error(err))
	}
	rtn := make([]*types.ProcessableAsset, 0)
	rtn = append(rtn, ai.pa)
	for _, nestedAsset := range nestedAssets {

		assets, err := NewAssetIniter(nestedAsset).Init()
		if err != nil {
			logger.GetLogger().Warn("failed to initialize nested asset", zap.String("name", nestedAsset.Name), zap.Error(err))
		}

		for _, a := range assets {
			if nestedAsset.Asset.AssetType == "image" {
				ai.pa.Asset.ImageID = a.Asset.ID
			}
			rtn = append(rtn, a)
		}

	}

	if err := database.SaveAsset(ai.pa.Asset); err != nil {
		logger.GetLogger().Error("failed to save asset", zap.String("asset_id", ai.pa.Asset.ID), zap.Error(err))
		return nil, err
	}

	return rtn, nil
}

func (ai *AssetIniter) processType() error {
	if t, ok := state.ExtensionProjectType[ai.pa.Asset.Extension]; ok {
		ai.pa.Asset.AssetType = t.Name
	} else {
		ai.pa.Asset.AssetType = "other"
	}

	if ai.pa.Asset.AssetType == "image" {
		ai.pa.Asset.ImageID = ai.pa.Asset.ID
	}
	return nil
}
