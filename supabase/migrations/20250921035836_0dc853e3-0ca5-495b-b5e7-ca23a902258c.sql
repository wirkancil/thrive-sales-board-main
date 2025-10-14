-- Phase 1: Foundation & Role Enhancement Migration

-- Create enums for user status and other lookups
CREATE TYPE public.user_status_enum AS ENUM ('active', 'inactive', 'resigned', 'terminated', 'leave');
CREATE TYPE public.audit_event_type AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'export', 'approval', 'reassignment', 'closed_won', 'closed_lost');
CREATE TYPE public.audit_object_type AS ENUM ('user', 'customer', 'contact', 'end_user', 'opportunity', 'deal', 'activity', 'target', 'pipeline');

-- Create lookup tables for admin-managed dropdowns
CREATE TABLE public.titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.fiscal_calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_month integer NOT NULL CHECK (start_month >= 1 AND start_month <= 12),
  region_code text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Comprehensive audit log table
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id),
  event_type public.audit_event_type NOT NULL,
  object_type public.audit_object_type NOT NULL,
  object_id uuid NOT NULL,
  before_values jsonb,
  after_values jsonb,
  reason text,
  metadata jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  tenant_id uuid,
  retention_until timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enhance user_profiles with globalization and role improvements
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS title_id uuid REFERENCES public.titles(id),
  ADD COLUMN IF NOT EXISTS region_id uuid REFERENCES public.regions(id),
  ADD COLUMN IF NOT EXISTS region_code text,
  ADD COLUMN IF NOT EXISTS currency_code text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS locale text DEFAULT 'en-US',
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS fiscal_calendar_id uuid REFERENCES public.fiscal_calendars(id),
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS tenant_id uuid,
  ADD COLUMN IF NOT EXISTS user_status public.user_status_enum DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Update role enum to match the 4 specified roles
-- First, update existing roles to new format
UPDATE public.user_profiles SET role = 'account_manager' WHERE role IN ('sales_rep', 'account_manager');
UPDATE public.user_profiles SET role = 'manager' WHERE role IN ('department_manager', 'department_head');
UPDATE public.user_profiles SET role = 'head' WHERE role IN ('division_head');
UPDATE public.user_profiles SET role = 'admin' WHERE role = 'admin';

-- Add soft delete to major tables
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);

ALTER TABLE public.opportunities 
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);

ALTER TABLE public.sales_activity_v2
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);

-- Enable RLS on new tables
ALTER TABLE public.titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for lookup tables
CREATE POLICY "Everyone can read active titles" ON public.titles
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage titles" ON public.titles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Everyone can read active regions" ON public.regions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage regions" ON public.regions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Everyone can read active fiscal calendars" ON public.fiscal_calendars
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage fiscal calendars" ON public.fiscal_calendars  
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Audit log policies - only admins can read, system can write
CREATE POLICY "Admins can read audit logs" ON public.audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can write audit logs" ON public.audit_log
  FOR INSERT WITH CHECK (actor_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_created ON public.audit_log (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_object ON public.audit_log (object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON public.audit_log (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles (user_status, is_deleted);
CREATE INDEX IF NOT EXISTS idx_organizations_deleted ON public.organizations (is_deleted) WHERE is_deleted = false;

-- Insert sample data for titles and regions
INSERT INTO public.titles (name, created_by) VALUES 
  ('Manager', (SELECT id FROM auth.users LIMIT 1)),
  ('Director', (SELECT id FROM auth.users LIMIT 1)),
  ('VP', (SELECT id FROM auth.users LIMIT 1)),
  ('Head', (SELECT id FROM auth.users LIMIT 1)),
  ('Senior Manager', (SELECT id FROM auth.users LIMIT 1)),
  ('Account Manager', (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.regions (name, code, created_by) VALUES 
  ('Asia Pacific', 'APAC', (SELECT id FROM auth.users LIMIT 1)),
  ('Europe, Middle East & Africa', 'EMEA', (SELECT id FROM auth.users LIMIT 1)),
  ('Americas', 'AMER', (SELECT id FROM auth.users LIMIT 1)),
  ('North America', 'NA', (SELECT id FROM auth.users LIMIT 1)),
  ('Latin America', 'LATAM', (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.fiscal_calendars (name, start_month, region_code, created_by) VALUES 
  ('Calendar Year', 1, 'GLOBAL', (SELECT id FROM auth.users LIMIT 1)),
  ('US Fiscal Year', 10, 'NA', (SELECT id FROM auth.users LIMIT 1)),
  ('APAC Fiscal Year', 4, 'APAC', (SELECT id FROM auth.users LIMIT 1));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_titles_updated_at
  BEFORE UPDATE ON public.titles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_regions_updated_at
  BEFORE UPDATE ON public.regions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();