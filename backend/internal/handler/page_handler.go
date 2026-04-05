// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/page"
	"github.com/timlinux/PropertyForSale/backend/internal/repository"
)

// PageHandler handles CMS page requests
type PageHandler struct {
	repo repository.PageRepository
}

// NewPageHandler creates a new page handler
func NewPageHandler(repo repository.PageRepository) *PageHandler {
	return &PageHandler{repo: repo}
}

// ListPages returns a list of pages
func (h *PageHandler) ListPages(c *gin.Context) {
	opts := repository.PageListOptions{
		Status:   c.Query("status"),
		Template: c.Query("template"),
		Search:   c.Query("search"),
	}

	if offset, err := strconv.Atoi(c.Query("offset")); err == nil {
		opts.Offset = offset
	}
	if limit, err := strconv.Atoi(c.Query("limit")); err == nil {
		opts.Limit = limit
	}

	pages, total, err := h.repo.List(c.Request.Context(), opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"pages": pages,
		"total": total,
	})
}

// GetPage returns a single page by ID or slug
func (h *PageHandler) GetPage(c *gin.Context) {
	idOrSlug := c.Param("id")

	// Try UUID first
	if id, err := uuid.Parse(idOrSlug); err == nil {
		p, err := h.repo.GetByID(c.Request.Context(), id)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Page not found"})
			return
		}
		c.JSON(http.StatusOK, p)
		return
	}

	// Try slug
	p, err := h.repo.GetBySlug(c.Request.Context(), idOrSlug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Page not found"})
		return
	}
	c.JSON(http.StatusOK, p)
}

// CreatePageRequest is the request body for creating a page
type CreatePageRequest struct {
	Slug        string            `json:"slug" binding:"required"`
	Title       string            `json:"title" binding:"required"`
	Description string            `json:"description"`
	Template    page.PageTemplate `json:"template"`
	MetaTitle   string            `json:"meta_title"`
	MetaDesc    string            `json:"meta_description"`
	OGImage     string            `json:"og_image"`
}

// CreatePage creates a new page
func (h *PageHandler) CreatePage(c *gin.Context) {
	var req CreatePageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context
	userID, _ := c.Get("userID")
	authorID, _ := userID.(uuid.UUID)

	p := &page.Page{
		ID:          uuid.New(),
		Slug:        req.Slug,
		Title:       req.Title,
		Description: req.Description,
		Template:    req.Template,
		MetaTitle:   req.MetaTitle,
		MetaDesc:    req.MetaDesc,
		OGImage:     req.OGImage,
		Status:      page.PageStatusDraft,
		AuthorID:    authorID,
	}

	if p.Template == "" {
		p.Template = page.PageTemplateBlank
	}

	if err := h.repo.Create(c.Request.Context(), p); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, p)
}

// UpdatePageRequest is the request body for updating a page
type UpdatePageRequest struct {
	Slug        *string            `json:"slug"`
	Title       *string            `json:"title"`
	Description *string            `json:"description"`
	Template    *page.PageTemplate `json:"template"`
	MetaTitle   *string            `json:"meta_title"`
	MetaDesc    *string            `json:"meta_description"`
	OGImage     *string            `json:"og_image"`
}

// UpdatePage updates a page
func (h *PageHandler) UpdatePage(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid page ID"})
		return
	}

	p, err := h.repo.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Page not found"})
		return
	}

	var req UpdatePageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Slug != nil {
		p.Slug = *req.Slug
	}
	if req.Title != nil {
		p.Title = *req.Title
	}
	if req.Description != nil {
		p.Description = *req.Description
	}
	if req.Template != nil {
		p.Template = *req.Template
	}
	if req.MetaTitle != nil {
		p.MetaTitle = *req.MetaTitle
	}
	if req.MetaDesc != nil {
		p.MetaDesc = *req.MetaDesc
	}
	if req.OGImage != nil {
		p.OGImage = *req.OGImage
	}

	if err := h.repo.Update(c.Request.Context(), p); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, p)
}

// DeletePage deletes a page
func (h *PageHandler) DeletePage(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid page ID"})
		return
	}

	if err := h.repo.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Page deleted"})
}

// PublishPage publishes a page
func (h *PageHandler) PublishPage(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid page ID"})
		return
	}

	// Get user ID for version snapshot
	userID, _ := c.Get("userID")
	authorID, _ := userID.(uuid.UUID)

	// Save snapshot before publishing
	if err := h.repo.SavePageSnapshot(c.Request.Context(), id, authorID, "Published"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.Publish(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Page published"})
}

// UnpublishPage unpublishes a page
func (h *PageHandler) UnpublishPage(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid page ID"})
		return
	}

	if err := h.repo.Unpublish(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Page unpublished"})
}

// Block handlers

// CreateBlockRequest is the request body for creating a block
type CreateBlockRequest struct {
	BlockType page.BlockType         `json:"block_type" binding:"required"`
	Position  int                    `json:"position"`
	Data      map[string]interface{} `json:"data"`
	Settings  map[string]interface{} `json:"settings"`
}

// CreateBlock creates a new block
func (h *PageHandler) CreateBlock(c *gin.Context) {
	pageID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid page ID"})
		return
	}

	var req CreateBlockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	block := &page.PageBlock{
		ID:        uuid.New(),
		PageID:    pageID,
		BlockType: req.BlockType,
		Position:  req.Position,
		Data:      page.JSONB(req.Data),
		Settings:  page.JSONB(req.Settings),
	}

	if err := h.repo.CreateBlock(c.Request.Context(), block); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, block)
}

// UpdateBlockRequest is the request body for updating a block
type UpdateBlockRequest struct {
	BlockType *page.BlockType         `json:"block_type"`
	Position  *int                    `json:"position"`
	Data      *map[string]interface{} `json:"data"`
	Settings  *map[string]interface{} `json:"settings"`
}

