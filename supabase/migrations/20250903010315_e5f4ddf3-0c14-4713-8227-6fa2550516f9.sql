-- Master Data CRM Module - Handle Existing Tables
-- Create comprehensive master data structure for CRM

-- Check if organizations table exists and create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'organizations') THEN
        CREATE TABLE public.organizations (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          org_id UUID, -- for multi-tenancy, can be null for now
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('customer', 'end_user')),
          tax_id TEXT,
          website TEXT,
          phone TEXT,
          email TEXT,
          industry TEXT,
          addresses JSONB, -- flexible address storage
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_by UUID,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
    END IF;
END $$;

-- Check if organization_contacts table exists and create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'organization_contacts') THEN
        CREATE TABLE public.organization_contacts (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
          full_name TEXT NOT NULL,
          title TEXT,
          email TEXT,
          phone TEXT,
          mobile TEXT,
          is_primary BOOLEAN NOT NULL DEFAULT false,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_by UUID,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
    END IF;
END $$;

-- Check if pipelines table exists and create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pipelines') THEN
        CREATE TABLE public.pipelines (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          org_id UUID, -- for multi-tenancy
          name TEXT NOT NULL,
          description TEXT,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_by UUID,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
    END IF;
END $$;

-- Check if pipeline_stages table exists and create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pipeline_stages') THEN
        CREATE TABLE public.pipeline_stages (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          sort_order INTEGER NOT NULL,
          default_probability DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (default_probability >= 0 AND default_probability <= 100),
          is_won BOOLEAN NOT NULL DEFAULT false,
          is_lost BOOLEAN NOT NULL DEFAULT false,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          UNIQUE(pipeline_id, sort_order)
        );
    END IF;
END $$;

-- Create opportunity_status type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opportunity_status') THEN
        CREATE TYPE opportunity_status AS ENUM ('open', 'won', 'lost', 'on_hold', 'archived');
    END IF;
END $$;

-- Check if opportunities table exists and create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'opportunities') THEN
        CREATE TABLE public.opportunities (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          org_id UUID, -- for multi-tenancy
          pipeline_id UUID NOT NULL REFERENCES public.pipelines(id),
          stage_id UUID NOT NULL REFERENCES public.pipeline_stages(id),
          owner_id UUID NOT NULL REFERENCES public.user_profiles(id), -- account manager
          customer_id UUID NOT NULL REFERENCES public.organizations(id),
          end_user_id UUID REFERENCES public.organizations(id), -- optional
          name TEXT NOT NULL,
          description TEXT,
          status opportunity_status NOT NULL DEFAULT 'open',
          amount DECIMAL(15,2),
          currency TEXT NOT NULL DEFAULT 'USD',
          probability DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (probability >= 0 AND probability <= 100),
          expected_close_date DATE,
          source TEXT,
          tags TEXT[],
          created_by UUID NOT NULL REFERENCES public.user_profiles(id),
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
    END IF;
END $$;

-- Check if opportunity_stage_history table exists and create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'opportunity_stage_history') THEN
        CREATE TABLE public.opportunity_stage_history (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
          from_stage_id UUID REFERENCES public.pipeline_stages(id),
          to_stage_id UUID NOT NULL REFERENCES public.pipeline_stages(id),
          changed_by UUID NOT NULL REFERENCES public.user_profiles(id),
          changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          note TEXT
        );
    END IF;
END $$;

-- VALIDATION FUNCTIONS (replacing CHECK constraints)
CREATE OR REPLACE FUNCTION public.validate_opportunity_organizations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validate customer_id is a customer type
  IF NOT EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE id = NEW.customer_id AND type = 'customer'
  ) THEN
    RAISE EXCEPTION 'customer_id must reference an organization with type customer';
  END IF;
  
  -- Validate end_user_id is an end_user type (if provided)
  IF NEW.end_user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE id = NEW.end_user_id AND type = 'end_user'
  ) THEN
    RAISE EXCEPTION 'end_user_id must reference an organization with type end_user';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger for organization validation
DROP TRIGGER IF EXISTS validate_opportunity_organizations_trigger ON public.opportunities;
CREATE TRIGGER validate_opportunity_organizations_trigger
  BEFORE INSERT OR UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_opportunity_organizations();

