package octorpint

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

	models "github.com/eduardooliveira/stLib/core/entities"
	"github.com/eduardooliveira/stLib/core/utils"
)

func (p *OctoPrintPrinter) serverInfo() (*OctoPrintResponse, error) {
	bearer := "Bearer " + p.ApiKey
	req, err := http.NewRequest("GET", fmt.Sprintf("%s/api/server", p.Address), nil)

	if err != nil {
		return nil, err
	}

	req.Header.Add("Authorization", bearer)

	client := &http.Client{}
	resp, err := client.Do(req)
	//TODO add error if forbidden
	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()

	decoder := json.NewDecoder(resp.Body)
	var r OctoPrintResponse
	err = decoder.Decode(&r)
	if err != nil {
		return nil, err
	}

	return &r, nil
}

func (p *OctoPrintPrinter) ServerFilesUpload(asset *models.Asset) error {
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

	bearer := "Bearer " + p.ApiKey
	// location could be local or sdcard, can also create new folders by adding path
	req, err := http.NewRequest("POST", fmt.Sprintf("%s/api/files/local", p.Address), body)

	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Add("Authorization", bearer)

	client := &http.Client{}
	resp, err := client.Do(req)

	if err != nil {
		return err
	}

	defer resp.Body.Close()

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
