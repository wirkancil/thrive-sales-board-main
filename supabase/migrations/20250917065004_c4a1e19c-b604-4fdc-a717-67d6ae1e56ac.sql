-- Fix user_profiles table structure and functions
-- Add missing columns to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS division_id uuid,
ADD COLUMN IF NOT EXISTS department_id uuid,
ADD COLUMN IF NOT EXISTS team_id uuid,
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS is_read_only boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS new_role text;

-- Update new_role column to match current role for existing users
UPDATE public.user_profiles 
SET new_role = role 
WHERE new_role IS NULL;

-- Create trigger for RBAC audit logging
DROP TRIGGER IF EXISTS log_rbac_changes_trigger ON public.user_profiles;
CREATE TRIGGER log_rbac_changes_trigger
  AFTER UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_rbac_changes();

-- Add foreign key constraints
ALTER TABLE public.user_profiles 
ADD CONSTRAINT fk_user_profiles_division 
FOREIGN KEY (division_id) REFERENCES public.divisions(id);

ALTER TABLE public.user_profiles 
ADD CONSTRAINT fk_user_profiles_department 
FOREIGN KEY (department_id) REFERENCES public.departments(id);

ALTER TABLE public.user_profiles 
ADD CONSTRAINT fk_user_profiles_team 
FOREIGN KEY (team_id) REFERENCES public.teams(id);