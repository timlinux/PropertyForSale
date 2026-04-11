// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/service"
)

// StructureHandler handles structure HTTP requests
type StructureHandler struct {
	structureSvc *service.StructureService
	roomSvc      *service.RoomService
}

// NewStructureHandler creates a new structure handler
func NewStructureHandler(structureSvc *service.StructureService, roomSvc *service.RoomService) *StructureHandler {
	return &StructureHandler{
		structureSvc: structureSvc,
		roomSvc:      roomSvc,
	}
}

// CreateStructureRequest represents the request body for creating a structure
type CreateStructureRequest struct {
	PropertyID  string  `json:"property_id" binding:"required"`
	Name        string  `json:"name" binding:"required"`
	Type        string  `json:"type"`
	Description string  `json:"description"`
	FloorCount  int     `json:"floor_count"`
	YearBuilt   int     `json:"year_built"`
	SizeSqm     float64 `json:"size_sqm"`
}

// Create handles POST /api/v1/structures
func (h *StructureHandler) Create(c *gin.Context) {
	var req CreateStructureRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	propertyID, err := uuid.Parse(req.PropertyID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid property_id"})
		return
	}

	input := service.CreateStructureInput{
		PropertyID:  propertyID,
		Name:        req.Name,
		Type:        req.Type,
		Description: req.Description,
		FloorCount:  req.FloorCount,
		YearBuilt:   req.YearBuilt,
		SizeSqm:     req.SizeSqm,
	}

	structure, err := h.structureSvc.Create(c.Request.Context(), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, structure)
}

// Get handles GET /api/v1/structures/:id
func (h *StructureHandler) Get(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	structure, err := h.structureSvc.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "structure not found"})
		return
	}

	c.JSON(http.StatusOK, structure)
}

// Update handles PUT /api/v1/structures/:id
func (h *StructureHandler) Update(c *gin.Context) {
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

	input := service.UpdateStructureInput{}
	if v, ok := req["name"].(string); ok {
		input.Name = &v
	}
	if v, ok := req["type"].(string); ok {
		input.Type = &v
	}
	if v, ok := req["description"].(string); ok {
		input.Description = &v
	}

	structure, err := h.structureSvc.Update(c.Request.Context(), id, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, structure)
}

// Delete handles DELETE /api/v1/structures/:id
func (h *StructureHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.structureSvc.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// ListRooms handles GET /api/v1/structures/:id/rooms
func (h *StructureHandler) ListRooms(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	rooms, err := h.roomSvc.ListByStructureID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": rooms})
}
