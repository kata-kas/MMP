package downloader

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"

	"github.com/eduardooliveira/stLib/core/downloader/makerworld"
	"github.com/eduardooliveira/stLib/core/downloader/thingiverse"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/labstack/echo/v4"
)

const (
	maxConcurrentDownloads = 3
	downloadTimeout        = 5 * time.Minute
	maxURLsPerRequest      = 50
)

type DownloadRequest struct {
	URLs    []string `json:"urls" validate:"required,min=1,max=50,dive,url"`
	Cookies []Cookie `json:"cookies,omitempty"`
}

type Cookie struct {
	Name  string `json:"name" validate:"required"`
	Value string `json:"value" validate:"required"`
}

type DownloadResult struct {
	URL     string `json:"url"`
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
}

type DownloadResponse struct {
	Results []DownloadResult `json:"results"`
}

func fetch(c echo.Context) error {
	var req DownloadRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if len(req.URLs) > maxURLsPerRequest {
		return echo.NewHTTPError(http.StatusBadRequest,
			fmt.Sprintf("maximum %d URLs allowed", maxURLsPerRequest))
	}

	validURLs, validationErrors := validateURLs(req.URLs)

	results := make([]DownloadResult, 0, len(req.URLs))
	for _, err := range validationErrors {
		results = append(results, err)
	}

	if len(validURLs) == 0 {
		return c.JSON(http.StatusOK, DownloadResponse{Results: results})
	}

	ctx, cancel := context.WithTimeout(c.Request().Context(), downloadTimeout)
	defer cancel()

	userAgent := c.Request().Header.Get("User-Agent")
	if userAgent == "" {
		userAgent = "Mozilla/5.0"
	}

	downloadResults := processDownloads(ctx, validURLs, req.Cookies, userAgent)
	results = append(results, downloadResults...)

	return c.JSON(http.StatusOK, DownloadResponse{Results: results})
}

func validateURLs(urls []string) ([]string, []DownloadResult) {
	valid := make([]string, 0, len(urls))
	errors := make([]DownloadResult, 0)

	for _, rawURL := range urls {
		parsed, err := url.Parse(rawURL)
		if err != nil {
			errors = append(errors, DownloadResult{
				URL:     rawURL,
				Success: false,
				Error:   "invalid URL format",
			})
			continue
		}

		if err := validateURLSafety(parsed); err != nil {
			errors = append(errors, DownloadResult{
				URL:     rawURL,
				Success: false,
				Error:   err.Error(),
			})
			continue
		}

		if !isSupportedDomain(parsed.Host) {
			errors = append(errors, DownloadResult{
				URL:     rawURL,
				Success: false,
				Error:   "unsupported domain",
			})
			continue
		}

		valid = append(valid, rawURL)
	}

	return valid, errors
}

func validateURLSafety(u *url.URL) error {
	if u.Scheme != "http" && u.Scheme != "https" {
		return fmt.Errorf("only http/https allowed")
	}

	host := u.Hostname()

	ip := net.ParseIP(host)
	if ip != nil {
		if ip.IsLoopback() || ip.IsPrivate() {
			return fmt.Errorf("private/loopback IPs not allowed")
		}
	}

	if strings.HasSuffix(host, ".local") ||
		strings.HasSuffix(host, ".internal") {
		return fmt.Errorf("internal domains not allowed")
	}

	return nil
}

func isSupportedDomain(host string) bool {
	return strings.Contains(host, "thingiverse.com") ||
		strings.Contains(host, "makerworld.com")
}

func processDownloads(ctx context.Context, urls []string, cookies []Cookie, userAgent string) []DownloadResult {
	results := make([]DownloadResult, len(urls))
	resultsMu := sync.Mutex{}

	g, gCtx := errgroup.WithContext(ctx)
	g.SetLimit(maxConcurrentDownloads)

	for i, rawURL := range urls {
		i, rawURL := i, rawURL

		g.Go(func() error {
			result := downloadURL(gCtx, rawURL, cookies, userAgent)

			resultsMu.Lock()
			results[i] = result
			resultsMu.Unlock()

			return nil
		})
	}

	g.Wait()
	return results
}

func downloadURL(ctx context.Context, rawURL string, cookies []Cookie, userAgent string) DownloadResult {
	log := logger.GetLogger().With(zap.String("url", rawURL))

	parsed, _ := url.Parse(rawURL)

	var err error
	if strings.Contains(parsed.Host, "thingiverse.com") {
		err = thingiverse.Fetch(ctx, rawURL)
	} else if strings.Contains(parsed.Host, "makerworld.com") {
		httpCookies := make([]*http.Cookie, len(cookies))
		for i, c := range cookies {
			httpCookies[i] = &http.Cookie{
				Name:   c.Name,
				Value:  c.Value,
				Path:   "/",
				Domain: parsed.Host,
			}
		}
		err = makerworld.Fetch(rawURL, httpCookies, userAgent)
	}

	if err != nil {
		log.Error("download failed", zap.Error(err))
		return DownloadResult{
			URL:     rawURL,
			Success: false,
			Error:   "download failed",
		}
	}

	log.Info("download completed")
	return DownloadResult{
		URL:     rawURL,
		Success: true,
	}
}
