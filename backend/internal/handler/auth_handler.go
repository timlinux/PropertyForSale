// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package handler

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/timlinux/PropertyForSale/backend/internal/middleware"
	"github.com/timlinux/PropertyForSale/backend/internal/service"
)

// AuthHandler handles authentication HTTP requests
type AuthHandler struct {
	authSvc     *service.AuthService
	frontendURL string
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(authSvc *service.AuthService) *AuthHandler {
	return &AuthHandler{
		authSvc:     authSvc,
		frontendURL: "http://localhost:5173", // TODO: Make configurable
	}
}

// InitiateOAuth handles GET /api/v1/auth/:provider
// Redirects to the OAuth provider's authorization page
func (h *AuthHandler) InitiateOAuth(c *gin.Context) {
	provider := c.Param("provider")

	// Check if provider exists
	_, err := goth.GetProvider(provider)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":              fmt.Sprintf("unsupported provider: %s", provider),
			"available_providers": getAvailableProviders(),
		})
		return
	}

	// Set provider in query for gothic
	q := c.Request.URL.Query()
	q.Set("provider", provider)
	c.Request.URL.RawQuery = q.Encode()

	// Begin auth flow - this redirects to the provider
	gothic.BeginAuthHandler(c.Writer, c.Request)
}

// OAuthCallback handles GET /api/v1/auth/:provider/callback
// Processes the OAuth callback and creates/updates user
func (h *AuthHandler) OAuthCallback(c *gin.Context) {
	provider := c.Param("provider")

	// Set provider in query for gothic
	q := c.Request.URL.Query()
	q.Set("provider", provider)
	c.Request.URL.RawQuery = q.Encode()

	// Complete auth and get user info from provider
	gothUser, err := gothic.CompleteUserAuth(c.Writer, c.Request)
	if err != nil {
		// Redirect to frontend with error
		c.Redirect(http.StatusTemporaryRedirect,
			fmt.Sprintf("%s/login?error=%s", h.frontendURL, err.Error()))
		return
	}

	// Convert goth user to our user info
	userInfo := service.OAuthUserInfo{
		Provider:   gothUser.Provider,
		ProviderID: gothUser.UserID,
		Email:      gothUser.Email,
		Name:       gothUser.Name,
		AvatarURL:  gothUser.AvatarURL,
	}

	// If name is empty, try to construct from first/last name
	if userInfo.Name == "" && (gothUser.FirstName != "" || gothUser.LastName != "") {
		userInfo.Name = fmt.Sprintf("%s %s", gothUser.FirstName, gothUser.LastName)
	}

	// Authenticate and get tokens
	tokens, _, err := h.authSvc.AuthenticateOAuth(c.Request.Context(), userInfo)
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect,
			fmt.Sprintf("%s/login?error=%s", h.frontendURL, "authentication_failed"))
		return
	}

	// Redirect to frontend with tokens
	// In production, consider using secure HTTP-only cookies instead
	c.Redirect(http.StatusTemporaryRedirect,
		fmt.Sprintf("%s/auth/callback?access_token=%s&refresh_token=%s&expires_at=%s",
			h.frontendURL,
			tokens.AccessToken,
			tokens.RefreshToken,
			tokens.ExpiresAt.Format("2006-01-02T15:04:05Z07:00"),
		))
}

// GetProviders handles GET /api/v1/auth/providers
// Returns a list of available OAuth providers
func (h *AuthHandler) GetProviders(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"providers": getAvailableProviders(),
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

// getAvailableProviders returns the list of configured OAuth providers
func getAvailableProviders() []string {
	var providers []string
	for name := range goth.GetProviders() {
		providers = append(providers, name)
	}
	return providers
}
