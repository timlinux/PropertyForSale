// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

// Package embeddedstorage provides filesystem-based storage for media files
package embeddedstorage

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sync"

	"github.com/rs/zerolog/log"
)

// Storage provides filesystem-based storage
type Storage struct {
	dataDir string
	baseURL string
	mu      sync.RWMutex
}

// Config holds storage configuration
type Config struct {
	DataDir string // Directory for file storage
	BaseURL string // Base URL for serving files (e.g., "/api/v1/media/files")
}

var globalStorage *Storage

// Init initializes the filesystem storage
func Init(cfg *Config) (*Storage, error) {
	if cfg.DataDir == "" {
		cfg.DataDir = "./data/media"
	}

	if err := os.MkdirAll(cfg.DataDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create storage directory: %w", err)
	}

	storage := &Storage{
		dataDir: cfg.DataDir,
		baseURL: cfg.BaseURL,
	}

	globalStorage = storage
	log.Info().Str("dir", cfg.DataDir).Msg("Filesystem storage initialized")
	return storage, nil
}

// Get returns the global storage instance
func Get() *Storage {
	return globalStorage
}

// PutObject stores a file
func (s *Storage) PutObject(key string, data io.Reader, size int64, contentType string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	path := filepath.Join(s.dataDir, key)
	dir := filepath.Dir(path)

	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	file, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}
	defer file.Close()

	if _, err := io.Copy(file, data); err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}

	return nil
}

// GetObject retrieves a file
func (s *Storage) GetObject(key string) (io.ReadCloser, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	path := filepath.Join(s.dataDir, key)
	file, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}

	return file, nil
}

// DeleteObject removes a file
func (s *Storage) DeleteObject(key string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	path := filepath.Join(s.dataDir, key)
	if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	return nil
}

// GetURL returns the URL for accessing a file
func (s *Storage) GetURL(key string) string {
	if s.baseURL != "" {
		return fmt.Sprintf("%s/%s", s.baseURL, key)
	}
	return fmt.Sprintf("/api/v1/media/files/%s", key)
}

// GetPath returns the filesystem path for a file
func (s *Storage) GetPath(key string) string {
	return filepath.Join(s.dataDir, key)
}

// Exists checks if a file exists
func (s *Storage) Exists(key string) bool {
	path := filepath.Join(s.dataDir, key)
	_, err := os.Stat(path)
	return err == nil
}

// DataDir returns the storage directory
func (s *Storage) DataDir() string {
	return s.dataDir
}
