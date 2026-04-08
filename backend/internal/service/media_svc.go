// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package service

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/config"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/media"
	"github.com/timlinux/PropertyForSale/backend/internal/repository"
	"github.com/timlinux/PropertyForSale/backend/pkg/thumbnailer"
	"github.com/timlinux/PropertyForSale/backend/pkg/types"
)

// MediaService handles media business logic
type MediaService struct {
	mediaRepo   repository.MediaRepository
	storagePath string
	cfg         *config.Config
	thumbnailer *thumbnailer.Thumbnailer
}

// NewMediaService creates a new media service
func NewMediaService(mediaRepo repository.MediaRepository, cfg *config.Config) *MediaService {
	// Ensure storage directory exists
	if err := os.MkdirAll(cfg.Storage.Path, 0755); err != nil {
		fmt.Printf("Warning: failed to create storage directory: %v\n", err)
	}

	// Initialize thumbnailer (optional - will be nil if ffmpeg not available)
	th, err := thumbnailer.New()
	if err != nil {
		fmt.Printf("Warning: thumbnail generation unavailable: %v\n", err)
	}

	return &MediaService{
		mediaRepo:   mediaRepo,
		storagePath: cfg.Storage.Path,
		cfg:         cfg,
		thumbnailer: th,
	}
}

// UploadInput contains the data for uploading media
type UploadInput struct {
	EntityType media.EntityType
	EntityID   uuid.UUID
	File       io.Reader
	FileName   string
	FileSize   int64
	MimeType   string
	Autoplay   bool
}

// Upload uploads a media file
func (s *MediaService) Upload(ctx context.Context, input UploadInput) (*media.Media, error) {
	// Determine media type from mime type
	mediaType := determineMediaType(input.MimeType)

	// Generate unique file path
	ext := filepath.Ext(input.FileName)
	fileID := uuid.New().String()
	relativePath := filepath.Join(
		string(input.EntityType),
		input.EntityID.String(),
		fileID+ext,
	)

	// Full path on filesystem
	fullPath := filepath.Join(s.storagePath, relativePath)

	// Create directory structure
	if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
		return nil, fmt.Errorf("failed to create directory: %w", err)
	}

	// Write file to disk
	outFile, err := os.Create(fullPath)
	if err != nil {
		return nil, fmt.Errorf("failed to create file: %w", err)
	}
	defer outFile.Close()

	if _, err := io.Copy(outFile, input.File); err != nil {
		return nil, fmt.Errorf("failed to write file: %w", err)
	}

	// Create media record with URL pointing to our static file server
	now := time.Now()
	m := &media.Media{
		ID:         uuid.New(),
		EntityType: input.EntityType,
		EntityID:   input.EntityID,
		Type:       mediaType,
		URL:        fmt.Sprintf("/api/v1/media/files/%s", relativePath),
		FileName:   input.FileName,
		FileSize:   input.FileSize,
		MimeType:   input.MimeType,
		Autoplay:   input.Autoplay,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	// Generate thumbnail and extract metadata for video files
	if thumbnailer.IsVideoFile(input.MimeType) && s.thumbnailer != nil {
		thumbnailPath := filepath.Join(
			s.storagePath,
			string(input.EntityType),
			input.EntityID.String(),
			fileID+"_thumb.jpg",
		)

		// Generate thumbnail (non-blocking - continue even if it fails)
		if err := s.thumbnailer.GenerateVideoThumbnail(ctx, fullPath, thumbnailPath); err != nil {
			fmt.Printf("Warning: failed to generate video thumbnail: %v\n", err)
		} else {
			// Set thumbnail URL
			thumbnailRelPath := filepath.Join(
				string(input.EntityType),
				input.EntityID.String(),
				fileID+"_thumb.jpg",
			)
			m.ThumbnailURL = fmt.Sprintf("/api/v1/media/files/%s", thumbnailRelPath)
		}

		// Extract video metadata
		if meta, err := s.thumbnailer.GetVideoMetadata(ctx, fullPath); err == nil {
			m.Duration = meta.Duration
			m.Width = meta.Width
			m.Height = meta.Height
		}
	}

	if err := s.mediaRepo.Create(ctx, m); err != nil {
		// Clean up file on failure
		os.Remove(fullPath)
		return nil, fmt.Errorf("failed to create media record: %w", err)
	}

	return m, nil
}

// GetByID retrieves media by ID
func (s *MediaService) GetByID(ctx context.Context, id uuid.UUID) (*media.Media, error) {
	return s.mediaRepo.GetByID(ctx, id)
}

// ListByEntity retrieves media for an entity
func (s *MediaService) ListByEntity(ctx context.Context, entityType media.EntityType, entityID uuid.UUID) ([]media.Media, error) {
	return s.mediaRepo.ListByEntity(ctx, entityType, entityID)
}

// UpdateMediaInput contains the data for updating media
type UpdateMediaInput struct {
	Autoplay  *bool
	Starred   *bool
	SortOrder *int
	Metadata  map[string]interface{}
}

// Update updates media
func (s *MediaService) Update(ctx context.Context, id uuid.UUID, input UpdateMediaInput) (*media.Media, error) {
	m, err := s.mediaRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("media not found: %w", err)
	}

	if input.Autoplay != nil {
		m.Autoplay = *input.Autoplay
	}
	if input.Starred != nil {
		m.Starred = *input.Starred
	}
	if input.SortOrder != nil {
		m.SortOrder = *input.SortOrder
	}
	if input.Metadata != nil {
		m.Metadata = types.JSONB(input.Metadata)
	}

	m.UpdatedAt = time.Now()

	if err := s.mediaRepo.Update(ctx, m); err != nil {
		return nil, fmt.Errorf("failed to update media: %w", err)
	}

	return m, nil
}

// Delete deletes media
func (s *MediaService) Delete(ctx context.Context, id uuid.UUID) error {
	m, err := s.mediaRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("media not found: %w", err)
	}

	// Delete file from filesystem
	relativePath := strings.TrimPrefix(m.URL, "/api/v1/media/files/")
	fullPath := filepath.Join(s.storagePath, relativePath)
	if err := os.Remove(fullPath); err != nil && !os.IsNotExist(err) {
		fmt.Printf("Warning: failed to delete file: %v\n", err)
	}

	return s.mediaRepo.Delete(ctx, id)
}

func determineMediaType(mimeType string) media.MediaType {
	switch {
	case strings.HasPrefix(mimeType, "image/"):
		return media.MediaTypeImage
	case strings.HasPrefix(mimeType, "video/"):
		return media.MediaTypeVideo
	case strings.HasPrefix(mimeType, "audio/"):
		return media.MediaTypeAudio
	case mimeType == "application/pdf" || strings.HasPrefix(mimeType, "application/"):
		return media.MediaTypeDocument
	case strings.Contains(mimeType, "gltf") || strings.Contains(mimeType, "glb"):
		return media.MediaTypeModel3D
	default:
		return media.MediaTypeDocument
	}
}
