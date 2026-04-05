// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package content

import (
	"time"

	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/pkg/types"
)

// ContentVersion represents a versioned snapshot of content
type ContentVersion struct {
	ID            uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	EntityType    string    `json:"entity_type" gorm:"not null;index:idx_content_entity"`
	EntityID      uuid.UUID `json:"entity_id" gorm:"type:uuid;not null;index:idx_content_entity"`
	VersionNumber int         `json:"version_number" gorm:"not null;index:idx_content_entity"`
	Data          types.JSONB `json:"data" gorm:"type:text;not null"`
	Diff          types.JSONB `json:"diff" gorm:"type:text"`
	AuthorID      uuid.UUID   `json:"author_id" gorm:"type:uuid;not null"`
	IsPublished   bool      `json:"is_published" gorm:"default:false"`
	PublishNote   string    `json:"publish_note"`
	CreatedAt     time.Time `json:"created_at"`
}

// TableName returns the table name for GORM
func (ContentVersion) TableName() string {
	return "content_versions"
}
