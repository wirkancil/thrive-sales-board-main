-- Add missing columns to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS division_id uuid REFERENCES public.divisions(id),
ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id),
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;