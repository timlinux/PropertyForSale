// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/media"
	"github.com/timlinux/PropertyForSale/backend/internal/service"
)

// MediaHandler handles media HTTP requests
type MediaHandler struct {
	mediaSvc *service.MediaService
}

// NewMediaHandler creates a new media handler
func NewMediaHandler(mediaSvc *service.MediaService) *MediaHandler {
	return &MediaHandler{mediaSvc: mediaSvc}
}

// Upload handles POST /api/v1/media/upload
func (h *MediaHandler) Upload(c *gin.Context) {
	entityType := c.PostForm("entity_type")
	entityIDStr := c.PostForm("entity_id")
	autoplay := c.PostForm("autoplay") == "true"

	entityID, err := uuid.Parse(entityIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid entity_id"})
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file required"})
		return
	}
	defer file.Close()

	input := service.UploadInput{
		EntityType: media.EntityType(entityType),
		EntityID:   entityID,
		File:       file,
		FileName:   header.Filename,
		FileSize:   header.Size,
		MimeType:   header.Header.Get("Content-Type"),
		Autoplay:   autoplay,
	}

	m, err := h.mediaSvc.Upload(c.Request.Context(), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, m)
}

// Get handles GET /api/v1/media/:id
func (h *MediaHandler) Get(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	m, err := h.mediaSvc.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "media not found"})
		return
	}

	c.JSON(http.StatusOK, m)
}

// Update handles PUT /api/v1/media/:id
func (h *MediaHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input := service.UpdateMediaInput{}
	if v, ok := req["autoplay"].(bool); ok {
		input.Autoplay = &v
	}
	if v, ok := req["sort_order"].(float64); ok {
		sortOrder := int(v)
		input.SortOrder = &sortOrder
	}

	m, err := h.mediaSvc.Update(c.Request.Context(), id, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, m)
}

// Delete handles DELETE /api/v1/media/:id
func (h *MediaHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.mediaSvc.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}
