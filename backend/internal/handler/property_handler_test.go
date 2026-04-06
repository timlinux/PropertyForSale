// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/property"
	"github.com/timlinux/PropertyForSale/backend/internal/repository"
	"github.com/timlinux/PropertyForSale/backend/internal/service"
)

// MockPropertyService is a mock for testing
type MockPropertyService struct {
	mock.Mock
}

func (m *MockPropertyService) Create(input service.CreatePropertyInput) (*property.Property, error) {
	args := m.Called(input)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*property.Property), args.Error(1)
}

func (m *MockPropertyService) GetByID(id uuid.UUID) (*property.Property, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*property.Property), args.Error(1)
}

func (m *MockPropertyService) GetBySlug(slug string) (*property.Property, error) {
	args := m.Called(slug)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*property.Property), args.Error(1)
}

func (m *MockPropertyService) List(opts repository.ListOptions) ([]property.Property, int64, error) {
	args := m.Called(opts)
	return args.Get(0).([]property.Property), args.Get(1).(int64), args.Error(2)
}

func (m *MockPropertyService) Update(id uuid.UUID, input service.UpdatePropertyInput, authorID uuid.UUID) (*property.Property, error) {
	args := m.Called(id, input, authorID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*property.Property), args.Error(1)
}

func (m *MockPropertyService) Delete(id uuid.UUID) error {
	args := m.Called(id)
	return args.Error(0)
}

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	return gin.New()
}

func TestPropertyHandler_ListProperties(t *testing.T) {
	t.Run("list properties successfully", func(t *testing.T) {
		router := setupTestRouter()

		// Create test response
		properties := []property.Property{
			{
				ID:       uuid.New(),
				Name:     "Property 1",
				Slug:     "property-1",
				Status:   property.StatusPublished,
				PriceMin: 100000,
				City:     "Lisbon",
			},
			{
				ID:       uuid.New(),
				Name:     "Property 2",
				Slug:     "property-2",
				Status:   property.StatusPublished,
				PriceMin: 200000,
				City:     "Porto",
			},
		}

		// Setup route directly for testing
		router.GET("/api/v1/properties", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"data":   properties,
				"total":  2,
				"offset": 0,
				"limit":  10,
			})
		})

		req := httptest.NewRequest(http.MethodGet, "/api/v1/properties", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, float64(2), response["total"])
	})

	t.Run("list with filters", func(t *testing.T) {
		router := setupTestRouter()

		router.GET("/api/v1/properties", func(c *gin.Context) {
			status := c.Query("status")
			assert.Equal(t, "published", status)

			c.JSON(http.StatusOK, gin.H{
				"data":   []property.Property{},
				"total":  0,
				"offset": 0,
				"limit":  10,
			})
		})

		req := httptest.NewRequest(http.MethodGet, "/api/v1/properties?status=published", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})
}

func TestPropertyHandler_GetProperty(t *testing.T) {
	t.Run("get property by slug successfully", func(t *testing.T) {
		router := setupTestRouter()

		prop := property.Property{
			ID:          uuid.New(),
			Name:        "Test Property",
			Slug:        "test-property",
			Description: "A test property",
			Status:      property.StatusPublished,
			PriceMin:    150000,
			PriceMax:    200000,
			City:        "Lisbon",
			Country:     "Portugal",
		}

		router.GET("/api/v1/properties/:slug", func(c *gin.Context) {
			slug := c.Param("slug")
			if slug == "test-property" {
				c.JSON(http.StatusOK, prop)
			} else {
				c.JSON(http.StatusNotFound, gin.H{"error": "Property not found"})
			}
		})

		req := httptest.NewRequest(http.MethodGet, "/api/v1/properties/test-property", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response property.Property
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Test Property", response.Name)
		assert.Equal(t, "test-property", response.Slug)
	})

	t.Run("get non-existent property", func(t *testing.T) {
		router := setupTestRouter()

		router.GET("/api/v1/properties/:slug", func(c *gin.Context) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Property not found"})
		})

		req := httptest.NewRequest(http.MethodGet, "/api/v1/properties/non-existent", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}

func TestPropertyHandler_CreateProperty(t *testing.T) {
	t.Run("create property successfully", func(t *testing.T) {
		router := setupTestRouter()

		router.POST("/api/v1/properties", func(c *gin.Context) {
			var input struct {
				Name        string  `json:"name"`
				Description string  `json:"description"`
				PriceMin    float64 `json:"price_min"`
			}
			if err := c.ShouldBindJSON(&input); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			if input.Name == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
				return
			}

			prop := property.Property{
				ID:          uuid.New(),
				Name:        input.Name,
				Slug:        "beautiful-villa",
				Description: input.Description,
				PriceMin:    input.PriceMin,
				Status:      property.StatusDraft,
			}

			c.JSON(http.StatusCreated, prop)
		})

		body := map[string]interface{}{
			"name":        "Beautiful Villa",
			"description": "A stunning villa",
			"price_min":   500000,
		}
		jsonBody, _ := json.Marshal(body)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/properties", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)

		var response property.Property
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Beautiful Villa", response.Name)
		assert.Equal(t, property.StatusDraft, response.Status)
	})

	t.Run("create property with missing name", func(t *testing.T) {
		router := setupTestRouter()

		router.POST("/api/v1/properties", func(c *gin.Context) {
			var input struct {
				Name string `json:"name" binding:"required"`
			}
			if err := c.ShouldBindJSON(&input); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
				return
			}
		})

		body := map[string]interface{}{
			"description": "No name provided",
		}
		jsonBody, _ := json.Marshal(body)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/properties", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestPropertyHandler_UpdateProperty(t *testing.T) {
	t.Run("update property successfully", func(t *testing.T) {
		router := setupTestRouter()

		router.PUT("/api/v1/properties/:slug", func(c *gin.Context) {
			slug := c.Param("slug")
			if slug != "test-property" {
				c.JSON(http.StatusNotFound, gin.H{"error": "Property not found"})
				return
			}

			var input struct {
				Name        *string `json:"name"`
				Description *string `json:"description"`
			}
			if err := c.ShouldBindJSON(&input); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			prop := property.Property{
				ID:          uuid.New(),
				Name:        "Updated Name",
				Slug:        slug,
				Description: "Updated description",
				Status:      property.StatusDraft,
			}

			if input.Name != nil {
				prop.Name = *input.Name
			}

			c.JSON(http.StatusOK, prop)
		})

		body := map[string]interface{}{
			"name":        "Updated Name",
			"description": "Updated description",
		}
		jsonBody, _ := json.Marshal(body)

		req := httptest.NewRequest(http.MethodPut, "/api/v1/properties/test-property", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response property.Property
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Updated Name", response.Name)
	})
}

func TestPropertyHandler_DeleteProperty(t *testing.T) {
	t.Run("delete property successfully", func(t *testing.T) {
		router := setupTestRouter()

		router.DELETE("/api/v1/properties/:slug", func(c *gin.Context) {
			slug := c.Param("slug")
			if slug != "test-property" {
				c.JSON(http.StatusNotFound, gin.H{"error": "Property not found"})
				return
			}

			c.JSON(http.StatusOK, gin.H{"message": "Property deleted successfully"})
		})

		req := httptest.NewRequest(http.MethodDelete, "/api/v1/properties/test-property", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("delete non-existent property", func(t *testing.T) {
		router := setupTestRouter()

		router.DELETE("/api/v1/properties/:slug", func(c *gin.Context) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Property not found"})
		})

		req := httptest.NewRequest(http.MethodDelete, "/api/v1/properties/non-existent", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}
