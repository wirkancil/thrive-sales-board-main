-- Update handle_new_user function for automatic admin provisioning
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();