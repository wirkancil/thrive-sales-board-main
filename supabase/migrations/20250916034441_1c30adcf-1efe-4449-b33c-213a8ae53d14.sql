-- Add missing division_id and department_id columns to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN division_id UUID REFERENCES public.divisions(id),
ADD COLUMN department_id UUID REFERENCES public.departments(id),
ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;

-- Update the existing admin_update_profile function to handle the new columns
CREATE OR REPLACE FUNCTION public.admin_update_profile(
  p_id uuid,
  p_role text,
  p_division uuid DEFAULT NULL,
  p_department uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'auth'
AS $function$
begin
  update public.user_profiles
  set role = p_role,
      department_id = p_department,
      division_id   = p_division
  where id = p_id;

  if not found then
    raise exception 'user_profile % not found', p_id using errcode='P0002';
  end if;
end;
$function$