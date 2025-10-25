-- Fix user profile trigger conflicts and clean up database schema
-- This migration resolves the 500 error when creating accounts

-- Step 1: Drop conflicting triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Drop the old handle_new_user_profile function that's conflicting
DROP FUNCTION IF EXISTS public.handle_new_user_profile() CASCADE;

-- Step 3: Drop the old profiles table that's no longer needed
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 4: Ensure we have the correct handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  -- Add all admin emails here
  admin_emails text[] := array['admin@gmail.com','hidayat.suli@gmail.com'];
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role, division_id, department_id, preferences, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    CASE WHEN NEW.email = ANY(admin_emails) THEN 'admin' ELSE 'sales_rep' END,
    NULL,
    NULL,
    '{}'::jsonb,
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET role = EXCLUDED.role,
      full_name = EXCLUDED.full_name,
      is_active = EXCLUDED.is_active;
  RETURN NEW;
END;
$$;

-- Step 5: Create the single, correct trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 6: Ensure user_profiles table has all necessary columns
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Step 7: Update existing user_profiles to ensure consistency
UPDATE public.user_profiles 
SET preferences = COALESCE(preferences, '{}'::jsonb),
    is_active = COALESCE(is_active, true)
WHERE preferences IS NULL OR is_active IS NULL;

-- Step 8: Refresh PostgREST cache
SELECT pg_notify('pgrst','reload schema');