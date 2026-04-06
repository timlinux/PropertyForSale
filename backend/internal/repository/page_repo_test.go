// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package repository

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/page"
)

func TestPageRepository_Create(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	repo := NewPageRepository(db)
	ctx := context.Background()

	tests := []struct {
		name    string
		page    *page.Page
		wantErr bool
	}{
		{
			name: "create valid page",
			page: &page.Page{
				ID:          uuid.New(),
				Slug:        "test-page",
				Title:       "Test Page",
				Description: "A test page",
				Template:    page.PageTemplateLanding,
				Status:      page.PageStatusDraft,
				AuthorID:    uuid.New(),
			},
			wantErr: false,
		},
		{
			name: "create page with SEO fields",
			page: &page.Page{
				ID:        uuid.New(),
				Slug:      "seo-page",
				Title:     "SEO Page",
				Template:  page.PageTemplateBlank,
				Status:    page.PageStatusDraft,
				MetaTitle: "SEO Meta Title",
				MetaDesc:  "SEO Meta Description",
				OGImage:   "https://example.com/og.jpg",
				AuthorID:  uuid.New(),
			},
			wantErr: false,
		},
		{
			name: "fail on duplicate slug",
			page: &page.Page{
				ID:       uuid.New(),
				Slug:     "test-page", // Same slug as first test
				Title:    "Another Page",
				AuthorID: uuid.New(),
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := repo.Create(ctx, tt.page)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestPageRepository_GetByID(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	repo := NewPageRepository(db)
	ctx := context.Background()

	// Create a page
	p := &page.Page{
		ID:          uuid.New(),
		Slug:        "getbyid-page",
		Title:       "Get By ID Page",
		Description: "A page to get by ID",
		Template:    page.PageTemplateLanding,
		Status:      page.PageStatusPublished,
		AuthorID:    uuid.New(),
	}
	require.NoError(t, repo.Create(ctx, p))

	tests := []struct {
		name    string
		id      uuid.UUID
		wantErr bool
	}{
		{
			name:    "get existing page",
			id:      p.ID,
			wantErr: false,
		},
		{
			name:    "get non-existent page",
			id:      uuid.New(),
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := repo.GetByID(ctx, tt.id)
			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, result)
				assert.Equal(t, p.Title, result.Title)
				assert.Equal(t, p.Slug, result.Slug)
			}
		})
	}
}

func TestPageRepository_GetBySlug(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	repo := NewPageRepository(db)
	ctx := context.Background()

	// Create a page
	p := &page.Page{
		ID:       uuid.New(),
		Slug:     "unique-slug-page",
		Title:    "Unique Slug Page",
		Template: page.PageTemplateBlank,
		Status:   page.PageStatusPublished,
		AuthorID: uuid.New(),
	}
	require.NoError(t, repo.Create(ctx, p))

	tests := []struct {
		name    string
		slug    string
		wantErr bool
	}{
		{
			name:    "get existing page by slug",
			slug:    "unique-slug-page",
			wantErr: false,
		},
		{
			name:    "get non-existent page by slug",
			slug:    "non-existent-slug",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := repo.GetBySlug(ctx, tt.slug)
			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, result)
				assert.Equal(t, p.Title, result.Title)
			}
		})
	}
}

func TestPageRepository_List(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	repo := NewPageRepository(db)
	ctx := context.Background()

	// Create multiple pages
	pages := []*page.Page{
		{
			ID:       uuid.New(),
			Slug:     "page-one",
			Title:    "Page One",
			Template: page.PageTemplateLanding,
			Status:   page.PageStatusPublished,
			AuthorID: uuid.New(),
		},
		{
			ID:       uuid.New(),
			Slug:     "page-two",
			Title:    "Page Two",
			Template: page.PageTemplateProperty,
			Status:   page.PageStatusPublished,
			AuthorID: uuid.New(),
		},
		{
			ID:       uuid.New(),
			Slug:     "page-three",
			Title:    "Page Three",
			Template: page.PageTemplateLanding,
			Status:   page.PageStatusDraft,
			AuthorID: uuid.New(),
		},
	}

	for _, p := range pages {
		require.NoError(t, repo.Create(ctx, p))
	}

	tests := []struct {
		name          string
		opts          PageListOptions
		expectedCount int
		expectedTotal int64
	}{
		{
			name:          "list all pages",
			opts:          PageListOptions{},
			expectedCount: 3,
			expectedTotal: 3,
		},
		{
			name: "list published pages only",
			opts: PageListOptions{
				Status: string(page.PageStatusPublished),
			},
			expectedCount: 2,
			expectedTotal: 2,
		},
		{
			name: "list landing pages only",
			opts: PageListOptions{
				Template: string(page.PageTemplateLanding),
			},
			expectedCount: 2,
			expectedTotal: 2,
		},
		{
			name: "list with pagination",
			opts: PageListOptions{
				Limit:  1,
				Offset: 0,
			},
			expectedCount: 1,
			expectedTotal: 3,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			results, total, err := repo.List(ctx, tt.opts)
			assert.NoError(t, err)
			assert.Len(t, results, tt.expectedCount)
			assert.Equal(t, tt.expectedTotal, total)
		})
	}
}

