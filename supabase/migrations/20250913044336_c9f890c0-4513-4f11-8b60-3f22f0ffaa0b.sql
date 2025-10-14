-- Fix remaining recursion issues in user_profiles policies
-- Drop all existing policies and create simple, non-recursive ones
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Dept heads can view department profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Division heads can view division profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Dept heads can update department profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Create simple, non-recursive policies
-- Users can always view and update their own profile
CREATE POLICY "Users can view own profile" 
  ON public.user_profiles 
  FOR SELECT 
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile" 
  ON public.user_profiles 
  FOR UPDATE 
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile" 
  ON public.user_profiles 
  FOR INSERT 
  WITH CHECK (id = auth.uid());

-- Allow admins and department heads full access through a separate admin function
-- Create a function that checks admin access without querying user_profiles recursively
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE(id uuid, full_name text, email text, role text, division_id uuid, department_id uuid, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  current_user_role text;
BEGIN
  SELECT auth.uid() INTO current_user_id;
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT p.role INTO current_user_role
  FROM public.user_profiles p
  WHERE p.id = current_user_id;

  IF current_user_role NOT IN ('admin', 'department_head', 'division_head') THEN
    RAISE EXCEPTION 'Insufficient privileges to view user profiles' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    (au.email)::text AS email,
    (p.role)::text AS role,
    p.division_id,
    p.department_id,
    p.created_at
  FROM public.user_profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  ORDER BY p.created_at DESC;
END;
$$;

-- Set up the user to be a department head if email contains 'head'
-- First check if hidayat.suli@gmail.com exists and update their role
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'hidayat.suli@gmail.com') THEN
    INSERT INTO public.user_profiles (id, full_name, role, is_active)
    SELECT 
      id, 
      COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
      'department_head' as role,
      true as is_active
    FROM auth.users 
    WHERE email = 'hidayat.suli@gmail.com'
    ON CONFLICT (id) DO UPDATE SET 
      role = 'department_head',
      is_active = true;
  END IF;
END $$;