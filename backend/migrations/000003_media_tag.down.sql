-- Remove tag column and index from media table
DROP INDEX IF EXISTS idx_media_tag;
ALTER TABLE media DROP COLUMN IF EXISTS tag;