-- INDEXES for performance (create only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_organizations_type') THEN
        CREATE INDEX idx_organizations_type ON public.organizations(type);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_organizations_name') THEN
        CREATE INDEX idx_organizations_name ON public.organizations(name);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_organizations_is_active') THEN
        CREATE INDEX idx_organizations_is_active ON public.organizations(is_active);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_organization_contacts_organization_id') THEN
        CREATE INDEX idx_organization_contacts_organization_id ON public.organization_contacts(organization_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pipeline_stages_pipeline_id') THEN
        CREATE INDEX idx_pipeline_stages_pipeline_id ON public.pipeline_stages(pipeline_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_opportunities_status') THEN
        CREATE INDEX idx_opportunities_status ON public.opportunities(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_opportunities_stage_id') THEN
        CREATE INDEX idx_opportunities_stage_id ON public.opportunities(stage_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_opportunities_owner_id') THEN
        CREATE INDEX idx_opportunities_owner_id ON public.opportunities(owner_id);
    END IF;
END $$;

-- TRIGGERS for updated_at (drop and recreate to avoid conflicts)
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_organization_contacts_updated_at ON public.organization_contacts;
CREATE TRIGGER update_organization_contacts_updated_at
  BEFORE UPDATE ON public.organization_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_pipelines_updated_at ON public.pipelines;
CREATE TRIGGER update_pipelines_updated_at
  BEFORE UPDATE ON public.pipelines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_pipeline_stages_updated_at ON public.pipeline_stages;
CREATE TRIGGER update_pipeline_stages_updated_at
  BEFORE UPDATE ON public.pipeline_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_opportunities_updated_at ON public.opportunities;
CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ENABLE RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_stage_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can update organizations they created" ON public.organizations;
DROP POLICY IF EXISTS "Admins can update all organizations" ON public.organizations;

-- RLS POLICIES for organizations
CREATE POLICY "Users can view all organizations" 
ON public.organizations FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can create organizations" 
ON public.organizations FOR INSERT 
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update organizations they created" 
ON public.organizations FOR UPDATE 
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Admins can update all organizations" 
ON public.organizations FOR UPDATE 
TO authenticated
USING (is_admin(auth.uid()));

-- Drop existing policies for organization_contacts
DROP POLICY IF EXISTS "Users can view organization contacts" ON public.organization_contacts;
DROP POLICY IF EXISTS "Users can create organization contacts" ON public.organization_contacts;
DROP POLICY IF EXISTS "Users can update contacts they created" ON public.organization_contacts;

-- RLS POLICIES for organization_contacts
CREATE POLICY "Users can view organization contacts" 
ON public.organization_contacts FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can create organization contacts" 
ON public.organization_contacts FOR INSERT 
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update contacts they created" 
ON public.organization_contacts FOR UPDATE 
TO authenticated
USING (created_by = auth.uid());

-- Drop existing policies for pipelines
DROP POLICY IF EXISTS "Users can view all pipelines" ON public.pipelines;
DROP POLICY IF EXISTS "Admins and dept heads can manage pipelines" ON public.pipelines;

-- RLS POLICIES for pipelines
CREATE POLICY "Users can view all pipelines" 
ON public.pipelines FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins and dept heads can manage pipelines" 
ON public.pipelines FOR ALL 
TO authenticated
USING (is_admin_or_dept_head(auth.uid()));

-- Drop existing policies for pipeline_stages
DROP POLICY IF EXISTS "Users can view pipeline stages" ON public.pipeline_stages;
DROP POLICY IF EXISTS "Admins and dept heads can manage pipeline stages" ON public.pipeline_stages;

-- RLS POLICIES for pipeline_stages
CREATE POLICY "Users can view pipeline stages" 
ON public.pipeline_stages FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins and dept heads can manage pipeline stages" 
ON public.pipeline_stages FOR ALL 
TO authenticated
USING (is_admin_or_dept_head(auth.uid()));

-- Drop existing policies for opportunities
DROP POLICY IF EXISTS "Users can view opportunities they own" ON public.opportunities;
DROP POLICY IF EXISTS "Dept heads can view all opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Users can create opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Users can update their opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Dept heads can update all opportunities" ON public.opportunities;

-- RLS POLICIES for opportunities
CREATE POLICY "Users can view opportunities they own" 
ON public.opportunities FOR SELECT 
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Dept heads can view all opportunities" 
ON public.opportunities FOR SELECT 
TO authenticated
USING (is_admin_or_dept_head(auth.uid()));

CREATE POLICY "Users can create opportunities" 
ON public.opportunities FOR INSERT 
TO authenticated
WITH CHECK (owner_id = auth.uid() AND created_by = auth.uid());

CREATE POLICY "Users can update their opportunities" 
ON public.opportunities FOR UPDATE 
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Dept heads can update all opportunities" 
ON public.opportunities FOR UPDATE 
TO authenticated
USING (is_admin_or_dept_head(auth.uid()));

-- Drop existing policies for opportunity_stage_history
DROP POLICY IF EXISTS "Users can view opportunity history for their opportunities" ON public.opportunity_stage_history;
DROP POLICY IF EXISTS "Dept heads can view all opportunity history" ON public.opportunity_stage_history;
DROP POLICY IF EXISTS "Users can create opportunity history" ON public.opportunity_stage_history;

-- RLS POLICIES for opportunity_stage_history
CREATE POLICY "Users can view opportunity history for their opportunities" 
ON public.opportunity_stage_history FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.opportunities o 
    WHERE o.id = opportunity_id AND o.owner_id = auth.uid()
  )
);

CREATE POLICY "Dept heads can view all opportunity history" 
ON public.opportunity_stage_history FOR SELECT 
TO authenticated
USING (is_admin_or_dept_head(auth.uid()));

CREATE POLICY "Users can create opportunity history" 
ON public.opportunity_stage_history FOR INSERT 
TO authenticated
WITH CHECK (changed_by = auth.uid());

-- CREATE VIEWS (drop existing first to avoid conflicts)
DROP VIEW IF EXISTS public.v_master_customer CASCADE;
DROP VIEW IF EXISTS public.v_master_end_user CASCADE;
DROP VIEW IF EXISTS public.v_account_managers CASCADE;
DROP VIEW IF EXISTS public.v_master_pipeline CASCADE;
DROP VIEW IF EXISTS public.v_master_opportunity CASCADE;

-- 1. Master Customer View
CREATE VIEW public.v_master_customer AS
SELECT 
  o.*,
  array_agg(
    CASE WHEN oc.is_active THEN
      json_build_object(
        'id', oc.id,
        'full_name', oc.full_name,
        'title', oc.title,
        'email', oc.email,
        'phone', oc.phone,
        'mobile', oc.mobile,
        'is_primary', oc.is_primary
      )
    END
  ) FILTER (WHERE oc.id IS NOT NULL) as contacts
FROM public.organizations o
LEFT JOIN public.organization_contacts oc ON o.id = oc.organization_id AND oc.is_active = true
WHERE o.type = 'customer' AND o.is_active = true
GROUP BY o.id, o.org_id, o.name, o.type, o.tax_id, o.website, o.phone, o.email, o.industry, o.addresses, o.is_active, o.created_by, o.created_at, o.updated_at;

-- 2. Master End User View
CREATE VIEW public.v_master_end_user AS
SELECT 
  o.*,
  array_agg(
    CASE WHEN oc.is_active THEN
      json_build_object(
        'id', oc.id,
        'full_name', oc.full_name,
        'title', oc.title,
        'email', oc.email,
        'phone', oc.phone,
        'mobile', oc.mobile,
        'is_primary', oc.is_primary
      )
    END
  ) FILTER (WHERE oc.id IS NOT NULL) as contacts
FROM public.organizations o
LEFT JOIN public.organization_contacts oc ON o.id = oc.organization_id AND oc.is_active = true
WHERE o.type = 'end_user' AND o.is_active = true
GROUP BY o.id, o.org_id, o.name, o.type, o.tax_id, o.website, o.phone, o.email, o.industry, o.addresses, o.is_active, o.created_by, o.created_at, o.updated_at;

-- 3. Account Managers View
CREATE VIEW public.v_account_managers AS
SELECT 
  up.id,
  up.full_name,
  up.role,
  up.division_id,
  up.department_id,
  d.name as division_name,
  dept.name as department_name,
  up.created_at
FROM public.user_profiles up
LEFT JOIN public.divisions d ON up.division_id = d.id
LEFT JOIN public.departments dept ON up.department_id = dept.id
WHERE up.role IN ('sales_rep', 'division_head', 'department_head', 'admin');

-- 4. Master Pipeline View
CREATE VIEW public.v_master_pipeline AS
SELECT 
  p.id as pipeline_id,
  p.org_id,
  p.name as pipeline_name,
  p.description as pipeline_description,
  p.is_active as pipeline_active,
  p.created_at as pipeline_created_at,
  array_agg(
    json_build_object(
      'stage_id', ps.id,
      'stage_name', ps.name,
      'sort_order', ps.sort_order,
      'default_probability', ps.default_probability,
      'is_won', ps.is_won,
      'is_lost', ps.is_lost,
      'is_active', ps.is_active
    ) ORDER BY ps.sort_order
  ) as stages
FROM public.pipelines p
LEFT JOIN public.pipeline_stages ps ON p.id = ps.pipeline_id AND ps.is_active = true
WHERE p.is_active = true
GROUP BY p.id, p.org_id, p.name, p.description, p.is_active, p.created_at;

-- 5. Master Opportunity View
CREATE VIEW public.v_master_opportunity AS
SELECT 
  opp.*,
  p.name as pipeline_name,
  ps.name as stage_name,
  ps.sort_order as stage_sort_order,
  ps.default_probability as stage_default_probability,
  ps.is_won as stage_is_won,
  ps.is_lost as stage_is_lost,
  cust.name as customer_name,
  cust.type as customer_type,
  cust.industry as customer_industry,
  eu.name as end_user_name,
  am.full_name as account_manager_name,
  am.role as account_manager_role,
  creator.full_name as created_by_name
FROM public.opportunities opp
JOIN public.pipelines p ON opp.pipeline_id = p.id
JOIN public.pipeline_stages ps ON opp.stage_id = ps.id
JOIN public.organizations cust ON opp.customer_id = cust.id
LEFT JOIN public.organizations eu ON opp.end_user_id = eu.id
JOIN public.user_profiles am ON opp.owner_id = am.id
JOIN public.user_profiles creator ON opp.created_by = creator.id;

-- Function to automatically track stage changes
CREATE OR REPLACE FUNCTION public.track_opportunity_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only track if stage actually changed
  IF OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
    INSERT INTO public.opportunity_stage_history (
      opportunity_id,
      from_stage_id,
      to_stage_id,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.stage_id,
      NEW.stage_id,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger to automatically track stage changes
DROP TRIGGER IF EXISTS track_opportunity_stage_changes ON public.opportunities;
CREATE TRIGGER track_opportunity_stage_changes
  AFTER UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.track_opportunity_stage_change();

-- SEED DATA for default pipeline (only if it doesn't exist)
INSERT INTO public.pipelines (name, description, created_by) 
SELECT 'Sales Pipeline', 'Standard sales pipeline for opportunities', (SELECT id FROM public.user_profiles WHERE role = 'admin' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.pipelines WHERE name = 'Sales Pipeline');

-- Get the pipeline ID for stages (only if stages don't exist)
INSERT INTO public.pipeline_stages (pipeline_id, name, sort_order, default_probability, is_won, is_lost) 
SELECT 
  p.id,
  stage_data.name,
  stage_data.sort_order,
  stage_data.default_probability,
  stage_data.is_won,
  stage_data.is_lost
FROM public.pipelines p,
(VALUES 
  ('Qualification', 1, 10.00, false, false),
  ('Proposal', 2, 35.00, false, false),
  ('Negotiation', 3, 65.00, false, false),
  ('Won', 4, 100.00, true, false),
  ('Lost', 5, 0.00, false, true)
) AS stage_data(name, sort_order, default_probability, is_won, is_lost)
WHERE p.name = 'Sales Pipeline' 
AND NOT EXISTS (SELECT 1 FROM public.pipeline_stages WHERE pipeline_id = p.id);