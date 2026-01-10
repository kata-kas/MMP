package logger

import (
	"io"
	"os"
	"path/filepath"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var globalLogger *zap.Logger

func init() {
	config := zap.NewProductionConfig()
	logger, _ := config.Build()
	globalLogger = logger
}

func InitLogger(enableFile bool, logPath string) (*zap.Logger, error) {
	var config zap.Config
	var writers []zapcore.WriteSyncer

	if enableFile && logPath != "" {
		fullLogPath := filepath.Join(logPath, "log")
		f, err := os.OpenFile(fullLogPath, os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
		if err != nil {
			return nil, err
		}
		writers = append(writers, zapcore.AddSync(f))
		writers = append(writers, zapcore.AddSync(os.Stdout))
	} else {
		writers = append(writers, zapcore.AddSync(os.Stdout))
	}

	config = zap.NewProductionConfig()
	config.EncoderConfig.TimeKey = "timestamp"
	config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	config.EncoderConfig.StacktraceKey = "stacktrace"
	config.Level = zap.NewAtomicLevelAt(zap.InfoLevel)

	core := zapcore.NewCore(
		zapcore.NewJSONEncoder(config.EncoderConfig),
		zapcore.NewMultiWriteSyncer(writers...),
		config.Level,
	)

	logger := zap.New(core, zap.AddCaller(), zap.AddStacktrace(zapcore.ErrorLevel))
	globalLogger = logger

	return logger, nil
}

func GetLogger() *zap.Logger {
	if globalLogger == nil {
		config := zap.NewProductionConfig()
		logger, _ := config.Build()
		return logger
	}
	return globalLogger
}

func Sync() error {
	if globalLogger != nil {
		return globalLogger.Sync()
	}
	return nil
}

func NewWriteSyncer(w io.Writer) zapcore.WriteSyncer {
	return zapcore.AddSync(w)
}
