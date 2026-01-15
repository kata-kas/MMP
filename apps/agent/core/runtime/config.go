package runtime

import (
	"fmt"
	"os"
	"path"
	"path/filepath"
	goruntime "runtime"

	"go.uber.org/zap"

	"github.com/BurntSushi/toml"
	"github.com/eduardooliveira/stLib/core/logger"
	_ "github.com/joho/godotenv/autoload"
	"github.com/spf13/viper"
)

type Config struct {
	Core struct {
		Log struct {
			EnableFile bool   `json:"enable_file" mapstructure:"enable_file"`
			Path       string `json:"path" mapstructure:"path"`
		} `json:"log" mapstructure:"log"`
		PprofAddr string `json:"pprof_addr"`
	} `json:"core" mapstructure:"core"`
	Server struct {
		Port int `json:"port" mapstructure:"port"`
	} `json:"server" mapstructure:"server"`
	Library struct {
		Path           string      `json:"path" mapstructure:"path"` // Deprecated: use fileSystems
		FileSystems    FileSystems `json:"file_systems" mapstructure:"file_systems"`
		Blacklist      []string    `json:"blacklist" mapstructure:"blacklist"`
		IgnoreDotFiles bool        `json:"ignore_dot_files" mapstructure:"ignore_dot_files"`
		RenderBundles  bool        `json:"render_bundles" mapstructure:"render_bundles"`
	} `json:"library" mapstructure:"library"`
	Render struct {
		MaxWorkers      int    `json:"max_workers" mapstructure:"max_workers"`
		ModelColor      string `json:"model_color" mapstructure:"model_color"`
		BackgroundColor string `json:"background_color" mapstructure:"background_color"`
	} `json:"render" mapstructure:"render"`
	Integrations struct {
		Thingiverse struct {
			Token string `json:"token" mapstructure:"token"`
		} `json:"thingiverse" mapstructure:"thingiverse"`
	} `json:"integrations" mapstructure:"integrations"`
}

type FileSystem struct {
	Name    string         `json:"name" mapstructure:"name"`
	Path    string         `json:"path" mapstructure:"path"`
	Kind    string         `json:"kind" mapstructure:"kind"`
	Config  map[string]any `json:"config" mapstructure:"config"`
	Default bool           `json:"default" mapstructure:"default"`
}

type FileSystems []FileSystem

var Cfg *Config

var dataPath = "/data"

var initErr error

func defaultLibraryPath() string {
	if v := os.Getenv("LIBRARY_PATH"); v != "" {
		return v
	}

	candidates := []string{
		"./testdata",
		"./library",
		"./apps/agent/testdata",
		"./apps/agent/library",
	}
	for _, p := range candidates {
		if st, err := os.Stat(p); err == nil && st.IsDir() {
			return p
		}
	}

	if goruntime.GOOS == "darwin" || goruntime.GOOS == "windows" {
		return "./library"
	}
	return "/library"
}

func init() {
	defer func() {
		if r := recover(); r != nil {
			initErr = fmt.Errorf("config initialization panic: %v", r)
		}
	}()

	viper.BindEnv("DATA_PATH")
	if viper.GetString("DATA_PATH") != "" {
		dataPath = viper.GetString("DATA_PATH")
	}
	if _, err := os.Stat(dataPath); os.IsNotExist(err) {
		err := os.MkdirAll(dataPath, os.ModePerm)
		if err != nil {
			initErr = fmt.Errorf("failed to create data directory: %w", err)
			return
		}
	}

	bindEnv()

	libDefault := defaultLibraryPath()

	if v := viper.GetInt("PORT"); v == 0 {
		viper.SetDefault("server.port", 8000)
	} else {
		viper.SetDefault("server.port", v)
	}
	viper.SetDefault("library.path", libDefault)
	if v := viper.GetString("MODEL_RENDER_COLOR"); v == "" {
		viper.SetDefault("render.model_color", "#167DF0")
	} else {
		viper.SetDefault("render.model_color", v)
	}
	if v := viper.GetString("MODEL_BACKGROUND_COLOR"); v == "" {
		viper.SetDefault("render.background_color", "#FFFFFF")
	} else {
		viper.SetDefault("render.background_color", v)
	}

	viper.SetDefault("library.blacklist", []string{})
	viper.SetDefault("library.ignore_dot_files", true)
	viper.SetDefault("library.render_bundles", false)
	viper.SetDefault("library.file_systems", []map[string]any{
		{"name": "default", "path": libDefault, "kind": "local", "default": true},
	})
	viper.SetDefault("render.max_workers", 5)
	viper.SetDefault("core.log.enable_file", false)

	viper.SetDefault("server.hostname", "localhost")

	viper.SetConfigName("config")
	viper.AddConfigPath(dataPath)
	viper.SetConfigType("toml")
	viper.AutomaticEnv()

	err := viper.ReadInConfig()
	if err != nil {
		logger.GetLogger().Debug("config file read error", zap.Error(err))
	}

	cfg := &Config{}
	viper.Unmarshal(cfg)

	if cfg.Library.Path == "/library" && viper.GetString("LIBRARY_PATH") != "" {
		cfg.Library.Path = viper.GetString("LIBRARY_PATH")
	}

	cfg.Library.Blacklist = append(cfg.Library.Blacklist, ".project.stlib", ".thumb.png", ".render.png")

	configExists := true
	if _, err := os.Stat(path.Join(dataPath, "config.toml")); os.IsNotExist(err) {
		logger.GetLogger().Info("config.toml not found, creating...")
		configExists = false
	}

	if configExists && cfg.Library.Path == "/library" && (goruntime.GOOS == "darwin" || goruntime.GOOS == "windows") {
		cfg.Library.Path = libDefault
		for i := range cfg.Library.FileSystems {
			if cfg.Library.FileSystems[i].Default && cfg.Library.FileSystems[i].Kind == "local" && cfg.Library.FileSystems[i].Path == "/library" {
				cfg.Library.FileSystems[i].Path = libDefault
			}
		}
	}

	if !filepath.IsAbs(cfg.Library.Path) {
		_ = os.MkdirAll(cfg.Library.Path, os.ModePerm)
	}

	if !configExists {
		SaveConfig(cfg)
	}

	Cfg = cfg
}

func bindEnv() {
	viper.BindEnv("PORT")
	viper.BindEnv("LIBRARY_PATH")
	viper.BindEnv("MAX_RENDER_WORKERS")
	viper.BindEnv("MODEL_RENDER_COLOR")
	viper.BindEnv("MODEL_BACKGROUND_COLOR")
	viper.BindEnv("LOG_PATH")
	viper.BindEnv("THINGIVERSE_TOKEN")
}

func GetDataPath() string {
	return dataPath
}

func GetInitError() error {
	return initErr
}

func SaveConfig(cfg *Config) error {
	f, err := os.OpenFile(filepath.Join(GetDataPath(), "config.toml"), os.O_RDWR|os.O_CREATE|os.O_TRUNC, os.ModePerm)
	if err != nil {
		logger.GetLogger().Error("failed to open config file", zap.Error(err))
		return err
	}
	if err := toml.NewEncoder(f).Encode(cfg); err != nil {
		logger.GetLogger().Error("failed to encode config", zap.Error(err))
		f.Close()
		return err
	}
	if err := f.Close(); err != nil {
		logger.GetLogger().Error("failed to close config file", zap.Error(err))
		return err
	}
	Cfg = cfg
	return nil
}
