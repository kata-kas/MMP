package renderers

import (
	"bufio"
	"bytes"
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"image"
	_ "image/jpeg"
	"image/png"
	"io/fs"
	"strconv"
	"strings"

	"go.uber.org/zap"

	"github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/libfs"
	"github.com/eduardooliveira/stLib/core/logger"
	"github.com/eduardooliveira/stLib/core/utils"
)

type gCodeRenderer struct {
}

type tmpImg struct {
	height int
	width  int
	data   []byte
}

func (r *gCodeRenderer) Render(ctx context.Context, asset *entities.Asset) (*entities.Asset, error) {
	genFS, err := libfs.GetLibFS("generated")
	if err != nil {
		return nil, fmt.Errorf("render error getting fs: %w", err)
	}
	imgName := fmt.Sprintf("%s.r.png", asset.ID)

	if _, err := fs.Stat(genFS.GetFS(), imgName); err == nil {
		return entities.NewAsset(genFS.GetName(), genFS.GetRoot(), imgName, false, asset), nil
	}

	pathStr := utils.VoZ(asset.Path)
	logger.GetLogger().Info("Rendering", zap.String("asset", pathStr), zap.String("img", imgName))

	objFs, err := libfs.GetAssetFS(ctx, *asset)
	if err != nil {
		return nil, fmt.Errorf("error getting fs: %w", err)
	}

	f, err := objFs.Open(pathStr)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	img := &tmpImg{}
	scanner := bufio.NewScanner(f)

	for scanner.Scan() {
		if strings.HasPrefix(strings.TrimSpace(scanner.Text()), ";") {
			line := strings.Trim(scanner.Text(), " ;")

			if strings.HasPrefix(line, "thumbnail begin") {
				header := strings.Split(line, " ")
				if len(header) < 4 {
					continue
				}
				length, err := strconv.Atoi(header[3])
				if err != nil {
					continue
				}
				i, err := r.parseThumbnail(scanner, header[2], length)
				if err != nil {
					continue
				}
				if i.width > img.width || i.height > img.height {
					img = i
				}
			}
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, errors.Join(err, errors.New("error reading gcode"))
	}

	if img.data == nil {
		return nil, errors.New("no thumbnail found")
	}

	// Double check decoding works
	decodedImg, _, err := image.Decode(bytes.NewReader(img.data))
	if err != nil {
		return nil, err
	}

	writer, err := genFS.Create(imgName)
	if err != nil {
		return nil, err
	}
	defer writer.Close()

	if err := png.Encode(writer, decodedImg); err != nil {
		return nil, err
	}

	return entities.NewAsset(genFS.GetName(), genFS.GetRoot(), imgName, false, asset), nil
}

func (r *gCodeRenderer) parseThumbnail(scanner *bufio.Scanner, size string, length int) (*tmpImg, error) {
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
	if len(dimensions) < 2 {
		return nil, errors.New("invalid thumbnail size format")
	}

	img := &tmpImg{
		data: b,
	}
	img.height, _ = strconv.Atoi(dimensions[0])
	img.width, _ = strconv.Atoi(dimensions[1])

	return img, nil
}
