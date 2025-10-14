-- Preflight: Ensure extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Drop old tables (if exist)
drop table if exists user_profiles cascade;
drop table if exists deals cascade;
drop table if exists sales_activity cascade;
drop table if exists reports cascade;
drop table if exists events cascade;
drop table if exists contacts cascade;
drop table if exists analytics cascade;

-- Create tables
-- user_profiles
create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text check (role in ('sales_rep','manager','admin')) not null,
  department text,
  preferences jsonb,
  created_at timestamptz default now()
);

alter table public.user_profiles enable row level security;

create policy "Users can view own profile"
  on public.user_profiles for select to authenticated
  using (id = auth.uid());

-- deals (sales pipeline)
create table public.deals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  company_name text not null,
  contact_person text,
  contact_email text,
  deal_value numeric not null,
  stage text check (stage in ('Lead','Contacted','Proposal Sent','Negotiation','Won','Lost')) default 'Lead',
  status text check (status in ('Hot','Warm','Cold')) default 'Warm',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.update_deals_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;$$ language plpgsql;

create trigger deals_updated_at_trigger
before update on public.deals
for each row execute procedure public.update_deals_updated_at();

alter table public.deals enable row level security;

create policy "User can read their own deals" on public.deals for select to authenticated using (user_id = auth.uid());
create policy "User can insert own deals" on public.deals for insert to authenticated with check (user_id = auth.uid());
create policy "User can update their own deals" on public.deals for update to authenticated using (user_id = auth.uid());
create policy "User can delete their own deals" on public.deals for delete to authenticated using (user_id = auth.uid());

-- sales_activity
create table public.sales_activity (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  activity_type text check (activity_type in ('Call','Meeting','Email','Follow-up')) not null,
  customer_name text not null,
  notes text,
  activity_time timestamptz not null,
  created_at timestamptz default now()
);

alter table public.sales_activity enable row level security;

create policy "User can read own activities" on public.sales_activity for select to authenticated using (user_id = auth.uid());
create policy "User can insert own activities" on public.sales_activity for insert to authenticated with check (user_id = auth.uid());
create policy "User can update own activities" on public.sales_activity for update to authenticated using (user_id = auth.uid());
create policy "User can delete own activities" on public.sales_activity for delete to authenticated using (user_id = auth.uid());

-- reports
create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  summary text,
  period_start date,
  period_end date,
  generated_at timestamptz default now()
);

alter table public.reports enable row level security;

create policy "User can read own reports" on public.reports for select to authenticated using (user_id = auth.uid());
create policy "User can insert own reports" on public.reports for insert to authenticated with check (user_id = auth.uid());
create policy "User can update own reports" on public.reports for update to authenticated using (user_id = auth.uid());
create policy "User can delete own reports" on public.reports for delete to authenticated using (user_id = auth.uid());

-- events
create table public.events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  description text,
  event_time timestamptz not null,
  location text,
  created_at timestamptz default now()
);

alter table public.events enable row level security;

create policy "User can read own events" on public.events for select to authenticated using (user_id = auth.uid());
create policy "User can insert own events" on public.events for insert to authenticated with check (user_id = auth.uid());
create policy "User can update own events" on public.events for update to authenticated using (user_id = auth.uid());
create policy "User can delete own events" on public.events for delete to authenticated using (user_id = auth.uid());

-- contacts
create table public.contacts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  notes text,
  created_at timestamptz default now()
);

alter table public.contacts enable row level security;

drop policy if exists "Allow all" on public.contacts;

create policy "Users can view their own contacts" on public.contacts for select to authenticated using (owner_id = auth.uid());
create policy "Users can insert their own contacts" on public.contacts for insert to authenticated with check (owner_id = auth.uid());
create policy "Users can update their own contacts" on public.contacts for update to authenticated using (owner_id = auth.uid());
create policy "Users can delete their own contacts" on public.contacts for delete to authenticated using (owner_id = auth.uid());

-- analytics
create table public.analytics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  metric text,
  value numeric,
  date date,
  created_at timestamptz default now()
);

alter table public.analytics enable row level security;

create policy "User can read own analytics" on public.analytics for select to authenticated using (user_id = auth.uid());
create policy "User can insert own analytics" on public.analytics for insert to authenticated with check (user_id = auth.uid());
create policy "User can update own analytics" on public.analytics for update to authenticated using (user_id = auth.uid());
create policy "User can delete own analytics" on public.analytics for delete to authenticated using (user_id = auth.uid());

-- Seed admin profile (id must match an existing auth.users row)
insert into public.user_profiles (id, full_name, role)
values ('57cc8691-3095-4d5c-9d2b-5d98af61ea2a','Admin User','admin')
on conflict (id) do update set role = excluded.role, full_name = excluded.full_name;

-- Acceptance checks (run):
-- Extensions
select extname from pg_extension where extname in ('uuid-ossp','pgcrypto');
-- RLS enabled
select relname, relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and relname in ('user_profiles','deals','sales_activity','reports','events','contacts','analytics');
-- Policies exist count (corrected column name)
select policyname, tablename from pg_policies where schemaname='public' and tablename in ('user_profiles','deals','sales_activity','reports','events','contacts','analytics') order by tablename, policyname;