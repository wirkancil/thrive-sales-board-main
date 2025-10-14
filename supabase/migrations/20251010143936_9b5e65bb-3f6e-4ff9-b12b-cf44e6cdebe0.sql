-- Fix admin_update_profile and enforce_user_hierarchy functions
-- These functions might be trying to set old role values

-- Update admin_update_profile to ensure it validates roles correctly
CREATE OR REPLACE FUNCTION public.admin_update_profile(
  p_id uuid,
  p_role text,
  p_division uuid DEFAULT NULL,
  p_department uuid DEFAULT NULL,
  p_team uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT public.check_is_admin() THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;

  -- Validate that the role is one of the valid enum values
  IF p_role NOT IN ('admin', 'head', 'manager', 'account_manager') THEN
    RAISE EXCEPTION 'Invalid role. Must be one of: admin, head, manager, account_manager';
  END IF;

  -- Insert or update user profile using UPSERT with proper enum casting
  INSERT INTO public.user_profiles (
    id,
    full_name,
    role,
    division_id,
    department_id,
    team_id,
    is_active
  )
  VALUES (
    p_id,
    (SELECT COALESCE(raw_user_meta_data->>'full_name', email) FROM auth.users WHERE id = p_id),
    p_role::role_enum,
    p_division,
    p_department,
    p_team,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    division_id = EXCLUDED.division_id,
    department_id = EXCLUDED.department_id,
    team_id = EXCLUDED.team_id,
    is_active = EXCLUDED.is_active;
END;
$$;

-- Update enforce_user_hierarchy to not reference old roles
CREATE OR REPLACE FUNCTION public.enforce_user_hierarchy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Role-based hierarchy validation using only valid enum values
  IF NEW.role = 'account_manager' THEN
    -- AM must have a manager assigned
    IF NEW.department_id IS NULL THEN
      RAISE EXCEPTION 'Account Manager must be assigned to a Manager';
    END IF;
    
    -- Auto-inherit head_id and entity_id from manager
    SELECT head_id, entity_id INTO NEW.head_id, NEW.entity_id
    FROM public.user_profiles
    WHERE id = NEW.department_id AND role = 'manager';
    
  ELSIF NEW.role = 'manager' THEN
    -- Manager must have a head assigned
    IF NEW.head_id IS NULL THEN
      RAISE EXCEPTION 'Manager must be assigned to a Head';
    END IF;
    
    -- Auto-inherit entity_id from head
    SELECT entity_id INTO NEW.entity_id
    FROM public.user_profiles
    WHERE id = NEW.head_id AND role = 'head';
    
  ELSIF NEW.role = 'head' THEN
    -- Head must have entity_id in multi-entity mode
    DECLARE
      entity_mode JSONB;
    BEGIN
      SELECT setting_value INTO entity_mode
      FROM public.system_settings
      WHERE setting_key = 'entity_mode';
      
      IF entity_mode->>'mode' = 'multi' AND NEW.entity_id IS NULL THEN
        RAISE EXCEPTION 'Head must be assigned to an Entity in multi-entity mode';
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;