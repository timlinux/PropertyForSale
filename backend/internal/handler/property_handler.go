// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/media"
	"github.com/timlinux/PropertyForSale/backend/internal/middleware"
	"github.com/timlinux/PropertyForSale/backend/internal/repository"
	"github.com/timlinux/PropertyForSale/backend/internal/service"
)

// PropertyHandler handles property HTTP requests
type PropertyHandler struct {
	propertySvc  *service.PropertyService
	structureSvc *service.StructureService
	roomSvc      *service.RoomService
	areaSvc      *service.AreaService
	mediaSvc     *service.MediaService
	quoteSvc     *service.QuoteService
}

// NewPropertyHandler creates a new property handler
func NewPropertyHandler(
	propertySvc *service.PropertyService,
	structureSvc *service.StructureService,
	roomSvc *service.RoomService,
	areaSvc *service.AreaService,
	mediaSvc *service.MediaService,
	quoteSvc *service.QuoteService,
) *PropertyHandler {
	return &PropertyHandler{
		propertySvc:  propertySvc,
		structureSvc: structureSvc,
		roomSvc:      roomSvc,
		areaSvc:      areaSvc,
		mediaSvc:     mediaSvc,
		quoteSvc:     quoteSvc,
	}
}

// CreatePropertyRequest represents the request body for creating a property
type CreatePropertyRequest struct {
	Name         string  `json:"name" binding:"required"`
	Description  string  `json:"description"`
	PriceMin     float64 `json:"price_min"`
	PriceMax     float64 `json:"price_max"`
	Currency     string  `json:"currency"`
	AddressLine1 string  `json:"address_line1"`
	AddressLine2 string  `json:"address_line2"`
	City         string  `json:"city"`
	State        string  `json:"state"`
	PostalCode   string  `json:"postal_code"`
	Country      string  `json:"country"`
	Latitude     float64 `json:"latitude"`
	Longitude    float64 `json:"longitude"`
}

// Create handles POST /api/v1/properties
func (h *PropertyHandler) Create(c *gin.Context) {
	var req CreatePropertyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	claims, ok := middleware.GetUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	input := service.CreatePropertyInput{
		OwnerID:      claims.UserID,
		Name:         req.Name,
		Description:  req.Description,
		PriceMin:     req.PriceMin,
		PriceMax:     req.PriceMax,
		Currency:     req.Currency,
		AddressLine1: req.AddressLine1,
		AddressLine2: req.AddressLine2,
		City:         req.City,
		State:        req.State,
		PostalCode:   req.PostalCode,
		Country:      req.Country,
		Latitude:     req.Latitude,
		Longitude:    req.Longitude,
	}

	property, err := h.propertySvc.Create(c.Request.Context(), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, property)
}

// List handles GET /api/v1/properties
func (h *PropertyHandler) List(c *gin.Context) {
	opts := repository.ListOptions{
		Offset: getIntQuery(c, "offset", 0),
		Limit:  getIntQuery(c, "limit", 20),
		Search: c.Query("search"),
		Status: c.Query("status"),
	}

	if minPrice := c.Query("min_price"); minPrice != "" {
		if v, err := strconv.ParseFloat(minPrice, 64); err == nil {
			opts.MinPrice = &v
		}
	}
	if maxPrice := c.Query("max_price"); maxPrice != "" {
		if v, err := strconv.ParseFloat(maxPrice, 64); err == nil {
			opts.MaxPrice = &v
		}
	}

	properties, total, err := h.propertySvc.List(c.Request.Context(), opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":   properties,
		"total":  total,
		"offset": opts.Offset,
		"limit":  opts.Limit,
	})
}

// GetBySlug handles GET /api/v1/properties/:slug
func (h *PropertyHandler) GetBySlug(c *gin.Context) {
	slug := c.Param("slug")

	property, err := h.propertySvc.GetBySlug(c.Request.Context(), slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "property not found"})
		return
	}

	c.JSON(http.StatusOK, property)
}

