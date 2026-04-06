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
	dwellingRepo := NewDwellingRepository(db)
	roomRepo := NewRoomRepository(db)
	ctx := context.Background()

	// Create parent property and dwelling
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Test Property",
		Slug:    "test-property-room",
	}
	require.NoError(t, propRepo.Create(ctx, prop))

	dwelling := &property.Dwelling{
		ID:         uuid.New(),
		PropertyID: prop.ID,
		Name:       "Main House",
	}
	require.NoError(t, dwellingRepo.Create(ctx, dwelling))

	tests := []struct {
		name    string
		room    *property.Room
		wantErr bool
	}{
		{
			name: "create valid room",
			room: &property.Room{
				ID:          uuid.New(),
				DwellingID:  dwelling.ID,
				Name:        "Master Bedroom",
				Type:        "bedroom",
				Description: "Large master bedroom",
				SizeSqm:     25,
				Floor:       1,
			},
			wantErr: false,
		},
		{
			name: "create room with minimum fields",
			room: &property.Room{
				ID:         uuid.New(),
				DwellingID: dwelling.ID,
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
	dwellingRepo := NewDwellingRepository(db)
	roomRepo := NewRoomRepository(db)
	ctx := context.Background()

	// Create parent property and dwelling
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Test Property",
		Slug:    "test-property-room-get",
	}
	require.NoError(t, propRepo.Create(ctx, prop))

	dwelling := &property.Dwelling{
		ID:         uuid.New(),
		PropertyID: prop.ID,
		Name:       "Main House",
	}
	require.NoError(t, dwellingRepo.Create(ctx, dwelling))

	// Create a room
	room := &property.Room{
		ID:          uuid.New(),
		DwellingID:  dwelling.ID,
		Name:        "Kitchen",
		Type:        "kitchen",
		Description: "Modern kitchen",
		SizeSqm:     15,
		Floor:       0,
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

func TestRoomRepository_ListByDwellingID(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	dwellingRepo := NewDwellingRepository(db)
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

	// Create two dwellings
	dwelling1 := &property.Dwelling{
		ID:         uuid.New(),
		PropertyID: prop.ID,
		Name:       "House",
	}
	require.NoError(t, dwellingRepo.Create(ctx, dwelling1))

	dwelling2 := &property.Dwelling{
		ID:         uuid.New(),
		PropertyID: prop.ID,
		Name:       "Barn",
	}
	require.NoError(t, dwellingRepo.Create(ctx, dwelling2))

	// Create rooms for dwelling 1
	rooms := []*property.Room{
		{
			ID:         uuid.New(),
			DwellingID: dwelling1.ID,
			Name:       "Bedroom 1",
			Type:       "bedroom",
			SortOrder:  1,
		},
		{
			ID:         uuid.New(),
			DwellingID: dwelling1.ID,
			Name:       "Bedroom 2",
			Type:       "bedroom",
			SortOrder:  2,
		},
		{
			ID:         uuid.New(),
			DwellingID: dwelling1.ID,
			Name:       "Bathroom",
			Type:       "bathroom",
			SortOrder:  3,
		},
	}
	for _, r := range rooms {
		require.NoError(t, roomRepo.Create(ctx, r))
	}

	// Create room for dwelling 2
	room4 := &property.Room{
		ID:         uuid.New(),
		DwellingID: dwelling2.ID,
		Name:       "Storage",
		Type:       "storage",
	}
	require.NoError(t, roomRepo.Create(ctx, room4))

	// Test listing
	results, err := roomRepo.ListByDwellingID(ctx, dwelling1.ID)
	assert.NoError(t, err)
	assert.Len(t, results, 3)

	results2, err := roomRepo.ListByDwellingID(ctx, dwelling2.ID)
	assert.NoError(t, err)
	assert.Len(t, results2, 1)

	// Non-existent dwelling
	results3, err := roomRepo.ListByDwellingID(ctx, uuid.New())
	assert.NoError(t, err)
	assert.Len(t, results3, 0)
}

func TestRoomRepository_Update(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	dwellingRepo := NewDwellingRepository(db)
	roomRepo := NewRoomRepository(db)
	ctx := context.Background()

	// Create parent property and dwelling
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Test Property",
		Slug:    "test-property-room-update",
	}
	require.NoError(t, propRepo.Create(ctx, prop))

	dwelling := &property.Dwelling{
		ID:         uuid.New(),
		PropertyID: prop.ID,
		Name:       "Main House",
	}
	require.NoError(t, dwellingRepo.Create(ctx, dwelling))

	// Create a room
	room := &property.Room{
		ID:          uuid.New(),
		DwellingID:  dwelling.ID,
		Name:        "Original Name",
		Type:        "bedroom",
		Description: "Original description",
		SizeSqm:     20,
		Floor:       1,
	}
	require.NoError(t, roomRepo.Create(ctx, room))

	// Update the room
	room.Name = "Updated Name"
	room.Description = "Updated description"
	room.SizeSqm = 25
	room.Floor = 2

	err := roomRepo.Update(ctx, room)
	assert.NoError(t, err)

	// Verify update
	updated, err := roomRepo.GetByID(ctx, room.ID)
	require.NoError(t, err)
	assert.Equal(t, "Updated Name", updated.Name)
	assert.Equal(t, "Updated description", updated.Description)
	assert.Equal(t, float64(25), updated.SizeSqm)
	assert.Equal(t, 2, updated.Floor)
}

func TestRoomRepository_Delete(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	dwellingRepo := NewDwellingRepository(db)
	roomRepo := NewRoomRepository(db)
	ctx := context.Background()

	// Create parent property and dwelling
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Test Property",
		Slug:    "test-property-room-delete",
	}
	require.NoError(t, propRepo.Create(ctx, prop))

	dwelling := &property.Dwelling{
		ID:         uuid.New(),
		PropertyID: prop.ID,
		Name:       "Main House",
	}
	require.NoError(t, dwellingRepo.Create(ctx, dwelling))

	// Create a room
	room := &property.Room{
		ID:         uuid.New(),
		DwellingID: dwelling.ID,
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
