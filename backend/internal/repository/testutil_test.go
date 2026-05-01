// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package repository

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// SQLite-compatible model definitions for testing
// These are simplified versions without Postgres-specific defaults

type testProperty struct {
	ID           uuid.UUID `gorm:"type:text;primaryKey"`
	OwnerID      uuid.UUID `gorm:"type:text;not null;index"`
	Name         string    `gorm:"not null"`
	Slug         string    `gorm:"uniqueIndex;not null"`
	Description  string
	PriceMin     float64
	PriceMax     float64
	Currency     string `gorm:"default:'EUR'"`
	AddressLine1 string
	AddressLine2 string
	City         string
	State        string
	PostalCode   string
	Country      string
	Latitude     float64
	Longitude    float64
	Status       string `gorm:"default:'draft'"`
	Metadata     string `gorm:"type:text;default:'{}'"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	PublishedAt  *time.Time
}

func (testProperty) TableName() string { return "properties" }

type testStructure struct {
	ID          uuid.UUID `gorm:"type:text;primaryKey"`
	PropertyID  uuid.UUID `gorm:"type:text;not null;index"`
	Name        string    `gorm:"not null"`
	Type        string
	Description string
	FloorCount  int
	YearBuilt   int
	SizeSqm     float64
	SortOrder   int `gorm:"default:0"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func (testStructure) TableName() string { return "structures" }

type testRoom struct {
	ID          uuid.UUID `gorm:"type:text;primaryKey"`
	StructureID uuid.UUID `gorm:"type:text;not null;index"`
	Name        string    `gorm:"not null"`
	Type        string
	Description string
	SizeSqm     float64
	FloorStart  int
	FloorEnd    int
	SortOrder   int `gorm:"default:0"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func (testRoom) TableName() string { return "rooms" }

type testArea struct {
	ID          uuid.UUID `gorm:"type:text;primaryKey"`
	PropertyID  uuid.UUID `gorm:"type:text;not null;index"`
	Name        string    `gorm:"not null"`
	Type        string
	Description string
	SizeSqm     float64
	SortOrder   int `gorm:"default:0"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func (testArea) TableName() string { return "areas" }

type testMedia struct {
	ID            uuid.UUID  `gorm:"type:text;primaryKey"`
	EntityType    string     `gorm:"not null;index:idx_media_entity"`
	EntityID      uuid.UUID  `gorm:"type:text;not null;index:idx_media_entity"`
	Type          string     `gorm:"not null"`
	URL           string     `gorm:"not null"`
	ThumbnailURL  string
	FileName      string
	FileSize      int64
	MimeType      string
	Width         int
	Height        int
	Duration      float64
	Caption       string
	LinkedAudioID *uuid.UUID `gorm:"type:text"`
	Autoplay      bool       `gorm:"default:false"`
	Starred       bool       `gorm:"default:false"`
	Tag           string     `gorm:"default:''"`
	Metadata      string     `gorm:"type:text;default:'{}'"`
	SortOrder     int        `gorm:"default:0"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

func (testMedia) TableName() string { return "media" }

type testUser struct {
	ID           uuid.UUID `gorm:"type:text;primaryKey"`
	Email        string    `gorm:"uniqueIndex;not null"`
	Name         string
	AvatarURL    string
	Role         string `gorm:"default:'viewer'"`
	Provider     string
	ProviderID   string
	RefreshToken string
	LastLoginAt  time.Time
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func (testUser) TableName() string { return "users" }

type testSession struct {
	ID           uuid.UUID `gorm:"type:text;primaryKey"`
	UserID       uuid.UUID `gorm:"type:text;not null;index"`
	RefreshToken string    `gorm:"not null"`
	UserAgent    string
	IPAddress    string
	ExpiresAt    time.Time
	CreatedAt    time.Time
}

func (testSession) TableName() string { return "sessions" }

type testPage struct {
	ID            uuid.UUID `gorm:"type:text;primaryKey"`
	Slug          string    `gorm:"uniqueIndex;not null"`
	Title         string    `gorm:"not null"`
	Description   string
	Template      string `gorm:"default:'blank'"`
	Status        string `gorm:"default:'draft'"`
	MetaTitle     string
	MetaDesc      string
	OGImage       string
	VersionNumber int       `gorm:"default:1"`
	AuthorID      uuid.UUID `gorm:"type:text"`
	PublishedAt   *time.Time
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

func (testPage) TableName() string { return "pages" }

type testPageBlock struct {
	ID        uuid.UUID `gorm:"type:text;primaryKey"`
	PageID    uuid.UUID `gorm:"type:text;not null;index"`
	BlockType string    `gorm:"not null"`
	Position  int       `gorm:"not null"`
	Data      string    `gorm:"type:text"`
	Settings  string    `gorm:"type:text"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (testPageBlock) TableName() string { return "page_blocks" }

type testPageView struct {
	ID          uuid.UUID  `gorm:"type:text;primaryKey"`
	SessionID   string     `gorm:"not null;index"`
	PropertyID  *uuid.UUID `gorm:"type:text;index"`
	PagePath    string     `gorm:"not null"`
	DwellTimeMs int64
	ScrollDepth float64
	Latitude    float64
	Longitude   float64
	Country     string
	Region      string
	City        string
	DeviceType  string
	UserAgent   string
	Referrer    string
	ABVariantID *uuid.UUID `gorm:"type:text"`
	CreatedAt   time.Time
}

func (testPageView) TableName() string { return "page_views" }

type testABTest struct {
	ID              uuid.UUID `gorm:"type:text;primaryKey"`
	Name            string    `gorm:"not null"`
	Description     string
	EntityType      string     `gorm:"not null"`
	EntityID        uuid.UUID  `gorm:"type:text;not null;index"`
	Variants        string     `gorm:"type:text"`
	TrafficSplit    int        `gorm:"default:50"`
	Status          string     `gorm:"default:'draft'"`
	WinnerVariantID *uuid.UUID `gorm:"type:text"`
	StartDate       *time.Time
	EndDate         *time.Time
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

func (testABTest) TableName() string { return "ab_tests" }

type testABVariant struct {
	ID        uuid.UUID `gorm:"type:text;primaryKey"`
	ABTestID  uuid.UUID `gorm:"type:text;not null;index"`
	Name      string    `gorm:"not null"`
	Content   string    `gorm:"type:text"`
	Weight    int       `gorm:"default:50"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (testABVariant) TableName() string { return "ab_variants" }

type testContentVersion struct {
	ID         uuid.UUID `gorm:"type:text;primaryKey"`
	EntityType string    `gorm:"not null;index:idx_content_version"`
	EntityID   uuid.UUID `gorm:"type:text;not null;index:idx_content_version"`
	Version    int       `gorm:"not null;index:idx_content_version"`
	Data       string    `gorm:"type:text"`
	AuthorID   uuid.UUID `gorm:"type:text"`
	Note       string
	CreatedAt  time.Time
}

func (testContentVersion) TableName() string { return "content_versions" }

// setupTestDB creates an in-memory SQLite database for testing
func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("failed to connect to test database: %v", err)
	}

	// Auto-migrate SQLite-compatible test models
	err = db.AutoMigrate(
		&testProperty{},
		&testStructure{},
		&testRoom{},
		&testArea{},
		&testMedia{},
		&testUser{},
		&testSession{},
		&testPage{},
		&testPageBlock{},
		&testPageView{},
		&testABTest{},
		&testABVariant{},
		&testContentVersion{},
	)
	if err != nil {
		t.Fatalf("failed to migrate test database: %v", err)
	}

	return db
}

// cleanupTestDB closes the database connection
func cleanupTestDB(t *testing.T, db *gorm.DB) {
	sqlDB, err := db.DB()
	if err != nil {
		t.Logf("failed to get underlying DB: %v", err)
		return
	}
	if err := sqlDB.Close(); err != nil {
		t.Logf("failed to close test database: %v", err)
	}
}
