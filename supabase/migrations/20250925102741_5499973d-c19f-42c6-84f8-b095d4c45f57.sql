-- Drop and recreate get_users_with_profiles function with correct signature
DROP FUNCTION IF EXISTS public.get_users_with_profiles(text, text);

CREATE OR REPLACE FUNCTION public.get_users_with_profiles(
  p_query text DEFAULT NULL,
  p_role text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role role_enum,
  division_id uuid,
  department_id uuid,
  team_id uuid,
  title_id uuid,
  region_id uuid
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  select u.id,
         u.email,
         COALESCE(up.full_name, u.email) as full_name,
         COALESCE(up.role, 'account_manager'::role_enum) as role,
         up.division_id,
         up.department_id,
         up.team_id,
         up.title_id,
         up.region_id
    from auth.users u
    left join public.user_profiles up on up.id = u.id
   where (public.check_is_admin() or up.id = auth.uid())
     and (p_query is null or
          u.email ilike '%'||p_query||'%' or
          coalesce(up.full_name, u.email) ilike '%'||p_query||'%')
     and (p_role is null or 
          (p_role = 'pending' and up.role is null) or
          coalesce(up.role, 'account_manager'::role_enum)::text = p_role)
   order by coalesce(up.full_name, u.email);
$$;