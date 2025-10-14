-- Add address field to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN address text;