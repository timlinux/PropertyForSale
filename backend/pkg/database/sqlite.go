// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

// Package database provides embedded SQLite database using pure Go driver
package database

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/google/uuid"
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

		// Structures table (formerly dwellings - includes houses, barns, sheds, etc.)
		`CREATE TABLE IF NOT EXISTS structures (
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
			structure_id TEXT NOT NULL,
			name TEXT NOT NULL,
			type TEXT,
			description TEXT,
			size_sqm REAL,
			floor_start INTEGER DEFAULT 0,
			floor_end INTEGER DEFAULT 0,
			sort_order INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (structure_id) REFERENCES structures(id) ON DELETE CASCADE
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
			width INTEGER DEFAULT 0,
			height INTEGER DEFAULT 0,
			duration REAL DEFAULT 0,
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

		// Property quotes table (promotional taglines)
		`CREATE TABLE IF NOT EXISTS property_quotes (
			id TEXT PRIMARY KEY,
			property_id TEXT NOT NULL,
			text TEXT NOT NULL,
			sort_order INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
		)`,

		// A/B variants table
		`CREATE TABLE IF NOT EXISTS ab_variants (
			id TEXT PRIMARY KEY,
			ab_test_id TEXT NOT NULL,
			name TEXT NOT NULL,
			content TEXT DEFAULT '{}',
			weight INTEGER DEFAULT 50,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (ab_test_id) REFERENCES ab_tests(id) ON DELETE CASCADE
		)`,

		// Create indexes
		`CREATE INDEX IF NOT EXISTS idx_properties_slug ON properties(slug)`,
		`CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id)`,
		`CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status)`,
		`CREATE INDEX IF NOT EXISTS idx_structures_property ON structures(property_id)`,
		`CREATE INDEX IF NOT EXISTS idx_rooms_structure ON rooms(structure_id)`,
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
		`CREATE INDEX IF NOT EXISTS idx_property_quotes_property ON property_quotes(property_id)`,
		`CREATE INDEX IF NOT EXISTS idx_ab_variants_test ON ab_variants(ab_test_id)`,
	}

	for _, migration := range migrations {
		if err := db.Exec(migration).Error; err != nil {
			return fmt.Errorf("migration failed: %w", err)
		}
	}

	// Add missing columns to existing tables (ignore errors if columns exist)
	schemaUpdates := []string{
		`ALTER TABLE media ADD COLUMN width INTEGER DEFAULT 0`,
		`ALTER TABLE media ADD COLUMN height INTEGER DEFAULT 0`,
		`ALTER TABLE media ADD COLUMN duration REAL DEFAULT 0`,
		`ALTER TABLE media ADD COLUMN starred INTEGER DEFAULT 0`,
		`ALTER TABLE media ADD COLUMN caption TEXT`,
		`ALTER TABLE media ADD COLUMN linked_audio_id TEXT`,
		// Room floor changes - support spanning levels
		`ALTER TABLE rooms ADD COLUMN floor_start INTEGER DEFAULT 0`,
		`ALTER TABLE rooms ADD COLUMN floor_end INTEGER DEFAULT 0`,
		// Quote-media association - optional link to specific image
		`ALTER TABLE property_quotes ADD COLUMN media_id TEXT`,
		// Rename dwelling to structure - add structure_id column to rooms
		`ALTER TABLE rooms ADD COLUMN structure_id TEXT`,
	}

	for _, update := range schemaUpdates {
		// Ignore errors - column may already exist
		db.Exec(update)
	}

	// Migrate old floor data to floor_start/floor_end (if floor column exists)
	db.Exec(`UPDATE rooms SET floor_start = floor, floor_end = floor WHERE floor_start = 0 AND floor_end = 0 AND floor IS NOT NULL AND floor != 0`)

	// Migration: Rename dwellings to structures
	// Check if old dwellings table exists and structures doesn't
	var dwellingsExists, structuresExists int
	db.Raw(`SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='dwellings'`).Scan(&dwellingsExists)
	db.Raw(`SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='structures'`).Scan(&structuresExists)

	if dwellingsExists > 0 && structuresExists == 0 {
		log.Info().Msg("Migrating dwellings table to structures")
		// Rename the table
		db.Exec(`ALTER TABLE dwellings RENAME TO structures`)
		// Drop old index and create new one
		db.Exec(`DROP INDEX IF EXISTS idx_dwellings_property`)
		db.Exec(`CREATE INDEX IF NOT EXISTS idx_structures_property ON structures(property_id)`)
	}

	// Copy dwelling_id to structure_id in rooms table (if dwelling_id exists)
	db.Exec(`UPDATE rooms SET structure_id = dwelling_id WHERE structure_id IS NULL AND dwelling_id IS NOT NULL`)

	// Update media entity_type from 'dwelling' to 'structure'
	db.Exec(`UPDATE media SET entity_type = 'structure' WHERE entity_type = 'dwelling'`)

	// Fix media records with zero UUIDs
	if err := fixZeroMediaIDs(db); err != nil {
		log.Warn().Err(err).Msg("Failed to fix zero media IDs")
	}

	return nil
}

// fixZeroMediaIDs generates proper UUIDs for media records that have zero or empty UUIDs
func fixZeroMediaIDs(db *gorm.DB) error {
	zeroUUID := "00000000-0000-0000-0000-000000000000"

	// Get all media with zero, empty, or null UUID using raw SQL
	type mediaRow struct {
		URL string
		ID  string
	}
	var rows []mediaRow
	result := db.Raw(`SELECT id, url FROM media WHERE id = ? OR id = '' OR id IS NULL`, zeroUUID).Scan(&rows)
	if result.Error != nil {
		return fmt.Errorf("failed to find zero-UUID media: %w", result.Error)
	}

	if len(rows) == 0 {
		log.Debug().Msg("No media records with zero/empty UUIDs found")
		return nil
	}

	log.Info().Int("count", len(rows)).Msg("Fixing media records with zero/empty UUIDs")

	// Update each one with a unique ID based on URL hash
	for _, row := range rows {
		// Generate a deterministic UUID from the URL using namespace UUID
		newID := uuid.NewSHA1(uuid.NameSpaceURL, []byte(row.URL)).String()
		result := db.Exec(`UPDATE media SET id = ? WHERE url = ? AND (id = ? OR id = '' OR id IS NULL)`, newID, row.URL, zeroUUID)
		if result.Error != nil {
			log.Warn().Err(result.Error).Str("url", row.URL).Msg("Failed to update media ID")
		} else {
			log.Debug().Str("url", row.URL).Str("newID", newID).Msg("Updated media ID")
		}
	}

	log.Info().Int("count", len(rows)).Msg("Fixed media records with proper UUIDs")
	return nil
}
