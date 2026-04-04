// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/service"
)

// AnalyticsHandler handles analytics HTTP requests
type AnalyticsHandler struct {
	analyticsSvc *service.AnalyticsService
}

// NewAnalyticsHandler creates a new analytics handler
func NewAnalyticsHandler(analyticsSvc *service.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{analyticsSvc: analyticsSvc}
}

// PageViewRequest represents the request body for recording a page view
type PageViewRequest struct {
	SessionID   string  `json:"session_id" binding:"required"`
	PropertyID  *string `json:"property_id"`
	PagePath    string  `json:"page_path" binding:"required"`
	DwellTimeMs int64   `json:"dwell_time_ms"`
	ScrollDepth int     `json:"scroll_depth"`
	Referrer    string  `json:"referrer"`
}

// RecordPageView handles POST /api/v1/analytics/pageview
func (h *AnalyticsHandler) RecordPageView(c *gin.Context) {
	var req PageViewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var propertyID *uuid.UUID
	if req.PropertyID != nil {
		id, err := uuid.Parse(*req.PropertyID)
		if err == nil {
			propertyID = &id
		}
	}

	input := service.PageViewInput{
		SessionID:   req.SessionID,
		PropertyID:  propertyID,
		PagePath:    req.PagePath,
		DwellTimeMs: req.DwellTimeMs,
		ScrollDepth: req.ScrollDepth,
		IPAddress:   c.ClientIP(),
		Referrer:    req.Referrer,
		UserAgent:   c.Request.UserAgent(),
	}

	if err := h.analyticsSvc.RecordPageView(c.Request.Context(), input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "recorded"})
}

// Dashboard handles GET /api/v1/analytics/dashboard
func (h *AnalyticsHandler) Dashboard(c *gin.Context) {
	propertyIDStr := c.Query("property_id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	var propertyID *uuid.UUID
	if propertyIDStr != "" {
		id, err := uuid.Parse(propertyIDStr)
		if err == nil {
			propertyID = &id
		}
	}

	data, err := h.analyticsSvc.GetDashboardData(c.Request.Context(), propertyID, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, data)
}

// VisitorMap handles GET /api/v1/analytics/visitors/map
func (h *AnalyticsHandler) VisitorMap(c *gin.Context) {
	propertyIDStr := c.Query("property_id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	var propertyID *uuid.UUID
	if propertyIDStr != "" {
		id, err := uuid.Parse(propertyIDStr)
		if err == nil {
			propertyID = &id
		}
	}

	locations, err := h.analyticsSvc.GetVisitorMap(c.Request.Context(), propertyID, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": locations})
}

// DailyReport handles GET /api/v1/analytics/reports/daily
func (h *AnalyticsHandler) DailyReport(c *gin.Context) {
	// Placeholder for daily report generation
	c.JSON(http.StatusOK, gin.H{
		"message": "Daily report endpoint - to be implemented",
	})
}
