// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package repository

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/page"
	"github.com/timlinux/PropertyForSale/backend/pkg/types"
	"gorm.io/gorm"
)

type pageRepository struct {
	db *gorm.DB
}

// NewPageRepository creates a new page repository
func NewPageRepository(db *gorm.DB) PageRepository {
	return &pageRepository{db: db}
}

// PageListOptions for filtering pages
type PageListOptions struct {
	Status   string
	Template string
	Search   string
	Offset   int
	Limit    int
}

func (r *pageRepository) Create(ctx context.Context, p *page.Page) error {
	return r.db.WithContext(ctx).Create(p).Error
}

func (r *pageRepository) GetByID(ctx context.Context, id uuid.UUID) (*page.Page, error) {
	var p page.Page
	err := r.db.WithContext(ctx).Preload("Blocks", func(db *gorm.DB) *gorm.DB {
		return db.Order("position ASC")
	}).First(&p, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *pageRepository) GetBySlug(ctx context.Context, slug string) (*page.Page, error) {
	var p page.Page
	err := r.db.WithContext(ctx).Preload("Blocks", func(db *gorm.DB) *gorm.DB {
		return db.Order("position ASC")
	}).First(&p, "slug = ?", slug).Error
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *pageRepository) List(ctx context.Context, opts PageListOptions) ([]page.Page, int64, error) {
	var pages []page.Page
	var total int64

	query := r.db.WithContext(ctx).Model(&page.Page{})

	if opts.Status != "" {
		query = query.Where("status = ?", opts.Status)
	}
	if opts.Template != "" {
		query = query.Where("template = ?", opts.Template)
	}
	if opts.Search != "" {
		search := "%" + opts.Search + "%"
		query = query.Where("title LIKE ? OR slug LIKE ?", search, search)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if opts.Limit == 0 {
		opts.Limit = 20
	}

	err := query.
		Order("updated_at DESC").
		Offset(opts.Offset).
		Limit(opts.Limit).
		Find(&pages).Error

	return pages, total, err
}

func (r *pageRepository) Update(ctx context.Context, p *page.Page) error {
	return r.db.WithContext(ctx).Save(p).Error
}

func (r *pageRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&page.Page{}, "id = ?", id).Error
}

func (r *pageRepository) Publish(ctx context.Context, id uuid.UUID) error {
	now := r.db.NowFunc()
	return r.db.WithContext(ctx).Model(&page.Page{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":       page.PageStatusPublished,
			"published_at": now,
		}).Error
}

func (r *pageRepository) Unpublish(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&page.Page{}).
		Where("id = ?", id).
		Update("status", page.PageStatusDraft).Error
}

// Block operations
func (r *pageRepository) CreateBlock(ctx context.Context, block *page.PageBlock) error {
	return r.db.WithContext(ctx).Create(block).Error
}

func (r *pageRepository) GetBlock(ctx context.Context, id uuid.UUID) (*page.PageBlock, error) {
	var block page.PageBlock
	err := r.db.WithContext(ctx).First(&block, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &block, nil
}

func (r *pageRepository) ListBlocks(ctx context.Context, pageID uuid.UUID) ([]page.PageBlock, error) {
	var blocks []page.PageBlock
	err := r.db.WithContext(ctx).
		Where("page_id = ?", pageID).
		Order("position ASC").
		Find(&blocks).Error
	return blocks, err
}

func (r *pageRepository) UpdateBlock(ctx context.Context, block *page.PageBlock) error {
	return r.db.WithContext(ctx).Save(block).Error
}

func (r *pageRepository) DeleteBlock(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&page.PageBlock{}, "id = ?", id).Error
}