func TestPageRepository_Update(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	repo := NewPageRepository(db)
	ctx := context.Background()

	// Create a page
	p := &page.Page{
		ID:          uuid.New(),
		Slug:        "update-page",
		Title:       "Original Title",
		Description: "Original description",
		Template:    page.PageTemplateBlank,
		Status:      page.PageStatusDraft,
		AuthorID:    uuid.New(),
	}
	require.NoError(t, repo.Create(ctx, p))

	// Update the page
	p.Title = "Updated Title"
	p.Description = "Updated description"
	p.MetaTitle = "New Meta Title"

	err := repo.Update(ctx, p)
	assert.NoError(t, err)

	// Verify update
	updated, err := repo.GetByID(ctx, p.ID)
	require.NoError(t, err)
	assert.Equal(t, "Updated Title", updated.Title)
	assert.Equal(t, "Updated description", updated.Description)
	assert.Equal(t, "New Meta Title", updated.MetaTitle)
}

func TestPageRepository_Delete(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	repo := NewPageRepository(db)
	ctx := context.Background()

	// Create a page
	p := &page.Page{
		ID:       uuid.New(),
		Slug:     "delete-page",
		Title:    "To Be Deleted",
		Template: page.PageTemplateBlank,
		AuthorID: uuid.New(),
	}
	require.NoError(t, repo.Create(ctx, p))

	// Delete the page
	err := repo.Delete(ctx, p.ID)
	assert.NoError(t, err)

	// Verify deletion
	_, err = repo.GetByID(ctx, p.ID)
	assert.Error(t, err)
}

func TestPageRepository_PublishUnpublish(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	repo := NewPageRepository(db)
	ctx := context.Background()

	// Create a draft page
	p := &page.Page{
		ID:       uuid.New(),
		Slug:     "publish-page",
		Title:    "Publish Test Page",
		Template: page.PageTemplateBlank,
		Status:   page.PageStatusDraft,
		AuthorID: uuid.New(),
	}
	require.NoError(t, repo.Create(ctx, p))

	// Publish the page
	err := repo.Publish(ctx, p.ID)
	assert.NoError(t, err)

	// Verify published
	published, err := repo.GetByID(ctx, p.ID)
	require.NoError(t, err)
	assert.Equal(t, page.PageStatusPublished, published.Status)
	assert.NotNil(t, published.PublishedAt)

	// Unpublish the page
	err = repo.Unpublish(ctx, p.ID)
	assert.NoError(t, err)

	// Verify unpublished
	unpublished, err := repo.GetByID(ctx, p.ID)
	require.NoError(t, err)
	assert.Equal(t, page.PageStatusDraft, unpublished.Status)
}

func TestPageRepository_Blocks(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	repo := NewPageRepository(db)
	ctx := context.Background()

	// Create a page
	p := &page.Page{
		ID:       uuid.New(),
		Slug:     "blocks-page",
		Title:    "Page with Blocks",
		Template: page.PageTemplateBlank,
		AuthorID: uuid.New(),
	}
	require.NoError(t, repo.Create(ctx, p))

	// Create blocks
	blocks := []*page.PageBlock{
		{
			ID:        uuid.New(),
			PageID:    p.ID,
			BlockType: page.BlockTypeHero,
			Position:  0,
		},
		{
			ID:        uuid.New(),
			PageID:    p.ID,
			BlockType: page.BlockTypeText,
			Position:  1,
		},
		{
			ID:        uuid.New(),
			PageID:    p.ID,
			BlockType: page.BlockTypeCTA,
			Position:  2,
		},
	}

	for _, b := range blocks {
		err := repo.CreateBlock(ctx, b)
		require.NoError(t, err)
	}

	// List blocks
	result, err := repo.ListBlocks(ctx, p.ID)
	assert.NoError(t, err)
	assert.Len(t, result, 3)

	// Get single block
	block, err := repo.GetBlock(ctx, blocks[0].ID)
	assert.NoError(t, err)
	assert.Equal(t, page.BlockTypeHero, block.BlockType)

	// Update block
	block.Position = 5
	err = repo.UpdateBlock(ctx, block)
	assert.NoError(t, err)

	updated, _ := repo.GetBlock(ctx, block.ID)
	assert.Equal(t, 5, updated.Position)

	// Delete block
	err = repo.DeleteBlock(ctx, blocks[2].ID)
	assert.NoError(t, err)

	remaining, _ := repo.ListBlocks(ctx, p.ID)
	assert.Len(t, remaining, 2)
}

func TestPageRepository_ReorderBlocks(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	repo := NewPageRepository(db)
	ctx := context.Background()

	// Create a page
	p := &page.Page{
		ID:       uuid.New(),
		Slug:     "reorder-page",
		Title:    "Page for Reordering",
		Template: page.PageTemplateBlank,
		AuthorID: uuid.New(),
	}
	require.NoError(t, repo.Create(ctx, p))

	// Create blocks
	block1 := &page.PageBlock{ID: uuid.New(), PageID: p.ID, BlockType: page.BlockTypeHero, Position: 0}
	block2 := &page.PageBlock{ID: uuid.New(), PageID: p.ID, BlockType: page.BlockTypeText, Position: 1}
	block3 := &page.PageBlock{ID: uuid.New(), PageID: p.ID, BlockType: page.BlockTypeCTA, Position: 2}

	require.NoError(t, repo.CreateBlock(ctx, block1))
	require.NoError(t, repo.CreateBlock(ctx, block2))
	require.NoError(t, repo.CreateBlock(ctx, block3))

	// Reorder: CTA, Hero, Text
	newOrder := []uuid.UUID{block3.ID, block1.ID, block2.ID}
	err := repo.ReorderBlocks(ctx, p.ID, newOrder)
	assert.NoError(t, err)

	// Verify new order
	blocks, _ := repo.ListBlocks(ctx, p.ID)
	assert.Equal(t, block3.ID, blocks[0].ID)
	assert.Equal(t, block1.ID, blocks[1].ID)
	assert.Equal(t, block2.ID, blocks[2].ID)
}
