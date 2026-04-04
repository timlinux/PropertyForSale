// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/content"
	"github.com/timlinux/PropertyForSale/backend/internal/repository"
)

// ContentService handles content versioning business logic
type ContentService struct {
	contentRepo  repository.ContentRepository
	propertyRepo repository.PropertyRepository
}

// NewContentService creates a new content service
func NewContentService(contentRepo repository.ContentRepository, propertyRepo repository.PropertyRepository) *ContentService {
	return &ContentService{
		contentRepo:  contentRepo,
		propertyRepo: propertyRepo,
	}
}

// GetVersion retrieves a specific version
func (s *ContentService) GetVersion(ctx context.Context, entityType string, entityID uuid.UUID, version int) (*content.ContentVersion, error) {
	return s.contentRepo.GetVersion(ctx, entityType, entityID, version)
}

// GetLatestVersion retrieves the latest version
func (s *ContentService) GetLatestVersion(ctx context.Context, entityType string, entityID uuid.UUID) (*content.ContentVersion, error) {
	return s.contentRepo.GetLatestVersion(ctx, entityType, entityID)
}

// ListVersions retrieves all versions for an entity
func (s *ContentService) ListVersions(ctx context.Context, entityType string, entityID uuid.UUID) ([]content.ContentVersion, error) {
	return s.contentRepo.ListVersions(ctx, entityType, entityID)
}

// Rollback restores an entity to a previous version
func (s *ContentService) Rollback(ctx context.Context, entityType string, entityID uuid.UUID, version int, authorID uuid.UUID) (*content.ContentVersion, error) {
	// Get the version to rollback to
	targetVersion, err := s.contentRepo.GetVersion(ctx, entityType, entityID, version)
	if err != nil {
		return nil, fmt.Errorf("version not found: %w", err)
	}

	// Get the latest version number
	latest, err := s.contentRepo.GetLatestVersion(ctx, entityType, entityID)
	if err != nil {
		return nil, fmt.Errorf("failed to get latest version: %w", err)
	}

	// Create a new version with the old data
	newVersion := &content.ContentVersion{
		EntityType:    entityType,
		EntityID:      entityID,
		VersionNumber: latest.VersionNumber + 1,
		Data:          targetVersion.Data,
		AuthorID:      authorID,
		PublishNote:   fmt.Sprintf("Rollback to version %d", version),
	}

	if err := s.contentRepo.CreateVersion(ctx, newVersion); err != nil {
		return nil, fmt.Errorf("failed to create rollback version: %w", err)
	}

	return newVersion, nil
}
