-- 0) Extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- 1) First ensure user_profiles has the right structure
alter table public.user_profiles add column if not exists department_id uuid;
alter table public.user_profiles add column if not exists division_id uuid;

-- Update role check constraint to include new roles
alter table public.user_profiles drop constraint if exists user_profiles_role_check;  
alter table public.user_profiles add constraint user_profiles_role_check check (role in ('admin','department_head','division_head','account_manager','sales_rep'));

-- 2) SECURITY DEFINER helper functions (non-recursive)
create or replace function public.current_user_role()
returns text language sql stable security definer
set search_path = public, extensions
as $$ select role from public.user_profiles where id = auth.uid(); $$;

create or replace function public.current_user_department_id()
returns uuid language sql stable security definer
set search_path = public, extensions
as $$ select department_id from public.user_profiles where id = auth.uid(); $$;

create or replace function public.current_user_division_id()
returns uuid language sql stable security definer
set search_path = public, extensions
as $$ select division_id from public.user_profiles where id = auth.uid(); $$;

create or replace function public.role_of(user_id uuid)
returns text language sql stable security definer
set search_path = public, extensions
as $$ select role from public.user_profiles where id = user_id; $$;

-- Set function ownership and permissions
alter function public.current_user_role() owner to postgres;
alter function public.current_user_department_id() owner to postgres;
alter function public.current_user_division_id() owner to postgres;
alter function public.role_of(uuid) owner to postgres;

revoke all on function public.current_user_role() from public;
revoke all on function public.current_user_department_id() from public;
revoke all on function public.current_user_division_id() from public;
revoke all on function public.role_of(uuid) from public;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_user_department_id() to authenticated;
grant execute on function public.current_user_division_id() to authenticated;
grant execute on function public.role_of(uuid) to authenticated;

-- 3) SALES TARGETS table (hierarchical assignments)
drop table if exists public.sales_targets cascade;

create table public.sales_targets (
  id uuid primary key default uuid_generate_v4(),
  created_by uuid not null references auth.users(id) on delete cascade,
  assigned_to uuid not null references auth.users(id) on delete cascade,
  department_id uuid,
  division_id uuid,
  measure text not null,
  amount numeric not null,
  period_start date not null,
  period_end date not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.tg_sales_targets_touch()
returns trigger language plpgsql security definer set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;

create trigger sales_targets_touch before update on public.sales_targets 
for each row execute procedure public.tg_sales_targets_touch();

alter table public.sales_targets enable row level security;

-- 4) RLS for sales_targets (Admin full; DH/VH scoped; AM/Sales read-only)
-- Admin: full read/write
create policy "st_admin_all" on public.sales_targets for all to authenticated
using (public.current_user_role() = 'admin') with check (true);

-- Department Head: SELECT within own department
create policy "st_dh_select" on public.sales_targets for select to authenticated
using (
  public.current_user_role() = 'department_head' and department_id = public.current_user_department_id()
);

-- Department Head: INSERT only to Division Heads in own department
create policy "st_dh_insert" on public.sales_targets for insert to authenticated
with check (
  public.current_user_role() = 'department_head'
  and department_id = public.current_user_department_id()
  and public.role_of(assigned_to) = 'division_head'
);

-- Department Head: UPDATE only targets they created in their department
create policy "st_dh_update" on public.sales_targets for update to authenticated
using (
  public.current_user_role() = 'department_head'
  and department_id = public.current_user_department_id()
  and created_by = auth.uid()
) with check (
  department_id = public.current_user_department_id()
);

-- Department Head: DELETE only targets they created in their department
create policy "st_dh_delete" on public.sales_targets for delete to authenticated
using (
  public.current_user_role() = 'department_head'
  and department_id = public.current_user_department_id()
  and created_by = auth.uid()
);

-- Division Head: SELECT within own division
create policy "st_vh_select" on public.sales_targets for select to authenticated
using (
  public.current_user_role() = 'division_head' and division_id = public.current_user_division_id()
);

-- Division Head: INSERT only to AM/Sales in own division
create policy "st_vh_insert" on public.sales_targets for insert to authenticated
with check (
  public.current_user_role() = 'division_head'
  and division_id = public.current_user_division_id()
  and public.role_of(assigned_to) in ('account_manager','sales_rep')
);

-- Division Head: UPDATE only targets they created in their division
create policy "st_vh_update" on public.sales_targets for update to authenticated
using (
  public.current_user_role() = 'division_head'
  and division_id = public.current_user_division_id()
  and created_by = auth.uid()
) with check (
  division_id = public.current_user_division_id()
);

-- Division Head: DELETE only targets they created in their division
create policy "st_vh_delete" on public.sales_targets for delete to authenticated
using (
  public.current_user_role() = 'division_head'
  and division_id = public.current_user_division_id()
  and created_by = auth.uid()
);

-- AM/Sales: read only targets assigned to self
create policy "st_self_select" on public.sales_targets for select to authenticated
using (assigned_to = auth.uid());

-- 5) Acceptance checks
select relname, relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname='public' and relname in ('user_profiles','sales_targets');
select policyname, tablename from pg_policies where schemaname='public' and tablename in ('user_profiles','sales_targets') order by tablename, policyname;