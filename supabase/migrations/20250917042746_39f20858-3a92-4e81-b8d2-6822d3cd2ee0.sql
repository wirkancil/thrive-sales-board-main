-- Fix security warnings by setting proper search_path for functions

-- Update check_is_admin function
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

-- Update promote_to_admin function  
create or replace function public.promote_to_admin(p_email text)
returns void 
language plpgsql 
security definer 
set search_path = public, auth 
as $$
declare v_id uuid;
begin
  select id into v_id from auth.users where email = p_email;
  if v_id is null then raise exception 'User % not found', p_email; end if;
  insert into public.user_profiles(id, role)
  values (v_id, 'admin')
  on conflict (id) do update set role='admin';
end$$;