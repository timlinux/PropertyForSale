// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/analytics"
	"gorm.io/gorm"
)

type analyticsRepository struct {
	db *gorm.DB
}

// NewAnalyticsRepository creates a new analytics repository
func NewAnalyticsRepository(db *gorm.DB) AnalyticsRepository {
	return &analyticsRepository{db: db}
}

func (r *analyticsRepository) CreatePageView(ctx context.Context, pv *analytics.PageView) error {
	return r.db.WithContext(ctx).Create(pv).Error
}

func (r *analyticsRepository) GetPageViews(ctx context.Context, opts PageViewOptions) ([]analytics.PageView, error) {
	var views []analytics.PageView
	query := r.db.WithContext(ctx).Model(&analytics.PageView{})

	if opts.PropertyID != nil {
		query = query.Where("property_id = ?", *opts.PropertyID)
	}
	if opts.StartDate != "" {
		query = query.Where("created_at >= ?", opts.StartDate)
	}
	if opts.EndDate != "" {
		query = query.Where("created_at <= ?", opts.EndDate)
	}
	if opts.Limit > 0 {
		query = query.Limit(opts.Limit)
	}

	err := query.Order("created_at DESC").Find(&views).Error
	return views, err
}

func (r *analyticsRepository) GetVisitorLocations(ctx context.Context, opts LocationOptions) ([]VisitorLocation, error) {
	var locations []VisitorLocation

	query := r.db.WithContext(ctx).
		Model(&analytics.PageView{}).
		Select("latitude, longitude, country, city, COUNT(*) as count").
		Where("latitude IS NOT NULL AND longitude IS NOT NULL").
		Group("latitude, longitude, country, city")

	if opts.PropertyID != nil {
		query = query.Where("property_id = ?", *opts.PropertyID)
	}
	if opts.StartDate != "" {
		query = query.Where("created_at >= ?", opts.StartDate)
	}
	if opts.EndDate != "" {
		query = query.Where("created_at <= ?", opts.EndDate)
	}

	err := query.Find(&locations).Error
	return locations, err
}

func (r *analyticsRepository) GetDwellTimeStats(ctx context.Context, propertyID uuid.UUID) (*DwellTimeStats, error) {
	stats := &DwellTimeStats{
		ByPage: make(map[string]int64),
	}

	// Get average dwell time
	var avgResult struct {
		Avg float64
	}
	r.db.WithContext(ctx).
		Model(&analytics.PageView{}).
		Select("AVG(dwell_time_ms) as avg").
		Where("property_id = ?", propertyID).
		Scan(&avgResult)
	stats.AvgDwellTimeMs = int64(avgResult.Avg)

	// Get dwell time by page
	var pageStats []struct {
		PagePath string
		Avg      float64
	}
	r.db.WithContext(ctx).
		Model(&analytics.PageView{}).
		Select("page_path, AVG(dwell_time_ms) as avg").
		Where("property_id = ?", propertyID).
		Group("page_path").
		Scan(&pageStats)

	for _, ps := range pageStats {
		stats.ByPage[ps.PagePath] = int64(ps.Avg)
	}

	return stats, nil
}

// A/B Testing

func (r *analyticsRepository) CreateABTest(ctx context.Context, test *analytics.ABTest) error {
	return r.db.WithContext(ctx).Create(test).Error
}

func (r *analyticsRepository) GetABTest(ctx context.Context, id uuid.UUID) (*analytics.ABTest, error) {
	var test analytics.ABTest
	err := r.db.WithContext(ctx).First(&test, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &test, nil
}

func (r *analyticsRepository) UpdateABTest(ctx context.Context, test *analytics.ABTest) error {
	return r.db.WithContext(ctx).Save(test).Error
}

func (r *analyticsRepository) GetActiveTestForEntity(ctx context.Context, entityType string, entityID uuid.UUID) (*analytics.ABTest, error) {
	var test analytics.ABTest
	err := r.db.WithContext(ctx).
		Where("entity_type = ? AND entity_id = ? AND status = ?", entityType, entityID, analytics.ABTestStatusRunning).
		First(&test).Error
	if err != nil {
		return nil, err
	}
	return &test, nil
}
