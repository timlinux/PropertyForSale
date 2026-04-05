// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package media

import (
	"time"

	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/pkg/types"
)

// MediaType represents the type of media file
type MediaType string

const (
	MediaTypeImage    MediaType = "image"
	MediaTypeVideo    MediaType = "video"
	MediaTypeVideo360 MediaType = "video360"
	MediaTypeAudio    MediaType = "audio"
	MediaTypeDocument MediaType = "document"
	MediaTypeModel3D  MediaType = "model3d"
)

// EntityType represents the type of entity the media is attached to
type EntityType string

const (
	EntityTypeProperty EntityType = "property"
	EntityTypeDwelling EntityType = "dwelling"
	EntityTypeRoom     EntityType = "room"
	EntityTypeArea     EntityType = "area"
)

// Media represents a media file attached to an entity
type Media struct {
	ID           uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	EntityType   EntityType `json:"entity_type" gorm:"not null;index:idx_media_entity"`
	EntityID     uuid.UUID  `json:"entity_id" gorm:"type:uuid;not null;index:idx_media_entity"`
	Type         MediaType  `json:"type" gorm:"not null"`
	URL          string     `json:"url" gorm:"not null"`
	ThumbnailURL string     `json:"thumbnail_url"`
	FileName     string     `json:"file_name"`
	FileSize     int64      `json:"file_size"`
	MimeType     string     `json:"mime_type"`
	Width        int        `json:"width,omitempty"`
	Height       int        `json:"height,omitempty"`
	Duration     float64    `json:"duration,omitempty"` // For video/audio in seconds
	Autoplay     bool        `json:"autoplay" gorm:"default:false"`
	Metadata     types.JSONB `json:"metadata" gorm:"type:text;default:'{}'"`
	SortOrder    int         `json:"sort_order" gorm:"default:0"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

// TableName returns the table name for GORM
func (Media) TableName() string {
	return "media"
}
