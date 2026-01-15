package thingiverse

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/data/database"
	"github.com/eduardooliveira/stLib/core/downloader/tools"
	"github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/eduardooliveira/stLib/core/runtime"
	"github.com/eduardooliveira/stLib/core/utils"
	"golang.org/x/sync/errgroup"
)

const (
	thingiverseAPIBase     = "https://api.thingiverse.com"
	maxConcurrentDownloads = 5
	apiTimeout             = 30 * time.Second
	downloadTimeout        = 2 * time.Minute
)

var thingURLPattern = regexp.MustCompile(`thing:(\d+)`)

func Fetch(ctx context.Context, rawURL string) error {
	if runtime.Cfg.Integrations.Thingiverse.Token == "" {
		return errors.New("thingiverse API token not configured")
	}

	thingID, err := extractThingID(rawURL)
	if err != nil {
		return err
	}

	log := logger.GetLogger().With(zap.String("thing_id", thingID))
	log.Info("fetching thingiverse thing")

	apiClient := &http.Client{Timeout: apiTimeout}
	downloadClient := &http.Client{Timeout: downloadTimeout}

	thing, err := fetchThingDetails(ctx, thingID, apiClient)
	if err != nil {
		return fmt.Errorf("failed to fetch thing details: %w", err)
	}

	rootAsset, err := createOrLoadRootAsset(thing)
	if err != nil {
		return fmt.Errorf("failed to create root asset: %w", err)
	}

	if err := utils.CreateFolder(utils.ToLibPath(filepath.Join(
		runtime.Cfg.Library.Path, *rootAsset.Path))); err != nil {
		return fmt.Errorf("failed to create asset folder: %w", err)
	}

	if err := database.InsertAsset(rootAsset); err != nil {
		log.Debug("root asset may already exist", zap.Error(err))
	}

	assets, err := downloadThingAssets(ctx, thingID, rootAsset, apiClient, downloadClient, log)
	if err != nil {
		return fmt.Errorf("failed to download assets: %w", err)
	}

	if err := setThumbnail(rootAsset, assets); err != nil {
		log.Warn("failed to set thumbnail", zap.Error(err))
	}

	log.Info("thingiverse thing fetched successfully",
		zap.Int("file_count", len(assets)))

	return nil
}

func extractThingID(rawURL string) (string, error) {
	matches := thingURLPattern.FindStringSubmatch(rawURL)
	if len(matches) < 2 {
		return "", errors.New("invalid thingiverse URL format")
	}
	return matches[1], nil
}

func fetchThingDetails(ctx context.Context, thingID string, client *http.Client) (*Thing, error) {
	req, err := http.NewRequestWithContext(ctx, "GET",
		fmt.Sprintf("%s/things/%s", thingiverseAPIBase, thingID), nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+runtime.Cfg.Integrations.Thingiverse.Token)

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	var thing Thing
	if err := json.NewDecoder(resp.Body).Decode(&thing); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &thing, nil
}

func createOrLoadRootAsset(thing *Thing) (*entities.Asset, error) {
	projectName := sanitizeName(fmt.Sprintf("%d - %s", thing.ID, thing.Name))
	projectPath := filepath.Join("/", projectName)

	rootAsset := entities.NewAsset("default", runtime.Cfg.Library.Path, projectPath, true, nil)
	rootAsset.Label = &projectName

	desc := thing.Description
	rootAsset.Description = &desc

	if rootAsset.Properties == nil {
		rootAsset.Properties = make(entities.Properties)
	}
	rootAsset.Properties["external_link"] = thing.PublicURL

	var tags []*entities.Tag
	for _, tag := range thing.Tags {
		tags = append(tags, entities.StringToTag(tag.Name))
	}
	rootAsset.Tags = tags

	existing, err := database.GetAsset(rootAsset.ID, false)
	if err == nil && existing.ID != "" {
		return &existing, nil
	}

	return rootAsset, nil
}

func sanitizeName(name string) string {
	return strings.ReplaceAll(name, "/", "-")
}

func downloadThingAssets(
	ctx context.Context,
	thingID string,
	parentAsset *entities.Asset,
	apiClient, downloadClient *http.Client,
	log *zap.Logger,
) ([]*entities.Asset, error) {
	g, gCtx := errgroup.WithContext(ctx)
	g.SetLimit(maxConcurrentDownloads)

	var assetsMu sync.Mutex
	var allAssets []*entities.Asset

	g.Go(func() error {
		files, err := fetchFileList(gCtx, thingID, apiClient)
		if err != nil {
			return fmt.Errorf("failed to fetch file list: %w", err)
		}

		assets, err := downloadFiles(gCtx, files, parentAsset, downloadClient)
		if err != nil {
			return err
		}

		assetsMu.Lock()
		allAssets = append(allAssets, assets...)
		assetsMu.Unlock()

		log.Info("files downloaded", zap.Int("count", len(files)))
		return nil
	})

	g.Go(func() error {
		images, err := fetchImageList(gCtx, thingID, apiClient)
		if err != nil {
			return fmt.Errorf("failed to fetch image list: %w", err)
		}

		assets, err := downloadImages(gCtx, images, parentAsset, downloadClient)
		if err != nil {
			return err
		}

		assetsMu.Lock()
		allAssets = append(allAssets, assets...)
		assetsMu.Unlock()

		log.Info("images downloaded", zap.Int("count", len(images)))
		return nil
	})

	if err := g.Wait(); err != nil {
		return allAssets, err
	}

	return allAssets, nil
}

