// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package handler

import (
	"crypto/md5"
	"encoding/hex"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/analytics"
	"github.com/timlinux/PropertyForSale/backend/internal/repository"
)

// ABTestHandler handles A/B testing HTTP requests
type ABTestHandler struct {
	analyticsRepo repository.AnalyticsRepository
}

// NewABTestHandler creates a new A/B test handler
func NewABTestHandler(analyticsRepo repository.AnalyticsRepository) *ABTestHandler {
	return &ABTestHandler{analyticsRepo: analyticsRepo}
}

// CreateABTestRequest represents the request body for creating an A/B test
type CreateABTestRequest struct {
	Name        string     `json:"name" binding:"required"`
	Description string     `json:"description"`
	EntityType  string     `json:"entity_type" binding:"required"`
	EntityID    string     `json:"entity_id" binding:"required"`
	StartDate   *time.Time `json:"start_date"`
	EndDate     *time.Time `json:"end_date"`
}

// CreateABTest handles POST /api/v1/ab-tests
func (h *ABTestHandler) CreateABTest(c *gin.Context) {
	var req CreateABTestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	entityID, err := uuid.Parse(req.EntityID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid entity_id"})
		return
	}

	userID, _ := c.Get("user_id")
	createdBy, _ := userID.(uuid.UUID)

	test := &analytics.ABTest{
		ID:          uuid.New(),
		Name:        req.Name,
		Description: req.Description,
		EntityType:  req.EntityType,
		EntityID:    entityID,
		StartDate:   req.StartDate,
		EndDate:     req.EndDate,
		Status:      analytics.ABTestStatusDraft,
		CreatedBy:   createdBy,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := h.analyticsRepo.CreateABTest(c.Request.Context(), test); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, test)
}

// GetABTest handles GET /api/v1/ab-tests/:id
func (h *ABTestHandler) GetABTest(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid test id"})
		return
	}

	test, err := h.analyticsRepo.GetABTest(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "test not found"})
		return
	}

	// Get variants
	variants, _ := h.analyticsRepo.ListABVariants(c.Request.Context(), id)

	c.JSON(http.StatusOK, gin.H{
		"test":     test,
		"variants": variants,
	})
}

// ListABTests handles GET /api/v1/ab-tests
func (h *ABTestHandler) ListABTests(c *gin.Context) {
	opts := repository.ABTestListOptions{
		Status:     c.Query("status"),
		EntityType: c.Query("entity_type"),
		Limit:      20,
	}

	if entityID := c.Query("entity_id"); entityID != "" {
		id, _ := uuid.Parse(entityID)
		opts.EntityID = &id
	}

	tests, total, err := h.analyticsRepo.ListABTests(c.Request.Context(), opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  tests,
		"total": total,
	})
}

// UpdateABTestRequest represents the request body for updating an A/B test
type UpdateABTestRequest struct {
	Name        *string              `json:"name"`
	Description *string              `json:"description"`
	Status      *analytics.ABTestStatus `json:"status"`
	StartDate   *time.Time           `json:"start_date"`
	EndDate     *time.Time           `json:"end_date"`
	WinnerVariantID *string          `json:"winner_variant_id"`
}

// UpdateABTest handles PUT /api/v1/ab-tests/:id
func (h *ABTestHandler) UpdateABTest(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid test id"})
		return
	}

	var req UpdateABTestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	test, err := h.analyticsRepo.GetABTest(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "test not found"})
		return
	}

	if req.Name != nil {
		test.Name = *req.Name
	}
	if req.Description != nil {
		test.Description = *req.Description
	}
	if req.Status != nil {
		test.Status = *req.Status
	}
	if req.StartDate != nil {
		test.StartDate = req.StartDate
	}
	if req.EndDate != nil {
		test.EndDate = req.EndDate
	}
	if req.WinnerVariantID != nil {
		winnerID, _ := uuid.Parse(*req.WinnerVariantID)
		test.WinnerVariantID = &winnerID
	}
	test.UpdatedAt = time.Now()

	if err := h.analyticsRepo.UpdateABTest(c.Request.Context(), test); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, test)
}

