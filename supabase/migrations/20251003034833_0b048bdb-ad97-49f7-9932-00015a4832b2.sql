-- Phase 1: Foundation & Critical Fixes (Fixed)
-- Part 1: Enhance activities table for unified calendar system

-- Add new columns to activities table
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS starts_at timestamptz;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS ends_at timestamptz;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS type text CHECK (type IN ('call','meeting','follow-up','demo'));
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS meet_link text;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS wa_link text;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS with_contact_id uuid REFERENCES public.organization_contacts(id);
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS with_customer_id uuid REFERENCES public.organizations(id);

-- Add timezone to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Asia/Jakarta';

-- Migrate existing events to activities (using 'open' status)
INSERT INTO public.activities (
  created_by,
  subject,
  description,
  starts_at,
  ends_at,
  location,
  status,
  type,
  created_at
)
SELECT 
  user_id as created_by,
  title as subject,
  description,
  event_time as starts_at,
  event_time + interval '1 hour' as ends_at,
  location,
  'open' as status,
  'meeting' as type,
  created_at
FROM public.events
WHERE NOT EXISTS (
  SELECT 1 FROM public.activities a 
  WHERE a.created_by = events.user_id 
  AND a.subject = events.title 
  AND a.starts_at = events.event_time
);

-- Add master data enhancements
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS whatsapp_number text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS id_number text;
ALTER TABLE public.organization_contacts ADD COLUMN IF NOT EXISTS whatsapp_number text;
ALTER TABLE public.organization_contacts ADD COLUMN IF NOT EXISTS id_number text;

-- Create indexes for better calendar performance
CREATE INDEX IF NOT EXISTS idx_activities_starts_at ON public.activities(starts_at);
CREATE INDEX IF NOT EXISTS idx_activities_created_by_starts_at ON public.activities(created_by, starts_at);

-- Drop events table (data migrated)
DROP TABLE IF EXISTS public.events CASCADE;

-- Add comments for documentation
COMMENT ON COLUMN public.activities.starts_at IS 'Event start time in UTC';
COMMENT ON COLUMN public.activities.ends_at IS 'Event end time in UTC';
COMMENT ON COLUMN public.activities.type IS 'Activity type: call, meeting, follow-up, demo';
COMMENT ON COLUMN public.user_profiles.timezone IS 'User timezone (e.g., Asia/Jakarta, America/New_York)';