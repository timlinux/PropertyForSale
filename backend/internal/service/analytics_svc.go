// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package service

import (
	"context"
	"fmt"
	"net"
	"strings"

	"github.com/google/uuid"
	"github.com/oschwald/geoip2-golang"
	"github.com/timlinux/PropertyForSale/backend/internal/config"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/analytics"
	"github.com/timlinux/PropertyForSale/backend/internal/repository"
)

// AnalyticsService handles analytics business logic
type AnalyticsService struct {
	analyticsRepo repository.AnalyticsRepository
	geoIPDB       *geoip2.Reader
	cfg           *config.Config
}

// NewAnalyticsService creates a new analytics service
func NewAnalyticsService(analyticsRepo repository.AnalyticsRepository, cfg *config.Config) *AnalyticsService {
	// Initialize GeoIP database
	var geoIPDB *geoip2.Reader
	if cfg.GeoIP.DatabasePath != "" {
		db, err := geoip2.Open(cfg.GeoIP.DatabasePath)
		if err != nil {
			fmt.Printf("Warning: failed to open GeoIP database: %v\n", err)
		} else {
			geoIPDB = db
		}
	}

	return &AnalyticsService{
		analyticsRepo: analyticsRepo,
		geoIPDB:       geoIPDB,
		cfg:           cfg,
	}
}

// PageViewInput contains the data for recording a page view
type PageViewInput struct {
	SessionID   string
	PropertyID  *uuid.UUID
	PagePath    string
	DwellTimeMs int64
	ScrollDepth int
	IPAddress   string
	Referrer    string
	UserAgent   string
}

// RecordPageView records a page view event
func (s *AnalyticsService) RecordPageView(ctx context.Context, input PageViewInput) error {
	pv := &analytics.PageView{
		SessionID:   input.SessionID,
		PropertyID:  input.PropertyID,
		PagePath:    input.PagePath,
		DwellTimeMs: input.DwellTimeMs,
		ScrollDepth: input.ScrollDepth,
		IPAddress:   input.IPAddress,
		Referrer:    input.Referrer,
		UserAgent:   input.UserAgent,
		DeviceType:  detectDeviceType(input.UserAgent),
	}

	// Resolve IP to location
	if s.geoIPDB != nil && input.IPAddress != "" {
		ip := net.ParseIP(input.IPAddress)
		if ip != nil {
			record, err := s.geoIPDB.City(ip)
			if err == nil {
				pv.Latitude = record.Location.Latitude
				pv.Longitude = record.Location.Longitude
				pv.Country = record.Country.IsoCode
				if len(record.Subdivisions) > 0 {
					pv.Region = record.Subdivisions[0].IsoCode
				}
				pv.City = record.City.Names["en"]
			}
		}
	}

	// Clear IP address after resolution for privacy
	pv.IPAddress = ""

	return s.analyticsRepo.CreatePageView(ctx, pv)
}

// GetDashboardData retrieves dashboard analytics data
func (s *AnalyticsService) GetDashboardData(ctx context.Context, propertyID *uuid.UUID, startDate, endDate string) (*DashboardData, error) {
	// Get page views
	views, err := s.analyticsRepo.GetPageViews(ctx, repository.PageViewOptions{
		PropertyID: propertyID,
		StartDate:  startDate,
		EndDate:    endDate,
		Limit:      1000,
	})
	if err != nil {
		return nil, err
	}

	// Calculate metrics
	totalViews := len(views)
	uniqueSessions := make(map[string]bool)
	totalDwellTime := int64(0)
	pageViewCounts := make(map[string]int)
	deviceCounts := make(map[string]int)

	for _, v := range views {
		uniqueSessions[v.SessionID] = true
		totalDwellTime += v.DwellTimeMs
		pageViewCounts[v.PagePath]++
		deviceCounts[v.DeviceType]++
	}

	avgDwellTime := int64(0)
	if totalViews > 0 {
		avgDwellTime = totalDwellTime / int64(totalViews)
	}

	return &DashboardData{
		TotalViews:      totalViews,
		UniqueSessions:  len(uniqueSessions),
		AvgDwellTimeMs:  avgDwellTime,
		PageViewCounts:  pageViewCounts,
		DeviceBreakdown: deviceCounts,
	}, nil
}

// DashboardData contains aggregated analytics data
type DashboardData struct {
	TotalViews      int            `json:"total_views"`
	UniqueSessions  int            `json:"unique_sessions"`
	AvgDwellTimeMs  int64          `json:"avg_dwell_time_ms"`
	PageViewCounts  map[string]int `json:"page_view_counts"`
	DeviceBreakdown map[string]int `json:"device_breakdown"`
}

// GetVisitorMap retrieves visitor locations for mapping
func (s *AnalyticsService) GetVisitorMap(ctx context.Context, propertyID *uuid.UUID, startDate, endDate string) ([]repository.VisitorLocation, error) {
	return s.analyticsRepo.GetVisitorLocations(ctx, repository.LocationOptions{
		PropertyID: propertyID,
		StartDate:  startDate,
		EndDate:    endDate,
	})
}

func detectDeviceType(userAgent string) string {
	ua := strings.ToLower(userAgent)
	switch {
	case strings.Contains(ua, "mobile") || strings.Contains(ua, "android") || strings.Contains(ua, "iphone"):
		return "mobile"
	case strings.Contains(ua, "tablet") || strings.Contains(ua, "ipad"):
		return "tablet"
	default:
		return "desktop"
	}
}
