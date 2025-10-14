-- Add missing columns to user_profiles table
alter table public.user_profiles
  add column if not exists division_id uuid,
  add column if not exists department_id uuid,
  add column if not exists team_id uuid;

-- Update role constraint to include new roles
do $$
begin
  if exists (select 1 from information_schema.table_constraints where constraint_name = 'user_profiles_role_check') then
    alter table public.user_profiles drop constraint user_profiles_role_check;
  end if;
  
  alter table public.user_profiles 
    add constraint user_profiles_role_check 
    check (role in ('admin','head','manager','staff','sales_rep','account_manager'));
end$$;

-- Ensure departments.division_id exists + FK
alter table public.departments
  add column if not exists division_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'departments_division_fk'
  ) then
    alter table public.departments
      add constraint departments_division_fk
      foreign key (division_id) references public.divisions(id) on delete restrict;
  end if;
end$$;

create index if not exists idx_departments_division_id on public.departments(division_id);

-- ADMIN HELPER: check_is_admin() - new function name to avoid conflicts
create or replace function public.check_is_admin(u uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_profiles up
    where up.id = coalesce(u, auth.uid())
      and up.role = 'admin'
  );
$$;

grant execute on function public.check_is_admin(uuid) to authenticated;

-- RLS: Admin can select all profiles; others only self
drop policy if exists up_admin_or_self_select on public.user_profiles;
create policy up_admin_or_self_select
on public.user_profiles
for select
to authenticated
using ( public.check_is_admin(auth.uid()) or id = auth.uid() );

-- LIST USERS RPC (Admin sees all)
drop function if exists public.get_users_with_profiles(text,text);
create or replace function public.get_users_with_profiles(
  p_query text default null,   -- search by name/email
  p_role  text default null    -- exact role or null
)
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  division_id uuid,
  department_id uuid,
  team_id uuid
)
language sql
security definer
set search_path = public, auth
as $$
  select u.id,
         u.email,
         up.full_name,
         up.role,
         up.division_id,
         up.department_id,
         up.team_id
    from auth.users u
    join public.user_profiles up on up.id = u.id
   where (public.check_is_admin() or up.id = auth.uid())
     and (p_query is null or
          u.email ilike '%'||p_query||'%' or
          coalesce(up.full_name,'') ilike '%'||p_query||'%')
     and (p_role is null or up.role = p_role)
   order by coalesce(up.full_name, u.email);
$$;

grant execute on function public.get_users_with_profiles(text,text) to authenticated;

-- ADMIN UPDATE RPC (only Admin can change roles/units)
drop function if exists public.admin_update_profile(uuid,text,uuid,uuid,uuid);
create or replace function public.admin_update_profile(
  p_id uuid,
  p_role text,
  p_division uuid default null,
  p_department uuid default null,
  p_team uuid default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.check_is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  update public.user_profiles
     set role         = p_role,
         division_id  = p_division,
         department_id= p_department,
         team_id      = p_team
   where id = p_id;

  if not found then
    raise exception 'user_profile % not found', p_id using errcode = 'P0002';
  end if;
end;
$$;

grant execute on function public.admin_update_profile(uuid,text,uuid,uuid,uuid) to authenticated;

-- OPTIONAL helper to promote by email (run manually when needed)
create or replace function public.promote_to_admin(p_email text)
returns void language plpgsql security definer set search_path=public,auth as $$
declare v_id uuid;
begin
  select id into v_id from auth.users where email = p_email;
  if v_id is null then raise exception 'User % not found', p_email; end if;
  insert into public.user_profiles(id, role)
  values (v_id, 'admin')
  on conflict (id) do update set role='admin';
end$$;

grant execute on function public.promote_to_admin(text) to authenticated;