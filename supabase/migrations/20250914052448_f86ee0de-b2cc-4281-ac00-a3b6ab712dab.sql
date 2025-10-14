-- ============================================
-- 🔧 Admin User Management System Setup
-- ============================================

-- 1) Ensure columns exist in user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS division_id uuid,
  ADD COLUMN IF NOT EXISTS department_id uuid,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Update role constraint to include all roles
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('admin','department_head','division_head','account_manager','sales_rep'));

-- 2) Provision profile on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role, division_id, department_id, preferences, is_active)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
    'sales_rep', 
    NULL, 
    NULL, 
    '{}'::jsonb,
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM public;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3) Backfill missing profiles now
INSERT INTO public.user_profiles (id, full_name, role, preferences, is_active)
SELECT 
  u.id, 
  COALESCE(u.raw_user_meta_data->>'full_name', u.email), 
  'sales_rep', 
  '{}'::jsonb,
  true
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.id = u.id);

-- 4) Helper functions (security definer)
CREATE OR REPLACE FUNCTION public.current_user_role() 
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions AS $$ 
  SELECT role FROM public.user_profiles WHERE id = auth.uid(); 
$$;

CREATE OR REPLACE FUNCTION public.current_user_division_id() 
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions AS $$ 
  SELECT division_id FROM public.user_profiles WHERE id = auth.uid(); 
$$;

CREATE OR REPLACE FUNCTION public.current_user_department_id() 
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions AS $$ 
  SELECT department_id FROM public.user_profiles WHERE id = auth.uid(); 
$$;

ALTER FUNCTION public.current_user_role() OWNER TO postgres;
ALTER FUNCTION public.current_user_division_id() OWNER TO postgres;
ALTER FUNCTION public.current_user_department_id() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.current_user_role() FROM public;
REVOKE ALL ON FUNCTION public.current_user_division_id() FROM public;
REVOKE ALL ON FUNCTION public.current_user_department_id() FROM public;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_division_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_department_id() TO authenticated;

-- 5) Fresh RLS policies (non-recursive)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to refresh
DROP POLICY IF EXISTS "up_self_select" ON public.user_profiles;
DROP POLICY IF EXISTS "up_self_update" ON public.user_profiles;
DROP POLICY IF EXISTS "up_self_insert" ON public.user_profiles;
DROP POLICY IF EXISTS "up_admin_select" ON public.user_profiles;
DROP POLICY IF EXISTS "up_admin_update" ON public.user_profiles;
DROP POLICY IF EXISTS "up_vh_select" ON public.user_profiles;
DROP POLICY IF EXISTS "up_vh_update" ON public.user_profiles;
DROP POLICY IF EXISTS "up_dh_select" ON public.user_profiles;
DROP POLICY IF EXISTS "up_dh_update" ON public.user_profiles;

-- Self access
CREATE POLICY "up_self_select" ON public.user_profiles 
  FOR SELECT TO authenticated 
  USING (id = auth.uid());

CREATE POLICY "up_self_update" ON public.user_profiles 
  FOR UPDATE TO authenticated 
  USING (id = auth.uid()) 
  WITH CHECK (id = auth.uid());

CREATE POLICY "up_self_insert" ON public.user_profiles 
  FOR INSERT TO authenticated 
  WITH CHECK (id = auth.uid());

-- Admin full access
CREATE POLICY "up_admin_select" ON public.user_profiles 
  FOR SELECT TO authenticated 
  USING (public.current_user_role() = 'admin');

CREATE POLICY "up_admin_update" ON public.user_profiles 
  FOR UPDATE TO authenticated 
  USING (public.current_user_role() = 'admin') 
  WITH CHECK (true);

-- Division head scoped access
CREATE POLICY "up_vh_select" ON public.user_profiles 
  FOR SELECT TO authenticated 
  USING (
    public.current_user_role() = 'division_head' 
    AND division_id = public.current_user_division_id()
  );

CREATE POLICY "up_vh_update" ON public.user_profiles 
  FOR UPDATE TO authenticated 
  USING (
    public.current_user_role() = 'division_head' 
    AND division_id = public.current_user_division_id()
  ) 
  WITH CHECK (division_id = public.current_user_division_id());

-- Department head scoped access
CREATE POLICY "up_dh_select" ON public.user_profiles 
  FOR SELECT TO authenticated 
  USING (
    public.current_user_role() = 'department_head' 
    AND department_id = public.current_user_department_id()
  );

CREATE POLICY "up_dh_update" ON public.user_profiles 
  FOR UPDATE TO authenticated 
  USING (
    public.current_user_role() = 'department_head' 
    AND department_id = public.current_user_department_id()
  ) 
  WITH CHECK (department_id = public.current_user_department_id());

-- 6) RPC to update a profile (role + scope) — only admin allowed
CREATE OR REPLACE FUNCTION public.admin_update_profile(
  p_id uuid, 
  p_role text, 
  p_division uuid, 
  p_department uuid
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  IF public.current_user_role() <> 'admin' THEN
    RAISE EXCEPTION 'Forbidden: Only admins can update user profiles';
  END IF;
  
  UPDATE public.user_profiles
  SET 
    role = p_role,
    division_id = p_division,
    department_id = p_department
  WHERE id = p_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
END; $$;

ALTER FUNCTION public.admin_update_profile(uuid,text,uuid,uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.admin_update_profile(uuid,text,uuid,uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_update_profile(uuid,text,uuid,uuid) TO authenticated;

-- 7) Function to get users with profiles for admin view
CREATE OR REPLACE FUNCTION public.get_users_with_profiles()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
  division_id uuid,
  department_id uuid,
  division_name text,
  department_name text,
  is_active boolean,
  created_at timestamptz
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  IF public.current_user_role() <> 'admin' THEN
    RAISE EXCEPTION 'Forbidden: Only admins can view all user profiles';
  END IF;
  
  RETURN QUERY
  SELECT 
    up.id,
    au.email::text,
    up.full_name,
    up.role,
    up.division_id,
    up.department_id,
    d.name as division_name,
    dept.name as department_name,
    up.is_active,
    up.created_at
  FROM public.user_profiles up
  LEFT JOIN auth.users au ON au.id = up.id
  LEFT JOIN public.divisions d ON d.id = up.division_id
  LEFT JOIN public.departments dept ON dept.id = up.department_id
  ORDER BY up.created_at DESC;
END; $$;

ALTER FUNCTION public.get_users_with_profiles() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_users_with_profiles() FROM public;
GRANT EXECUTE ON FUNCTION public.get_users_with_profiles() TO authenticated;