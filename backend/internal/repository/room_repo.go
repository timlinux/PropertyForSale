// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/property"
	"gorm.io/gorm"
)

type roomRepository struct {
	db *gorm.DB
}

// NewRoomRepository creates a new room repository
func NewRoomRepository(db *gorm.DB) RoomRepository {
	return &roomRepository{db: db}
}

func (r *roomRepository) Create(ctx context.Context, room *property.Room) error {
	return r.db.WithContext(ctx).Create(room).Error
}

func (r *roomRepository) GetByID(ctx context.Context, id uuid.UUID) (*property.Room, error) {
	var room property.Room
	err := r.db.WithContext(ctx).First(&room, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &room, nil
}

func (r *roomRepository) ListByStructureID(ctx context.Context, structureID uuid.UUID) ([]property.Room, error) {
	var rooms []property.Room
	err := r.db.WithContext(ctx).
		Where("structure_id = ?", structureID).
		Order("sort_order ASC, created_at ASC").
		Find(&rooms).Error
	return rooms, err
}

func (r *roomRepository) Update(ctx context.Context, room *property.Room) error {
	return r.db.WithContext(ctx).Save(room).Error
}

func (r *roomRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&property.Room{}, "id = ?", id).Error
}
