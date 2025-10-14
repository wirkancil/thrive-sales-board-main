-- Phase 1: Database Cleanup - Remove Division/Department Structure
-- Create titles table for admin-managed job titles
CREATE TABLE IF NOT EXISTS public.titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create regions table for admin-managed regional codes
CREATE TABLE IF NOT EXISTS public.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add title_id and region_id to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS title_id UUID REFERENCES public.titles(id),
ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES public.regions(id);

-- Insert default titles and regions
INSERT INTO public.titles (name, created_by) VALUES 
  ('Director', (SELECT id FROM auth.users LIMIT 1)),
  ('Senior Manager', (SELECT id FROM auth.users LIMIT 1)),
  ('Manager', (SELECT id FROM auth.users LIMIT 1)),
  ('Senior Sales Representative', (SELECT id FROM auth.users LIMIT 1)),
  ('Sales Representative', (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.regions (name, code, created_by) VALUES 
  ('Asia Pacific', 'APAC', (SELECT id FROM auth.users LIMIT 1)),
  ('North America', 'NA', (SELECT id FROM auth.users LIMIT 1)),
  ('Europe', 'EU', (SELECT id FROM auth.users LIMIT 1)),
  ('Latin America', 'LATAM', (SELECT id FROM auth.users LIMIT 1)),
  ('Middle East & Africa', 'MEA', (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (code) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for titles (Admin only can manage, everyone can read)
DROP POLICY IF EXISTS "Admins can manage titles" ON public.titles;
CREATE POLICY "Admins can manage titles" ON public.titles
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Everyone can read active titles" ON public.titles;
CREATE POLICY "Everyone can read active titles" ON public.titles
FOR SELECT USING (is_active = true);

-- RLS Policies for regions (Admin only can manage, everyone can read)
DROP POLICY IF EXISTS "Admins can manage regions" ON public.regions;
CREATE POLICY "Admins can manage regions" ON public.regions
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Everyone can read active regions" ON public.regions;
CREATE POLICY "Everyone can read active regions" ON public.regions
FOR SELECT USING (is_active = true);

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS titles_updated_at ON public.titles;
CREATE TRIGGER titles_updated_at BEFORE UPDATE ON public.titles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS regions_updated_at ON public.regions;  
CREATE TRIGGER regions_updated_at BEFORE UPDATE ON public.regions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();