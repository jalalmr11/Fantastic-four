-- ==============================================================================
-- FANTASTIC FOUR - SUPABASE DATABASE & STORAGE SCHEMA
-- Production Security & Row Level Security (RLS) Configuration
-- ==============================================================================

-- 1. Create profiles table to track user roles securely
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Profiles RLS policies (Non-recursive):
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 1. Authenticated users can view their own profile (ZERO recursion)
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- 2. Only admins can update profiles (prevents normal users from elevating role)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can update profiles" ON public.profiles;
CREATE POLICY "Only admins can update profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Trigger to create a profile automatically when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'user' -- defaults to 'user'; first admin is promoted manually via SQL
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email, updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. Create photos table
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'gallery' CHECK (category IN ('gallery', 'memories', 'members', 'general')),
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for performant querying by category and creation time
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'gallery' CHECK (category IN ('gallery', 'memories', 'members', 'general'));
CREATE INDEX IF NOT EXISTS idx_photos_category_created ON public.photos (category, created_at DESC);

-- Enable RLS on photos
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Photos RLS Policies:
-- 1. Public can view (SELECT) all photos
DROP POLICY IF EXISTS "Public can view photos" ON public.photos;
CREATE POLICY "Public can view photos"
  ON public.photos
  FOR SELECT
  TO public
  USING (true);

-- 2. Only authenticated admins can insert photos
DROP POLICY IF EXISTS "Admins can insert photos" ON public.photos;
CREATE POLICY "Admins can insert photos"
  ON public.photos
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- 3. Only authenticated admins can update photos
DROP POLICY IF EXISTS "Admins can update photos" ON public.photos;
CREATE POLICY "Admins can update photos"
  ON public.photos
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Only authenticated admins can delete photos
DROP POLICY IF EXISTS "Admins can delete photos" ON public.photos;
CREATE POLICY "Admins can delete photos"
  ON public.photos
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 3. Storage Setup & Policies for 'website-photos' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('website-photos', 'website-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies:
-- 1. Public can read files in 'website-photos'
DROP POLICY IF EXISTS "Public can view website photos" ON storage.objects;
CREATE POLICY "Public can view website photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'website-photos');

-- 2. Only admins can upload files
DROP POLICY IF EXISTS "Admins can upload website photos" ON storage.objects;
CREATE POLICY "Admins can upload website photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'website-photos' AND public.is_admin());

-- 3. Only admins can update/replace files
DROP POLICY IF EXISTS "Admins can update website photos" ON storage.objects;
CREATE POLICY "Admins can update website photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'website-photos' AND public.is_admin())
  WITH CHECK (bucket_id = 'website-photos' AND public.is_admin());

-- 4. Only admins can delete files
DROP POLICY IF EXISTS "Admins can delete website photos" ON storage.objects;
CREATE POLICY "Admins can delete website photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'website-photos' AND public.is_admin());
