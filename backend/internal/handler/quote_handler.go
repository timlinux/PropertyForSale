// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/service"
)

// QuoteHandler handles quote HTTP requests
type QuoteHandler struct {
	quoteSvc *service.QuoteService
}

// NewQuoteHandler creates a new quote handler
func NewQuoteHandler(quoteSvc *service.QuoteService) *QuoteHandler {
	return &QuoteHandler{quoteSvc: quoteSvc}
}

// CreateQuoteRequest represents the request body for creating a quote
type CreateQuoteRequest struct {
	PropertyID string `json:"property_id" binding:"required"`
	Text       string `json:"text" binding:"required"`
	SortOrder  int    `json:"sort_order"`
}

// Create handles POST /api/v1/quotes
func (h *QuoteHandler) Create(c *gin.Context) {
	var req CreateQuoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	propertyID, err := uuid.Parse(req.PropertyID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid property_id"})
		return
	}

	input := service.CreateQuoteInput{
		PropertyID: propertyID,
		Text:       req.Text,
		SortOrder:  req.SortOrder,
	}

	quote, err := h.quoteSvc.Create(c.Request.Context(), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, quote)
}

// Get handles GET /api/v1/quotes/:id
func (h *QuoteHandler) Get(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	quote, err := h.quoteSvc.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "quote not found"})
		return
	}

	c.JSON(http.StatusOK, quote)
}

// ListByProperty handles GET /api/v1/properties/:slug/quotes
func (h *QuoteHandler) ListByProperty(c *gin.Context, propertyID uuid.UUID) {
	quotes, err := h.quoteSvc.ListByPropertyID(c.Request.Context(), propertyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": quotes})
}

// UpdateQuoteRequest represents the request body for updating a quote
type UpdateQuoteRequest struct {
	Text      *string `json:"text"`
	SortOrder *int    `json:"sort_order"`
}

// Update handles PUT /api/v1/quotes/:id
func (h *QuoteHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req UpdateQuoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input := service.UpdateQuoteInput{
		Text:      req.Text,
		SortOrder: req.SortOrder,
	}

	quote, err := h.quoteSvc.Update(c.Request.Context(), id, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, quote)
}

// Delete handles DELETE /api/v1/quotes/:id
func (h *QuoteHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.quoteSvc.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}
