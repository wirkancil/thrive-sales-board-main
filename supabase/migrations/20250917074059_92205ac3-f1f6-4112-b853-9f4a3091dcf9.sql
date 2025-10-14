-- Refactor role structure: rename roles and remove teams
-- Step 1: Update existing roles in user_profiles
UPDATE public.user_profiles 
SET role = CASE 
  WHEN role = 'head' THEN 'division_head'
  WHEN role = 'manager' THEN 'department_manager' 
  WHEN role = 'sales_rep' THEN 'account_manager'
  ELSE role
END;

UPDATE public.user_profiles 
SET new_role = CASE 
  WHEN new_role = 'head' THEN 'division_head'
  WHEN new_role = 'manager' THEN 'department_manager'
  WHEN new_role = 'sales_rep' THEN 'account_manager'
  ELSE new_role
END;

-- Step 2: Remove team assignments since teams are being eliminated
UPDATE public.user_profiles SET team_id = NULL;

-- Step 3: Drop team foreign key constraint
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS fk_user_profiles_team;

-- Step 4: Update role-based functions to use new role names
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $function$ 
  select role from public.user_profiles where id = auth.uid(); 
$function$;

CREATE OR REPLACE FUNCTION public.is_division_head(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles p
    WHERE p.id = is_division_head.user_id AND p.role = 'division_head'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_department_manager(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles p
    WHERE p.id = is_department_manager.user_id AND p.role = 'department_manager'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_manager_or_above()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT new_role IN ('admin', 'division_head', 'department_manager') FROM public.user_profiles WHERE id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.is_head_or_above()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT new_role IN ('admin', 'division_head') FROM public.user_profiles WHERE id = auth.uid();
$function$;

-- Step 5: Update admin_update_profile function to remove team parameter
CREATE OR REPLACE FUNCTION public.admin_update_profile(p_id uuid, p_role text, p_division uuid DEFAULT NULL::uuid, p_department uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  if not public.check_is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  update public.user_profiles
     set role         = p_role,
         division_id  = p_division,
         department_id= p_department,
         team_id      = NULL  -- Always set to NULL since teams are eliminated
   where id = p_id;

  if not found then
    raise exception 'user_profile % not found', p_id using errcode = 'P0002';
  end if;
end;
$function$;

-- Step 6: Update sales targets policies for new role names
DROP POLICY IF EXISTS st_self_select ON public.sales_targets;
CREATE POLICY st_self_select ON public.sales_targets
FOR SELECT USING (
  (role_of(auth.uid()) = 'account_manager') AND (assigned_to = auth.uid())
);

DROP POLICY IF EXISTS st_self_update_progress ON public.sales_targets;
CREATE POLICY st_self_update_progress ON public.sales_targets
FOR UPDATE USING (
  (role_of(auth.uid()) = 'account_manager') AND (assigned_to = auth.uid())
) 
WITH CHECK (
  (role_of(auth.uid()) = 'account_manager') AND (assigned_to = auth.uid())
);

DROP POLICY IF EXISTS st_vh_select ON public.sales_targets;
CREATE POLICY st_vh_select ON public.sales_targets
FOR SELECT USING (
  (current_user_role() = 'division_head') AND (division_id = current_user_division_id())
);

DROP POLICY IF EXISTS st_vh_update ON public.sales_targets;
CREATE POLICY st_vh_update ON public.sales_targets
FOR UPDATE USING (
  (current_user_role() = 'division_head') AND (division_id = current_user_division_id()) AND (created_by = auth.uid())
)
WITH CHECK (
  (current_user_role() = 'division_head') AND (division_id = current_user_division_id())
);

DROP POLICY IF EXISTS st_vh_delete ON public.sales_targets;
CREATE POLICY st_vh_delete ON public.sales_targets
FOR DELETE USING (
  (current_user_role() = 'division_head') AND (division_id = current_user_division_id()) AND (created_by = auth.uid())
);

DROP POLICY IF EXISTS st_dh_select ON public.sales_targets;
CREATE POLICY st_dh_select ON public.sales_targets
FOR SELECT USING (
  (current_user_role() = 'department_manager') AND (department_id = current_user_department_id())
);

DROP POLICY IF EXISTS st_dh_update ON public.sales_targets;
CREATE POLICY st_dh_update ON public.sales_targets
FOR UPDATE USING (
  (current_user_role() = 'department_manager') AND (department_id = current_user_department_id()) AND (created_by = auth.uid())
)
WITH CHECK (
  (current_user_role() = 'department_manager') AND (department_id = current_user_department_id())
);

DROP POLICY IF EXISTS st_dh_delete ON public.sales_targets;
CREATE POLICY st_dh_delete ON public.sales_targets
FOR DELETE USING (
  (current_user_role() = 'department_manager') AND (department_id = current_user_department_id()) AND (created_by = auth.uid())
);

-- Step 7: Update other policies that reference old role names
DROP POLICY IF EXISTS teams_manager_department ON public.teams;
CREATE POLICY teams_department_manager ON public.teams
FOR ALL USING (
  (current_user_role() = 'department_manager') AND (EXISTS ( 
    SELECT 1 FROM departments d
    WHERE ((d.id = teams.department_id) AND (d.id = current_user_department_id()))
  ))
)
WITH CHECK (
  (current_user_role() = 'department_manager') AND (EXISTS ( 
    SELECT 1 FROM departments d
    WHERE ((d.id = teams.department_id) AND (d.id = current_user_department_id()))
  ))
);

DROP POLICY IF EXISTS departments_update_policy ON public.departments;
CREATE POLICY departments_update_policy ON public.departments
FOR UPDATE USING (
  current_user_role() = ANY (ARRAY['admin'::text, 'department_manager'::text])
)
WITH CHECK (
  current_user_role() = ANY (ARRAY['admin'::text, 'department_manager'::text])
);

DROP POLICY IF EXISTS departments_insert_policy ON public.departments;
CREATE POLICY departments_insert_policy ON public.departments
FOR INSERT 
WITH CHECK (
  current_user_role() = ANY (ARRAY['admin'::text, 'department_manager'::text])
);