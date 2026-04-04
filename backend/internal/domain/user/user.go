// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package user

import (
	"time"

	"github.com/google/uuid"
)

// Role represents a user's role in the system
type Role string

const (
	RoleViewer Role = "viewer"
	RoleAgent  Role = "agent"
	RoleAdmin  Role = "admin"
)

// User represents an authenticated user
type User struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Email        string    `json:"email" gorm:"uniqueIndex;not null"`
	Name         string    `json:"name"`
	AvatarURL    string    `json:"avatar_url"`
	Role         Role      `json:"role" gorm:"default:'viewer'"`
	Provider     string    `json:"provider"`      // google, apple, microsoft, github, facebook
	ProviderID   string    `json:"provider_id"`   // ID from the OAuth provider
	RefreshToken string    `json:"-"`             // Encrypted refresh token
	LastLoginAt  time.Time `json:"last_login_at"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// TableName returns the table name for GORM
func (User) TableName() string {
	return "users"
}

// Session represents an active user session
type Session struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID       uuid.UUID `json:"user_id" gorm:"type:uuid;not null;index"`
	RefreshToken string    `json:"-" gorm:"not null"`
	UserAgent    string    `json:"user_agent"`
	IPAddress    string    `json:"ip_address"`
	ExpiresAt    time.Time `json:"expires_at"`
	CreatedAt    time.Time `json:"created_at"`
}

// TableName returns the table name for GORM
func (Session) TableName() string {
	return "sessions"
}
