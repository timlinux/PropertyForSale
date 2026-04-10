-- Add caption and linked_audio_id columns to media table
-- Also ensure starred column exists (may have been added by GORM previously)

-- Add caption column for image captions
ALTER TABLE media ADD COLUMN IF NOT EXISTS caption TEXT;

-- Add linked_audio_id column for linking audio narration to images
ALTER TABLE media ADD COLUMN IF NOT EXISTS linked_audio_id UUID REFERENCES media(id) ON DELETE SET NULL;

-- Ensure starred column exists
ALTER TABLE media ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT FALSE;

-- Create index for linked_audio_id lookups
CREATE INDEX IF NOT EXISTS idx_media_linked_audio ON media(linked_audio_id) WHERE linked_audio_id IS NOT NULL;