func (r *pageRepository) ReorderBlocks(ctx context.Context, pageID uuid.UUID, blockIDs []uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for i, blockID := range blockIDs {
			if err := tx.Model(&page.PageBlock{}).
				Where("id = ? AND page_id = ?", blockID, pageID).
				Update("position", i).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

// Version operations
func (r *pageRepository) CreateVersion(ctx context.Context, v *page.PageVersion) error {
	return r.db.WithContext(ctx).Create(v).Error
}

func (r *pageRepository) GetVersion(ctx context.Context, pageID uuid.UUID, versionNumber int) (*page.PageVersion, error) {
	var v page.PageVersion
	err := r.db.WithContext(ctx).
		Where("page_id = ? AND version_number = ?", pageID, versionNumber).
		First(&v).Error
	if err != nil {
		return nil, err
	}
	return &v, nil
}

func (r *pageRepository) ListVersions(ctx context.Context, pageID uuid.UUID) ([]page.PageVersion, error) {
	var versions []page.PageVersion
	err := r.db.WithContext(ctx).
		Where("page_id = ?", pageID).
		Order("version_number DESC").
		Find(&versions).Error
	return versions, err
}

func (r *pageRepository) GetLatestVersionNumber(ctx context.Context, pageID uuid.UUID) (int, error) {
	var maxVersion int
	err := r.db.WithContext(ctx).
		Model(&page.PageVersion{}).
		Where("page_id = ?", pageID).
		Select("COALESCE(MAX(version_number), 0)").
		Scan(&maxVersion).Error
	return maxVersion, err
}

// Block template operations
func (r *pageRepository) CreateBlockTemplate(ctx context.Context, t *page.BlockTemplate) error {
	return r.db.WithContext(ctx).Create(t).Error
}

func (r *pageRepository) GetBlockTemplate(ctx context.Context, id uuid.UUID) (*page.BlockTemplate, error) {
	var t page.BlockTemplate
	err := r.db.WithContext(ctx).First(&t, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *pageRepository) ListBlockTemplates(ctx context.Context, blockType string) ([]page.BlockTemplate, error) {
	var templates []page.BlockTemplate
	query := r.db.WithContext(ctx)
	if blockType != "" {
		query = query.Where("block_type = ?", blockType)
	}
	err := query.Order("name ASC").Find(&templates).Error
	return templates, err
}

func (r *pageRepository) DeleteBlockTemplate(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&page.BlockTemplate{}, "id = ?", id).Error
}

// SavePageSnapshot creates a version snapshot of the current page state
func (r *pageRepository) SavePageSnapshot(ctx context.Context, pageID uuid.UUID, authorID uuid.UUID, note string) error {
	// Get current page with blocks
	p, err := r.GetByID(ctx, pageID)
	if err != nil {
		return err
	}

	// Get latest version number
	latestVersion, err := r.GetLatestVersionNumber(ctx, pageID)
	if err != nil {
		return err
	}

	// Serialize page data to map
	data, err := json.Marshal(p)
	if err != nil {
		return err
	}

	var dataMap map[string]interface{}
	if err := json.Unmarshal(data, &dataMap); err != nil {
		return err
	}

	// Create version
	version := &page.PageVersion{
		ID:            uuid.New(),
		PageID:        pageID,
		VersionNumber: latestVersion + 1,
		Title:         p.Title,
		Data:          types.JSONB(dataMap),
		AuthorID:      authorID,
		Note:          note,
	}

	if err := r.CreateVersion(ctx, version); err != nil {
		return err
	}

	// Update page version number
	return r.db.WithContext(ctx).Model(&page.Page{}).
		Where("id = ?", pageID).
		Update("version_number", latestVersion+1).Error
}

// RollbackToVersion restores a page to a previous version
func (r *pageRepository) RollbackToVersion(ctx context.Context, pageID uuid.UUID, versionNumber int) error {
	// Get the target version
	v, err := r.GetVersion(ctx, pageID, versionNumber)
	if err != nil {
		return err
	}

	// Convert data map back to page struct
	dataBytes, err := json.Marshal(v.Data)
	if err != nil {
		return err
	}

	var pageData page.Page
	if err := json.Unmarshal(dataBytes, &pageData); err != nil {
		return err
	}

	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Delete current blocks
		if err := tx.Delete(&page.PageBlock{}, "page_id = ?", pageID).Error; err != nil {
			return err
		}

		// Restore page fields (not ID, timestamps)
		if err := tx.Model(&page.Page{}).Where("id = ?", pageID).Updates(map[string]interface{}{
			"title":       pageData.Title,
			"description": pageData.Description,
			"template":    pageData.Template,
			"meta_title":  pageData.MetaTitle,
			"meta_desc":   pageData.MetaDesc,
			"og_image":    pageData.OGImage,
		}).Error; err != nil {
			return err
		}

		// Restore blocks
		for _, block := range pageData.Blocks {
			block.ID = uuid.New() // New IDs for restored blocks
			block.PageID = pageID
			if err := tx.Create(&block).Error; err != nil {
				return err
			}
		}

		return nil
	})
}
