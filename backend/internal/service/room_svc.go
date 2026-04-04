// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/property"
	"github.com/timlinux/PropertyForSale/backend/internal/repository"
)

// RoomService handles room business logic
type RoomService struct {
	roomRepo    repository.RoomRepository
	contentRepo repository.ContentRepository
}

// NewRoomService creates a new room service
func NewRoomService(roomRepo repository.RoomRepository, contentRepo repository.ContentRepository) *RoomService {
	return &RoomService{
		roomRepo:    roomRepo,
		contentRepo: contentRepo,
	}
}

// CreateRoomInput contains the data for creating a room
type CreateRoomInput struct {
	DwellingID  uuid.UUID
	Name        string
	Type        string
	Description string
	SizeSqm     float64
	Floor       int
}

// Create creates a new room
func (s *RoomService) Create(ctx context.Context, input CreateRoomInput) (*property.Room, error) {
	r := &property.Room{
		DwellingID:  input.DwellingID,
		Name:        input.Name,
		Type:        input.Type,
		Description: input.Description,
		SizeSqm:     input.SizeSqm,
		Floor:       input.Floor,
	}

	if err := s.roomRepo.Create(ctx, r); err != nil {
		return nil, fmt.Errorf("failed to create room: %w", err)
	}

	return r, nil
}

// GetByID retrieves a room by ID
func (s *RoomService) GetByID(ctx context.Context, id uuid.UUID) (*property.Room, error) {
	return s.roomRepo.GetByID(ctx, id)
}

// ListByDwellingID retrieves rooms for a dwelling
func (s *RoomService) ListByDwellingID(ctx context.Context, dwellingID uuid.UUID) ([]property.Room, error) {
	return s.roomRepo.ListByDwellingID(ctx, dwellingID)
}

// UpdateRoomInput contains the data for updating a room
type UpdateRoomInput struct {
	Name        *string
	Type        *string
	Description *string
	SizeSqm     *float64
	Floor       *int
	SortOrder   *int
}

// Update updates a room
func (s *RoomService) Update(ctx context.Context, id uuid.UUID, input UpdateRoomInput) (*property.Room, error) {
	r, err := s.roomRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("room not found: %w", err)
	}

	if input.Name != nil {
		r.Name = *input.Name
	}
	if input.Type != nil {
		r.Type = *input.Type
	}
	if input.Description != nil {
		r.Description = *input.Description
	}
	if input.SizeSqm != nil {
		r.SizeSqm = *input.SizeSqm
	}
	if input.Floor != nil {
		r.Floor = *input.Floor
	}
	if input.SortOrder != nil {
		r.SortOrder = *input.SortOrder
	}

	r.UpdatedAt = time.Now()

	if err := s.roomRepo.Update(ctx, r); err != nil {
		return nil, fmt.Errorf("failed to update room: %w", err)
	}

	return r, nil
}

// Delete deletes a room
func (s *RoomService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.roomRepo.Delete(ctx, id)
}
