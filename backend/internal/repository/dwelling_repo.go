// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/property"
	"gorm.io/gorm"
)

type dwellingRepository struct {
	db *gorm.DB
}

// NewDwellingRepository creates a new dwelling repository
func NewDwellingRepository(db *gorm.DB) DwellingRepository {
	return &dwellingRepository{db: db}
}

func (r *dwellingRepository) Create(ctx context.Context, d *property.Dwelling) error {
	return r.db.WithContext(ctx).Create(d).Error
}

func (r *dwellingRepository) GetByID(ctx context.Context, id uuid.UUID) (*property.Dwelling, error) {
	var d property.Dwelling
	err := r.db.WithContext(ctx).
		Preload("Rooms").
		First(&d, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &d, nil
}

func (r *dwellingRepository) ListByPropertyID(ctx context.Context, propertyID uuid.UUID) ([]property.Dwelling, error) {
	var dwellings []property.Dwelling
	err := r.db.WithContext(ctx).
		Where("property_id = ?", propertyID).
		Order("sort_order ASC, created_at ASC").
		Find(&dwellings).Error
	return dwellings, err
}

func (r *dwellingRepository) Update(ctx context.Context, d *property.Dwelling) error {
	return r.db.WithContext(ctx).Save(d).Error
}

func (r *dwellingRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&property.Dwelling{}, "id = ?", id).Error
}
