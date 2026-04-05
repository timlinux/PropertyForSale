// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

// Package database provides embedded SQLite database using pure Go driver
package database

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/rs/zerolog/log"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Config holds database configuration
type Config struct {
	Path  string // Path to database file (empty for in-memory)
	Debug bool   // Enable debug logging
}

// Init initializes the SQLite database connection
func Init(cfg *Config) (*gorm.DB, error) {
	var dsn string

	if cfg.Path == "" {
		// In-memory database
		dsn = "file::memory:?cache=shared"
		log.Info().Msg("Using in-memory SQLite database")
	} else {
		// File-based database
		dir := filepath.Dir(cfg.Path)
		if err := os.MkdirAll(dir, 0755); err != nil {
			return nil, fmt.Errorf("failed to create database directory: %w", err)
		}
		// Use file: URI format with mode=rwc for read/write/create
		dsn = fmt.Sprintf("file:%s?mode=rwc&_journal_mode=WAL", cfg.Path)
		log.Info().Str("path", cfg.Path).Msg("Using file-based SQLite database")
	}

	// Configure GORM logger
	gormLogger := logger.Default.LogMode(logger.Silent)
	if cfg.Debug {
		gormLogger = logger.Default.LogMode(logger.Info)
	}

	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{
		Logger: gormLogger,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to open SQLite: %w", err)
	}

	// Enable foreign keys
	db.Exec("PRAGMA foreign_keys = ON")

	// Run migrations
	if err := runMigrations(db); err != nil {
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Info().Msg("SQLite database initialized successfully")
	return db, nil
}

// runMigrations creates the database schema
func runMigrations(db *gorm.DB) error {
	migrations := []string{
		// Users table
		`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			email TEXT UNIQUE NOT NULL,
			name TEXT NOT NULL,
			avatar_url TEXT,
			provider TEXT NOT NULL,
			provider_id TEXT NOT NULL,
			role TEXT DEFAULT 'viewer',
			refresh_token TEXT,
			last_login_at DATETIME,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,

		// Sessions table
		`CREATE TABLE IF NOT EXISTS sessions (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			refresh_token TEXT NOT NULL,
			user_agent TEXT,
			ip_address TEXT,
			expires_at DATETIME NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)`,

		// Properties table
		`CREATE TABLE IF NOT EXISTS properties (
			id TEXT PRIMARY KEY,
			owner_id TEXT NOT NULL,
			name TEXT NOT NULL,
			slug TEXT UNIQUE NOT NULL,
			description TEXT,
			price_min REAL,
			price_max REAL,
			currency TEXT DEFAULT 'EUR',
			address_line1 TEXT,
			address_line2 TEXT,
			city TEXT,
			state TEXT,
			postal_code TEXT,
			country TEXT,
			latitude REAL,
			longitude REAL,
			status TEXT DEFAULT 'draft',
			metadata TEXT DEFAULT '{}',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			published_at DATETIME,
			FOREIGN KEY (owner_id) REFERENCES users(id)
		)`,

		// Dwellings table
		`CREATE TABLE IF NOT EXISTS dwellings (
			id TEXT PRIMARY KEY,
			property_id TEXT NOT NULL,
			name TEXT NOT NULL,
			type TEXT,
			description TEXT,
			floor_count INTEGER,
			year_built INTEGER,
			size_sqm REAL,
			latitude REAL,
			longitude REAL,
			sort_order INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
		)`,

		// Rooms table
		`CREATE TABLE IF NOT EXISTS rooms (
			id TEXT PRIMARY KEY,
			dwelling_id TEXT NOT NULL,
			name TEXT NOT NULL,
			type TEXT,
			description TEXT,
			size_sqm REAL,
			floor INTEGER DEFAULT 0,
			sort_order INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (dwelling_id) REFERENCES dwellings(id) ON DELETE CASCADE
		)`,

		// Areas table
		`CREATE TABLE IF NOT EXISTS areas (
			id TEXT PRIMARY KEY,
			property_id TEXT NOT NULL,
			name TEXT NOT NULL,
			type TEXT,
			description TEXT,
			size_sqm REAL,
			latitude REAL,
			longitude REAL,
			sort_order INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
		)`,

		// Media table
		`CREATE TABLE IF NOT EXISTS media (
			id TEXT PRIMARY KEY,
			entity_type TEXT NOT NULL,
			entity_id TEXT NOT NULL,
			type TEXT NOT NULL,
			url TEXT NOT NULL,
			thumbnail_url TEXT,
			file_name TEXT,
			file_size INTEGER,
			mime_type TEXT,
			autoplay INTEGER DEFAULT 0,
			sort_order INTEGER DEFAULT 0,
			metadata TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,

		// Content versions table
		`CREATE TABLE IF NOT EXISTS content_versions (
			id TEXT PRIMARY KEY,
			entity_type TEXT NOT NULL,
			entity_id TEXT NOT NULL,
			version_number INTEGER NOT NULL,
			data TEXT NOT NULL,
			diff TEXT,
			author_id TEXT,
			publish_note TEXT,
			is_published INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (author_id) REFERENCES users(id)
		)`,

		// Page views table (analytics)
		`CREATE TABLE IF NOT EXISTS page_views (
			id TEXT PRIMARY KEY,
			session_id TEXT NOT NULL,
			property_id TEXT,
			page_path TEXT NOT NULL,
			dwell_time_ms INTEGER,
			scroll_depth INTEGER,
			ip_address TEXT,
			country TEXT,
			region TEXT,
			city TEXT,
			latitude REAL,
			longitude REAL,
			referrer TEXT,
			user_agent TEXT,
			device_type TEXT,
			ab_variant_id TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,

		// A/B tests table
		`CREATE TABLE IF NOT EXISTS ab_tests (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			entity_type TEXT NOT NULL,
			entity_id TEXT NOT NULL,
			variants TEXT NOT NULL,
			start_date DATETIME,
			end_date DATETIME,
			status TEXT DEFAULT 'draft',
			winner_variant TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,

		// CMS Pages table
		`CREATE TABLE IF NOT EXISTS pages (
			id TEXT PRIMARY KEY,
			slug TEXT UNIQUE NOT NULL,
			title TEXT NOT NULL,
			description TEXT,
			template TEXT DEFAULT 'blank',
			status TEXT DEFAULT 'draft',
			meta_title TEXT,
			meta_desc TEXT,
			og_image TEXT,
			version_number INTEGER DEFAULT 1,
			author_id TEXT,
			published_at DATETIME,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (author_id) REFERENCES users(id)
		)`,

		// Page blocks table
		`CREATE TABLE IF NOT EXISTS page_blocks (
			id TEXT PRIMARY KEY,
			page_id TEXT NOT NULL,
			block_type TEXT NOT NULL,
			position INTEGER NOT NULL,
			data TEXT,
			settings TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
		)`,

		// Page versions table
		`CREATE TABLE IF NOT EXISTS page_versions (
			id TEXT PRIMARY KEY,
			page_id TEXT NOT NULL,
			version_number INTEGER NOT NULL,
			title TEXT,
			data TEXT,
			diff TEXT,
			author_id TEXT,
			note TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
			FOREIGN KEY (author_id) REFERENCES users(id)
		)`,

		// Block templates table
		`CREATE TABLE IF NOT EXISTS block_templates (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			description TEXT,
			block_type TEXT NOT NULL,
			schema TEXT,
			default_data TEXT,
			thumbnail TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,

		// Notifications table
		`CREATE TABLE IF NOT EXISTS notifications (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			type TEXT NOT NULL,
			title TEXT NOT NULL,
			message TEXT,
			data TEXT,
			status TEXT DEFAULT 'unread',
			action_url TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			read_at DATETIME,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)`,

		// Notification preferences table
		`CREATE TABLE IF NOT EXISTS notification_preferences (
			id TEXT PRIMARY KEY,
			user_id TEXT UNIQUE NOT NULL,
			email_enabled INTEGER DEFAULT 1,
			push_enabled INTEGER DEFAULT 1,
			digest_enabled INTEGER DEFAULT 1,
			digest_frequency TEXT DEFAULT 'daily',
			type_preferences TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)`,

		// Expression of interest table
		`CREATE TABLE IF NOT EXISTS expressions_of_interest (
			id TEXT PRIMARY KEY,
			property_id TEXT NOT NULL,
			name TEXT NOT NULL,
			email TEXT NOT NULL,
			phone TEXT,
			message TEXT,
			status TEXT DEFAULT 'new',
			notified_at DATETIME,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
		)`,

		// Email templates table
		`CREATE TABLE IF NOT EXISTS email_templates (
			id TEXT PRIMARY KEY,
			name TEXT UNIQUE NOT NULL,
			subject TEXT NOT NULL,
			html_body TEXT NOT NULL,
			text_body TEXT,
			variables TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,

		// Email logs table
		`CREATE TABLE IF NOT EXISTS email_logs (
			id TEXT PRIMARY KEY,
			template_id TEXT,
			template_name TEXT,
			recipient_id TEXT,
			to_email TEXT NOT NULL,
			subject TEXT NOT NULL,
			status TEXT DEFAULT 'pending',
			error TEXT,
			sent_at DATETIME,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (recipient_id) REFERENCES users(id)
		)`,

		// Create indexes
		`CREATE INDEX IF NOT EXISTS idx_properties_slug ON properties(slug)`,
		`CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id)`,
		`CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status)`,
		`CREATE INDEX IF NOT EXISTS idx_dwellings_property ON dwellings(property_id)`,
		`CREATE INDEX IF NOT EXISTS idx_rooms_dwelling ON rooms(dwelling_id)`,
		`CREATE INDEX IF NOT EXISTS idx_areas_property ON areas(property_id)`,
		`CREATE INDEX IF NOT EXISTS idx_media_entity ON media(entity_type, entity_id)`,
		`CREATE INDEX IF NOT EXISTS idx_content_versions_entity ON content_versions(entity_type, entity_id)`,
		`CREATE INDEX IF NOT EXISTS idx_page_views_property ON page_views(property_id)`,
		`CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id)`,
		`CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug)`,
		`CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status)`,
		`CREATE INDEX IF NOT EXISTS idx_page_blocks_page ON page_blocks(page_id)`,
		`CREATE INDEX IF NOT EXISTS idx_page_versions_page ON page_versions(page_id)`,
		`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status)`,
		`CREATE INDEX IF NOT EXISTS idx_eoi_property ON expressions_of_interest(property_id)`,
		`CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status)`,
	}

	for _, migration := range migrations {
		if err := db.Exec(migration).Error; err != nil {
			return fmt.Errorf("migration failed: %w", err)
		}
	}

	return nil
}
