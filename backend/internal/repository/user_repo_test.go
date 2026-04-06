// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package repository

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/user"
)

func TestUserRepository_Create(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	repo := NewUserRepository(db)
	ctx := context.Background()

	tests := []struct {
		name    string
		user    *user.User
		wantErr bool
	}{
		{
			name: "create valid user",
			user: &user.User{
				ID:         uuid.New(),
				Email:      "test@example.com",
				Name:       "Test User",
				AvatarURL:  "https://example.com/avatar.jpg",
				Provider:   "google",
				ProviderID: "google-123",
				Role:       user.RoleAgent,
			},
			wantErr: false,
		},
		{
			name: "create user with minimum fields",
			user: &user.User{
				ID:         uuid.New(),
				Email:      "minimal@example.com",
				Provider:   "github",
				ProviderID: "github-456",
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := repo.Create(ctx, tt.user)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestUserRepository_GetByID(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	repo := NewUserRepository(db)
	ctx := context.Background()

	// Create a user
	u := &user.User{
		ID:         uuid.New(),
		Email:      "getbyid@example.com",
		Name:       "Get By ID User",
		Provider:   "google",
		ProviderID: "google-getbyid",
		Role:       user.RoleViewer,
	}
	require.NoError(t, repo.Create(ctx, u))

	tests := []struct {
		name    string
		id      uuid.UUID
		wantErr bool
	}{
		{
			name:    "get existing user",
			id:      u.ID,
			wantErr: false,
		},
		{
			name:    "get non-existent user",
			id:      uuid.New(),
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := repo.GetByID(ctx, tt.id)
			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, result)
				assert.Equal(t, u.Email, result.Email)
				assert.Equal(t, u.Name, result.Name)
			}
		})
	}
}

func TestUserRepository_GetByEmail(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	repo := NewUserRepository(db)
	ctx := context.Background()

	// Create a user
	u := &user.User{
		ID:         uuid.New(),
		Email:      "unique@example.com",
		Name:       "Unique Email User",
		Provider:   "google",
		ProviderID: "google-unique",
	}
	require.NoError(t, repo.Create(ctx, u))

	tests := []struct {
		name    string
		email   string
		wantErr bool
	}{
		{
			name:    "get existing user by email",
			email:   "unique@example.com",
			wantErr: false,
		},
		{
			name:    "get non-existent user by email",
			email:   "nonexistent@example.com",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := repo.GetByEmail(ctx, tt.email)
			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, result)
				assert.Equal(t, u.Name, result.Name)
			}
		})
	}
}

func TestUserRepository_GetByProviderID(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	repo := NewUserRepository(db)
	ctx := context.Background()

	// Create a user
	u := &user.User{
		ID:         uuid.New(),
		Email:      "provider@example.com",
		Name:       "Provider User",
		Provider:   "github",
		ProviderID: "github-provider-123",
	}
	require.NoError(t, repo.Create(ctx, u))

	tests := []struct {
		name       string
		provider   string
		providerID string
		wantErr    bool
	}{
		{
			name:       "get existing user by provider",
			provider:   "github",
			providerID: "github-provider-123",
			wantErr:    false,
		},
		{
			name:       "wrong provider",
			provider:   "google",
			providerID: "github-provider-123",
			wantErr:    true,
		},
		{
			name:       "wrong provider ID",
			provider:   "github",
			providerID: "wrong-id",
			wantErr:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := repo.GetByProviderID(ctx, tt.provider, tt.providerID)
			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, result)
				assert.Equal(t, u.Email, result.Email)
			}
		})
	}
}

func TestUserRepository_Update(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	repo := NewUserRepository(db)
	ctx := context.Background()

	// Create a user
	u := &user.User{
		ID:         uuid.New(),
		Email:      "update@example.com",
		Name:       "Original Name",
		Provider:   "google",
		ProviderID: "google-update",
		Role:       user.RoleViewer,
	}
	require.NoError(t, repo.Create(ctx, u))

	// Update the user
	u.Name = "Updated Name"
	u.Role = user.RoleAdmin
	u.AvatarURL = "https://example.com/new-avatar.jpg"

	err := repo.Update(ctx, u)
	assert.NoError(t, err)

	// Verify update
	updated, err := repo.GetByID(ctx, u.ID)
	require.NoError(t, err)
	assert.Equal(t, "Updated Name", updated.Name)
	assert.Equal(t, user.RoleAdmin, updated.Role)
	assert.Equal(t, "https://example.com/new-avatar.jpg", updated.AvatarURL)
}

func TestUserRepository_Session(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	repo := NewUserRepository(db)
	ctx := context.Background()

	// Create a user
	u := &user.User{
		ID:         uuid.New(),
		Email:      "session@example.com",
		Name:       "Session User",
		Provider:   "google",
		ProviderID: "google-session",
	}
	require.NoError(t, repo.Create(ctx, u))

	// Create a session
	session := &user.Session{
		ID:           uuid.New(),
		UserID:       u.ID,
		RefreshToken: "test-refresh-token-123",
		ExpiresAt:    time.Now().Add(24 * time.Hour),
		UserAgent:    "Test Browser",
		IPAddress:    "127.0.0.1",
	}
	err := repo.CreateSession(ctx, session)
	assert.NoError(t, err)

	// Get session by token
	retrieved, err := repo.GetSessionByToken(ctx, "test-refresh-token-123")
	assert.NoError(t, err)
	assert.NotNil(t, retrieved)
	assert.Equal(t, u.ID, retrieved.UserID)

	// Non-existent token
	_, err = repo.GetSessionByToken(ctx, "non-existent-token")
	assert.Error(t, err)

	// Delete session
	err = repo.DeleteSession(ctx, session.ID)
	assert.NoError(t, err)

	// Verify deletion
	_, err = repo.GetSessionByToken(ctx, "test-refresh-token-123")
	assert.Error(t, err)
}

func TestUserRepository_DeleteUserSessions(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	repo := NewUserRepository(db)
	ctx := context.Background()

	// Create a user
	u := &user.User{
		ID:         uuid.New(),
		Email:      "multisession@example.com",
		Name:       "Multi Session User",
		Provider:   "google",
		ProviderID: "google-multisession",
	}
	require.NoError(t, repo.Create(ctx, u))

	// Create multiple sessions
	sessions := []*user.Session{
		{
			ID:           uuid.New(),
			UserID:       u.ID,
			RefreshToken: "token-1",
			ExpiresAt:    time.Now().Add(24 * time.Hour),
		},
		{
			ID:           uuid.New(),
			UserID:       u.ID,
			RefreshToken: "token-2",
			ExpiresAt:    time.Now().Add(24 * time.Hour),
		},
	}
	for _, s := range sessions {
		require.NoError(t, repo.CreateSession(ctx, s))
	}

	// Delete all sessions for user
	err := repo.DeleteUserSessions(ctx, u.ID)
	assert.NoError(t, err)

	// Verify all sessions deleted
	_, err = repo.GetSessionByToken(ctx, "token-1")
	assert.Error(t, err)
	_, err = repo.GetSessionByToken(ctx, "token-2")
	assert.Error(t, err)
}
