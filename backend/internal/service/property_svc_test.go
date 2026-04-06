// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package service

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/content"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/property"
	"github.com/timlinux/PropertyForSale/backend/internal/repository"
)

// MockPropertyRepository is a mock implementation of PropertyRepository
type MockPropertyRepository struct {
	mock.Mock
}

func (m *MockPropertyRepository) Create(ctx context.Context, p *property.Property) error {
	args := m.Called(ctx, p)
	return args.Error(0)
}

func (m *MockPropertyRepository) GetByID(ctx context.Context, id uuid.UUID) (*property.Property, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*property.Property), args.Error(1)
}

func (m *MockPropertyRepository) GetBySlug(ctx context.Context, slug string) (*property.Property, error) {
	args := m.Called(ctx, slug)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*property.Property), args.Error(1)
}

func (m *MockPropertyRepository) List(ctx context.Context, opts repository.ListOptions) ([]property.Property, int64, error) {
	args := m.Called(ctx, opts)
	return args.Get(0).([]property.Property), args.Get(1).(int64), args.Error(2)
}

func (m *MockPropertyRepository) Update(ctx context.Context, p *property.Property) error {
	args := m.Called(ctx, p)
	return args.Error(0)
}

func (m *MockPropertyRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

// MockContentRepository is a mock implementation of ContentRepository
type MockContentRepository struct {
	mock.Mock
}

func (m *MockContentRepository) CreateVersion(ctx context.Context, v *content.ContentVersion) error {
	args := m.Called(ctx, v)
	return args.Error(0)
}

func (m *MockContentRepository) GetVersion(ctx context.Context, entityType string, entityID uuid.UUID, version int) (*content.ContentVersion, error) {
	args := m.Called(ctx, entityType, entityID, version)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*content.ContentVersion), args.Error(1)
}

func (m *MockContentRepository) GetLatestVersion(ctx context.Context, entityType string, entityID uuid.UUID) (*content.ContentVersion, error) {
	args := m.Called(ctx, entityType, entityID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*content.ContentVersion), args.Error(1)
}

func (m *MockContentRepository) ListVersions(ctx context.Context, entityType string, entityID uuid.UUID) ([]content.ContentVersion, error) {
	args := m.Called(ctx, entityType, entityID)
	return args.Get(0).([]content.ContentVersion), args.Error(1)
}

func TestPropertyService_Create(t *testing.T) {
	ctx := context.Background()
	mockPropRepo := new(MockPropertyRepository)
	mockContentRepo := new(MockContentRepository)

	svc := NewPropertyService(mockPropRepo, mockContentRepo)

	t.Run("create property successfully", func(t *testing.T) {
		input := CreatePropertyInput{
			OwnerID:     uuid.New(),
			Name:        "Beautiful Villa",
			Description: "A stunning villa with sea views",
			PriceMin:    500000,
			PriceMax:    600000,
			Currency:    "EUR",
			City:        "Lisbon",
			Country:     "Portugal",
		}

		// Setup mocks
		mockPropRepo.On("GetBySlug", ctx, "beautiful-villa").Return(nil, nil).Once()
		mockPropRepo.On("Create", ctx, mock.AnythingOfType("*property.Property")).Return(nil).Once()
		mockContentRepo.On("GetLatestVersion", ctx, "property", mock.AnythingOfType("uuid.UUID")).Return(nil, nil).Once()
		mockContentRepo.On("CreateVersion", ctx, mock.AnythingOfType("*content.ContentVersion")).Return(nil).Once()

		result, err := svc.Create(ctx, input)

		assert.NoError(t, err)
		require.NotNil(t, result)
		assert.Equal(t, "Beautiful Villa", result.Name)
		assert.Equal(t, "beautiful-villa", result.Slug)
		assert.Equal(t, property.StatusDraft, result.Status)
	})

	t.Run("create property with duplicate slug", func(t *testing.T) {
		input := CreatePropertyInput{
			OwnerID: uuid.New(),
			Name:    "Test Property",
		}

		existingProp := &property.Property{
			ID:   uuid.New(),
			Slug: "test-property",
		}

		// Setup mocks
		mockPropRepo.On("GetBySlug", ctx, "test-property").Return(existingProp, nil).Once()
		mockPropRepo.On("Create", ctx, mock.AnythingOfType("*property.Property")).Return(nil).Once()
		mockContentRepo.On("GetLatestVersion", ctx, "property", mock.AnythingOfType("uuid.UUID")).Return(nil, nil).Once()
		mockContentRepo.On("CreateVersion", ctx, mock.AnythingOfType("*content.ContentVersion")).Return(nil).Once()

		result, err := svc.Create(ctx, input)

		assert.NoError(t, err)
		require.NotNil(t, result)
		assert.Contains(t, result.Slug, "test-property-")
	})
}