// DeleteABTest handles DELETE /api/v1/ab-tests/:id
func (h *ABTestHandler) DeleteABTest(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid test id"})
		return
	}

	if err := h.analyticsRepo.DeleteABTest(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// CreateVariantRequest represents the request body for creating a variant
type CreateVariantRequest struct {
	Name    string                 `json:"name" binding:"required"`
	Content map[string]interface{} `json:"content"`
	Weight  int                    `json:"weight"`
}

// CreateVariant handles POST /api/v1/ab-tests/:id/variants
func (h *ABTestHandler) CreateVariant(c *gin.Context) {
	testID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid test id"})
		return
	}

	var req CreateVariantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify test exists
	if _, err := h.analyticsRepo.GetABTest(c.Request.Context(), testID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "test not found"})
		return
	}

	weight := req.Weight
	if weight <= 0 {
		weight = 50
	}

	variant := &analytics.ABVariant{
		ID:        uuid.New(),
		ABTestID:  testID,
		Name:      req.Name,
		Content:   req.Content,
		Weight:    weight,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := h.analyticsRepo.CreateABVariant(c.Request.Context(), variant); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, variant)
}

// AssignVariantRequest represents the request for variant assignment
type AssignVariantRequest struct {
	SessionID string `json:"session_id" binding:"required"`
}

// AssignVariant handles POST /api/v1/ab-tests/:id/assign
// Deterministically assigns a session to a variant based on session ID hash
func (h *ABTestHandler) AssignVariant(c *gin.Context) {
	testID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid test id"})
		return
	}

	var req AssignVariantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get test
	test, err := h.analyticsRepo.GetABTest(c.Request.Context(), testID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "test not found"})
		return
	}

	// Only assign for running tests
	if test.Status != analytics.ABTestStatusRunning {
		c.JSON(http.StatusBadRequest, gin.H{"error": "test is not running"})
		return
	}

	// Get variants
	variants, err := h.analyticsRepo.ListABVariants(c.Request.Context(), testID)
	if err != nil || len(variants) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "no variants found"})
		return
	}

	// Deterministically assign based on session ID hash
	variant := assignVariantByHash(req.SessionID, testID.String(), variants)

	c.JSON(http.StatusOK, gin.H{
		"variant_id": variant.ID,
		"variant":    variant,
	})
}

// GetResults handles GET /api/v1/ab-tests/:id/results
func (h *ABTestHandler) GetResults(c *gin.Context) {
	testID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid test id"})
		return
	}

	results, err := h.analyticsRepo.GetABTestResults(c.Request.Context(), testID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, results)
}

// assignVariantByHash deterministically assigns a variant based on session hash
func assignVariantByHash(sessionID, testID string, variants []analytics.ABVariant) *analytics.ABVariant {
	// Create hash from session ID + test ID
	hash := md5.Sum([]byte(sessionID + testID))
	hashStr := hex.EncodeToString(hash[:])

	// Convert first 8 chars of hash to number
	var hashNum int64
	for i := 0; i < 8 && i < len(hashStr); i++ {
		hashNum = hashNum*16 + int64(hexCharToInt(hashStr[i]))
	}

	// Calculate total weight
	totalWeight := 0
	for _, v := range variants {
		totalWeight += v.Weight
	}

	if totalWeight == 0 {
		return &variants[0]
	}

	// Find variant based on hash position in weight distribution
	position := int(hashNum % int64(totalWeight))
	cumulative := 0
	for i := range variants {
		cumulative += variants[i].Weight
		if position < cumulative {
			return &variants[i]
		}
	}

	return &variants[len(variants)-1]
}

func hexCharToInt(c byte) int {
	switch {
	case c >= '0' && c <= '9':
		return int(c - '0')
	case c >= 'a' && c <= 'f':
		return int(c - 'a' + 10)
	case c >= 'A' && c <= 'F':
		return int(c - 'A' + 10)
	}
	return 0
}
