// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package repository

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/property"
)

func TestPropertyRepository_Create(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	repo := NewPropertyRepository(db)
	ctx := context.Background()

	tests := []struct {
		name     string
		property *property.Property
		wantErr  bool
	}{
		{
			name: "create valid property",
			property: &property.Property{
				ID:          uuid.New(),
				OwnerID:     uuid.New(),
				Name:        "Test Property",
				Slug:        "test-property",
				Description: "A beautiful test property",
				PriceMin:    100000,
				PriceMax:    150000,
				Currency:    "EUR",
				City:        "Lisbon",
				Country:     "Portugal",
				Status:      property.StatusDraft,
			},
			wantErr: false,
		},
		{
			name: "create property with minimum fields",
			property: &property.Property{
				ID:      uuid.New(),
				OwnerID: uuid.New(),
				Name:    "Minimal Property",
				Slug:    "minimal-property",
			},
			wantErr: false,
		},
		{
			name: "fail on duplicate slug",
			property: &property.Property{
				ID:      uuid.New(),
				OwnerID: uuid.New(),
				Name:    "Another Property",
				Slug:    "test-property", // Same slug as first test
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := repo.Create(ctx, tt.property)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestPropertyRepository_GetByID(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	repo := NewPropertyRepository(db)
	ctx := context.Background()

	// Create a property
	prop := &property.Property{
		ID:          uuid.New(),
		OwnerID:     uuid.New(),
		Name:        "Test Property",
		Slug:        "test-property",
		Description: "A beautiful test property",
		PriceMin:    100000,
		PriceMax:    150000,
		Currency:    "EUR",
		City:        "Lisbon",
		Country:     "Portugal",
		Status:      property.StatusPublished,
	}
	require.NoError(t, repo.Create(ctx, prop))

	tests := []struct {
		name    string
		id      uuid.UUID
		wantErr bool
	}{
		{
			name:    "get existing property",
			id:      prop.ID,
			wantErr: false,
		},
		{
			name:    "get non-existent property",
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
				assert.Equal(t, prop.Name, result.Name)
				assert.Equal(t, prop.Slug, result.Slug)
			}
		})
	}
}

func TestPropertyRepository_GetBySlug(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	repo := NewPropertyRepository(db)
	ctx := context.Background()

	// Create a property
	prop := &property.Property{
		ID:          uuid.New(),
		OwnerID:     uuid.New(),
		Name:        "Test Property",
		Slug:        "test-property-slug",
		Description: "A beautiful test property",
		Status:      property.StatusPublished,
	}
	require.NoError(t, repo.Create(ctx, prop))

	tests := []struct {
		name    string
		slug    string
		wantErr bool
	}{
		{
			name:    "get existing property by slug",
			slug:    "test-property-slug",
			wantErr: false,
		},
		{
			name:    "get non-existent property by slug",
			slug:    "non-existent-slug",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := repo.GetBySlug(ctx, tt.slug)
			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, result)
				assert.Equal(t, prop.Name, result.Name)
			}
		})
	}
}

func TestPropertyRepository_List(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	repo := NewPropertyRepository(db)
	ctx := context.Background()

	ownerID := uuid.New()

	// Create multiple properties
	properties := []*property.Property{
		{
			ID:       uuid.New(),
			OwnerID:  ownerID,
			Name:     "Property One",
			Slug:     "property-one",
			PriceMin: 100000,
			PriceMax: 150000,
			City:     "Lisbon",
			Status:   property.StatusPublished,
		},
		{
			ID:       uuid.New(),
			OwnerID:  ownerID,
			Name:     "Property Two",
			Slug:     "property-two",
			PriceMin: 200000,
			PriceMax: 250000,
			City:     "Porto",
			Status:   property.StatusPublished,
		},
		{
			ID:       uuid.New(),
			OwnerID:  uuid.New(), // Different owner
			Name:     "Property Three",
			Slug:     "property-three",
			PriceMin: 300000,
			PriceMax: 350000,
			City:     "Faro",
			Status:   property.StatusDraft,
		},
	}

	for _, p := range properties {
		require.NoError(t, repo.Create(ctx, p))
	}

	tests := []struct {
		name          string
		opts          ListOptions
		expectedCount int
		expectedTotal int64
	}{
		{
			name:          "list all properties",
			opts:          ListOptions{},
			expectedCount: 3,
			expectedTotal: 3,
		},
		{
			name: "list published properties only",
			opts: ListOptions{
				Status: string(property.StatusPublished),
			},
			expectedCount: 2,
			expectedTotal: 2,
		},
		{
			name: "list properties by owner",
			opts: ListOptions{
				OwnerID: &ownerID,
			},
			expectedCount: 2,
			expectedTotal: 2,
		},
		{
			name: "list with pagination",
			opts: ListOptions{
				Limit:  1,
				Offset: 0,
			},
			expectedCount: 1,
			expectedTotal: 3,
		},
		{
			name: "list with price filter",
			opts: ListOptions{
				MinPrice: func() *float64 { v := 150000.0; return &v }(),
			},
			expectedCount: 2,
			expectedTotal: 2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			results, total, err := repo.List(ctx, tt.opts)
			assert.NoError(t, err)
			assert.Len(t, results, tt.expectedCount)
			assert.Equal(t, tt.expectedTotal, total)
		})
	}
}