func TestPropertyService_GetBySlug(t *testing.T) {
	ctx := context.Background()
	mockPropRepo := new(MockPropertyRepository)
	mockContentRepo := new(MockContentRepository)

	svc := NewPropertyService(mockPropRepo, mockContentRepo)

	t.Run("get existing property", func(t *testing.T) {
		expected := &property.Property{
			ID:   uuid.New(),
			Name: "Test Property",
			Slug: "test-property",
		}

		mockPropRepo.On("GetBySlug", ctx, "test-property").Return(expected, nil).Once()

		result, err := svc.GetBySlug(ctx, "test-property")

		assert.NoError(t, err)
		assert.Equal(t, expected, result)
	})

	t.Run("get non-existent property", func(t *testing.T) {
		mockPropRepo.On("GetBySlug", ctx, "non-existent").Return(nil, assert.AnError).Once()

		result, err := svc.GetBySlug(ctx, "non-existent")

		assert.Error(t, err)
		assert.Nil(t, result)
	})
}

func TestPropertyService_Update(t *testing.T) {
	ctx := context.Background()
	mockPropRepo := new(MockPropertyRepository)
	mockContentRepo := new(MockContentRepository)

	svc := NewPropertyService(mockPropRepo, mockContentRepo)

	t.Run("update property successfully", func(t *testing.T) {
		propID := uuid.New()
		authorID := uuid.New()
		existing := &property.Property{
			ID:          propID,
			OwnerID:     authorID,
			Name:        "Original Name",
			Description: "Original description",
			Status:      property.StatusDraft,
		}

		newName := "Updated Name"
		newDesc := "Updated description"
		input := UpdatePropertyInput{
			Name:        &newName,
			Description: &newDesc,
		}

		mockPropRepo.On("GetByID", ctx, propID).Return(existing, nil).Once()
		mockPropRepo.On("Update", ctx, mock.AnythingOfType("*property.Property")).Return(nil).Once()
		mockContentRepo.On("GetLatestVersion", ctx, "property", propID).Return(nil, nil).Once()
		mockContentRepo.On("CreateVersion", ctx, mock.AnythingOfType("*content.ContentVersion")).Return(nil).Once()

		result, err := svc.Update(ctx, propID, input, authorID)

		assert.NoError(t, err)
		require.NotNil(t, result)
		assert.Equal(t, "Updated Name", result.Name)
		assert.Equal(t, "Updated description", result.Description)
	})

	t.Run("update non-existent property", func(t *testing.T) {
		propID := uuid.New()
		authorID := uuid.New()
		input := UpdatePropertyInput{}

		mockPropRepo.On("GetByID", ctx, propID).Return(nil, assert.AnError).Once()

		result, err := svc.Update(ctx, propID, input, authorID)

		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "property not found")
	})
}

func TestPropertyService_Delete(t *testing.T) {
	ctx := context.Background()
	mockPropRepo := new(MockPropertyRepository)
	mockContentRepo := new(MockContentRepository)

	svc := NewPropertyService(mockPropRepo, mockContentRepo)

	t.Run("delete property successfully", func(t *testing.T) {
		propID := uuid.New()

		mockPropRepo.On("Delete", ctx, propID).Return(nil).Once()

		err := svc.Delete(ctx, propID)

		assert.NoError(t, err)
	})

	t.Run("delete non-existent property", func(t *testing.T) {
		propID := uuid.New()

		mockPropRepo.On("Delete", ctx, propID).Return(assert.AnError).Once()

		err := svc.Delete(ctx, propID)

		assert.Error(t, err)
	})
}

func TestPropertyService_List(t *testing.T) {
	ctx := context.Background()
	mockPropRepo := new(MockPropertyRepository)
	mockContentRepo := new(MockContentRepository)

	svc := NewPropertyService(mockPropRepo, mockContentRepo)

	t.Run("list properties successfully", func(t *testing.T) {
		opts := repository.ListOptions{
			Status: string(property.StatusPublished),
			Limit:  10,
		}

		expected := []property.Property{
			{ID: uuid.New(), Name: "Property 1"},
			{ID: uuid.New(), Name: "Property 2"},
		}

		mockPropRepo.On("List", ctx, opts).Return(expected, int64(2), nil).Once()

		results, total, err := svc.List(ctx, opts)

		assert.NoError(t, err)
		assert.Len(t, results, 2)
		assert.Equal(t, int64(2), total)
	})
}

func TestGenerateSlug(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"Beautiful Villa", "beautiful-villa"},
		{"My Property!", "my-property"},
		{"  Spaces  Around  ", "spaces-around"},
		{"Special@#$Characters", "specialcharacters"},
		{"Multiple---Hyphens", "multiple-hyphens"},
		{"123 Numbers", "123-numbers"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := generateSlug(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}
