// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/property"
	"gorm.io/gorm"
)

type propertyRepository struct {
	db *gorm.DB
}

// NewPropertyRepository creates a new property repository
func NewPropertyRepository(db *gorm.DB) PropertyRepository {
	return &propertyRepository{db: db}
}

func (r *propertyRepository) Create(ctx context.Context, p *property.Property) error {
	return r.db.WithContext(ctx).Create(p).Error
}

func (r *propertyRepository) GetByID(ctx context.Context, id uuid.UUID) (*property.Property, error) {
	var p property.Property
	err := r.db.WithContext(ctx).
		Preload("Dwellings").
		Preload("Areas").
		First(&p, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *propertyRepository) GetBySlug(ctx context.Context, slug string) (*property.Property, error) {
	var p property.Property
	err := r.db.WithContext(ctx).
		Preload("Dwellings").
		Preload("Areas").
		First(&p, "slug = ?", slug).Error
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *propertyRepository) List(ctx context.Context, opts ListOptions) ([]property.Property, int64, error) {
	var properties []property.Property
	var total int64

	query := r.db.WithContext(ctx).Model(&property.Property{})

	// Apply filters
	if opts.Status != "" {
		query = query.Where("status = ?", opts.Status)
	}
	if opts.OwnerID != nil {
		query = query.Where("owner_id = ?", *opts.OwnerID)
	}
	if opts.Search != "" {
		search := "%" + opts.Search + "%"
		query = query.Where("name ILIKE ? OR description ILIKE ? OR city ILIKE ?", search, search, search)
	}
	if opts.MinPrice != nil {
		query = query.Where("price_min >= ?", *opts.MinPrice)
	}
	if opts.MaxPrice != nil {
		query = query.Where("price_max <= ?", *opts.MaxPrice)
	}

	// Geospatial filter
	if opts.Latitude != nil && opts.Longitude != nil && opts.RadiusKm != nil {
		// Haversine formula for distance calculation
		query = query.Where(`
			(6371 * acos(
				cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) +
				sin(radians(?)) * sin(radians(latitude))
			)) <= ?
		`, *opts.Latitude, *opts.Longitude, *opts.Latitude, *opts.RadiusKm)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply ordering
	orderBy := opts.OrderBy
	if orderBy == "" {
		orderBy = "created_at"
	}
	orderDir := opts.OrderDir
	if orderDir == "" {
		orderDir = "DESC"
	}
	query = query.Order(fmt.Sprintf("%s %s", orderBy, orderDir))

	// Apply pagination
	if opts.Limit > 0 {
		query = query.Limit(opts.Limit)
	}
	if opts.Offset > 0 {
		query = query.Offset(opts.Offset)
	}

	if err := query.Find(&properties).Error; err != nil {
		return nil, 0, err
	}

	return properties, total, nil
}

func (r *propertyRepository) Update(ctx context.Context, p *property.Property) error {
	return r.db.WithContext(ctx).Save(p).Error
}

func (r *propertyRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&property.Property{}, "id = ?", id).Error
}