func fetchFileList(ctx context.Context, thingID string, client *http.Client) ([]*ThingFile, error) {
	req, err := http.NewRequestWithContext(ctx, "GET",
		fmt.Sprintf("%s/things/%s/files", thingiverseAPIBase, thingID), nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+runtime.Cfg.Integrations.Thingiverse.Token)

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	var files []*ThingFile
	if err := json.NewDecoder(resp.Body).Decode(&files); err != nil {
		return nil, err
	}

	return files, nil
}

func downloadFiles(
	ctx context.Context,
	files []*ThingFile,
	parentAsset *entities.Asset,
	client *http.Client,
) ([]*entities.Asset, error) {
	g, gCtx := errgroup.WithContext(ctx)
	g.SetLimit(maxConcurrentDownloads)

	assetChan := make(chan *entities.Asset, len(files))

	for _, file := range files {
		file := file
		g.Go(func() error {
			req, err := http.NewRequestWithContext(gCtx, "GET", file.DownloadURL, nil)
			if err != nil {
				return fmt.Errorf("failed to create request for %s: %w", file.Name, err)
			}

			asset, err := tools.DownloadAsset(file.Name, parentAsset, client, req)
			if err != nil {
				return fmt.Errorf("failed to download %s: %w", file.Name, err)
			}

			if err := database.InsertAsset(asset); err != nil {
				logger.GetLogger().Debug("asset may already exist",
					zap.String("name", file.Name),
					zap.Error(err))
			}

			select {
			case assetChan <- asset:
			case <-gCtx.Done():
				return gCtx.Err()
			}

			return nil
		})
	}

	go func() {
		g.Wait()
		close(assetChan)
	}()

	var assets []*entities.Asset
	for asset := range assetChan {
		assets = append(assets, asset)
	}

	return assets, g.Wait()
}

func fetchImageList(ctx context.Context, thingID string, client *http.Client) ([]*ThingImage, error) {
	req, err := http.NewRequestWithContext(ctx, "GET",
		fmt.Sprintf("%s/things/%s/images", thingiverseAPIBase, thingID), nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+runtime.Cfg.Integrations.Thingiverse.Token)

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	var images []*ThingImage
	if err := json.NewDecoder(resp.Body).Decode(&images); err != nil {
		return nil, err
	}

	return images, nil
}

func downloadImages(
	ctx context.Context,
	images []*ThingImage,
	parentAsset *entities.Asset,
	client *http.Client,
) ([]*entities.Asset, error) {
	g, gCtx := errgroup.WithContext(ctx)
	g.SetLimit(maxConcurrentDownloads)

	assetChan := make(chan *entities.Asset, len(images))

	for _, image := range images {
		image := image
		imageURL := findLargeDisplayURL(image)
		if imageURL == "" {
			continue
		}

		g.Go(func() error {
			req, err := http.NewRequestWithContext(gCtx, "GET", imageURL, nil)
			if err != nil {
				return fmt.Errorf("failed to create request for %s: %w", image.Name, err)
			}

			asset, err := tools.DownloadAsset(image.Name, parentAsset, client, req)
			if err != nil {
				return fmt.Errorf("failed to download %s: %w", image.Name, err)
			}

			if err := database.InsertAsset(asset); err != nil {
				logger.GetLogger().Debug("asset may already exist",
					zap.String("name", image.Name),
					zap.Error(err))
			}

			select {
			case assetChan <- asset:
			case <-gCtx.Done():
				return gCtx.Err()
			}

			return nil
		})
	}

	go func() {
		g.Wait()
		close(assetChan)
	}()

	var assets []*entities.Asset
	for asset := range assetChan {
		assets = append(assets, asset)
	}

	return assets, g.Wait()
}

func findLargeDisplayURL(image *ThingImage) string {
	for _, size := range image.Sizes {
		if size.Size == "large" && size.Type == "display" {
			return size.URL
		}
	}
	return ""
}

func setThumbnail(rootAsset *entities.Asset, assets []*entities.Asset) error {
	for _, asset := range assets {
		if asset.Kind != nil && *asset.Kind == "image" {
			rootAsset.Thumbnail = &asset.ID
			return database.SaveAsset(rootAsset)
		}
	}
	return nil
}

type ThingImage struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	URL   string `json:"url"`
	Sizes []struct {
		Type string `json:"type"`
		Size string `json:"size"`
		URL  string `json:"url"`
	} `json:"sizes"`
}

