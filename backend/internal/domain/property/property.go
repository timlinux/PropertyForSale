// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package property

import (
	"time"

	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/pkg/types"
)

// Status represents the property publication status
type Status string

const (
	StatusDraft     Status = "draft"
	StatusPublished Status = "published"
	StatusArchived  Status = "archived"
)

// Property represents a real estate property listing
type Property struct {
	ID           uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	OwnerID      uuid.UUID  `json:"owner_id" gorm:"type:uuid;not null;index"`
	Name         string     `json:"name" gorm:"not null"`
	Slug         string     `json:"slug" gorm:"uniqueIndex;not null"`
	Description  string     `json:"description"`
	PriceMin     float64    `json:"price_min"`
	PriceMax     float64    `json:"price_max"`
	Currency     string     `json:"currency" gorm:"default:'EUR'"`
	AddressLine1 string     `json:"address_line1"`
	AddressLine2 string     `json:"address_line2"`
	City         string     `json:"city"`
	State        string     `json:"state"`
	PostalCode   string     `json:"postal_code"`
	Country      string     `json:"country"`
	Latitude     float64    `json:"latitude"`
	Longitude    float64    `json:"longitude"`
	Status       Status      `json:"status" gorm:"default:'draft'"`
	Metadata     types.JSONB `json:"metadata" gorm:"type:text;default:'{}'"`
	CreatedAt    time.Time   `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	PublishedAt  *time.Time `json:"published_at"`

	// Relations
	Dwellings []Dwelling `json:"dwellings,omitempty" gorm:"foreignKey:PropertyID"`
	Areas     []Area     `json:"areas,omitempty" gorm:"foreignKey:PropertyID"`
}

// TableName returns the table name for GORM
func (Property) TableName() string {
	return "properties"
}

// Dwelling represents a building or structure within a property
type Dwelling struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	PropertyID  uuid.UUID `json:"property_id" gorm:"type:uuid;not null;index"`
	Name        string    `json:"name" gorm:"not null"`
	Type        string    `json:"type"` // house, apartment, barn, etc.
	Description string    `json:"description"`
	FloorCount  int       `json:"floor_count"`
	YearBuilt   int       `json:"year_built"`
	SizeSqm     float64   `json:"size_sqm"`
	SortOrder   int       `json:"sort_order" gorm:"default:0"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relations
	Rooms []Room `json:"rooms,omitempty" gorm:"foreignKey:DwellingID"`
}

// TableName returns the table name for GORM
func (Dwelling) TableName() string {
	return "dwellings"
}

// Area represents an outdoor area like a garden or field
type Area struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	PropertyID  uuid.UUID `json:"property_id" gorm:"type:uuid;not null;index"`
	Name        string    `json:"name" gorm:"not null"`
	Type        string    `json:"type"` // garden, field, forest, etc.
	Description string    `json:"description"`
	SizeSqm     float64   `json:"size_sqm"`
	SortOrder   int       `json:"sort_order" gorm:"default:0"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// TableName returns the table name for GORM
func (Area) TableName() string {
	return "areas"
}

// Room represents a room within a dwelling
type Room struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	DwellingID  uuid.UUID `json:"dwelling_id" gorm:"type:uuid;not null;index"`
	Name        string    `json:"name" gorm:"not null"`
	Type        string    `json:"type"` // bedroom, bathroom, kitchen, etc.
	Description string    `json:"description"`
	SizeSqm     float64   `json:"size_sqm"`
	Floor       int       `json:"floor"`
	SortOrder   int       `json:"sort_order" gorm:"default:0"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// TableName returns the table name for GORM
func (Room) TableName() string {
	return "rooms"
}
