-- Phase 1: Complete remaining tasks and fix security issues

-- Add soft delete to remaining major tables
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

-- Enable RLS on new tables (CRITICAL SECURITY FIX)
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

-- Create/update trigger functions with proper security settings
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS handle_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER handle_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_titles_updated_at ON public.titles;
CREATE TRIGGER handle_titles_updated_at
  BEFORE UPDATE ON public.titles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_regions_updated_at ON public.regions;
CREATE TRIGGER handle_regions_updated_at
  BEFORE UPDATE ON public.regions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();