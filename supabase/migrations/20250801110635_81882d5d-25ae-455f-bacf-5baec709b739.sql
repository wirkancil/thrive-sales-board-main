-- Phase 1: Critical Database Security Fixes

-- Add user_id column to deals table if it doesn't exist
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing deals to have a user_id (set to a default for migration)
-- In production, you'd need to assign these to actual users
UPDATE public.deals SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

-- Make user_id NOT NULL after setting values
ALTER TABLE public.deals ALTER COLUMN user_id SET NOT NULL;

-- Enable Row Level Security on deals table
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for deals table
CREATE POLICY "Users can view their own deals" 
ON public.deals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deals" 
ON public.deals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deals" 
ON public.deals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deals" 
ON public.deals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix database function security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Update the update_updated_at_column function with proper security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add database-level validation constraints
ALTER TABLE public.deals ADD CONSTRAINT deals_value_positive CHECK (deal_value > 0);
ALTER TABLE public.deals ADD CONSTRAINT deals_email_format CHECK (contact_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR contact_email IS NULL);

-- Add trigger for deals updated_at
CREATE TRIGGER update_deals_updated_at
BEFORE UPDATE ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();