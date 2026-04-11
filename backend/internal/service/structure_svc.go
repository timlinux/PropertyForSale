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

// StructureService handles structure business logic
type StructureService struct {
	structureRepo repository.StructureRepository
	contentRepo   repository.ContentRepository
}

// NewStructureService creates a new structure service
func NewStructureService(structureRepo repository.StructureRepository, contentRepo repository.ContentRepository) *StructureService {
	return &StructureService{
		structureRepo: structureRepo,
		contentRepo:   contentRepo,
	}
}

// CreateStructureInput contains the data for creating a structure
type CreateStructureInput struct {
	PropertyID  uuid.UUID
	Name        string
	Type        string
	Description string
	FloorCount  int
	YearBuilt   int
	SizeSqm     float64
}

// Create creates a new structure
func (s *StructureService) Create(ctx context.Context, input CreateStructureInput) (*property.Structure, error) {
	st := &property.Structure{
		ID:          uuid.New(), // Generate UUID for SQLite compatibility
		PropertyID:  input.PropertyID,
		Name:        input.Name,
		Type:        input.Type,
		Description: input.Description,
		FloorCount:  input.FloorCount,
		YearBuilt:   input.YearBuilt,
		SizeSqm:     input.SizeSqm,
	}

	if err := s.structureRepo.Create(ctx, st); err != nil {
		return nil, fmt.Errorf("failed to create structure: %w", err)
	}

	return st, nil
}

// GetByID retrieves a structure by ID
func (s *StructureService) GetByID(ctx context.Context, id uuid.UUID) (*property.Structure, error) {
	return s.structureRepo.GetByID(ctx, id)
}

// ListByPropertyID retrieves structures for a property
func (s *StructureService) ListByPropertyID(ctx context.Context, propertyID uuid.UUID) ([]property.Structure, error) {
	return s.structureRepo.ListByPropertyID(ctx, propertyID)
}

// UpdateStructureInput contains the data for updating a structure
type UpdateStructureInput struct {
	Name        *string
	Type        *string
	Description *string
	FloorCount  *int
	YearBuilt   *int
	SizeSqm     *float64
	SortOrder   *int
}

// Update updates a structure
func (s *StructureService) Update(ctx context.Context, id uuid.UUID, input UpdateStructureInput) (*property.Structure, error) {
	st, err := s.structureRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("structure not found: %w", err)
	}

	if input.Name != nil {
		st.Name = *input.Name
	}
	if input.Type != nil {
		st.Type = *input.Type
	}
	if input.Description != nil {
		st.Description = *input.Description
	}
	if input.FloorCount != nil {
		st.FloorCount = *input.FloorCount
	}
	if input.YearBuilt != nil {
		st.YearBuilt = *input.YearBuilt
	}
	if input.SizeSqm != nil {
		st.SizeSqm = *input.SizeSqm
	}
	if input.SortOrder != nil {
		st.SortOrder = *input.SortOrder
	}

	st.UpdatedAt = time.Now()

	if err := s.structureRepo.Update(ctx, st); err != nil {
		return nil, fmt.Errorf("failed to update structure: %w", err)
	}

	return st, nil
}

// Delete deletes a structure
func (s *StructureService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.structureRepo.Delete(ctx, id)
}
