// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/media"
	"gorm.io/gorm"
)

type mediaRepository struct {
	db *gorm.DB
}

// NewMediaRepository creates a new media repository
func NewMediaRepository(db *gorm.DB) MediaRepository {
	return &mediaRepository{db: db}
}

func (r *mediaRepository) Create(ctx context.Context, m *media.Media) error {
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *mediaRepository) GetByID(ctx context.Context, id uuid.UUID) (*media.Media, error) {
	var m media.Media
	err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *mediaRepository) ListByEntity(ctx context.Context, entityType media.EntityType, entityID uuid.UUID) ([]media.Media, error) {
	var items []media.Media
	err := r.db.WithContext(ctx).
		Where("entity_type = ? AND entity_id = ?", entityType, entityID).
		Order("sort_order ASC, created_at ASC").
		Find(&items).Error
	return items, err
}

func (r *mediaRepository) Update(ctx context.Context, m *media.Media) error {
	return r.db.WithContext(ctx).Save(m).Error
}

func (r *mediaRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&media.Media{}, "id = ?", id).Error
}
