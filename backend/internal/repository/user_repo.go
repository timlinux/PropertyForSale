// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/user"
	"gorm.io/gorm"
)

type userRepository struct {
	db *gorm.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, u *user.User) error {
	// Generate UUID if not set (SQLite doesn't support gen_random_uuid())
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return r.db.WithContext(ctx).Create(u).Error
}

func (r *userRepository) GetByID(ctx context.Context, id uuid.UUID) (*user.User, error) {
	var u user.User
	err := r.db.WithContext(ctx).First(&u, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*user.User, error) {
	var u user.User
	err := r.db.WithContext(ctx).First(&u, "email = ?", email).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *userRepository) GetByProviderID(ctx context.Context, provider, providerID string) (*user.User, error) {
	var u user.User
	err := r.db.WithContext(ctx).
		Where("provider = ? AND provider_id = ?", provider, providerID).
		First(&u).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *userRepository) Update(ctx context.Context, u *user.User) error {
	return r.db.WithContext(ctx).Save(u).Error
}

// Session management

func (r *userRepository) CreateSession(ctx context.Context, s *user.Session) error {
	// Generate UUID if not set (SQLite doesn't support gen_random_uuid())
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return r.db.WithContext(ctx).Create(s).Error
}

func (r *userRepository) GetSessionByToken(ctx context.Context, token string) (*user.Session, error) {
	var s user.Session
	err := r.db.WithContext(ctx).First(&s, "refresh_token = ?", token).Error
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *userRepository) DeleteSession(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&user.Session{}, "id = ?", id).Error
}

func (r *userRepository) DeleteUserSessions(ctx context.Context, userID uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&user.Session{}, "user_id = ?", userID).Error
}
