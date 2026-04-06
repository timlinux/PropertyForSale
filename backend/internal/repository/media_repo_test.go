// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package repository

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/media"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/property"
)

func TestMediaRepository_Create(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	mediaRepo := NewMediaRepository(db)
	ctx := context.Background()

	// Create parent property
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Test Property",
		Slug:    "test-property-media",
	}
	require.NoError(t, propRepo.Create(ctx, prop))

	tests := []struct {
		name    string
		media   *media.Media
		wantErr bool
	}{
		{
			name: "create image media",
			media: &media.Media{
				ID:         uuid.New(),
				EntityType: media.EntityTypeProperty,
				EntityID:   prop.ID,
				Type:       media.MediaTypeImage,
				URL:        "/uploads/images/test.jpg",
				FileName:   "test.jpg",
				MimeType:   "image/jpeg",
				FileSize:   1024000,
				Width:      1920,
				Height:     1080,
			},
			wantErr: false,
		},
		{
			name: "create video media",
			media: &media.Media{
				ID:         uuid.New(),
				EntityType: media.EntityTypeProperty,
				EntityID:   prop.ID,
				Type:       media.MediaTypeVideo,
				URL:        "/uploads/videos/test.mp4",
				FileName:   "test.mp4",
				MimeType:   "video/mp4",
				FileSize:   10240000,
				Duration:   120,
			},
			wantErr: false,
		},
		{
			name: "create audio media",
			media: &media.Media{
				ID:         uuid.New(),
				EntityType: media.EntityTypeProperty,
				EntityID:   prop.ID,
				Type:       media.MediaTypeAudio,
				URL:        "/uploads/audio/ambient.mp3",
				FileName:   "ambient.mp3",
				MimeType:   "audio/mpeg",
				Autoplay:   true,
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := mediaRepo.Create(ctx, tt.media)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestMediaRepository_GetByID(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	mediaRepo := NewMediaRepository(db)
	ctx := context.Background()

	// Create parent property
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Test Property",
		Slug:    "test-property-media-get",
	}
	require.NoError(t, propRepo.Create(ctx, prop))

	// Create a media
	m := &media.Media{
		ID:         uuid.New(),
		EntityType: media.EntityTypeProperty,
		EntityID:   prop.ID,
		Type:       media.MediaTypeImage,
		URL:        "/uploads/images/hero.jpg",
		FileName:   "hero.jpg",
		MimeType:   "image/jpeg",
		FileSize:   2048000,
	}
	require.NoError(t, mediaRepo.Create(ctx, m))

	tests := []struct {
		name    string
		id      uuid.UUID
		wantErr bool
	}{
		{
			name:    "get existing media",
			id:      m.ID,
			wantErr: false,
		},
		{
			name:    "get non-existent media",
			id:      uuid.New(),
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := mediaRepo.GetByID(ctx, tt.id)
			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, result)
				assert.Equal(t, m.FileName, result.FileName)
				assert.Equal(t, m.Type, result.Type)
			}
		})
	}
}

func TestMediaRepository_ListByEntity(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	dwellingRepo := NewDwellingRepository(db)
	mediaRepo := NewMediaRepository(db)
	ctx := context.Background()

	// Create property and dwelling
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Test Property",
		Slug:    "test-property-media-list",
	}
	require.NoError(t, propRepo.Create(ctx, prop))

	dwelling := &property.Dwelling{
		ID:         uuid.New(),
		PropertyID: prop.ID,
		Name:       "Main House",
	}
	require.NoError(t, dwellingRepo.Create(ctx, dwelling))

	// Create media for property
	propertyMedia := []*media.Media{
		{
			ID:         uuid.New(),
			EntityType: media.EntityTypeProperty,
			EntityID:   prop.ID,
			Type:       media.MediaTypeImage,
			URL:        "/uploads/property1.jpg",
			FileName:   "property1.jpg",
			SortOrder:  1,
		},
		{
			ID:         uuid.New(),
			EntityType: media.EntityTypeProperty,
			EntityID:   prop.ID,
			Type:       media.MediaTypeImage,
			URL:        "/uploads/property2.jpg",
			FileName:   "property2.jpg",
			SortOrder:  2,
		},
	}
	for _, m := range propertyMedia {
		require.NoError(t, mediaRepo.Create(ctx, m))
	}

	// Create media for dwelling
	dwellingMedia := &media.Media{
		ID:         uuid.New(),
		EntityType: media.EntityTypeDwelling,
		EntityID:   dwelling.ID,
		Type:       media.MediaTypeImage,
		URL:        "/uploads/dwelling1.jpg",
		FileName:   "dwelling1.jpg",
	}
	require.NoError(t, mediaRepo.Create(ctx, dwellingMedia))

	// Test listing by property
	results, err := mediaRepo.ListByEntity(ctx, media.EntityTypeProperty, prop.ID)
	assert.NoError(t, err)
	assert.Len(t, results, 2)

	// Test listing by dwelling
	results2, err := mediaRepo.ListByEntity(ctx, media.EntityTypeDwelling, dwelling.ID)
	assert.NoError(t, err)
	assert.Len(t, results2, 1)

	// Non-existent entity
	results3, err := mediaRepo.ListByEntity(ctx, media.EntityTypeProperty, uuid.New())
	assert.NoError(t, err)
	assert.Len(t, results3, 0)
}

func TestMediaRepository_Update(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	mediaRepo := NewMediaRepository(db)
	ctx := context.Background()

	// Create parent property
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Test Property",
		Slug:    "test-property-media-update",
	}
	require.NoError(t, propRepo.Create(ctx, prop))

	// Create a media
	m := &media.Media{
		ID:         uuid.New(),
		EntityType: media.EntityTypeProperty,
		EntityID:   prop.ID,
		Type:       media.MediaTypeImage,
		URL:        "/uploads/original.jpg",
		FileName:   "original.jpg",
		MimeType:   "image/jpeg",
		SortOrder:  0,
	}
	require.NoError(t, mediaRepo.Create(ctx, m))

	// Update the media
	m.SortOrder = 5
	m.ThumbnailURL = "/uploads/thumb_original.jpg"

	err := mediaRepo.Update(ctx, m)
	assert.NoError(t, err)

	// Verify update
	updated, err := mediaRepo.GetByID(ctx, m.ID)
	require.NoError(t, err)
	assert.Equal(t, 5, updated.SortOrder)
	assert.Equal(t, "/uploads/thumb_original.jpg", updated.ThumbnailURL)
}

func TestMediaRepository_Delete(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	propRepo := NewPropertyRepository(db)
	mediaRepo := NewMediaRepository(db)
	ctx := context.Background()

	// Create parent property
	prop := &property.Property{
		ID:      uuid.New(),
		OwnerID: uuid.New(),
		Name:    "Test Property",
		Slug:    "test-property-media-delete",
	}
	require.NoError(t, propRepo.Create(ctx, prop))

	// Create a media
	m := &media.Media{
		ID:         uuid.New(),
		EntityType: media.EntityTypeProperty,
		EntityID:   prop.ID,
		Type:       media.MediaTypeImage,
		URL:        "/uploads/todelete.jpg",
		FileName:   "todelete.jpg",
	}
	require.NoError(t, mediaRepo.Create(ctx, m))

	// Delete the media
	err := mediaRepo.Delete(ctx, m.ID)
	assert.NoError(t, err)

	// Verify deletion
	_, err = mediaRepo.GetByID(ctx, m.ID)
	assert.Error(t, err)
}
