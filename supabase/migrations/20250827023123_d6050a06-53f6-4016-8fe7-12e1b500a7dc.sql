-- Fix policies creation without IF NOT EXISTS by dropping then creating

-- 1) Ensure required table/columns
create table if not exists public.user_profiles (
  id uuid primary key,
  full_name text,
  role text,
  created_at timestamptz default now()
);

alter table public.user_profiles
  add column if not exists department_id uuid,
  add column if not exists division_id uuid;

-- 2) Enable RLS
alter table public.user_profiles enable row level security;

-- 3) Helper function for role checking (admin or dept head)
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

-- 4) Signup trigger to populate user_profiles
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
    'sales_rep'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

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

-- 5) RLS policies
-- Allow admins and department heads to read all
DROP POLICY IF EXISTS "Admins and dept heads can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins and dept heads can view all profiles"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_dept_head(auth.uid()));

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow admins and department heads to update any
DROP POLICY IF EXISTS "Admins and dept heads can update profiles" ON public.user_profiles;
CREATE POLICY "Admins and dept heads can update profiles"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_dept_head(auth.uid()))
  WITH CHECK (true);
