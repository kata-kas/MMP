package processing

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/processing/discovery"
	"github.com/eduardooliveira/stLib/core/processing/initialization"
	"github.com/eduardooliveira/stLib/core/processing/types"
	"github.com/eduardooliveira/stLib/core/runtime"
	"github.com/eduardooliveira/stLib/core/utils"
	"golang.org/x/sync/errgroup"
)

type ProcessableAsset struct {
	Name    string
	Label   string
	Project *entities.Project
	Asset   *entities.ProjectAsset
	Origin  string
}

func (p *ProcessableAsset) GetProject() *entities.Project {
	return p.Project
}
func (p *ProcessableAsset) GetAsset() *entities.ProjectAsset {
	return p.Asset
}

func ProcessFolder(ctx context.Context, root string, logger *zap.Logger) error {
	tempPath := filepath.Clean(filepath.Join(runtime.GetDataPath(), "assets"))
	if _, err := os.Stat(tempPath); os.IsNotExist(err) {
		err := os.MkdirAll(tempPath, os.ModePerm)
		if err != nil {
			return fmt.Errorf("failed to create assets directory: %w", err)
		}
	}
	projects, err := discovery.DeepProjectDiscoverer{}.Discover(root)
	if err != nil {
		return err
	}

	eg, nctx := errgroup.WithContext(ctx)
	eg.SetLimit(10)
	outs := make([]chan *types.ProcessableProject, 0)
	for _, p := range projects {
		out, runner := utils.Jobber(initialization.NewProjectIniter(p).
			WithContext(nctx).
			WithAssetDiscoverer(discovery.FlatAssetDiscoverer{}).
			PersistOnFinish().
			Init)
		eg.Go(runner)
		outs = append(outs, out)
	}
	eg.Wait()

	for _, out := range outs {
		for p := range out {
			logger.Debug("processed project",
				zap.String("name", p.Name),
				zap.String("path", p.Path),
			)
		}
	}

	return nil
}
