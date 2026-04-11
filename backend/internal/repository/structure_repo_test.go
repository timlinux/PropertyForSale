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

func TestStructureRepository_Create(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	structureRepo := NewStructureRepository(db)
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
		name      string
		structure *property.Structure
		wantErr   bool
	}{
		{
			name: "create valid structure",
			structure: &property.Structure{
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
			name: "create structure with minimum fields",
			structure: &property.Structure{
				ID:         uuid.New(),
				PropertyID: prop.ID,
				Name:       "Barn",
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := structureRepo.Create(ctx, tt.structure)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestStructureRepository_GetByID(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	structureRepo := NewStructureRepository(db)
	ctx := context.Background()

	// Create parent property
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Test Property",
		Slug:    "test-property-structure",
	}
	require.NoError(t, propRepo.Create(ctx, prop))

	// Create a structure
	structure := &property.Structure{
		ID:          uuid.New(),
		PropertyID:  prop.ID,
		Name:        "Main House",
		Type:        "house",
		Description: "A beautiful house",
		FloorCount:  2,
		YearBuilt:   2020,
		SizeSqm:     200,
	}
	require.NoError(t, structureRepo.Create(ctx, structure))

	tests := []struct {
		name    string
		id      uuid.UUID
		wantErr bool
	}{
		{
			name:    "get existing structure",
			id:      structure.ID,
			wantErr: false,
		},
		{
			name:    "get non-existent structure",
			id:      uuid.New(),
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := structureRepo.GetByID(ctx, tt.id)
			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, result)
				assert.Equal(t, structure.Name, result.Name)
				assert.Equal(t, structure.Type, result.Type)
			}
		})
	}
}

func TestStructureRepository_ListByPropertyID(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	structureRepo := NewStructureRepository(db)
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

	// Create structures for property 1
	structures := []*property.Structure{
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
	for _, d := range structures {
		require.NoError(t, structureRepo.Create(ctx, d))
	}

	// Create structure for property 2
	structure3 := &property.Structure{
		ID:         uuid.New(),
		PropertyID: prop2.ID,
		Name:       "Apartment",
		Type:       "apartment",
	}
	require.NoError(t, structureRepo.Create(ctx, structure3))

	// Test listing
	results, err := structureRepo.ListByPropertyID(ctx, prop1.ID)
	assert.NoError(t, err)
	assert.Len(t, results, 2)

	results2, err := structureRepo.ListByPropertyID(ctx, prop2.ID)
	assert.NoError(t, err)
	assert.Len(t, results2, 1)

	// Non-existent property
	results3, err := structureRepo.ListByPropertyID(ctx, uuid.New())
	assert.NoError(t, err)
	assert.Len(t, results3, 0)
}

func TestStructureRepository_Update(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	structureRepo := NewStructureRepository(db)
	ctx := context.Background()

	// Create parent property
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Test Property",
		Slug:    "test-property-update",
	}
	require.NoError(t, propRepo.Create(ctx, prop))

	// Create a structure
	structure := &property.Structure{
		ID:          uuid.New(),
		PropertyID:  prop.ID,
		Name:        "Original Name",
		Type:        "house",
		Description: "Original description",
		FloorCount:  1,
		SizeSqm:     100,
	}
	require.NoError(t, structureRepo.Create(ctx, structure))

	// Update the structure
	structure.Name = "Updated Name"
	structure.Description = "Updated description"
	structure.FloorCount = 2
	structure.SizeSqm = 150

	err := structureRepo.Update(ctx, structure)
	assert.NoError(t, err)

	// Verify update
	updated, err := structureRepo.GetByID(ctx, structure.ID)
	require.NoError(t, err)
	assert.Equal(t, "Updated Name", updated.Name)
	assert.Equal(t, "Updated description", updated.Description)
	assert.Equal(t, 2, updated.FloorCount)
	assert.Equal(t, float64(150), updated.SizeSqm)
}

func TestStructureRepository_Delete(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	structureRepo := NewStructureRepository(db)
	ctx := context.Background()

	// Create parent property
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Test Property",
		Slug:    "test-property-delete",
	}
	require.NoError(t, propRepo.Create(ctx, prop))

	// Create a structure
	structure := &property.Structure{
		ID:         uuid.New(),
		PropertyID: prop.ID,
		Name:       "To Be Deleted",
	}
	require.NoError(t, structureRepo.Create(ctx, structure))

	// Delete the structure
	err := structureRepo.Delete(ctx, structure.ID)
	assert.NoError(t, err)

	// Verify deletion
	_, err = structureRepo.GetByID(ctx, structure.ID)
	assert.Error(t, err)
}
