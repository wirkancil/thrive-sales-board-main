-- Expand admin allowlist to include admin@company.com

-- Update ensure_admin_profile allowlist
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
  _uid := auth.uid();
  IF _uid IS NULL THEN
    RETURN;
  END IF;

  SELECT u.email, COALESCE(u.raw_user_meta_data->>'full_name', u.email)
    INTO _email, _full_name
  FROM auth.users u
  WHERE u.id = _uid;

  IF _email IS NULL THEN
    RETURN;
  END IF;

  IF LOWER(_email) IN (
    'admin@gmail.com',
    'hidayat.suli@gmail.com',
    'admin@company.com'
  ) THEN
    INSERT INTO public.user_profiles (id, user_id, full_name, role, is_active)
    VALUES (_uid, _uid, _full_name, 'admin', true)
    ON CONFLICT (user_id)
    DO UPDATE SET
      role = 'admin',
      full_name = EXCLUDED.full_name,
      is_active = true,
      updated_at = now();
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_admin_profile() TO authenticated;

-- Update provisioning function allowlist
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name text;
  v_email text;
  v_role role_enum;
BEGIN
  v_email := NEW.email;
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  IF LOWER(v_email) IN ('admin@gmail.com','hidayat.suli@gmail.com','admin@company.com') THEN
    v_role := 'admin';
  ELSE
    v_role := 'account_manager';
  END IF;

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
    v_role,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Backfill: promote existing allowlisted emails to admin
UPDATE public.user_profiles
SET role = 'admin', updated_at = now()
WHERE lower(email) IN ('admin@gmail.com','hidayat.suli@gmail.com','admin@company.com')
  AND role <> 'admin';