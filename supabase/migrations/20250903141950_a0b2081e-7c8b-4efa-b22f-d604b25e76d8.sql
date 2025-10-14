-- Temporarily disable the trigger to allow role migration
ALTER TABLE public.user_profiles DISABLE TRIGGER ALL;

-- Update existing sales_rep roles to account_manager
UPDATE public.user_profiles 
SET role = 'account_manager' 
WHERE role = 'sales_rep';

-- Re-enable the trigger
ALTER TABLE public.user_profiles ENABLE TRIGGER ALL;

-- Update database functions to use account_manager instead of sales_rep
CREATE OR REPLACE FUNCTION public.enforce_user_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only enforce when role is being changed
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Admins can set any role
    IF public.is_admin(auth.uid()) THEN
      RETURN NEW;
    END IF;

    -- Department heads can only set roles within their department and limited to account_manager/division_head
    IF public.dept_head_can_update_profile(NEW.id) AND NEW.role IN ('account_manager','division_head') THEN
      RETURN NEW;
    END IF;

    -- Everyone else cannot change roles
    RAISE EXCEPTION 'Insufficient privileges to change role';
  END IF;

  RETURN NEW;
END;
$function$;

-- Update RLS policies that reference sales_rep
DROP POLICY IF EXISTS "Account managers can create companies" ON public.companies;
CREATE POLICY "Account managers can create companies" 
ON public.companies 
FOR INSERT 
WITH CHECK ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['account_manager'::text, 'division_head'::text, 'department_head'::text, 'admin'::text]))))) AND (created_by = auth.uid()));

DROP POLICY IF EXISTS "Account managers can create customer contacts" ON public.customer_contacts;
CREATE POLICY "Account managers can create customer contacts" 
ON public.customer_contacts 
FOR INSERT 
WITH CHECK ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['account_manager'::text, 'division_head'::text, 'department_head'::text, 'admin'::text]))))) AND (created_by = auth.uid()));

DROP POLICY IF EXISTS "Account managers can create customer org units" ON public.customer_org_units;
CREATE POLICY "Account managers can create customer org units" 
ON public.customer_org_units 
FOR INSERT 
WITH CHECK ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['account_manager'::text, 'division_head'::text, 'department_head'::text, 'admin'::text]))))) AND (created_by = auth.uid()));

-- Update the handle_new_user function to set default role as account_manager
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  insert into public.user_profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'account_manager'
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;