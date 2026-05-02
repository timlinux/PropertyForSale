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
	if v, ok := req["starred"].(bool); ok {
		input.Starred = &v
	}
	if v, ok := req["sort_order"].(float64); ok {
		sortOrder := int(v)
		input.SortOrder = &sortOrder
	}
	if v, ok := req["caption"].(string); ok {
		input.Caption = &v
	}
	if v, ok := req["linked_audio_id"].(string); ok {
		if audioID, err := uuid.Parse(v); err == nil {
			input.LinkedAudioID = &audioID
		}
	}
	// Allow clearing linked_audio_id by setting it to null
	if v, exists := req["linked_audio_id"]; exists && v == nil {
		emptyID := uuid.Nil
		input.LinkedAudioID = &emptyID
	}
	// Handle entity reassignment
	if v, ok := req["entity_type"].(string); ok {
		entityType := media.EntityType(v)
		input.EntityType = &entityType
	}
	if v, ok := req["entity_id"].(string); ok {
		if entityID, err := uuid.Parse(v); err == nil {
			input.EntityID = &entityID
		}
	}
	// Handle media tag
	if v, ok := req["tag"].(string); ok {
		tag := media.MediaTag(v)
		input.Tag = &tag
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

// UploadScene handles POST /api/v1/media/upload-scene
func (h *MediaHandler) UploadScene(c *gin.Context) {
	entityType := c.PostForm("entity_type")
	entityIDStr := c.PostForm("entity_id")
	description := c.PostForm("description")

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

	// Validate file extension
	if !isZipFile(header.Filename) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file must be a ZIP archive"})
		return
	}

	input := service.UploadSceneInput{
		EntityType:  media.EntityType(entityType),
		EntityID:    entityID,
		File:        file,
		FileName:    header.Filename,
		FileSize:    header.Size,
		Description: description,
	}

	m, err := h.mediaSvc.UploadScene(c.Request.Context(), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, m)
}

// isZipFile checks if a filename has a ZIP extension
func isZipFile(filename string) bool {
	ext := ""
	if i := len(filename) - 4; i > 0 && filename[i] == '.' {
		ext = filename[i:]
	}
	return ext == ".zip" || ext == ".ZIP"
}

// ToggleStar handles POST /api/v1/media/:id/star
func (h *MediaHandler) ToggleStar(c *gin.Context) {
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

	// Toggle the starred status
	newStarred := !m.Starred
	input := service.UpdateMediaInput{Starred: &newStarred}

	m, err = h.mediaSvc.Update(c.Request.Context(), id, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, m)
}