// UpdateBlock updates a block
func (h *PageHandler) UpdateBlock(c *gin.Context) {
	blockID, err := uuid.Parse(c.Param("blockId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid block ID"})
		return
	}

	block, err := h.repo.GetBlock(c.Request.Context(), blockID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Block not found"})
		return
	}

	var req UpdateBlockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.BlockType != nil {
		block.BlockType = *req.BlockType
	}
	if req.Position != nil {
		block.Position = *req.Position
	}
	if req.Data != nil {
		block.Data = page.JSONB(*req.Data)
	}
	if req.Settings != nil {
		block.Settings = page.JSONB(*req.Settings)
	}

	if err := h.repo.UpdateBlock(c.Request.Context(), block); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, block)
}

// DeleteBlock deletes a block
func (h *PageHandler) DeleteBlock(c *gin.Context) {
	blockID, err := uuid.Parse(c.Param("blockId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid block ID"})
		return
	}

	if err := h.repo.DeleteBlock(c.Request.Context(), blockID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Block deleted"})
}

// ReorderBlocksRequest is the request body for reordering blocks
type ReorderBlocksRequest struct {
	BlockIDs []string `json:"block_ids" binding:"required"`
}

// ReorderBlocks reorders blocks within a page
func (h *PageHandler) ReorderBlocks(c *gin.Context) {
	pageID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid page ID"})
		return
	}

	var req ReorderBlocksRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	blockIDs := make([]uuid.UUID, len(req.BlockIDs))
	for i, idStr := range req.BlockIDs {
		id, err := uuid.Parse(idStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid block ID"})
			return
		}
		blockIDs[i] = id
	}

	if err := h.repo.ReorderBlocks(c.Request.Context(), pageID, blockIDs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Blocks reordered"})
}

// Version handlers

// ListVersions lists all versions of a page
func (h *PageHandler) ListVersions(c *gin.Context) {
	pageID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid page ID"})
		return
	}

	versions, err := h.repo.ListVersions(c.Request.Context(), pageID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, versions)
}

// GetVersion returns a specific version of a page
func (h *PageHandler) GetVersion(c *gin.Context) {
	pageID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid page ID"})
		return
	}

	versionNumber, err := strconv.Atoi(c.Param("version"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid version number"})
		return
	}

	version, err := h.repo.GetVersion(c.Request.Context(), pageID, versionNumber)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Version not found"})
		return
	}

	c.JSON(http.StatusOK, version)
}

// RollbackRequest is the request body for rollback
type RollbackRequest struct {
	Note string `json:"note"`
}

// RollbackToVersion rolls back a page to a previous version
func (h *PageHandler) RollbackToVersion(c *gin.Context) {
	pageID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid page ID"})
		return
	}

	versionNumber, err := strconv.Atoi(c.Param("version"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid version number"})
		return
	}

	// Get user ID for new version note
	userID, _ := c.Get("userID")
	authorID, _ := userID.(uuid.UUID)

	// Save current state before rollback
	if err := h.repo.SavePageSnapshot(c.Request.Context(), pageID, authorID, "Before rollback"); err != nil {
		// Continue even if this fails
	}

	if err := h.repo.RollbackToVersion(c.Request.Context(), pageID, versionNumber); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Save new state after rollback
	if err := h.repo.SavePageSnapshot(c.Request.Context(), pageID, authorID, "After rollback to v"+strconv.Itoa(versionNumber)); err != nil {
		// Continue even if this fails
	}

	c.JSON(http.StatusOK, gin.H{"message": "Rolled back to version " + strconv.Itoa(versionNumber)})
}

// Block template handlers

// ListBlockTemplates lists block templates
func (h *PageHandler) ListBlockTemplates(c *gin.Context) {
	blockType := c.Query("block_type")

	templates, err := h.repo.ListBlockTemplates(c.Request.Context(), blockType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, templates)
}

// CreateBlockTemplateRequest is the request body for creating a block template
type CreateBlockTemplateRequest struct {
	Name        string                 `json:"name" binding:"required"`
	Description string                 `json:"description"`
	BlockType   page.BlockType         `json:"block_type" binding:"required"`
	Schema      map[string]interface{} `json:"schema"`
	DefaultData map[string]interface{} `json:"default_data"`
	Thumbnail   string                 `json:"thumbnail"`
}

// CreateBlockTemplate creates a new block template
func (h *PageHandler) CreateBlockTemplate(c *gin.Context) {
	var req CreateBlockTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	t := &page.BlockTemplate{
		ID:          uuid.New(),
		Name:        req.Name,
		Description: req.Description,
		BlockType:   req.BlockType,
		Schema:      page.JSONB(req.Schema),
		DefaultData: page.JSONB(req.DefaultData),
		Thumbnail:   req.Thumbnail,
	}

	if err := h.repo.CreateBlockTemplate(c.Request.Context(), t); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, t)
}

// DeleteBlockTemplate deletes a block template
func (h *PageHandler) DeleteBlockTemplate(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid template ID"})
		return
	}

	if err := h.repo.DeleteBlockTemplate(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Template deleted"})
}

// GetPublicPage returns a published page by slug for public access
func (h *PageHandler) GetPublicPage(c *gin.Context) {
	slug := c.Param("slug")

	p, err := h.repo.GetBySlug(c.Request.Context(), slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Page not found"})
		return
	}

	// Only return published pages
	if p.Status != page.PageStatusPublished {
		c.JSON(http.StatusNotFound, gin.H{"error": "Page not found"})
		return
	}

	c.JSON(http.StatusOK, p)
}
