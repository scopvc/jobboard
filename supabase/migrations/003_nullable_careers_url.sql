-- 003_nullable_careers_url_and_homepage.sql
-- Allow companies without careers pages (careers_url can be NULL).
-- These companies are stored for directory/search purposes but skipped during ingestion.
-- Also add a homepage_url column for a future companies directory.

ALTER TABLE companies ALTER COLUMN careers_url DROP NOT NULL;
ALTER TABLE companies ADD COLUMN homepage_url text;
