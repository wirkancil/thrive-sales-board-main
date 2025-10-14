-- Fix ALL remaining functions that use old role names
-- This is a comprehensive fix for: division_head, department_head, department_manager

-- 1. Fix can_access_contact function
CREATE OR REPLACE FUNCTION public.can_access_contact(contact_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- User can access their own contacts
    SELECT 1 WHERE contact_user_id = auth.uid()
    
    UNION
    
    -- Heads can access contacts from users in their entity
    SELECT 1 
    FROM user_profiles curr_user, user_profiles contact_owner
    WHERE curr_user.id = auth.uid()
      AND contact_owner.id = contact_user_id
      AND curr_user.role = 'head'
      AND curr_user.entity_id = contact_owner.entity_id
    
    UNION
    
    -- Managers can access contacts from users in their department/team
    SELECT 1 
    FROM user_profiles curr_user, user_profiles contact_owner
    WHERE curr_user.id = auth.uid()
      AND contact_owner.id = contact_user_id
      AND curr_user.role = 'manager'
      AND curr_user.department_id = contact_owner.department_id
  );
$$;

-- 2. Fix dept_head_can_update_profile function  
CREATE OR REPLACE FUNCTION public.dept_head_can_update_profile(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles curr
    JOIN public.user_profiles target ON target.id = dept_head_can_update_profile.target_user_id
    WHERE curr.id = auth.uid()
      AND curr.role = 'manager'
      AND curr.department_id IS NOT NULL
      AND curr.department_id = target.department_id
  );
$$;

-- 3. Fix enforce_user_profile_role_change function
CREATE OR REPLACE FUNCTION public.enforce_user_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only enforce when role is being changed
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Admins can set any role
    IF public.is_admin(auth.uid()) THEN
      RETURN NEW;
    END IF;

    -- Managers can only set roles within their department and limited to account_manager
    IF public.dept_head_can_update_profile(NEW.id) AND NEW.role IN ('account_manager') THEN
      RETURN NEW;
    END IF;

    -- Everyone else cannot change roles
    RAISE EXCEPTION 'Insufficient privileges to change role';
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Fix get_admin_users function
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE(
  id uuid,
  full_name text,
  email text,
  role text,
  division_id uuid,
  department_id uuid,
  created_at timestamp with time zone
)
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

  SELECT p.role::text INTO current_user_role
  FROM public.user_profiles p
  WHERE p.id = current_user_id;

  IF current_user_role NOT IN ('admin', 'manager', 'head') THEN
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

-- 5. Fix handle_dept_head_signup function
CREATE OR REPLACE FUNCTION public.handle_dept_head_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user email suggests they should be a manager
  IF NEW.email LIKE '%dept%' OR NEW.email LIKE '%department%' OR NEW.email LIKE '%head%' OR NEW.email LIKE '%manager%' THEN
    -- Update the profile to manager role
    UPDATE public.user_profiles 
    SET role = 'manager', is_active = true
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Fix create_deal_from_activity function
CREATE OR REPLACE FUNCTION public.create_deal_from_activity(
  p_activity_id uuid,
  p_value_idr numeric,
  p_status text DEFAULT 'warm',
  p_opportunity_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a record;
  new_id uuid;
  me record;
BEGIN
  -- Get current user profile
  SELECT * INTO me FROM user_profiles WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Fetch activity created by me or within my team (for heads/managers/admin)
  SELECT sa.*, sa.user_id as activity_user_id
  INTO a
  FROM sales_activity sa
  JOIN user_profiles creator ON creator.id = sa.user_id
  WHERE sa.id = p_activity_id
    AND (
      sa.user_id = auth.uid()
      OR (me.role IN ('head', 'manager', 'admin')
          AND (me.entity_id = creator.entity_id OR me.department_id = creator.department_id))
    )
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Activity not found or access denied';
  END IF;

  -- Insert deal
  INSERT INTO deals (
    company_name,
    deal_value,
    contact_person,
    stage,
    status,
    notes,
    user_id,
    created_by,
    created_from_activity_id,
    value_idr
  )
  VALUES (
    a.customer_name,
    COALESCE(p_value_idr, 0),
    a.customer_name,
    'Lead',
    p_status,
    a.notes,
    auth.uid(),
    auth.uid(),
    p_activity_id,
    COALESCE(p_value_idr, 0)
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;