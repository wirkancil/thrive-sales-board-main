-- Minimal fix for trigger conflicts
-- Only drops conflicting triggers and recreates the correct one

-- Drop conflicting triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop conflicting function if exists
DROP FUNCTION IF EXISTS public.handle_new_user_profile() CASCADE;

-- Create simple handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simple insert to user_profiles
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'sales_rep'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();