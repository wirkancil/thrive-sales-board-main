-- USER PROFILES (ensure table exists with needed columns)
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text check (role in ('admin','head','manager','staff')),
  division_id uuid,
  department_id uuid,
  team_id uuid,
  created_at timestamptz default now()
);

-- Enable RLS on profiles
alter table public.user_profiles enable row level security;

-- ORG TABLES (keep your current split, ensure presence)
create table if not exists public.divisions (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

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

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

-- OPTIONAL: auto-create profile on signup (default to 'staff')
create or replace function public.handle_new_user_profile()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.user_profiles(id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), 'staff')
  on conflict (id) do nothing;
  return new;
end$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user_profile();

-- ADMIN HELPER: is_admin()
create or replace function public.is_admin(u uuid default auth.uid())
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

grant execute on function public.is_admin(uuid) to authenticated;

-- RLS: Admin can select all profiles; others only self
drop policy if exists up_admin_or_self_select on public.user_profiles;
create policy up_admin_or_self_select
on public.user_profiles
for select
to authenticated
using ( public.is_admin(auth.uid()) or id = auth.uid() );

-- (Optional) allow self updates (non-admin)
drop policy if exists up_self_update on public.user_profiles;
create policy up_self_update
on public.user_profiles
for update
to authenticated
using (id = auth.uid());

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
   where (public.is_admin() or up.id = auth.uid())
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
  if not public.is_admin() then
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

-- Refresh PostgREST cache
select pg_notify('pgrst','reload schema');