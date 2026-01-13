package klipper

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"

	"github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/utils"
)

func (p *KlipperPrinter) serverInfo() (*Result, error) {
	res, err := http.Get(fmt.Sprintf("%s/server/info", p.Address))
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	decoder := json.NewDecoder(res.Body)
	var r MoonRakerResponse
	err = decoder.Decode(&r)
	if err != nil {
		return nil, err
	}

	return r.Result, nil
}

func (p *KlipperPrinter) ServerFilesUpload(asset *entities.Asset) error {
	if asset.Path == nil {
		return fmt.Errorf("asset has no path")
	}

	filePath := utils.ToLibPath(filepath.Join(asset.Root, *asset.Path))
	file, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	fileName := filepath.Base(*asset.Path)
	if asset.Label != nil {
		if asset.Extension != nil {
			fileName = *asset.Label + *asset.Extension
		} else {
			fileName = *asset.Label
		}
	}

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("file", fileName)
	if err != nil {
		return err
	}
	_, err = io.Copy(part, file)
	if err != nil {
		return err
	}

	err = writer.Close()
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", fmt.Sprintf("%s/server/files/upload", p.Address), body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	if err != nil {
		return err
	}
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	} else {
		if resp.StatusCode != 201 {
			body := &bytes.Buffer{}
			body.ReadFrom(resp.Body)
			resp.Body.Close()
			fmt.Println(resp.StatusCode)
			fmt.Println(resp.Header)
			fmt.Println(body)
			return errors.New("unknown error uploading file")
		}
	}

	return nil
}
