// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/analytics"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/content"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/media"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/notification"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/page"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/property"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/quote"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/user"
	"gorm.io/gorm"
)

// Repositories holds all repository implementations
type Repositories struct {
	Property     PropertyRepository
	Dwelling     DwellingRepository
	Room         RoomRepository
	Area         AreaRepository
	Media        MediaRepository
	User         UserRepository
	Analytics    AnalyticsRepository
	Content      ContentRepository
	Page         PageRepository
	Notification NotificationRepository
	Quote        QuoteRepository
}

// NewRepositories creates a new Repositories instance with all implementations
func NewRepositories(db *gorm.DB) *Repositories {
	return &Repositories{
		Property:     NewPropertyRepository(db),
		Dwelling:     NewDwellingRepository(db),
		Room:         NewRoomRepository(db),
		Area:         NewAreaRepository(db),
		Media:        NewMediaRepository(db),
		User:         NewUserRepository(db),
		Analytics:    NewAnalyticsRepository(db),
		Content:      NewContentRepository(db),
		Page:         NewPageRepository(db),
		Notification: NewNotificationRepository(db),
		Quote:        NewQuoteRepository(db),
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

// QuoteRepository defines quote data access operations
type QuoteRepository interface {
	Create(ctx context.Context, q *quote.Quote) error
	GetByID(ctx context.Context, id uuid.UUID) (*quote.Quote, error)
	ListByPropertyID(ctx context.Context, propertyID uuid.UUID) ([]quote.Quote, error)
	Update(ctx context.Context, q *quote.Quote) error
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
	ListABTests(ctx context.Context, opts ABTestListOptions) ([]analytics.ABTest, int64, error)
	DeleteABTest(ctx context.Context, id uuid.UUID) error

	// A/B Variants
	CreateABVariant(ctx context.Context, variant *analytics.ABVariant) error
	GetABVariant(ctx context.Context, id uuid.UUID) (*analytics.ABVariant, error)
	ListABVariants(ctx context.Context, testID uuid.UUID) ([]analytics.ABVariant, error)
	UpdateABVariant(ctx context.Context, variant *analytics.ABVariant) error
	DeleteABVariant(ctx context.Context, id uuid.UUID) error

	// A/B Test Results
	GetABTestResults(ctx context.Context, testID uuid.UUID) (*ABTestResults, error)
}

// ABTestListOptions contains A/B test listing parameters
type ABTestListOptions struct {
	Status     string
	EntityType string
	EntityID   *uuid.UUID
	Limit      int
	Offset     int
}

// ABTestResults contains A/B test results
type ABTestResults struct {
	TestID       uuid.UUID        `json:"test_id"`
	TotalViews   int64            `json:"total_views"`
	VariantStats []ABVariantStats `json:"variant_stats"`
}

// ABVariantStats contains per-variant statistics
type ABVariantStats struct {
	VariantID      uuid.UUID `json:"variant_id"`
	VariantName    string    `json:"variant_name"`
	Views          int64     `json:"views"`
	AvgDwellTimeMs int64     `json:"avg_dwell_time_ms"`
	AvgScrollDepth float64   `json:"avg_scroll_depth"`
}

// ContentRepository defines content versioning operations
type ContentRepository interface {
	CreateVersion(ctx context.Context, v *content.ContentVersion) error
	GetVersion(ctx context.Context, entityType string, entityID uuid.UUID, version int) (*content.ContentVersion, error)
	GetLatestVersion(ctx context.Context, entityType string, entityID uuid.UUID) (*content.ContentVersion, error)
	ListVersions(ctx context.Context, entityType string, entityID uuid.UUID) ([]content.ContentVersion, error)
}

// PageRepository defines CMS page data access operations
type PageRepository interface {
	// Page CRUD
	Create(ctx context.Context, p *page.Page) error
	GetByID(ctx context.Context, id uuid.UUID) (*page.Page, error)
	GetBySlug(ctx context.Context, slug string) (*page.Page, error)
	List(ctx context.Context, opts PageListOptions) ([]page.Page, int64, error)
	Update(ctx context.Context, p *page.Page) error
	Delete(ctx context.Context, id uuid.UUID) error
	Publish(ctx context.Context, id uuid.UUID) error
	Unpublish(ctx context.Context, id uuid.UUID) error

	// Block operations
	CreateBlock(ctx context.Context, block *page.PageBlock) error
	GetBlock(ctx context.Context, id uuid.UUID) (*page.PageBlock, error)
	ListBlocks(ctx context.Context, pageID uuid.UUID) ([]page.PageBlock, error)
	UpdateBlock(ctx context.Context, block *page.PageBlock) error
	DeleteBlock(ctx context.Context, id uuid.UUID) error
	ReorderBlocks(ctx context.Context, pageID uuid.UUID, blockIDs []uuid.UUID) error

	// Version operations
	CreateVersion(ctx context.Context, v *page.PageVersion) error
	GetVersion(ctx context.Context, pageID uuid.UUID, versionNumber int) (*page.PageVersion, error)
	ListVersions(ctx context.Context, pageID uuid.UUID) ([]page.PageVersion, error)
	GetLatestVersionNumber(ctx context.Context, pageID uuid.UUID) (int, error)
	SavePageSnapshot(ctx context.Context, pageID uuid.UUID, authorID uuid.UUID, note string) error
	RollbackToVersion(ctx context.Context, pageID uuid.UUID, versionNumber int) error

	// Block template operations
	CreateBlockTemplate(ctx context.Context, t *page.BlockTemplate) error
	GetBlockTemplate(ctx context.Context, id uuid.UUID) (*page.BlockTemplate, error)
	ListBlockTemplates(ctx context.Context, blockType string) ([]page.BlockTemplate, error)
	DeleteBlockTemplate(ctx context.Context, id uuid.UUID) error
}

// ListOptions contains common listing parameters
type ListOptions struct {
	Offset    int
	Limit     int
	Search    string
	Status    string
	OrderBy   string
	OrderDir  string
	OwnerID   *uuid.UUID
	MinPrice  *float64
	MaxPrice  *float64
	Latitude  *float64
	Longitude *float64
	RadiusKm  *float64
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

// NotificationRepository defines notification data access operations
type NotificationRepository interface {
	// Notifications
	CreateNotification(ctx context.Context, n *notification.Notification) error
	GetNotification(ctx context.Context, id uuid.UUID) (*notification.Notification, error)
	ListNotifications(ctx context.Context, opts NotificationListOptions) ([]notification.Notification, int64, error)
	MarkAsRead(ctx context.Context, id uuid.UUID) error
	MarkAllAsRead(ctx context.Context, userID uuid.UUID) error
	GetUnreadCount(ctx context.Context, userID uuid.UUID) (int64, error)
	DeleteNotification(ctx context.Context, id uuid.UUID) error
	DeleteOldNotifications(ctx context.Context, olderThan time.Time) (int64, error)

	// Preferences
	GetPreferences(ctx context.Context, userID uuid.UUID) (*notification.NotificationPreference, error)
	CreateOrUpdatePreferences(ctx context.Context, pref *notification.NotificationPreference) error

	// Expression of Interest
	CreateEOI(ctx context.Context, eoi *notification.ExpressionOfInterest) error
	GetEOI(ctx context.Context, id uuid.UUID) (*notification.ExpressionOfInterest, error)
	ListEOIs(ctx context.Context, propertyID uuid.UUID, status string) ([]notification.ExpressionOfInterest, error)
	UpdateEOIStatus(ctx context.Context, id uuid.UUID, status string) error
	GetEOIsByProperty(ctx context.Context, propertyID uuid.UUID) ([]notification.ExpressionOfInterest, error)

	// Email templates
	GetEmailTemplate(ctx context.Context, name string) (*notification.EmailTemplate, error)
	ListEmailTemplates(ctx context.Context) ([]notification.EmailTemplate, error)
	CreateOrUpdateEmailTemplate(ctx context.Context, template *notification.EmailTemplate) error

	// Email logs
	CreateEmailLog(ctx context.Context, log *notification.EmailLog) error
	UpdateEmailLogStatus(ctx context.Context, id uuid.UUID, status string, errMsg string) error
	GetPendingEmails(ctx context.Context, limit int) ([]notification.EmailLog, error)
}
