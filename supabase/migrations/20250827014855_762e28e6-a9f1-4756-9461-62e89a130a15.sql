-- 1) Ensure required columns on user_profiles
create table if not exists public.user_profiles (
  id uuid primary key,
  full_name text,
  role text,
  created_at timestamptz default now()
);

alter table public.user_profiles
  add column if not exists department_id uuid,
  add column if not exists division_id uuid;

-- 2) Enable RLS (idempotent)
alter table public.user_profiles enable row level security;

-- 3) Function to check admin or department head (updated to use user_profiles)
create or replace function public.is_admin_or_dept_head(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_profiles p
    where p.id = is_admin_or_dept_head.user_id
      and (p.role = 'department_head' or p.role = 'admin')
  );
$$;

-- 4) Signup trigger to populate user_profiles on new users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'sales_rep' -- default role; can be adjusted by admins later
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_user_profiles'
  ) THEN
    CREATE TRIGGER on_auth_user_created_user_profiles
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END $$;

-- 5) Policies: own read (keep existing), add admin/department_head read, and update policies
-- Allow admins and department heads to select all profiles
create policy if not exists "Admins and dept heads can view all profiles"
  on public.user_profiles
  for select
  to authenticated
  using (public.is_admin_or_dept_head(auth.uid()));

-- Allow users to update their own profile
create policy if not exists "Users can update own profile"
  on public.user_profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Allow admins and department heads to update any profile
create policy if not exists "Admins and dept heads can update profiles"
  on public.user_profiles
  for update
  to authenticated
  using (public.is_admin_or_dept_head(auth.uid()))
  with check (true);
