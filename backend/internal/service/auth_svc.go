// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package service

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/config"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/user"
	"github.com/timlinux/PropertyForSale/backend/internal/repository"
)

// AuthService handles authentication business logic
type AuthService struct {
	userRepo repository.UserRepository
	cfg      *config.Config
}

// NewAuthService creates a new auth service
func NewAuthService(userRepo repository.UserRepository, cfg *config.Config) *AuthService {
	return &AuthService{
		userRepo: userRepo,
		cfg:      cfg,
	}
}

// JWTClaims represents the claims in a JWT token
type JWTClaims struct {
	UserID uuid.UUID `json:"user_id"`
	Email  string    `json:"email"`
	Role   user.Role `json:"role"`
	jwt.RegisteredClaims
}

// TokenPair contains access and refresh tokens
type TokenPair struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at"`
}

// OAuthUserInfo contains user info from OAuth provider
type OAuthUserInfo struct {
	Provider   string
	ProviderID string
	Email      string
	Name       string
	AvatarURL  string
}

// AuthenticateOAuth authenticates a user via OAuth and returns tokens
func (s *AuthService) AuthenticateOAuth(ctx context.Context, info OAuthUserInfo) (*TokenPair, *user.User, error) {
	// Try to find existing user by provider ID
	u, err := s.userRepo.GetByProviderID(ctx, info.Provider, info.ProviderID)
	if err != nil {
		// Try to find by email
		u, err = s.userRepo.GetByEmail(ctx, info.Email)
		if err != nil {
			// Create new user
			u = &user.User{
				Email:      info.Email,
				Name:       info.Name,
				AvatarURL:  info.AvatarURL,
				Role:       user.RoleViewer,
				Provider:   info.Provider,
				ProviderID: info.ProviderID,
			}
			if err := s.userRepo.Create(ctx, u); err != nil {
				return nil, nil, fmt.Errorf("failed to create user: %w", err)
			}
		} else {
			// Update provider info
			u.Provider = info.Provider
			u.ProviderID = info.ProviderID
			u.AvatarURL = info.AvatarURL
			if err := s.userRepo.Update(ctx, u); err != nil {
				return nil, nil, fmt.Errorf("failed to update user: %w", err)
			}
		}
	}

	// Update last login
	u.LastLoginAt = time.Now()
	s.userRepo.Update(ctx, u)

	// Generate tokens
	tokens, err := s.generateTokenPair(ctx, u)
	if err != nil {
		return nil, nil, err
	}

	return tokens, u, nil
}

// RefreshTokens generates new tokens from a refresh token
func (s *AuthService) RefreshTokens(ctx context.Context, refreshToken string) (*TokenPair, error) {
	// Verify refresh token exists
	session, err := s.userRepo.GetSessionByToken(ctx, refreshToken)
	if err != nil {
		return nil, fmt.Errorf("invalid refresh token")
	}

	// Check expiry
	if time.Now().After(session.ExpiresAt) {
		s.userRepo.DeleteSession(ctx, session.ID)
		return nil, fmt.Errorf("refresh token expired")
	}

	// Get user
	u, err := s.userRepo.GetByID(ctx, session.UserID)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}

	// Delete old session
	s.userRepo.DeleteSession(ctx, session.ID)

	// Generate new tokens
	return s.generateTokenPair(ctx, u)
}

// Logout invalidates a user's session
func (s *AuthService) Logout(ctx context.Context, refreshToken string) error {
	session, err := s.userRepo.GetSessionByToken(ctx, refreshToken)
	if err != nil {
		return nil // Already logged out
	}
	return s.userRepo.DeleteSession(ctx, session.ID)
}

// GetUserByID retrieves a user by ID
func (s *AuthService) GetUserByID(ctx context.Context, id uuid.UUID) (*user.User, error) {
	return s.userRepo.GetByID(ctx, id)
}

// UpdateUserRole updates a user's role (for dev mode)
func (s *AuthService) UpdateUserRole(ctx context.Context, id uuid.UUID, role string) error {
	u, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	u.Role = user.Role(role)
	return s.userRepo.Update(ctx, u)
}

func (s *AuthService) generateTokenPair(ctx context.Context, u *user.User) (*TokenPair, error) {
	// Generate access token
	expiresAt := time.Now().Add(time.Duration(s.cfg.Auth.JWTExpiry) * time.Minute)
	claims := &JWTClaims{
		UserID: u.ID,
		Email:  u.Email,
		Role:   u.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   u.ID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	accessToken, err := token.SignedString([]byte(s.cfg.Auth.JWTSecret))
	if err != nil {
		return nil, fmt.Errorf("failed to sign token: %w", err)
	}

	// Generate refresh token
	refreshToken, err := generateSecureToken(32)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// Store session in database
	session := &user.Session{
		UserID:       u.ID,
		RefreshToken: refreshToken,
		ExpiresAt:    time.Now().Add(time.Duration(s.cfg.Auth.RefreshTokenExpiry) * 24 * time.Hour),
	}
	if err := s.userRepo.CreateSession(ctx, session); err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    expiresAt,
	}, nil
}

func generateSecureToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}
