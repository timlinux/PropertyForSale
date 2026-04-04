// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/content"
	"gorm.io/gorm"
)

type contentRepository struct {
	db *gorm.DB
}

// NewContentRepository creates a new content repository
func NewContentRepository(db *gorm.DB) ContentRepository {
	return &contentRepository{db: db}
}

func (r *contentRepository) CreateVersion(ctx context.Context, v *content.ContentVersion) error {
	return r.db.WithContext(ctx).Create(v).Error
}

func (r *contentRepository) GetVersion(ctx context.Context, entityType string, entityID uuid.UUID, version int) (*content.ContentVersion, error) {
	var v content.ContentVersion
	err := r.db.WithContext(ctx).
		Where("entity_type = ? AND entity_id = ? AND version_number = ?", entityType, entityID, version).
		First(&v).Error
	if err != nil {
		return nil, err
	}
	return &v, nil
}

func (r *contentRepository) GetLatestVersion(ctx context.Context, entityType string, entityID uuid.UUID) (*content.ContentVersion, error) {
	var v content.ContentVersion
	err := r.db.WithContext(ctx).
		Where("entity_type = ? AND entity_id = ?", entityType, entityID).
		Order("version_number DESC").
		First(&v).Error
	if err != nil {
		return nil, err
	}
	return &v, nil
}

func (r *contentRepository) ListVersions(ctx context.Context, entityType string, entityID uuid.UUID) ([]content.ContentVersion, error) {
	var versions []content.ContentVersion
	err := r.db.WithContext(ctx).
		Where("entity_type = ? AND entity_id = ?", entityType, entityID).
		Order("version_number DESC").
		Find(&versions).Error
	return versions, err
}
