-- Fix the admin_update_profile function to handle INSERT or UPDATE (UPSERT)
CREATE OR REPLACE FUNCTION public.admin_update_profile(p_id uuid, p_role text, p_division uuid DEFAULT NULL::uuid, p_department uuid DEFAULT NULL::uuid, p_team uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.check_is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  -- Insert or update user profile using UPSERT
  insert into public.user_profiles (id, full_name, role, division_id, department_id, team_id, is_active)
  values (
    p_id, 
    (select coalesce(raw_user_meta_data->>'full_name', email) from auth.users where id = p_id), 
    p_role, 
    p_division, 
    p_department, 
    p_team,
    true
  )
  on conflict (id) do update set
    role = excluded.role,
    division_id = excluded.division_id,
    department_id = excluded.department_id,
    team_id = excluded.team_id,
    is_active = excluded.is_active;

end;
$function$