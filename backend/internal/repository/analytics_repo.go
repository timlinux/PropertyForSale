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

func (r *analyticsRepository) ListABTests(ctx context.Context, opts ABTestListOptions) ([]analytics.ABTest, int64, error) {
	var tests []analytics.ABTest
	var total int64

	query := r.db.WithContext(ctx).Model(&analytics.ABTest{})

	if opts.Status != "" {
		query = query.Where("status = ?", opts.Status)
	}
	if opts.EntityType != "" {
		query = query.Where("entity_type = ?", opts.EntityType)
	}
	if opts.EntityID != nil {
		query = query.Where("entity_id = ?", *opts.EntityID)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if opts.Limit > 0 {
		query = query.Limit(opts.Limit)
	}
	if opts.Offset > 0 {
		query = query.Offset(opts.Offset)
	}

	err := query.Order("created_at DESC").Find(&tests).Error
	return tests, total, err
}

func (r *analyticsRepository) DeleteABTest(ctx context.Context, id uuid.UUID) error {
	// Delete variants first
	if err := r.db.WithContext(ctx).Where("ab_test_id = ?", id).Delete(&analytics.ABVariant{}).Error; err != nil {
		return err
	}
	return r.db.WithContext(ctx).Delete(&analytics.ABTest{}, "id = ?", id).Error
}

func (r *analyticsRepository) CreateABVariant(ctx context.Context, variant *analytics.ABVariant) error {
	if variant.ID == uuid.Nil {
		variant.ID = uuid.New()
	}
	return r.db.WithContext(ctx).Create(variant).Error
}

func (r *analyticsRepository) GetABVariant(ctx context.Context, id uuid.UUID) (*analytics.ABVariant, error) {
	var variant analytics.ABVariant
	err := r.db.WithContext(ctx).First(&variant, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &variant, nil
}

func (r *analyticsRepository) ListABVariants(ctx context.Context, testID uuid.UUID) ([]analytics.ABVariant, error) {
	var variants []analytics.ABVariant
	err := r.db.WithContext(ctx).Where("ab_test_id = ?", testID).Order("weight DESC").Find(&variants).Error
	return variants, err
}

func (r *analyticsRepository) UpdateABVariant(ctx context.Context, variant *analytics.ABVariant) error {
	return r.db.WithContext(ctx).Save(variant).Error
}

func (r *analyticsRepository) DeleteABVariant(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&analytics.ABVariant{}, "id = ?", id).Error
}

func (r *analyticsRepository) GetABTestResults(ctx context.Context, testID uuid.UUID) (*ABTestResults, error) {
	results := &ABTestResults{
		TestID:       testID,
		VariantStats: []ABVariantStats{},
	}

	// Get total views for this test
	var totalViews int64
	r.db.WithContext(ctx).
		Model(&analytics.PageView{}).
		Joins("JOIN ab_variants ON ab_variants.id = page_views.ab_variant_id").
		Where("ab_variants.ab_test_id = ?", testID).
		Count(&totalViews)
	results.TotalViews = totalViews

	// Get variants for this test
	variants, err := r.ListABVariants(ctx, testID)
	if err != nil {
		return nil, err
	}

	// Get stats per variant
	for _, v := range variants {
		var stats struct {
			Views          int64
			AvgDwellTimeMs float64
			AvgScrollDepth float64
		}

		r.db.WithContext(ctx).
			Model(&analytics.PageView{}).
			Select("COUNT(*) as views, AVG(dwell_time_ms) as avg_dwell_time_ms, AVG(scroll_depth) as avg_scroll_depth").
			Where("ab_variant_id = ?", v.ID).
			Scan(&stats)

		results.VariantStats = append(results.VariantStats, ABVariantStats{
			VariantID:      v.ID,
			VariantName:    v.Name,
			Views:          stats.Views,
			AvgDwellTimeMs: int64(stats.AvgDwellTimeMs),
			AvgScrollDepth: stats.AvgScrollDepth,
		})
	}

	return results, nil
}
