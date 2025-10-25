-- Safe fix for user profile trigger conflicts
-- This migration only fixes the trigger conflict without dropping tables

-- Step 1: Drop conflicting triggers (safe operation)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Drop conflicting function if exists
DROP FUNCTION IF EXISTS public.handle_new_user_profile() CASCADE;

-- Step 3: Create or replace the correct handle_new_user function
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
  -- Only insert if user_profiles table exists and has the right structure
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
  ) THEN
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
  END IF;
  RETURN NEW;
END;
$$;

-- Step 4: Create the single, correct trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 5: Add columns safely if they don't exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
  ) THEN
    -- Add preferences column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'preferences'
    ) THEN
      ALTER TABLE public.user_profiles ADD COLUMN preferences jsonb DEFAULT '{}'::jsonb;
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'is_active'
    ) THEN
      ALTER TABLE public.user_profiles ADD COLUMN is_active boolean DEFAULT true;
    END IF;
    
    -- Update existing records safely
    UPDATE public.user_profiles 
    SET preferences = COALESCE(preferences, '{}'::jsonb),
        is_active = COALESCE(is_active, true)
    WHERE preferences IS NULL OR is_active IS NULL;
  END IF;
END $$;

-- Step 6: Refresh PostgREST cache
SELECT pg_notify('pgrst','reload schema');