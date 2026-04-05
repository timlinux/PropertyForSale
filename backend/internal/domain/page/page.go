// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package page

import (
	"time"

	"github.com/google/uuid"
)

// JSONB is a map type for JSON/JSONB database columns
type JSONB map[string]interface{}

// PageStatus represents the publication status of a page
type PageStatus string

const (
	PageStatusDraft     PageStatus = "draft"
	PageStatusPublished PageStatus = "published"
	PageStatusArchived  PageStatus = "archived"
)

// PageTemplate represents predefined page layouts
type PageTemplate string

const (
	PageTemplateBlank    PageTemplate = "blank"
	PageTemplateLanding  PageTemplate = "landing"
	PageTemplateProperty PageTemplate = "property"
	PageTemplateContact  PageTemplate = "contact"
	PageTemplateAbout    PageTemplate = "about"
)

// Page represents a CMS page
type Page struct {
	ID            uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	Slug          string         `gorm:"uniqueIndex;not null" json:"slug"`
	Title         string         `gorm:"not null" json:"title"`
	Description   string         `json:"description"`
	Template      PageTemplate   `gorm:"default:'blank'" json:"template"`
	Status        PageStatus     `gorm:"default:'draft'" json:"status"`
	MetaTitle     string         `json:"meta_title"`
	MetaDesc      string         `json:"meta_description"`
	OGImage       string         `json:"og_image"`
	VersionNumber int            `gorm:"default:1" json:"version_number"`
	AuthorID      uuid.UUID      `gorm:"type:uuid" json:"author_id"`
	PublishedAt   *time.Time     `json:"published_at"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	Blocks        []PageBlock    `gorm:"foreignKey:PageID;constraint:OnDelete:CASCADE" json:"blocks,omitempty"`
}

// TableName returns the table name for GORM
func (Page) TableName() string {
	return "pages"
}

// BlockType represents the type of content block
type BlockType string

const (
	BlockTypeHero        BlockType = "hero"
	BlockTypeText        BlockType = "text"
	BlockTypeImage       BlockType = "image"
	BlockTypeGallery     BlockType = "gallery"
	BlockTypeVideo       BlockType = "video"
	BlockTypeVideo360    BlockType = "video360"
	BlockTypeFeatures    BlockType = "features"
	BlockTypePricing     BlockType = "pricing"
	BlockTypeTestimonial BlockType = "testimonial"
	BlockTypeCTA         BlockType = "cta"
	BlockTypeContact     BlockType = "contact"
	BlockTypeMap         BlockType = "map"
	BlockTypeProperties  BlockType = "properties"
	BlockTypeDivider     BlockType = "divider"
	BlockTypeHTML        BlockType = "html"
	BlockTypeSpacer      BlockType = "spacer"
)

// PageBlock represents a content block within a page
type PageBlock struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	PageID    uuid.UUID `gorm:"type:uuid;not null;index" json:"page_id"`
	BlockType BlockType `gorm:"not null" json:"block_type"`
	Position  int       `gorm:"not null" json:"position"`
	Data      JSONB     `gorm:"type:jsonb" json:"data"`
	Settings  JSONB     `gorm:"type:jsonb" json:"settings"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName returns the table name for GORM
func (PageBlock) TableName() string {
	return "page_blocks"
}

// BlockTemplate represents reusable block templates
type BlockTemplate struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name        string    `gorm:"not null" json:"name"`
	Description string    `json:"description"`
	BlockType   BlockType `gorm:"not null" json:"block_type"`
	Schema      JSONB     `gorm:"type:jsonb" json:"schema"`
	DefaultData JSONB     `gorm:"type:jsonb" json:"default_data"`
	Thumbnail   string    `json:"thumbnail"`
	CreatedAt   time.Time `json:"created_at"`
}

// TableName returns the table name for GORM
func (BlockTemplate) TableName() string {
	return "block_templates"
}

// PageVersion stores historical versions of pages
type PageVersion struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	PageID        uuid.UUID `gorm:"type:uuid;not null;index" json:"page_id"`
	VersionNumber int       `gorm:"not null" json:"version_number"`
	Title         string    `json:"title"`
	Data          JSONB     `gorm:"type:jsonb" json:"data"` // Full page snapshot
	Diff          JSONB     `gorm:"type:jsonb" json:"diff"` // Changes from previous
	AuthorID      uuid.UUID `gorm:"type:uuid" json:"author_id"`
	Note          string    `json:"note"`
	CreatedAt     time.Time `json:"created_at"`
}

// TableName returns the table name for GORM
func (PageVersion) TableName() string {
	return "page_versions"
}

// BeforeCreate generates UUID if not set
func (p *Page) BeforeCreate() error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

// BeforeCreate generates UUID if not set
func (b *PageBlock) BeforeCreate() error {
	if b.ID == uuid.Nil {
		b.ID = uuid.New()
	}
	return nil
}

// BeforeCreate generates UUID if not set
func (t *BlockTemplate) BeforeCreate() error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

// BeforeCreate generates UUID if not set
func (v *PageVersion) BeforeCreate() error {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	return nil
}
