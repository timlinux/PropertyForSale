// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/property"
	"gorm.io/gorm"
)

type areaRepository struct {
	db *gorm.DB
}

// NewAreaRepository creates a new area repository
func NewAreaRepository(db *gorm.DB) AreaRepository {
	return &areaRepository{db: db}
}

func (r *areaRepository) Create(ctx context.Context, a *property.Area) error {
	return r.db.WithContext(ctx).Create(a).Error
}

func (r *areaRepository) GetByID(ctx context.Context, id uuid.UUID) (*property.Area, error) {
	var a property.Area
	err := r.db.WithContext(ctx).First(&a, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *areaRepository) ListByPropertyID(ctx context.Context, propertyID uuid.UUID) ([]property.Area, error) {
	var areas []property.Area
	err := r.db.WithContext(ctx).
		Where("property_id = ?", propertyID).
		Order("sort_order ASC, created_at ASC").
		Find(&areas).Error
	return areas, err
}

func (r *areaRepository) Update(ctx context.Context, a *property.Area) error {
	return r.db.WithContext(ctx).Save(a).Error
}

func (r *areaRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&property.Area{}, "id = ?", id).Error
}
