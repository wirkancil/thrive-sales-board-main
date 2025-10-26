-- Bootstrap admin profile for known admin emails (security definer)
CREATE OR REPLACE FUNCTION public.ensure_admin_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid;
  _email text;
  _full_name text;
BEGIN
  -- Get current user id
  _uid := auth.uid();
  IF _uid IS NULL THEN
    RETURN;
  END IF;

  -- Fetch email and full_name from auth.users (allowed in security definer)
  SELECT u.email, COALESCE(u.raw_user_meta_data->>'full_name', u.email)
    INTO _email, _full_name
  FROM auth.users u
  WHERE u.id = _uid;

  IF _email IS NULL THEN
    RETURN;
  END IF;

  -- Allowlist of admin emails (can be extended via migration later)
  IF LOWER(_email) IN (
    'admin@gmail.com',
    'hidayat.suli@gmail.com'
  ) THEN
    -- Ensure a user_profiles row exists and promote to admin
    INSERT INTO public.user_profiles (id, user_id, full_name, role, is_active)
    VALUES (_uid, _uid, _full_name, 'admin', true)
    ON CONFLICT (user_id)
    DO UPDATE SET
      role = 'admin',
      full_name = EXCLUDED.full_name,
      is_active = true;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_admin_profile() TO authenticated;