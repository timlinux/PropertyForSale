// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package analytics

import (
	"time"

	"github.com/google/uuid"
)

// PageView represents a single page view event
type PageView struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	SessionID   string    `json:"session_id" gorm:"index;not null"`
	PropertyID  *uuid.UUID `json:"property_id" gorm:"type:uuid;index"`
	PagePath    string    `json:"page_path" gorm:"not null"`
	DwellTimeMs int64     `json:"dwell_time_ms"`
	ScrollDepth int       `json:"scroll_depth"` // 0-100 percentage
	IPAddress   string    `json:"-"`            // Stored temporarily for GeoIP resolution
	Latitude    float64   `json:"latitude"`
	Longitude   float64   `json:"longitude"`
	Country     string    `json:"country"`
	Region      string    `json:"region"`
	City        string    `json:"city"`
	Referrer    string    `json:"referrer"`
	UserAgent   string    `json:"user_agent"`
	DeviceType  string    `json:"device_type"` // desktop, mobile, tablet
	ABVariantID *uuid.UUID `json:"ab_variant_id" gorm:"type:uuid"`
	CreatedAt   time.Time `json:"created_at" gorm:"index"`
}

// TableName returns the table name for GORM
func (PageView) TableName() string {
	return "page_views"
}

// ABTestStatus represents the status of an A/B test
type ABTestStatus string

const (
	ABTestStatusDraft     ABTestStatus = "draft"
	ABTestStatusRunning   ABTestStatus = "running"
	ABTestStatusCompleted ABTestStatus = "completed"
	ABTestStatusCancelled ABTestStatus = "cancelled"
)

// ABTest represents an A/B test configuration
type ABTest struct {
	ID              uuid.UUID    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name            string       `json:"name" gorm:"not null"`
	Description     string       `json:"description"`
	EntityType      string       `json:"entity_type" gorm:"not null"`
	EntityID        uuid.UUID    `json:"entity_id" gorm:"type:uuid;not null"`
	Variants        JSONB        `json:"variants" gorm:"type:jsonb;default:'[]'"`
	TrafficSplit    JSONB        `json:"traffic_split" gorm:"type:jsonb;default:'{}'"`
	StartDate       *time.Time   `json:"start_date"`
	EndDate         *time.Time   `json:"end_date"`
	Status          ABTestStatus `json:"status" gorm:"default:'draft'"`
	WinnerVariantID *uuid.UUID   `json:"winner_variant_id" gorm:"type:uuid"`
	CreatedBy       uuid.UUID    `json:"created_by" gorm:"type:uuid;not null"`
	CreatedAt       time.Time    `json:"created_at"`
	UpdatedAt       time.Time    `json:"updated_at"`
}

// JSONB represents a JSONB column type
type JSONB map[string]interface{}

// TableName returns the table name for GORM
func (ABTest) TableName() string {
	return "ab_tests"
}

// ABVariant represents a variant in an A/B test
type ABVariant struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ABTestID  uuid.UUID `json:"ab_test_id" gorm:"type:uuid;not null;index"`
	Name      string    `json:"name" gorm:"not null"`
	Content   JSONB     `json:"content" gorm:"type:jsonb;default:'{}'"`
	Weight    int       `json:"weight" gorm:"default:50"` // Percentage weight
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName returns the table name for GORM
func (ABVariant) TableName() string {
	return "ab_variants"
}
