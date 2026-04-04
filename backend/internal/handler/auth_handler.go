// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/timlinux/PropertyForSale/backend/internal/middleware"
	"github.com/timlinux/PropertyForSale/backend/internal/service"
)

// AuthHandler handles authentication HTTP requests
type AuthHandler struct {
	authSvc *service.AuthService
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(authSvc *service.AuthService) *AuthHandler {
	return &AuthHandler{authSvc: authSvc}
}

// InitiateOAuth handles GET /api/v1/auth/:provider
func (h *AuthHandler) InitiateOAuth(c *gin.Context) {
	provider := c.Param("provider")

	// In a real implementation, this would redirect to the OAuth provider
	// For now, return the expected flow
	c.JSON(http.StatusOK, gin.H{
		"message":  "Redirect to OAuth provider",
		"provider": provider,
	})
}

// OAuthCallback handles GET /api/v1/auth/:provider/callback
func (h *AuthHandler) OAuthCallback(c *gin.Context) {
	provider := c.Param("provider")
	code := c.Query("code")

	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "authorization code required"})
		return
	}

	// In a real implementation, this would:
	// 1. Exchange code for tokens with the OAuth provider
	// 2. Fetch user info from the provider
	// 3. Create or update user in our database
	// 4. Generate our own tokens

	// For now, simulate a successful authentication
	userInfo := service.OAuthUserInfo{
		Provider:   provider,
		ProviderID: "mock-provider-id",
		Email:      "user@example.com",
		Name:       "Test User",
		AvatarURL:  "",
	}

	tokens, user, err := h.authSvc.AuthenticateOAuth(c.Request.Context(), userInfo)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"tokens": tokens,
		"user":   user,
	})
}

// RefreshTokenRequest represents the refresh token request body
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// RefreshToken handles POST /api/v1/auth/refresh
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tokens, err := h.authSvc.RefreshTokens(c.Request.Context(), req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tokens)
}

// LogoutRequest represents the logout request body
type LogoutRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// Logout handles POST /api/v1/auth/logout
func (h *AuthHandler) Logout(c *gin.Context) {
	var req LogoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.authSvc.Logout(c.Request.Context(), req.RefreshToken); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

// GetCurrentUser handles GET /api/v1/auth/me
func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	claims, ok := middleware.GetUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := h.authSvc.GetUserByID(c.Request.Context(), claims.UserID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}
