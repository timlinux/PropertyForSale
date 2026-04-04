// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/content"
	"github.com/timlinux/PropertyForSale/backend/internal/repository"
)

// ContentService handles content versioning business logic
type ContentService struct {
	contentRepo repository.ContentRepository
}

// NewContentService creates a new content service
func NewContentService(contentRepo repository.ContentRepository) *ContentService {
	return &ContentService{
		contentRepo: contentRepo,
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
