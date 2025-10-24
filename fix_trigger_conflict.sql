-- Manual SQL script to fix trigger conflicts
-- Run this manually in Supabase Dashboard SQL Editor

-- Step 1: Drop conflicting triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Drop conflicting function
DROP FUNCTION IF EXISTS public.handle_new_user_profile() CASCADE;

-- Step 3: Create clean handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert to user_profiles with basic info
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    CASE 
      WHEN NEW.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com') THEN 'admin'
      ELSE 'sales_rep'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Step 4: Create single trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Verify the fix
SELECT 'Trigger conflict fixed successfully' as status;