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

func TestDwellingRepository_Create(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	dwellingRepo := NewDwellingRepository(db)
	ctx := context.Background()

	// Create parent property
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Test Property",
		Slug:    "test-property",
	}
	require.NoError(t, propRepo.Create(ctx, prop))

	tests := []struct {
		name     string
		dwelling *property.Dwelling
		wantErr  bool
	}{
		{
			name: "create valid dwelling",
			dwelling: &property.Dwelling{
				ID:          uuid.New(),
				PropertyID:  prop.ID,
				Name:        "Main House",
				Type:        "house",
				Description: "A beautiful house",
				FloorCount:  2,
				YearBuilt:   2020,
				SizeSqm:     200,
			},
			wantErr: false,
		},
		{
			name: "create dwelling with minimum fields",
			dwelling: &property.Dwelling{
				ID:         uuid.New(),
				PropertyID: prop.ID,
				Name:       "Barn",
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := dwellingRepo.Create(ctx, tt.dwelling)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestDwellingRepository_GetByID(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	dwellingRepo := NewDwellingRepository(db)
	ctx := context.Background()

	// Create parent property
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Test Property",
		Slug:    "test-property-dwelling",
	}
	require.NoError(t, propRepo.Create(ctx, prop))

	// Create a dwelling
	dwelling := &property.Dwelling{
		ID:          uuid.New(),
		PropertyID:  prop.ID,
		Name:        "Main House",
		Type:        "house",
		Description: "A beautiful house",
		FloorCount:  2,
		YearBuilt:   2020,
		SizeSqm:     200,
	}
	require.NoError(t, dwellingRepo.Create(ctx, dwelling))

	tests := []struct {
		name    string
		id      uuid.UUID
		wantErr bool
	}{
		{
			name:    "get existing dwelling",
			id:      dwelling.ID,
			wantErr: false,
		},
		{
			name:    "get non-existent dwelling",
			id:      uuid.New(),
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := dwellingRepo.GetByID(ctx, tt.id)
			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, result)
				assert.Equal(t, dwelling.Name, result.Name)
				assert.Equal(t, dwelling.Type, result.Type)
			}
		})
	}
}

func TestDwellingRepository_ListByPropertyID(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	dwellingRepo := NewDwellingRepository(db)
	ctx := context.Background()

	// Create two properties
	prop1 := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Property One",
		Slug:    "property-one",
	}
	require.NoError(t, propRepo.Create(ctx, prop1))

	prop2 := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Property Two",
		Slug:    "property-two",
	}
	require.NoError(t, propRepo.Create(ctx, prop2))

	// Create dwellings for property 1
	dwellings := []*property.Dwelling{
		{
			ID:         uuid.New(),
			PropertyID: prop1.ID,
			Name:       "House",
			Type:       "house",
			SortOrder:  1,
		},
		{
			ID:         uuid.New(),
			PropertyID: prop1.ID,
			Name:       "Barn",
			Type:       "barn",
			SortOrder:  2,
		},
	}
	for _, d := range dwellings {
		require.NoError(t, dwellingRepo.Create(ctx, d))
	}

	// Create dwelling for property 2
	dwelling3 := &property.Dwelling{
		ID:         uuid.New(),
		PropertyID: prop2.ID,
		Name:       "Apartment",
		Type:       "apartment",
	}
	require.NoError(t, dwellingRepo.Create(ctx, dwelling3))

	// Test listing
	results, err := dwellingRepo.ListByPropertyID(ctx, prop1.ID)
	assert.NoError(t, err)
	assert.Len(t, results, 2)

	results2, err := dwellingRepo.ListByPropertyID(ctx, prop2.ID)
	assert.NoError(t, err)
	assert.Len(t, results2, 1)

	// Non-existent property
	results3, err := dwellingRepo.ListByPropertyID(ctx, uuid.New())
	assert.NoError(t, err)
	assert.Len(t, results3, 0)
}

func TestDwellingRepository_Update(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	dwellingRepo := NewDwellingRepository(db)
	ctx := context.Background()

	// Create parent property
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Test Property",
		Slug:    "test-property-update",
	}
	require.NoError(t, propRepo.Create(ctx, prop))

	// Create a dwelling
	dwelling := &property.Dwelling{
		ID:          uuid.New(),
		PropertyID:  prop.ID,
		Name:        "Original Name",
		Type:        "house",
		Description: "Original description",
		FloorCount:  1,
		SizeSqm:     100,
	}
	require.NoError(t, dwellingRepo.Create(ctx, dwelling))

	// Update the dwelling
	dwelling.Name = "Updated Name"
	dwelling.Description = "Updated description"
	dwelling.FloorCount = 2
	dwelling.SizeSqm = 150

	err := dwellingRepo.Update(ctx, dwelling)
	assert.NoError(t, err)

	// Verify update
	updated, err := dwellingRepo.GetByID(ctx, dwelling.ID)
	require.NoError(t, err)
	assert.Equal(t, "Updated Name", updated.Name)
	assert.Equal(t, "Updated description", updated.Description)
	assert.Equal(t, 2, updated.FloorCount)
	assert.Equal(t, float64(150), updated.SizeSqm)
}

func TestDwellingRepository_Delete(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	dwellingRepo := NewDwellingRepository(db)
	ctx := context.Background()

	// Create parent property
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Test Property",
		Slug:    "test-property-delete",
	}
	require.NoError(t, propRepo.Create(ctx, prop))

	// Create a dwelling
	dwelling := &property.Dwelling{
		ID:         uuid.New(),
		PropertyID: prop.ID,
		Name:       "To Be Deleted",
	}
	require.NoError(t, dwellingRepo.Create(ctx, dwelling))

	// Delete the dwelling
	err := dwellingRepo.Delete(ctx, dwelling.ID)
	assert.NoError(t, err)

	// Verify deletion
	_, err = dwellingRepo.GetByID(ctx, dwelling.ID)
	assert.Error(t, err)
}
