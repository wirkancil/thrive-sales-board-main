-- Patch: recognize admin allowlist on user provisioning

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

  -- Determine initial role based on allowlist
  IF LOWER(v_email) IN ('admin@gmail.com','hidayat.suli@gmail.com') THEN
    v_role := 'admin';
  ELSE
    v_role := 'account_manager';
  END IF;

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
    v_role,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Promote existing allowlisted users to admin if needed
UPDATE public.user_profiles
SET role = 'admin'
WHERE lower(email) IN ('admin@gmail.com','hidayat.suli@gmail.com')
  AND role <> 'admin';