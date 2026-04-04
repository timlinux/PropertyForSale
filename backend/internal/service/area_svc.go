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

// AreaService handles area business logic
type AreaService struct {
	areaRepo    repository.AreaRepository
	contentRepo repository.ContentRepository
}

// NewAreaService creates a new area service
func NewAreaService(areaRepo repository.AreaRepository, contentRepo repository.ContentRepository) *AreaService {
	return &AreaService{
		areaRepo:    areaRepo,
		contentRepo: contentRepo,
	}
}

// CreateAreaInput contains the data for creating an area
type CreateAreaInput struct {
	PropertyID  uuid.UUID
	Name        string
	Type        string
	Description string
	SizeSqm     float64
}

// Create creates a new area
func (s *AreaService) Create(ctx context.Context, input CreateAreaInput) (*property.Area, error) {
	a := &property.Area{
		PropertyID:  input.PropertyID,
		Name:        input.Name,
		Type:        input.Type,
		Description: input.Description,
		SizeSqm:     input.SizeSqm,
	}

	if err := s.areaRepo.Create(ctx, a); err != nil {
		return nil, fmt.Errorf("failed to create area: %w", err)
	}

	return a, nil
}

// GetByID retrieves an area by ID
func (s *AreaService) GetByID(ctx context.Context, id uuid.UUID) (*property.Area, error) {
	return s.areaRepo.GetByID(ctx, id)
}

// ListByPropertyID retrieves areas for a property
func (s *AreaService) ListByPropertyID(ctx context.Context, propertyID uuid.UUID) ([]property.Area, error) {
	return s.areaRepo.ListByPropertyID(ctx, propertyID)
}

// UpdateAreaInput contains the data for updating an area
type UpdateAreaInput struct {
	Name        *string
	Type        *string
	Description *string
	SizeSqm     *float64
	SortOrder   *int
}

// Update updates an area
func (s *AreaService) Update(ctx context.Context, id uuid.UUID, input UpdateAreaInput) (*property.Area, error) {
	a, err := s.areaRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("area not found: %w", err)
	}

	if input.Name != nil {
		a.Name = *input.Name
	}
	if input.Type != nil {
		a.Type = *input.Type
	}
	if input.Description != nil {
		a.Description = *input.Description
	}
	if input.SizeSqm != nil {
		a.SizeSqm = *input.SizeSqm
	}
	if input.SortOrder != nil {
		a.SortOrder = *input.SortOrder
	}

	a.UpdatedAt = time.Now()

	if err := s.areaRepo.Update(ctx, a); err != nil {
		return nil, fmt.Errorf("failed to update area: %w", err)
	}

	return a, nil
}

// Delete deletes an area
func (s *AreaService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.areaRepo.Delete(ctx, id)
}
