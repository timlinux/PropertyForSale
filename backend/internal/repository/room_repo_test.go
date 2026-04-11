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

func TestRoomRepository_Create(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	structureRepo := NewStructureRepository(db)
	roomRepo := NewRoomRepository(db)
	ctx := context.Background()

	// Create parent property and structure
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Test Property",
		Slug:    "test-property-room",
	}
	require.NoError(t, propRepo.Create(ctx, prop))

	structure := &property.Structure{
		ID:         uuid.New(),
		PropertyID: prop.ID,
		Name:       "Main House",
	}
	require.NoError(t, structureRepo.Create(ctx, structure))

	tests := []struct {
		name    string
		room    *property.Room
		wantErr bool
	}{
		{
			name: "create valid room",
			room: &property.Room{
				ID:          uuid.New(),
				StructureID:  structure.ID,
				Name:        "Master Bedroom",
				Type:        "bedroom",
				Description: "Large master bedroom",
				SizeSqm:     25,
				FloorStart:  1,
				FloorEnd:    1,
			},
			wantErr: false,
		},
		{
			name: "create room with minimum fields",
			room: &property.Room{
				ID:         uuid.New(),
				StructureID: structure.ID,
				Name:       "Storage",
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := roomRepo.Create(ctx, tt.room)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestRoomRepository_GetByID(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	structureRepo := NewStructureRepository(db)
	roomRepo := NewRoomRepository(db)
	ctx := context.Background()

	// Create parent property and structure
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Test Property",
		Slug:    "test-property-room-get",
	}
	require.NoError(t, propRepo.Create(ctx, prop))

	structure := &property.Structure{
		ID:         uuid.New(),
		PropertyID: prop.ID,
		Name:       "Main House",
	}
	require.NoError(t, structureRepo.Create(ctx, structure))

	// Create a room
	room := &property.Room{
		ID:          uuid.New(),
		StructureID:  structure.ID,
		Name:        "Kitchen",
		Type:        "kitchen",
		Description: "Modern kitchen",
		SizeSqm:     15,
		FloorStart:  0,
		FloorEnd:    0,
	}
	require.NoError(t, roomRepo.Create(ctx, room))

	tests := []struct {
		name    string
		id      uuid.UUID
		wantErr bool
	}{
		{
			name:    "get existing room",
			id:      room.ID,
			wantErr: false,
		},
		{
			name:    "get non-existent room",
			id:      uuid.New(),
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := roomRepo.GetByID(ctx, tt.id)
			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, result)
				assert.Equal(t, room.Name, result.Name)
				assert.Equal(t, room.Type, result.Type)
			}
		})
	}
}

func TestRoomRepository_ListByStructureID(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	structureRepo := NewStructureRepository(db)
	roomRepo := NewRoomRepository(db)
	ctx := context.Background()

	// Create parent property
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Test Property",
		Slug:    "test-property-room-list",
	}
	require.NoError(t, propRepo.Create(ctx, prop))

	// Create two structures
	structure1 := &property.Structure{
		ID:         uuid.New(),
		PropertyID: prop.ID,
		Name:       "House",
	}
	require.NoError(t, structureRepo.Create(ctx, structure1))

	structure2 := &property.Structure{
		ID:         uuid.New(),
		PropertyID: prop.ID,
		Name:       "Barn",
	}
	require.NoError(t, structureRepo.Create(ctx, structure2))

	// Create rooms for structure 1
	rooms := []*property.Room{
		{
			ID:         uuid.New(),
			StructureID: structure1.ID,
			Name:       "Bedroom 1",
			Type:       "bedroom",
			SortOrder:  1,
		},
		{
			ID:         uuid.New(),
			StructureID: structure1.ID,
			Name:       "Bedroom 2",
			Type:       "bedroom",
			SortOrder:  2,
		},
		{
			ID:         uuid.New(),
			StructureID: structure1.ID,
			Name:       "Bathroom",
			Type:       "bathroom",
			SortOrder:  3,
		},
	}
	for _, r := range rooms {
		require.NoError(t, roomRepo.Create(ctx, r))
	}

	// Create room for structure 2
	room4 := &property.Room{
		ID:         uuid.New(),
		StructureID: structure2.ID,
		Name:       "Storage",
		Type:       "storage",
	}
	require.NoError(t, roomRepo.Create(ctx, room4))

	// Test listing
	results, err := roomRepo.ListByStructureID(ctx, structure1.ID)
	assert.NoError(t, err)
	assert.Len(t, results, 3)

	results2, err := roomRepo.ListByStructureID(ctx, structure2.ID)
	assert.NoError(t, err)
	assert.Len(t, results2, 1)

	// Non-existent structure
	results3, err := roomRepo.ListByStructureID(ctx, uuid.New())
	assert.NoError(t, err)
	assert.Len(t, results3, 0)
}

func TestRoomRepository_Update(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	structureRepo := NewStructureRepository(db)
	roomRepo := NewRoomRepository(db)
	ctx := context.Background()

	// Create parent property and structure
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Test Property",
		Slug:    "test-property-room-update",
	}
	require.NoError(t, propRepo.Create(ctx, prop))

	structure := &property.Structure{
		ID:         uuid.New(),
		PropertyID: prop.ID,
		Name:       "Main House",
	}
	require.NoError(t, structureRepo.Create(ctx, structure))

	// Create a room
	room := &property.Room{
		ID:          uuid.New(),
		StructureID:  structure.ID,
		Name:        "Original Name",
		Type:        "bedroom",
		Description: "Original description",
		SizeSqm:     20,
		FloorStart:  1,
		FloorEnd:    1,
	}
	require.NoError(t, roomRepo.Create(ctx, room))

	// Update the room
	room.Name = "Updated Name"
	room.Description = "Updated description"
	room.SizeSqm = 25
	room.FloorStart = 2
	room.FloorEnd = 2

	err := roomRepo.Update(ctx, room)
	assert.NoError(t, err)

	// Verify update
	updated, err := roomRepo.GetByID(ctx, room.ID)
	require.NoError(t, err)
	assert.Equal(t, "Updated Name", updated.Name)
	assert.Equal(t, "Updated description", updated.Description)
	assert.Equal(t, float64(25), updated.SizeSqm)
	assert.Equal(t, 2, updated.FloorStart)
	assert.Equal(t, 2, updated.FloorEnd)
}

func TestRoomRepository_Delete(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	structureRepo := NewStructureRepository(db)
	roomRepo := NewRoomRepository(db)
	ctx := context.Background()

	// Create parent property and structure
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Test Property",
		Slug:    "test-property-room-delete",
	}
	require.NoError(t, propRepo.Create(ctx, prop))

	structure := &property.Structure{
		ID:         uuid.New(),
		PropertyID: prop.ID,
		Name:       "Main House",
	}
	require.NoError(t, structureRepo.Create(ctx, structure))

	// Create a room
	room := &property.Room{
		ID:         uuid.New(),
		StructureID: structure.ID,
		Name:       "To Be Deleted",
	}
	require.NoError(t, roomRepo.Create(ctx, room))

	// Delete the room
	err := roomRepo.Delete(ctx, room.ID)
	assert.NoError(t, err)

	// Verify deletion
	_, err = roomRepo.GetByID(ctx, room.ID)
	assert.Error(t, err)
}
