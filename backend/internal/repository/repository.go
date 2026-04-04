// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/analytics"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/content"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/media"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/property"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/user"
	"gorm.io/gorm"
)

// Repositories holds all repository implementations
type Repositories struct {
	Property  PropertyRepository
	Dwelling  DwellingRepository
	Room      RoomRepository
	Area      AreaRepository
	Media     MediaRepository
	User      UserRepository
	Analytics AnalyticsRepository
	Content   ContentRepository
}

// NewRepositories creates a new Repositories instance with all implementations
func NewRepositories(db *gorm.DB) *Repositories {
	return &Repositories{
		Property:  NewPropertyRepository(db),
		Dwelling:  NewDwellingRepository(db),
		Room:      NewRoomRepository(db),
		Area:      NewAreaRepository(db),
		Media:     NewMediaRepository(db),
		User:      NewUserRepository(db),
		Analytics: NewAnalyticsRepository(db),
		Content:   NewContentRepository(db),
	}
}

// PropertyRepository defines property data access operations
type PropertyRepository interface {
	Create(ctx context.Context, p *property.Property) error
	GetByID(ctx context.Context, id uuid.UUID) (*property.Property, error)
	GetBySlug(ctx context.Context, slug string) (*property.Property, error)
	List(ctx context.Context, opts ListOptions) ([]property.Property, int64, error)
	Update(ctx context.Context, p *property.Property) error
	Delete(ctx context.Context, id uuid.UUID) error
}

// DwellingRepository defines dwelling data access operations
type DwellingRepository interface {
	Create(ctx context.Context, d *property.Dwelling) error
	GetByID(ctx context.Context, id uuid.UUID) (*property.Dwelling, error)
	ListByPropertyID(ctx context.Context, propertyID uuid.UUID) ([]property.Dwelling, error)
	Update(ctx context.Context, d *property.Dwelling) error
	Delete(ctx context.Context, id uuid.UUID) error
}

// RoomRepository defines room data access operations
type RoomRepository interface {
	Create(ctx context.Context, r *property.Room) error
	GetByID(ctx context.Context, id uuid.UUID) (*property.Room, error)
	ListByDwellingID(ctx context.Context, dwellingID uuid.UUID) ([]property.Room, error)
	Update(ctx context.Context, r *property.Room) error
	Delete(ctx context.Context, id uuid.UUID) error
}

// AreaRepository defines area data access operations
type AreaRepository interface {
	Create(ctx context.Context, a *property.Area) error
	GetByID(ctx context.Context, id uuid.UUID) (*property.Area, error)
	ListByPropertyID(ctx context.Context, propertyID uuid.UUID) ([]property.Area, error)
	Update(ctx context.Context, a *property.Area) error
	Delete(ctx context.Context, id uuid.UUID) error
}

// MediaRepository defines media data access operations
type MediaRepository interface {
	Create(ctx context.Context, m *media.Media) error
	GetByID(ctx context.Context, id uuid.UUID) (*media.Media, error)
	ListByEntity(ctx context.Context, entityType media.EntityType, entityID uuid.UUID) ([]media.Media, error)
	Update(ctx context.Context, m *media.Media) error
	Delete(ctx context.Context, id uuid.UUID) error
}

// UserRepository defines user data access operations
type UserRepository interface {
	Create(ctx context.Context, u *user.User) error
	GetByID(ctx context.Context, id uuid.UUID) (*user.User, error)
	GetByEmail(ctx context.Context, email string) (*user.User, error)
	GetByProviderID(ctx context.Context, provider, providerID string) (*user.User, error)
	Update(ctx context.Context, u *user.User) error

	// Session management
	CreateSession(ctx context.Context, s *user.Session) error
	GetSessionByToken(ctx context.Context, token string) (*user.Session, error)
	DeleteSession(ctx context.Context, id uuid.UUID) error
	DeleteUserSessions(ctx context.Context, userID uuid.UUID) error
}

// AnalyticsRepository defines analytics data access operations
type AnalyticsRepository interface {
	CreatePageView(ctx context.Context, pv *analytics.PageView) error
	GetPageViews(ctx context.Context, opts PageViewOptions) ([]analytics.PageView, error)
	GetVisitorLocations(ctx context.Context, opts LocationOptions) ([]VisitorLocation, error)
	GetDwellTimeStats(ctx context.Context, propertyID uuid.UUID) (*DwellTimeStats, error)

	// A/B Testing
	CreateABTest(ctx context.Context, test *analytics.ABTest) error
	GetABTest(ctx context.Context, id uuid.UUID) (*analytics.ABTest, error)
	UpdateABTest(ctx context.Context, test *analytics.ABTest) error
	GetActiveTestForEntity(ctx context.Context, entityType string, entityID uuid.UUID) (*analytics.ABTest, error)
}

// ContentRepository defines content versioning operations
type ContentRepository interface {
	CreateVersion(ctx context.Context, v *content.ContentVersion) error
	GetVersion(ctx context.Context, entityType string, entityID uuid.UUID, version int) (*content.ContentVersion, error)
	GetLatestVersion(ctx context.Context, entityType string, entityID uuid.UUID) (*content.ContentVersion, error)
	ListVersions(ctx context.Context, entityType string, entityID uuid.UUID) ([]content.ContentVersion, error)
}

// ListOptions contains common listing parameters
type ListOptions struct {
	Offset     int
	Limit      int
	Search     string
	Status     string
	OrderBy    string
	OrderDir   string
	OwnerID    *uuid.UUID
	MinPrice   *float64
	MaxPrice   *float64
	Latitude   *float64
	Longitude  *float64
	RadiusKm   *float64
}

// PageViewOptions contains page view query parameters
type PageViewOptions struct {
	PropertyID *uuid.UUID
	StartDate  string
	EndDate    string
	Limit      int
}

// LocationOptions contains visitor location query parameters
type LocationOptions struct {
	PropertyID *uuid.UUID
	StartDate  string
	EndDate    string
}

// VisitorLocation represents aggregated visitor location data
type VisitorLocation struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Country   string  `json:"country"`
	City      string  `json:"city"`
	Count     int64   `json:"count"`
}

// DwellTimeStats represents dwell time statistics
type DwellTimeStats struct {
	AvgDwellTimeMs int64            `json:"avg_dwell_time_ms"`
	ByPage         map[string]int64 `json:"by_page"`
}
