-- SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
-- SPDX-License-Identifier: EUPL-1.2

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('viewer', 'agent', 'admin')),
    provider VARCHAR(50),
    provider_id VARCHAR(255),
    refresh_token TEXT,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider, provider_id);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);

-- Properties table
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price_min DECIMAL(15, 2),
    price_max DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'EUR',
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location GEOGRAPHY(POINT, 4326),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_properties_slug ON properties(slug);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_location ON properties USING GIST(location);
CREATE INDEX idx_properties_search ON properties USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Trigger to update location from lat/lng
CREATE OR REPLACE FUNCTION update_property_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_property_location
    BEFORE INSERT OR UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_property_location();

-- Dwellings table
CREATE TABLE dwellings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    description TEXT,
    floor_count INTEGER DEFAULT 1,
    year_built INTEGER,
    size_sqm DECIMAL(10, 2),
    geometry GEOGRAPHY(POLYGON, 4326),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dwellings_property_id ON dwellings(property_id);

-- Rooms table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dwelling_id UUID NOT NULL REFERENCES dwellings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    description TEXT,
    size_sqm DECIMAL(10, 2),
    floor INTEGER DEFAULT 0,
    geometry GEOGRAPHY(POLYGON, 4326),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rooms_dwelling_id ON rooms(dwelling_id);

-- Areas table (gardens, fields, etc.)
CREATE TABLE areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    description TEXT,
    size_sqm DECIMAL(10, 2),
    geometry GEOGRAPHY(POLYGON, 4326),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_areas_property_id ON areas(property_id);

-- Media table
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('image', 'video', 'video360', 'audio', 'document', 'model3d')),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    duration DECIMAL(10, 3),
    autoplay BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_media_entity ON media(entity_type, entity_id);
CREATE INDEX idx_media_type ON media(type);

-- Content versions table
CREATE TABLE content_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    version_number INTEGER NOT NULL,
    data JSONB NOT NULL,
    diff JSONB,
    author_id UUID NOT NULL REFERENCES users(id),
    is_published BOOLEAN DEFAULT FALSE,
    publish_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(entity_type, entity_id, version_number)
);

CREATE INDEX idx_content_versions_entity ON content_versions(entity_type, entity_id);

-- Page views table (analytics)
CREATE TABLE page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    page_path VARCHAR(500) NOT NULL,
    dwell_time_ms BIGINT DEFAULT 0,
    scroll_depth INTEGER DEFAULT 0,
    ip_address VARCHAR(45),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geo_location GEOGRAPHY(POINT, 4326),
    country VARCHAR(100),
    region VARCHAR(100),
    city VARCHAR(100),
    referrer TEXT,
    user_agent TEXT,
    device_type VARCHAR(50),
    ab_variant_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_page_views_session_id ON page_views(session_id);
CREATE INDEX idx_page_views_property_id ON page_views(property_id);
CREATE INDEX idx_page_views_created_at ON page_views(created_at);
CREATE INDEX idx_page_views_geo_location ON page_views USING GIST(geo_location);

-- A/B tests table
CREATE TABLE ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    variants JSONB DEFAULT '[]',
    traffic_split JSONB DEFAULT '{}',
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'cancelled')),
    winner_variant_id UUID,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ab_tests_entity ON ab_tests(entity_type, entity_id);
CREATE INDEX idx_ab_tests_status ON ab_tests(status);

-- A/B variants table
CREATE TABLE ab_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ab_test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    content JSONB DEFAULT '{}',
    weight INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ab_variants_test_id ON ab_variants(ab_test_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_dwellings_updated_at
    BEFORE UPDATE ON dwellings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_areas_updated_at
    BEFORE UPDATE ON areas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_media_updated_at
    BEFORE UPDATE ON media
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_ab_tests_updated_at
    BEFORE UPDATE ON ab_tests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_ab_variants_updated_at
    BEFORE UPDATE ON ab_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
