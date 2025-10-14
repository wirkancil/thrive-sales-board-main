-- Add product column to opportunities table
ALTER TABLE public.opportunities 
ADD COLUMN product TEXT CHECK (product IN ('Infrastructure', 'Security', 'Automation', 'Prosnap', 'Services', 'Manage Services', 'Other'));