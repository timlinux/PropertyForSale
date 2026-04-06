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

func TestAreaRepository_Create(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	areaRepo := NewAreaRepository(db)
	ctx := context.Background()

	// Create parent property
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Test Property",
		Slug:    "test-property-area",
	}
	require.NoError(t, propRepo.Create(ctx, prop))

	tests := []struct {
		name    string
		area    *property.Area
		wantErr bool
	}{
		{
			name: "create valid area",
			area: &property.Area{
				ID:          uuid.New(),
				PropertyID:  prop.ID,
				Name:        "Garden",
				Type:        "garden",
				Description: "Beautiful garden with flowers",
				SizeSqm:     500,
			},
			wantErr: false,
		},
		{
			name: "create area with minimum fields",
			area: &property.Area{
				ID:         uuid.New(),
				PropertyID: prop.ID,
				Name:       "Parking",
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := areaRepo.Create(ctx, tt.area)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestAreaRepository_GetByID(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	areaRepo := NewAreaRepository(db)
	ctx := context.Background()

	// Create parent property
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Test Property",
		Slug:    "test-property-area-get",
	}
	require.NoError(t, propRepo.Create(ctx, prop))

	// Create an area
	area := &property.Area{
		ID:          uuid.New(),
		PropertyID:  prop.ID,
		Name:        "Pool",
		Type:        "pool",
		Description: "Olympic size pool",
		SizeSqm:     100,
	}
	require.NoError(t, areaRepo.Create(ctx, area))

	tests := []struct {
		name    string
		id      uuid.UUID
		wantErr bool
	}{
		{
			name:    "get existing area",
			id:      area.ID,
			wantErr: false,
		},
		{
			name:    "get non-existent area",
			id:      uuid.New(),
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := areaRepo.GetByID(ctx, tt.id)
			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, result)
				assert.Equal(t, area.Name, result.Name)
				assert.Equal(t, area.Type, result.Type)
			}
		})
	}
}

func TestAreaRepository_ListByPropertyID(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	areaRepo := NewAreaRepository(db)
	ctx := context.Background()

	// Create two properties
	prop1 := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Property One",
		Slug:    "property-one-area",
	}
	require.NoError(t, propRepo.Create(ctx, prop1))

	prop2 := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Property Two",
		Slug:    "property-two-area",
	}
	require.NoError(t, propRepo.Create(ctx, prop2))

	// Create areas for property 1
	areas := []*property.Area{
		{
			ID:         uuid.New(),
			PropertyID: prop1.ID,
			Name:       "Garden",
			Type:       "garden",
			SortOrder:  1,
		},
		{
			ID:         uuid.New(),
			PropertyID: prop1.ID,
			Name:       "Pool",
			Type:       "pool",
			SortOrder:  2,
		},
	}
	for _, a := range areas {
		require.NoError(t, areaRepo.Create(ctx, a))
	}

	// Create area for property 2
	area3 := &property.Area{
		ID:         uuid.New(),
		PropertyID: prop2.ID,
		Name:       "Vineyard",
		Type:       "vineyard",
	}
	require.NoError(t, areaRepo.Create(ctx, area3))

	// Test listing
	results, err := areaRepo.ListByPropertyID(ctx, prop1.ID)
	assert.NoError(t, err)
	assert.Len(t, results, 2)

	results2, err := areaRepo.ListByPropertyID(ctx, prop2.ID)
	assert.NoError(t, err)
	assert.Len(t, results2, 1)

	// Non-existent property
	results3, err := areaRepo.ListByPropertyID(ctx, uuid.New())
	assert.NoError(t, err)
	assert.Len(t, results3, 0)
}

func TestAreaRepository_Update(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	areaRepo := NewAreaRepository(db)
	ctx := context.Background()

	// Create parent property
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Test Property",
		Slug:    "test-property-area-update",
	}
	require.NoError(t, propRepo.Create(ctx, prop))

	// Create an area
	area := &property.Area{
		ID:          uuid.New(),
		PropertyID:  prop.ID,
		Name:        "Original Name",
		Type:        "garden",
		Description: "Original description",
		SizeSqm:     200,
	}
	require.NoError(t, areaRepo.Create(ctx, area))

	// Update the area
	area.Name = "Updated Name"
	area.Description = "Updated description"
	area.SizeSqm = 300
	area.Type = "orchard"

	err := areaRepo.Update(ctx, area)
	assert.NoError(t, err)

	// Verify update
	updated, err := areaRepo.GetByID(ctx, area.ID)
	require.NoError(t, err)
	assert.Equal(t, "Updated Name", updated.Name)
	assert.Equal(t, "Updated description", updated.Description)
	assert.Equal(t, float64(300), updated.SizeSqm)
	assert.Equal(t, "orchard", updated.Type)
}

func TestAreaRepository_Delete(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	areaRepo := NewAreaRepository(db)
	ctx := context.Background()

	// Create parent property
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Test Property",
		Slug:    "test-property-area-delete",
	}
	require.NoError(t, propRepo.Create(ctx, prop))

	// Create an area
	area := &property.Area{
		ID:         uuid.New(),
		PropertyID: prop.ID,
		Name:       "To Be Deleted",
	}
	require.NoError(t, areaRepo.Create(ctx, area))

	// Delete the area
	err := areaRepo.Delete(ctx, area.ID)
	assert.NoError(t, err)

	// Verify deletion
	_, err = areaRepo.GetByID(ctx, area.ID)
	assert.Error(t, err)
}
