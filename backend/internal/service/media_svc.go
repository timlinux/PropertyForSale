// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package service

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/timlinux/PropertyForSale/backend/internal/config"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/media"
	"github.com/timlinux/PropertyForSale/backend/internal/repository"
)

// MediaService handles media business logic
type MediaService struct {
	mediaRepo   repository.MediaRepository
	minioClient *minio.Client
	cfg         *config.Config
}

// NewMediaService creates a new media service
func NewMediaService(mediaRepo repository.MediaRepository, cfg *config.Config) *MediaService {
	// Initialize MinIO client
	client, err := minio.New(cfg.S3.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.S3.AccessKey, cfg.S3.SecretKey, ""),
		Secure: cfg.S3.UseSSL,
	})
	if err != nil {
		fmt.Printf("Warning: failed to initialize MinIO client: %v\n", err)
	}

	return &MediaService{
		mediaRepo:   mediaRepo,
		minioClient: client,
		cfg:         cfg,
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
	objectName := fmt.Sprintf("%s/%s/%s%s",
		input.EntityType,
		input.EntityID.String(),
		uuid.New().String(),
		ext,
	)

	// Upload to MinIO
	if s.minioClient != nil {
		_, err := s.minioClient.PutObject(ctx, s.cfg.S3.Bucket, objectName, input.File, input.FileSize, minio.PutObjectOptions{
			ContentType: input.MimeType,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to upload file: %w", err)
		}
	}

	// Create media record
	m := &media.Media{
		EntityType: input.EntityType,
		EntityID:   input.EntityID,
		Type:       mediaType,
		URL:        fmt.Sprintf("%s/%s", s.cfg.S3.PublicURLPrefix, objectName),
		FileName:   input.FileName,
		FileSize:   input.FileSize,
		MimeType:   input.MimeType,
		Autoplay:   input.Autoplay,
	}

	if err := s.mediaRepo.Create(ctx, m); err != nil {
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
	if input.SortOrder != nil {
		m.SortOrder = *input.SortOrder
	}
	if input.Metadata != nil {
		m.Metadata = media.JSONB(input.Metadata)
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

	// Delete from S3
	if s.minioClient != nil {
		objectName := strings.TrimPrefix(m.URL, s.cfg.S3.PublicURLPrefix+"/")
		if err := s.minioClient.RemoveObject(ctx, s.cfg.S3.Bucket, objectName, minio.RemoveObjectOptions{}); err != nil {
			fmt.Printf("Warning: failed to delete from S3: %v\n", err)
		}
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
