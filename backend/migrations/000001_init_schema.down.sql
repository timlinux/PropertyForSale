-- SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
-- SPDX-License-Identifier: EUPL-1.2

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_ab_variants_updated_at ON ab_variants;
DROP TRIGGER IF EXISTS trigger_ab_tests_updated_at ON ab_tests;
DROP TRIGGER IF EXISTS trigger_media_updated_at ON media;
DROP TRIGGER IF EXISTS trigger_areas_updated_at ON areas;
DROP TRIGGER IF EXISTS trigger_rooms_updated_at ON rooms;
DROP TRIGGER IF EXISTS trigger_dwellings_updated_at ON dwellings;
DROP TRIGGER IF EXISTS trigger_properties_updated_at ON properties;
DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
DROP TRIGGER IF EXISTS trigger_update_property_location ON properties;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS update_property_location();

-- Drop tables in reverse order (respecting foreign key constraints)
DROP TABLE IF EXISTS ab_variants;
DROP TABLE IF EXISTS ab_tests;
DROP TABLE IF EXISTS page_views;
DROP TABLE IF EXISTS content_versions;
DROP TABLE IF EXISTS media;
DROP TABLE IF EXISTS areas;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS dwellings;
DROP TABLE IF EXISTS properties;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;

-- Drop extensions (optional, may be used by other databases)
-- DROP EXTENSION IF EXISTS pg_trgm;
-- DROP EXTENSION IF EXISTS postgis;
-- DROP EXTENSION IF EXISTS "uuid-ossp";
