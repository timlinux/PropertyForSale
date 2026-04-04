// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
	"github.com/timlinux/PropertyForSale/backend/internal/config"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/user"
)

// ContextKey is a type for context keys
type ContextKey string

const (
	// UserContextKey is the context key for the authenticated user
	UserContextKey ContextKey = "user"
	// RequestIDContextKey is the context key for the request ID
	RequestIDContextKey ContextKey = "request_id"
)

// Logger returns a middleware that logs requests using zerolog
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()

		event := log.Info()
		if status >= 400 {
			event = log.Warn()
		}
		if status >= 500 {
			event = log.Error()
		}

		event.
			Str("method", c.Request.Method).
			Str("path", path).
			Str("query", query).
			Int("status", status).
			Dur("latency", latency).
			Str("ip", c.ClientIP()).
			Str("user_agent", c.Request.UserAgent()).
			Str("request_id", c.GetString(string(RequestIDContextKey))).
			Msg("HTTP request")
	}
}

// RequestID generates a unique request ID for tracing
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = uuid.New().String()
		}
		c.Set(string(RequestIDContextKey), requestID)
		c.Header("X-Request-ID", requestID)
		c.Next()
	}
}

// JWTClaims represents the claims in a JWT token
type JWTClaims struct {
	UserID uuid.UUID `json:"user_id"`
	Email  string    `json:"email"`
	Role   user.Role `json:"role"`
	jwt.RegisteredClaims
}

// RequireAuth validates JWT tokens and sets the user in context
func RequireAuth(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header required",
			})
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Bearer token required",
			})
			return
		}

		token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(cfg.Auth.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired token",
			})
			return
		}

		claims, ok := token.Claims.(*JWTClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid token claims",
			})
			return
		}

		c.Set(string(UserContextKey), claims)
		c.Next()
	}
}

// RequireRole checks if the authenticated user has the required role
func RequireRole(requiredRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, exists := c.Get(string(UserContextKey))
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Authentication required",
			})
			return
		}

		jwtClaims, ok := claims.(*JWTClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"error": "Invalid user context",
			})
			return
		}

		// Admin has access to everything
		if jwtClaims.Role == user.RoleAdmin {
			c.Next()
			return
		}

		// Check specific role
		if string(jwtClaims.Role) != requiredRole {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "Insufficient permissions",
			})
			return
		}

		c.Next()
	}
}

// GetUserFromContext retrieves the authenticated user from the context
func GetUserFromContext(c *gin.Context) (*JWTClaims, bool) {
	claims, exists := c.Get(string(UserContextKey))
	if !exists {
		return nil, false
	}
	jwtClaims, ok := claims.(*JWTClaims)
	return jwtClaims, ok
}
