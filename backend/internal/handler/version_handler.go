// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/service"
)

// VersionHandler handles content versioning HTTP requests
type VersionHandler struct {
	contentSvc *service.ContentService
}

// NewVersionHandler creates a new version handler
func NewVersionHandler(contentSvc *service.ContentService) *VersionHandler {
	return &VersionHandler{contentSvc: contentSvc}
}

// List handles GET /api/v1/versions/:entity_type/:entity_id
func (h *VersionHandler) List(c *gin.Context) {
	entityType := c.Param("entity_type")
	entityID, err := uuid.Parse(c.Param("entity_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid entity_id"})
		return
	}

	versions, err := h.contentSvc.ListVersions(c.Request.Context(), entityType, entityID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": versions})
}

// Get handles GET /api/v1/versions/:entity_type/:entity_id/:version
func (h *VersionHandler) Get(c *gin.Context) {
	entityType := c.Param("entity_type")
	entityID, err := uuid.Parse(c.Param("entity_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid entity_id"})
		return
	}

	version, err := strconv.Atoi(c.Param("version"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid version"})
		return
	}

	v, err := h.contentSvc.GetVersion(c.Request.Context(), entityType, entityID, version)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "version not found"})
		return
	}

	c.JSON(http.StatusOK, v)
}

// Rollback handles POST /api/v1/versions/:entity_type/:entity_id/rollback/:version
func (h *VersionHandler) Rollback(c *gin.Context) {
	// Placeholder for rollback functionality
	c.JSON(http.StatusOK, gin.H{
		"message": "Rollback endpoint - to be implemented",
	})
}
