-- Add missing market_size column to organizations table
ALTER TABLE public.organizations 
ADD COLUMN market_size text;