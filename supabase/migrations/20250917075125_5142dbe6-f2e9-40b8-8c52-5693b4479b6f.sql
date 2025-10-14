-- Update get_users_with_profiles function to show ALL users including those without profiles
CREATE OR REPLACE FUNCTION public.get_users_with_profiles(p_query text DEFAULT NULL::text, p_role text DEFAULT NULL::text)
RETURNS TABLE(id uuid, email text, full_name text, role text, division_id uuid, department_id uuid, team_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
  select u.id,
         u.email,
         COALESCE(up.full_name, u.email) as full_name,
         COALESCE(up.role, 'pending') as role,
         up.division_id,
         up.department_id,
         up.team_id
    from auth.users u
    left join public.user_profiles up on up.id = u.id
   where (public.check_is_admin() or up.id = auth.uid())
     and (p_query is null or
          u.email ilike '%'||p_query||'%' or
          coalesce(up.full_name, u.email) ilike '%'||p_query||'%')
     and (p_role is null or coalesce(up.role, 'pending') = p_role)
   order by coalesce(up.full_name, u.email);
$function$;

-- Update admin_update_profile to handle users without profiles
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

  -- Insert or update user profile
  insert into public.user_profiles (id, full_name, role, division_id, department_id, team_id, is_active)
  values (
    p_id, 
    (select email from auth.users where id = p_id), 
    p_role, 
    p_division, 
    p_department, 
    null, 
    true
  )
  on conflict (id) do update set
    role = excluded.role,
    division_id = excluded.division_id,
    department_id = excluded.department_id,
    team_id = null;  -- Always set to NULL since teams are eliminated

  if not found and not exists (select 1 from public.user_profiles where id = p_id) then
    raise exception 'failed to create or update user_profile for %', p_id using errcode = 'P0002';
  end if;
end;
$function$;