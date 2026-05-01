-- Add tag column to media table for special categorization (house_plan, property_map)
ALTER TABLE media ADD COLUMN IF NOT EXISTS tag VARCHAR(50) DEFAULT '';

-- Create index for tag lookups
CREATE INDEX IF NOT EXISTS idx_media_tag ON media(tag) WHERE tag != '';