type ThingFile struct {
	ID            int           `json:"id"`
	Name          string        `json:"name"`
	Size          int           `json:"size"`
	URL           string        `json:"url"`
	PublicURL     string        `json:"public_url"`
	DownloadURL   string        `json:"download_url"`
	ThreejsURL    string        `json:"threejs_url"`
	Thumbnail     string        `json:"thumbnail"`
	DefaultImage  interface{}   `json:"default_image"`
	Date          string        `json:"date"`
	FormattedSize string        `json:"formatted_size"`
	MetaData      []interface{} `json:"meta_data"`
	DownloadCount int           `json:"download_count"`
	DirectURL     string        `json:"direct_url"`
}

type Thing struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Thumbnail string `json:"thumbnail"`
	URL       string `json:"url"`
	PublicURL string `json:"public_url"`
	Creator   struct {
		ID               int    `json:"id"`
		Name             string `json:"name"`
		FirstName        string `json:"first_name"`
		LastName         string `json:"last_name"`
		URL              string `json:"url"`
		PublicURL        string `json:"public_url"`
		Thumbnail        string `json:"thumbnail"`
		CountOfFollowers int    `json:"count_of_followers"`
		CountOfFollowing int    `json:"count_of_following"`
		CountOfDesigns   int    `json:"count_of_designs"`
		AcceptsTips      bool   `json:"accepts_tips"`
		IsFollowing      bool   `json:"is_following"`
		Location         string `json:"location"`
		Cover            string `json:"cover"`
	} `json:"creator"`
	Added        time.Time   `json:"added"`
	Modified     time.Time   `json:"modified"`
	IsPublished  int         `json:"is_published"`
	IsWip        int         `json:"is_wip"`
	IsFeatured   interface{} `json:"is_featured"`
	IsNsfw       bool        `json:"is_nsfw"`
	LikeCount    int         `json:"like_count"`
	IsLiked      bool        `json:"is_liked"`
	CollectCount int         `json:"collect_count"`
	IsCollected  bool        `json:"is_collected"`
	CommentCount int         `json:"comment_count"`
	IsWatched    bool        `json:"is_watched"`
	DefaultImage struct {
		ID    int    `json:"id"`
		URL   string `json:"url"`
		Name  string `json:"name"`
		Sizes []struct {
			Type string `json:"type"`
			Size string `json:"size"`
			URL  string `json:"url"`
		} `json:"sizes"`
		Added time.Time `json:"added"`
	} `json:"default_image"`
	Description      string `json:"description"`
	Instructions     string `json:"instructions"`
	DescriptionHTML  string `json:"description_html"`
	InstructionsHTML string `json:"instructions_html"`
	Details          string `json:"details"`
	DetailsParts     []struct {
		Type     string `json:"type"`
		Name     string `json:"name"`
		Required string `json:"required,omitempty"`
		Data     []struct {
			Content string `json:"content"`
		} `json:"data,omitempty"`
	} `json:"details_parts"`
	EduDetails        string      `json:"edu_details"`
	EduDetailsParts   interface{} `json:"edu_details_parts"`
	License           string      `json:"license"`
	AllowsDerivatives bool        `json:"allows_derivatives"`
	FilesURL          string      `json:"files_url"`
	ImagesURL         string      `json:"images_url"`
	LikesURL          string      `json:"likes_url"`
	AncestorsURL      string      `json:"ancestors_url"`
	DerivativesURL    string      `json:"derivatives_url"`
	TagsURL           string      `json:"tags_url"`
	Tags              []struct {
		Name        string `json:"name"`
		Tag         string `json:"tag"`
		URL         string `json:"url"`
		Count       int    `json:"count"`
		ThingsURL   string `json:"things_url"`
		AbsoluteURL string `json:"absolute_url"`
	} `json:"tags"`
	CategoriesURL     string      `json:"categories_url"`
	FileCount         int         `json:"file_count"`
	LayoutCount       int         `json:"layout_count"`
	LayoutsURL        string      `json:"layouts_url"`
	IsPrivate         int         `json:"is_private"`
	IsPurchased       int         `json:"is_purchased"`
	InLibrary         bool        `json:"in_library"`
	PrintHistoryCount int         `json:"print_history_count"`
	AppID             interface{} `json:"app_id"`
	DownloadCount     int         `json:"download_count"`
	ViewCount         int         `json:"view_count"`
	Education         struct {
		Grades   []interface{} `json:"grades"`
		Subjects []interface{} `json:"subjects"`
	} `json:"education"`
	RemixCount       int           `json:"remix_count"`
	MakeCount        int           `json:"make_count"`
	AppCount         int           `json:"app_count"`
	RootCommentCount int           `json:"root_comment_count"`
	Moderation       string        `json:"moderation"`
	IsDerivative     bool          `json:"is_derivative"`
	Ancestors        []interface{} `json:"ancestors"`
	CanComment       bool          `json:"can_comment"`
	TypeName         string        `json:"type_name"`
}