func TestPropertyRepository_Update(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	repo := NewPropertyRepository(db)
	ctx := context.Background()

	// Create a property
	prop := &property.Property{
		ID:          uuid.New(),
		OwnerID:     uuid.New(),
		Name:        "Original Name",
		Slug:        "original-slug",
		Description: "Original description",
		PriceMin:    100000,
		Status:      property.StatusDraft,
	}
	require.NoError(t, repo.Create(ctx, prop))

	// Update the property
	prop.Name = "Updated Name"
	prop.Description = "Updated description"
	prop.PriceMin = 120000
	prop.Status = property.StatusPublished

	err := repo.Update(ctx, prop)
	assert.NoError(t, err)

	// Verify update
	updated, err := repo.GetByID(ctx, prop.ID)
	require.NoError(t, err)
	assert.Equal(t, "Updated Name", updated.Name)
	assert.Equal(t, "Updated description", updated.Description)
	assert.Equal(t, float64(120000), updated.PriceMin)
	assert.Equal(t, property.StatusPublished, updated.Status)
}

func TestPropertyRepository_Delete(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	repo := NewPropertyRepository(db)
	ctx := context.Background()

	// Create a property
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "To Be Deleted",
		Slug:    "to-be-deleted",
	}
	require.NoError(t, repo.Create(ctx, prop))

	// Delete the property
	err := repo.Delete(ctx, prop.ID)
	assert.NoError(t, err)

	// Verify deletion
	_, err = repo.GetByID(ctx, prop.ID)
	assert.Error(t, err)

	// Delete non-existent property should not error (soft delete behavior)
	err = repo.Delete(ctx, uuid.New())
	assert.NoError(t, err)
}

func TestPropertyRepository_WithDwellingsAndAreas(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	dwellingRepo := NewDwellingRepository(db)
	areaRepo := NewAreaRepository(db)
	ctx := context.Background()

	// Create a property
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Property with Relations",
		Slug:    "property-with-relations",
		Status:  property.StatusPublished,
	}
	require.NoError(t, propRepo.Create(ctx, prop))

	// Create dwellings
	dwelling := &property.Dwelling{
		ID:          uuid.New(),
		PropertyID:  prop.ID,
		Name:        "Main House",
		Type:        "house",
		Description: "The main house",
		FloorCount:  2,
		SizeSqm:     250,
	}
	require.NoError(t, dwellingRepo.Create(ctx, dwelling))

	// Create areas
	area := &property.Area{
		ID:          uuid.New(),
		PropertyID:  prop.ID,
		Name:        "Garden",
		Type:        "garden",
		Description: "Beautiful garden",
		SizeSqm:     500,
	}
	require.NoError(t, areaRepo.Create(ctx, area))

	// Get property with relations
	result, err := propRepo.GetByID(ctx, prop.ID)
	require.NoError(t, err)
	assert.Len(t, result.Dwellings, 1)
	assert.Equal(t, "Main House", result.Dwellings[0].Name)
	assert.Len(t, result.Areas, 1)
	assert.Equal(t, "Garden", result.Areas[0].Name)
}
