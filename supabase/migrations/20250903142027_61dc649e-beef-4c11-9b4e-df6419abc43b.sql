-- Simple approach: just update the functions and policies, data update will be manual if needed
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