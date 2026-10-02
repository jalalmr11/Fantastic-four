-- ==============================================================================
-- MIGRATION: Add category column to photos table and categorize existing photos
-- Run this in the Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/kjyainsyobngrsogehnz/sql
-- ==============================================================================

-- 1. Add the category column if it does not already exist
ALTER TABLE public.photos 
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'gallery' 
CHECK (category IN ('gallery', 'memories', 'members', 'general'));

-- 2. Create index for fast filtering by category and creation date
CREATE INDEX IF NOT EXISTS idx_photos_category_created 
ON public.photos (category, created_at DESC);

-- 3. Categorize all existing photos correctly based on their storage path
-- Gallery images are stored in the 'gallery/' storage folder
UPDATE public.photos 
SET category = 'gallery' 
WHERE storage_path LIKE 'gallery/%' OR category IS NULL OR category = '';

-- Memories images are stored in the 'memories/' storage folder
UPDATE public.photos 
SET category = 'memories' 
WHERE storage_path LIKE 'memories/%' OR storage_path LIKE '["memories/%' OR image_url LIKE '[%';
