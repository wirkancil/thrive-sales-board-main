-- Auto-provision user_profiles on new auth.users
-- and provide RPC for admin approvals

-- Function: handle new auth user insert -> user_profiles
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name text;
  v_email text;
BEGIN
  v_email := NEW.email;
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Insert default profile for new user
  INSERT INTO public.user_profiles (
    user_id,
    email,
    full_name,
    role,
    is_active
  )
  VALUES (
    NEW.id,
    v_email,
    COALESCE(v_full_name, split_part(NEW.email, '@', 1)),
    'account_manager',
    true
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger: after insert on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

-- Backfill existing auth.users without profiles
INSERT INTO public.user_profiles (user_id, email, full_name, role, is_active)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  'account_manager',
  true
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles up WHERE up.user_id = u.id
);

-- RPC: admin_update_profile to approve role/division/department
CREATE OR REPLACE FUNCTION public.admin_update_profile(
  p_id uuid,
  p_role role_enum,
  p_division uuid DEFAULT NULL,
  p_department uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE id = p_id) INTO v_exists;
  IF NOT v_exists THEN
    RETURN FALSE;
  END IF;

  UPDATE public.user_profiles
  SET 
    role = p_role,
    division_id = p_division,
    department_id = p_department,
    updated_at = now()
  WHERE id = p_id;

  RETURN TRUE;
END;
$$;