// Update handles PUT /api/v1/properties/:slug
func (h *PropertyHandler) Update(c *gin.Context) {
	slug := c.Param("slug")

	// Look up property by slug to get the ID
	property, err := h.propertySvc.GetBySlug(c.Request.Context(), slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "property not found"})
		return
	}

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	claims, ok := middleware.GetUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	input := service.UpdatePropertyInput{}
	if v, ok := req["name"].(string); ok {
		input.Name = &v
	}
	if v, ok := req["description"].(string); ok {
		input.Description = &v
	}

	updated, err := h.propertySvc.Update(c.Request.Context(), property.ID, input, claims.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updated)
}

// Delete handles DELETE /api/v1/properties/:slug
func (h *PropertyHandler) Delete(c *gin.Context) {
	slug := c.Param("slug")

	// Look up property by slug to get the ID
	property, err := h.propertySvc.GetBySlug(c.Request.Context(), slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "property not found"})
		return
	}

	if err := h.propertySvc.Delete(c.Request.Context(), property.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// ListStructures handles GET /api/v1/properties/:slug/structures
func (h *PropertyHandler) ListStructures(c *gin.Context) {
	slug := c.Param("slug")

	// Look up property by slug to get the ID
	property, err := h.propertySvc.GetBySlug(c.Request.Context(), slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "property not found"})
		return
	}

	structures, err := h.structureSvc.ListByPropertyID(c.Request.Context(), property.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": structures})
}

// ListAreas handles GET /api/v1/properties/:slug/areas
func (h *PropertyHandler) ListAreas(c *gin.Context) {
	slug := c.Param("slug")

	// Look up property by slug to get the ID
	property, err := h.propertySvc.GetBySlug(c.Request.Context(), slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "property not found"})
		return
	}

	areas, err := h.areaSvc.ListByPropertyID(c.Request.Context(), property.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": areas})
}

// ListMedia handles GET /api/v1/properties/:slug/media
// Returns all media for the property and its sub-entities (structures, rooms, areas)
func (h *PropertyHandler) ListMedia(c *gin.Context) {
	slug := c.Param("slug")
	ctx := c.Request.Context()

	// Look up property by slug to get the ID
	property, err := h.propertySvc.GetBySlug(ctx, slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "property not found"})
		return
	}

	// Collect all media items
	var allMedia []media.Media

	// Get property media
	propertyMedia, err := h.mediaSvc.ListByEntity(ctx, media.EntityTypeProperty, property.ID)
	if err == nil {
		allMedia = append(allMedia, propertyMedia...)
	}

	// Get structures and their media
	structures, err := h.structureSvc.ListByPropertyID(ctx, property.ID)
	if err == nil {
		for _, structure := range structures {
			structureMedia, err := h.mediaSvc.ListByEntity(ctx, media.EntityTypeStructure, structure.ID)
			if err == nil {
				allMedia = append(allMedia, structureMedia...)
			}

			// Get rooms for this structure and their media
			rooms, err := h.roomSvc.ListByStructureID(ctx, structure.ID)
			if err == nil {
				for _, room := range rooms {
					roomMedia, err := h.mediaSvc.ListByEntity(ctx, media.EntityTypeRoom, room.ID)
					if err == nil {
						allMedia = append(allMedia, roomMedia...)
					}
				}
			}
		}
	}

	// Get areas and their media
	areas, err := h.areaSvc.ListByPropertyID(ctx, property.ID)
	if err == nil {
		for _, area := range areas {
			areaMedia, err := h.mediaSvc.ListByEntity(ctx, media.EntityTypeArea, area.ID)
			if err == nil {
				allMedia = append(allMedia, areaMedia...)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": allMedia})
}

// ListQuotes handles GET /api/v1/properties/:slug/quotes
func (h *PropertyHandler) ListQuotes(c *gin.Context) {
	slug := c.Param("slug")
	ctx := c.Request.Context()

	// Look up property by slug to get the ID
	property, err := h.propertySvc.GetBySlug(ctx, slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "property not found"})
		return
	}

	quotes, err := h.quoteSvc.ListByPropertyID(ctx, property.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": quotes})
}

func getIntQuery(c *gin.Context, key string, defaultValue int) int {
	if v := c.Query(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return defaultValue
}
