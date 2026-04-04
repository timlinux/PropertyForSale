// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/service"
)

// RoomHandler handles room HTTP requests
type RoomHandler struct {
	roomSvc *service.RoomService
}

// NewRoomHandler creates a new room handler
func NewRoomHandler(roomSvc *service.RoomService) *RoomHandler {
	return &RoomHandler{roomSvc: roomSvc}
}

// CreateRoomRequest represents the request body for creating a room
type CreateRoomRequest struct {
	DwellingID  string  `json:"dwelling_id" binding:"required"`
	Name        string  `json:"name" binding:"required"`
	Type        string  `json:"type"`
	Description string  `json:"description"`
	SizeSqm     float64 `json:"size_sqm"`
	Floor       int     `json:"floor"`
}

// Create handles POST /api/v1/rooms
func (h *RoomHandler) Create(c *gin.Context) {
	var req CreateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	dwellingID, err := uuid.Parse(req.DwellingID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid dwelling_id"})
		return
	}

	input := service.CreateRoomInput{
		DwellingID:  dwellingID,
		Name:        req.Name,
		Type:        req.Type,
		Description: req.Description,
		SizeSqm:     req.SizeSqm,
		Floor:       req.Floor,
	}

	room, err := h.roomSvc.Create(c.Request.Context(), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, room)
}

// Get handles GET /api/v1/rooms/:id
func (h *RoomHandler) Get(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	room, err := h.roomSvc.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
		return
	}

	c.JSON(http.StatusOK, room)
}

// Update handles PUT /api/v1/rooms/:id
func (h *RoomHandler) Update(c *gin.Context) {
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

	input := service.UpdateRoomInput{}
	if v, ok := req["name"].(string); ok {
		input.Name = &v
	}
	if v, ok := req["type"].(string); ok {
		input.Type = &v
	}
	if v, ok := req["description"].(string); ok {
		input.Description = &v
	}

	room, err := h.roomSvc.Update(c.Request.Context(), id, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, room)
}

// Delete handles DELETE /api/v1/rooms/:id
func (h *RoomHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.roomSvc.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}
