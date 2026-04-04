// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package service

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/content"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/property"
	"github.com/timlinux/PropertyForSale/backend/internal/repository"
)

// PropertyService handles property business logic
type PropertyService struct {
	propertyRepo repository.PropertyRepository
	contentRepo  repository.ContentRepository
}

// NewPropertyService creates a new property service
func NewPropertyService(propertyRepo repository.PropertyRepository, contentRepo repository.ContentRepository) *PropertyService {
	return &PropertyService{
		propertyRepo: propertyRepo,
		contentRepo:  contentRepo,
	}
}

// CreatePropertyInput contains the data for creating a property
type CreatePropertyInput struct {
	OwnerID      uuid.UUID
	Name         string
	Description  string
	PriceMin     float64
	PriceMax     float64
	Currency     string
	AddressLine1 string
	AddressLine2 string
	City         string
	State        string
	PostalCode   string
	Country      string
	Latitude     float64
	Longitude    float64
}

// Create creates a new property
func (s *PropertyService) Create(ctx context.Context, input CreatePropertyInput) (*property.Property, error) {
	// Generate slug from name
	slug := generateSlug(input.Name)

	// Check slug uniqueness
	existing, _ := s.propertyRepo.GetBySlug(ctx, slug)
	if existing != nil {
		slug = fmt.Sprintf("%s-%s", slug, uuid.New().String()[:8])
	}

	p := &property.Property{
		OwnerID:      input.OwnerID,
		Name:         input.Name,
		Slug:         slug,
		Description:  input.Description,
		PriceMin:     input.PriceMin,
		PriceMax:     input.PriceMax,
		Currency:     input.Currency,
		AddressLine1: input.AddressLine1,
		AddressLine2: input.AddressLine2,
		City:         input.City,
		State:        input.State,
		PostalCode:   input.PostalCode,
		Country:      input.Country,
		Latitude:     input.Latitude,
		Longitude:    input.Longitude,
		Status:       property.StatusDraft,
	}

	if err := s.propertyRepo.Create(ctx, p); err != nil {
		return nil, fmt.Errorf("failed to create property: %w", err)
	}

	// Create initial content version
	if err := s.createVersion(ctx, p); err != nil {
		// Log but don't fail
		fmt.Printf("Warning: failed to create version: %v\n", err)
	}

	return p, nil
}

// GetByID retrieves a property by ID
func (s *PropertyService) GetByID(ctx context.Context, id uuid.UUID) (*property.Property, error) {
	return s.propertyRepo.GetByID(ctx, id)
}

// GetBySlug retrieves a property by slug
func (s *PropertyService) GetBySlug(ctx context.Context, slug string) (*property.Property, error) {
	return s.propertyRepo.GetBySlug(ctx, slug)
}

// List retrieves properties with filtering and pagination
func (s *PropertyService) List(ctx context.Context, opts repository.ListOptions) ([]property.Property, int64, error) {
	return s.propertyRepo.List(ctx, opts)
}

// UpdatePropertyInput contains the data for updating a property
type UpdatePropertyInput struct {
	Name         *string
	Description  *string
	PriceMin     *float64
	PriceMax     *float64
	Currency     *string
	AddressLine1 *string
	AddressLine2 *string
	City         *string
	State        *string
	PostalCode   *string
	Country      *string
	Latitude     *float64
	Longitude    *float64
	Status       *property.Status
}

// Update updates a property
func (s *PropertyService) Update(ctx context.Context, id uuid.UUID, input UpdatePropertyInput, authorID uuid.UUID) (*property.Property, error) {
	p, err := s.propertyRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("property not found: %w", err)
	}

	// Apply updates
	if input.Name != nil {
		p.Name = *input.Name
	}
	if input.Description != nil {
		p.Description = *input.Description
	}
	if input.PriceMin != nil {
		p.PriceMin = *input.PriceMin
	}
	if input.PriceMax != nil {
		p.PriceMax = *input.PriceMax
	}
	if input.Currency != nil {
		p.Currency = *input.Currency
	}
	if input.AddressLine1 != nil {
		p.AddressLine1 = *input.AddressLine1
	}
	if input.AddressLine2 != nil {
		p.AddressLine2 = *input.AddressLine2
	}
	if input.City != nil {
		p.City = *input.City
	}
	if input.State != nil {
		p.State = *input.State
	}
	if input.PostalCode != nil {
		p.PostalCode = *input.PostalCode
	}
	if input.Country != nil {
		p.Country = *input.Country
	}
	if input.Latitude != nil {
		p.Latitude = *input.Latitude
	}
	if input.Longitude != nil {
		p.Longitude = *input.Longitude
	}
	if input.Status != nil {
		p.Status = *input.Status
		if *input.Status == property.StatusPublished && p.PublishedAt == nil {
			now := time.Now()
			p.PublishedAt = &now
		}
	}

	p.UpdatedAt = time.Now()

	if err := s.propertyRepo.Update(ctx, p); err != nil {
		return nil, fmt.Errorf("failed to update property: %w", err)
	}

	// Create new content version
	if err := s.createVersion(ctx, p); err != nil {
		fmt.Printf("Warning: failed to create version: %v\n", err)
	}

	return p, nil
}

// Delete deletes a property
func (s *PropertyService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.propertyRepo.Delete(ctx, id)
}

// createVersion creates a new content version for a property
func (s *PropertyService) createVersion(ctx context.Context, p *property.Property) error {
	// Get latest version number
	latest, _ := s.contentRepo.GetLatestVersion(ctx, "property", p.ID)
	versionNum := 1
	if latest != nil {
		versionNum = latest.VersionNumber + 1
	}

	// Serialize property data
	data, err := json.Marshal(p)
	if err != nil {
		return err
	}

	var jsonData content.JSONB
	if err := json.Unmarshal(data, &jsonData); err != nil {
		return err
	}

	version := &content.ContentVersion{
		EntityType:    "property",
		EntityID:      p.ID,
		VersionNumber: versionNum,
		Data:          jsonData,
		AuthorID:      p.OwnerID,
		IsPublished:   p.Status == property.StatusPublished,
	}

	return s.contentRepo.CreateVersion(ctx, version)
}

// generateSlug creates a URL-safe slug from a string
func generateSlug(s string) string {
	// Convert to lowercase
	slug := strings.ToLower(s)
	// Replace spaces with hyphens
	slug = strings.ReplaceAll(slug, " ", "-")
	// Remove non-alphanumeric characters except hyphens
	reg := regexp.MustCompile(`[^a-z0-9-]`)
	slug = reg.ReplaceAllString(slug, "")
	// Remove multiple consecutive hyphens
	reg = regexp.MustCompile(`-+`)
	slug = reg.ReplaceAllString(slug, "-")
	// Trim hyphens from ends
	slug = strings.Trim(slug, "-")
	return slug
}
