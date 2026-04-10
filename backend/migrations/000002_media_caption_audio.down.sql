-- Remove caption and linked_audio_id columns from media table

DROP INDEX IF EXISTS idx_media_linked_audio;
ALTER TABLE media DROP COLUMN IF EXISTS linked_audio_id;
ALTER TABLE media DROP COLUMN IF EXISTS caption;
-- Note: Not removing starred column as it was likely in use before this migration
