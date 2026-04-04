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

// DwellingService handles dwelling business logic
type DwellingService struct {
	dwellingRepo repository.DwellingRepository
	contentRepo  repository.ContentRepository
}

// NewDwellingService creates a new dwelling service
func NewDwellingService(dwellingRepo repository.DwellingRepository, contentRepo repository.ContentRepository) *DwellingService {
	return &DwellingService{
		dwellingRepo: dwellingRepo,
		contentRepo:  contentRepo,
	}
}

// CreateDwellingInput contains the data for creating a dwelling
type CreateDwellingInput struct {
	PropertyID  uuid.UUID
	Name        string
	Type        string
	Description string
	FloorCount  int
	YearBuilt   int
	SizeSqm     float64
}

// Create creates a new dwelling
func (s *DwellingService) Create(ctx context.Context, input CreateDwellingInput) (*property.Dwelling, error) {
	d := &property.Dwelling{
		PropertyID:  input.PropertyID,
		Name:        input.Name,
		Type:        input.Type,
		Description: input.Description,
		FloorCount:  input.FloorCount,
		YearBuilt:   input.YearBuilt,
		SizeSqm:     input.SizeSqm,
	}

	if err := s.dwellingRepo.Create(ctx, d); err != nil {
		return nil, fmt.Errorf("failed to create dwelling: %w", err)
	}

	return d, nil
}

// GetByID retrieves a dwelling by ID
func (s *DwellingService) GetByID(ctx context.Context, id uuid.UUID) (*property.Dwelling, error) {
	return s.dwellingRepo.GetByID(ctx, id)
}

// ListByPropertyID retrieves dwellings for a property
func (s *DwellingService) ListByPropertyID(ctx context.Context, propertyID uuid.UUID) ([]property.Dwelling, error) {
	return s.dwellingRepo.ListByPropertyID(ctx, propertyID)
}

// UpdateDwellingInput contains the data for updating a dwelling
type UpdateDwellingInput struct {
	Name        *string
	Type        *string
	Description *string
	FloorCount  *int
	YearBuilt   *int
	SizeSqm     *float64
	SortOrder   *int
}

// Update updates a dwelling
func (s *DwellingService) Update(ctx context.Context, id uuid.UUID, input UpdateDwellingInput) (*property.Dwelling, error) {
	d, err := s.dwellingRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("dwelling not found: %w", err)
	}

	if input.Name != nil {
		d.Name = *input.Name
	}
	if input.Type != nil {
		d.Type = *input.Type
	}
	if input.Description != nil {
		d.Description = *input.Description
	}
	if input.FloorCount != nil {
		d.FloorCount = *input.FloorCount
	}
	if input.YearBuilt != nil {
		d.YearBuilt = *input.YearBuilt
	}
	if input.SizeSqm != nil {
		d.SizeSqm = *input.SizeSqm
	}
	if input.SortOrder != nil {
		d.SortOrder = *input.SortOrder
	}

	d.UpdatedAt = time.Now()

	if err := s.dwellingRepo.Update(ctx, d); err != nil {
		return nil, fmt.Errorf("failed to update dwelling: %w", err)
	}

	return d, nil
}

// Delete deletes a dwelling
func (s *DwellingService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.dwellingRepo.Delete(ctx, id)
}
