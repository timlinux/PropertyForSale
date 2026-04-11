// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/property"
	"gorm.io/gorm"
)

type structureRepository struct {
	db *gorm.DB
}

// NewStructureRepository creates a new structure repository
func NewStructureRepository(db *gorm.DB) StructureRepository {
	return &structureRepository{db: db}
}

func (r *structureRepository) Create(ctx context.Context, s *property.Structure) error {
	return r.db.WithContext(ctx).Create(s).Error
}

func (r *structureRepository) GetByID(ctx context.Context, id uuid.UUID) (*property.Structure, error) {
	var s property.Structure
	err := r.db.WithContext(ctx).
		Preload("Rooms").
		First(&s, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *structureRepository) ListByPropertyID(ctx context.Context, propertyID uuid.UUID) ([]property.Structure, error) {
	var structures []property.Structure
	err := r.db.WithContext(ctx).
		Where("property_id = ?", propertyID).
		Order("sort_order ASC, created_at ASC").
		Find(&structures).Error
	return structures, err
}

func (r *structureRepository) Update(ctx context.Context, s *property.Structure) error {
	return r.db.WithContext(ctx).Save(s).Error
}

func (r *structureRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&property.Structure{}, "id = ?", id).Error
}
