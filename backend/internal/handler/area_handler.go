// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/service"
)

// AreaHandler handles area HTTP requests
type AreaHandler struct {
	areaSvc *service.AreaService
}

// NewAreaHandler creates a new area handler
func NewAreaHandler(areaSvc *service.AreaService) *AreaHandler {
	return &AreaHandler{areaSvc: areaSvc}
}

// CreateAreaRequest represents the request body for creating an area
type CreateAreaRequest struct {
	PropertyID  string  `json:"property_id" binding:"required"`
	Name        string  `json:"name" binding:"required"`
	Type        string  `json:"type"`
	Description string  `json:"description"`
	SizeSqm     float64 `json:"size_sqm"`
}

// Create handles POST /api/v1/areas
func (h *AreaHandler) Create(c *gin.Context) {
	var req CreateAreaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	propertyID, err := uuid.Parse(req.PropertyID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid property_id"})
		return
	}

	input := service.CreateAreaInput{
		PropertyID:  propertyID,
		Name:        req.Name,
		Type:        req.Type,
		Description: req.Description,
		SizeSqm:     req.SizeSqm,
	}

	area, err := h.areaSvc.Create(c.Request.Context(), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, area)
}

// Get handles GET /api/v1/areas/:id
func (h *AreaHandler) Get(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	area, err := h.areaSvc.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "area not found"})
		return
	}

	c.JSON(http.StatusOK, area)
}

// Update handles PUT /api/v1/areas/:id
func (h *AreaHandler) Update(c *gin.Context) {
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

	input := service.UpdateAreaInput{}
	if v, ok := req["name"].(string); ok {
		input.Name = &v
	}
	if v, ok := req["type"].(string); ok {
		input.Type = &v
	}
	if v, ok := req["description"].(string); ok {
		input.Description = &v
	}

	area, err := h.areaSvc.Update(c.Request.Context(), id, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, area)
}

// Delete handles DELETE /api/v1/areas/:id
func (h *AreaHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.areaSvc.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}
