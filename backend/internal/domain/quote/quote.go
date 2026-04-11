// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package quote

import (
	"time"

	"github.com/google/uuid"
)

// Quote represents a promotional tagline for a property
type Quote struct {
	ID         uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	PropertyID uuid.UUID `json:"property_id" gorm:"type:uuid;not null;index:idx_property_quotes_property_id"`
	Text       string    `json:"text" gorm:"not null"`
	MediaID    *string   `json:"media_id,omitempty" gorm:"type:text"` // Optional link to a specific image
	SortOrder  int       `json:"sort_order" gorm:"default:0"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// TableName returns the table name for GORM
func (Quote) TableName() string {
	return "property_quotes"
}
