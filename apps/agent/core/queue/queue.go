package queue

import (
	"github.com/eduardooliveira/stLib/core/logger"
	"go.uber.org/zap"
)

type Job interface {
	JobName() string
	JobAction()
}

var queue = make(chan Job, 9999999)

func init() {
	go func() {
		for {
			job := <-queue
			job.JobAction()
			logger.GetLogger().Debug("job completed",
				zap.Int("queue_size", len(queue)),
				zap.String("job_name", job.JobName()),
			)
		}
	}()
}

func Enqueue(job Job) {
	queue <- job
	logger.GetLogger().Debug("job enqueued",
		zap.Int("queue_size", len(queue)),
		zap.String("job_name", job.JobName()),
	)
}
