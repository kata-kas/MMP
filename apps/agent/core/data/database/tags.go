package database

import (
	models "github.com/eduardooliveira/stLib/core/entities"
	"gorm.io/gorm"
)

func initTags() error {
	return DB.AutoMigrate(&models.Tag{})
}

func GetTags() (rtn []*models.Tag, err error) {
	return rtn, DB.Order("value").Find(&rtn).Error
}

func EnsureTags(db *gorm.DB, tags []*models.Tag) error {
	for _, t := range tags {
		if t == nil || t.Value == "" {
			continue
		}
		if err := db.FirstOrCreate(&models.Tag{Value: t.Value}).Error; err != nil {
			return err
		}
	}
	return nil
}
