// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/service"
)

// DwellingHandler handles dwelling HTTP requests
type DwellingHandler struct {
	dwellingSvc *service.DwellingService
	roomSvc     *service.RoomService
}

// NewDwellingHandler creates a new dwelling handler
func NewDwellingHandler(dwellingSvc *service.DwellingService, roomSvc *service.RoomService) *DwellingHandler {
	return &DwellingHandler{
		dwellingSvc: dwellingSvc,
		roomSvc:     roomSvc,
	}
}

// CreateDwellingRequest represents the request body for creating a dwelling
type CreateDwellingRequest struct {
	PropertyID  string  `json:"property_id" binding:"required"`
	Name        string  `json:"name" binding:"required"`
	Type        string  `json:"type"`
	Description string  `json:"description"`
	FloorCount  int     `json:"floor_count"`
	YearBuilt   int     `json:"year_built"`
	SizeSqm     float64 `json:"size_sqm"`
}

// Create handles POST /api/v1/dwellings
func (h *DwellingHandler) Create(c *gin.Context) {
	var req CreateDwellingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	propertyID, err := uuid.Parse(req.PropertyID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid property_id"})
		return
	}

	input := service.CreateDwellingInput{
		PropertyID:  propertyID,
		Name:        req.Name,
		Type:        req.Type,
		Description: req.Description,
		FloorCount:  req.FloorCount,
		YearBuilt:   req.YearBuilt,
		SizeSqm:     req.SizeSqm,
	}

	dwelling, err := h.dwellingSvc.Create(c.Request.Context(), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, dwelling)
}

// Get handles GET /api/v1/dwellings/:id
func (h *DwellingHandler) Get(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	dwelling, err := h.dwellingSvc.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "dwelling not found"})
		return
	}

	c.JSON(http.StatusOK, dwelling)
}

// Update handles PUT /api/v1/dwellings/:id
func (h *DwellingHandler) Update(c *gin.Context) {
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

	input := service.UpdateDwellingInput{}
	if v, ok := req["name"].(string); ok {
		input.Name = &v
	}
	if v, ok := req["type"].(string); ok {
		input.Type = &v
	}
	if v, ok := req["description"].(string); ok {
		input.Description = &v
	}

	dwelling, err := h.dwellingSvc.Update(c.Request.Context(), id, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dwelling)
}

// Delete handles DELETE /api/v1/dwellings/:id
func (h *DwellingHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.dwellingSvc.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// ListRooms handles GET /api/v1/dwellings/:id/rooms
func (h *DwellingHandler) ListRooms(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	rooms, err := h.roomSvc.ListByDwellingID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": rooms})
}
