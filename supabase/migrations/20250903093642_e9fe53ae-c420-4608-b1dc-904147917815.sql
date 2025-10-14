-- Two-Phase CRM Master Data Model Implementation
-- Phase 1: Opportunity (activity funnel) → Phase 2: Pipeline (deal funnel)

-- ============================================================================
-- 1. CREATE ENUMS
-- ============================================================================

-- Opportunity stages for Phase 1
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opp_stage_enum') THEN
    CREATE TYPE public.opp_stage_enum AS ENUM ('contacted', 'visit', 'presentation', 'poc');
  END IF;
END $$;

-- Pipeline item status for Phase 2
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deal_status_enum') THEN
    CREATE TYPE public.deal_status_enum AS ENUM ('negotiation', 'won', 'lost');
  END IF;
END $$;

-- Currency types
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency_enum') THEN
    CREATE TYPE public.currency_enum AS ENUM ('IDR', 'USD', 'JPY', 'EUR', 'SGD');
  END IF;
END $$;

-- Approval status for workflow
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status_enum') THEN
    CREATE TYPE public.approval_status_enum AS ENUM ('draft', 'submitted', 'approved', 'rejected');
  END IF;
END $$;

-- User roles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
    CREATE TYPE public.user_role_enum AS ENUM ('account_manager', 'division_head', 'department_head', 'admin');
  END IF;
END $$;

-- ============================================================================
-- 2. MASTER DATA - COMPANIES (Customer & End User)
-- ============================================================================

-- Rename organizations to companies if it doesn't exist, or modify existing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
    -- Create companies table (using organizations structure if available)
    CREATE TABLE public.companies (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid,
      name text NOT NULL,
      legal_name text,
      tax_id text,
      website text,
      phone text,
      email text,
      industry text,
      type text NOT NULL CHECK (type IN ('customer', 'end_user')),
      billing_address jsonb,
      shipping_address jsonb,
      parent_company_id uuid REFERENCES public.companies(id),
      is_active boolean NOT NULL DEFAULT true,
      notes text,
      
      -- Approval workflow fields
      approval_status public.approval_status_enum DEFAULT 'draft',
      approved_by uuid,
      approved_at timestamptz,
      approval_note text,
      
      created_by uuid,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    -- Migrate data from organizations if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
      INSERT INTO public.companies (
        id, org_id, name, tax_id, website, phone, email, industry, type,
        billing_address, shipping_address, is_active, created_by, created_at, updated_at
      )
      SELECT 
        id, org_id, name, tax_id, website, phone, email, industry,
        COALESCE(type, 'customer'),
        addresses, addresses, is_active, created_by, created_at, updated_at
      FROM public.organizations
      ON CONFLICT (id) DO NOTHING;
    END IF;
  ELSE
    -- Add missing columns to existing companies table
    ALTER TABLE public.companies 
      ADD COLUMN IF NOT EXISTS legal_name text,
      ADD COLUMN IF NOT EXISTS billing_address jsonb,
      ADD COLUMN IF NOT EXISTS shipping_address jsonb,
      ADD COLUMN IF NOT EXISTS parent_company_id uuid REFERENCES public.companies(id),
      ADD COLUMN IF NOT EXISTS approval_status public.approval_status_enum DEFAULT 'draft',
      ADD COLUMN IF NOT EXISTS approved_by uuid,
      ADD COLUMN IF NOT EXISTS approved_at timestamptz,
      ADD COLUMN IF NOT EXISTS approval_note text;
  END IF;
END $$;

-- Indexes for companies
CREATE INDEX IF NOT EXISTS idx_companies_type ON public.companies(type);
CREATE INDEX IF NOT EXISTS idx_companies_org_name ON public.companies(org_id, LOWER(name));
CREATE INDEX IF NOT EXISTS idx_companies_active ON public.companies(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_approval ON public.companies(approval_status);

-- ============================================================================
-- 3. CUSTOMER ORGANIZATIONAL STRUCTURES
-- ============================================================================

-- Customer organizational units
CREATE TABLE IF NOT EXISTS public.customer_org_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.companies(id),
  parent_unit_id uuid REFERENCES public.customer_org_units(id),
  name text NOT NULL,
  description text,
  level integer NOT NULL CHECK (level IN (1, 2, 3)), -- 1=Division, 2=Department, 3=Unit
  is_active boolean DEFAULT true,
  
  -- Approval workflow
  approval_status public.approval_status_enum DEFAULT 'draft',
  approved_by uuid,
  approved_at timestamptz,
  approval_note text,
  
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customer contacts
CREATE TABLE IF NOT EXISTS public.customer_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.companies(id),
  org_unit_id uuid REFERENCES public.customer_org_units(id),
  full_name text NOT NULL,
  title text,
  email text,
  phone text,
  is_primary boolean DEFAULT false,
  is_active boolean DEFAULT true,
  
  -- Approval workflow
  approval_status public.approval_status_enum DEFAULT 'draft',
  approved_by uuid,
  approved_at timestamptz,
  approval_note text,
  
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_org_units_customer ON public.customer_org_units(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_org_units_parent ON public.customer_org_units(parent_unit_id);
CREATE INDEX IF NOT EXISTS idx_customer_contacts_customer ON public.customer_contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_contacts_org_unit ON public.customer_contacts(org_unit_id);

-- ============================================================================
-- 4. MODIFY USER PROFILES FOR ACCOUNT MANAGERS
-- ============================================================================

-- Update user_profiles to match the new role structure
DO $$
BEGIN
  -- Add missing columns
  ALTER TABLE public.user_profiles 
    ADD COLUMN IF NOT EXISTS email text,
    ADD COLUMN IF NOT EXISTS phone text,
    ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
    
  -- Update role column to use new enum if it's not already enum
  -- First check if it's already the right enum
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'role' 
    AND udt_name = 'user_role_enum'
  ) THEN
    -- Update existing roles to match new enum values
    UPDATE public.user_profiles SET 
      role = CASE 
        WHEN role = 'sales_rep' THEN 'account_manager'
        WHEN role IN ('division_head', 'department_head', 'admin') THEN role
        ELSE 'account_manager'
      END;
      
    -- Convert column to new enum type
    ALTER TABLE public.user_profiles 
      ALTER COLUMN role TYPE public.user_role_enum 
      USING (role::public.user_role_enum);
  END IF;
END $$;

-- ============================================================================
-- 5. PHASE 1 - OPPORTUNITIES (Activity Funnel)
-- ============================================================================

-- Modify existing opportunities table or create new structure
DO $$
BEGIN
  -- Add new columns to opportunities table
  ALTER TABLE public.opportunities
    ADD COLUMN IF NOT EXISTS opp_stage public.opp_stage_enum DEFAULT 'contacted',
    ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS approval_status public.approval_status_enum DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS approved_by uuid,
    ADD COLUMN IF NOT EXISTS approved_at timestamptz,
    ADD COLUMN IF NOT EXISTS approval_note text;
    
  -- Ensure end_user_id is NOT NULL by setting constraint
  UPDATE public.opportunities SET end_user_id = customer_id WHERE end_user_id IS NULL;
  ALTER TABLE public.opportunities ALTER COLUMN end_user_id SET NOT NULL;
END $$;

-- Opportunity stage history (append-only)
CREATE TABLE IF NOT EXISTS public.opportunity_stage_history_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id),
  from_stage public.opp_stage_enum,
  to_stage public.opp_stage_enum NOT NULL,
  changed_by uuid NOT NULL,
  changed_at timestamptz DEFAULT now(),
  note text
);

-- Indexes for opportunities
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON public.opportunities(opp_stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_active ON public.opportunities(is_active);
CREATE INDEX IF NOT EXISTS idx_opportunities_approval ON public.opportunities(approval_status);

-- ============================================================================
-- 6. PHASE 2 - PIPELINE (Deal Funnel)
-- ============================================================================

-- Pipeline items (the actual deals with amounts)
CREATE TABLE IF NOT EXISTS public.pipeline_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES public.pipelines(id),
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id),
  amount numeric(18,2) NOT NULL,
  currency public.currency_enum DEFAULT 'IDR',
  status public.deal_status_enum DEFAULT 'negotiation',
  expected_close_date date NOT NULL,
  probability numeric(5,2) CHECK (probability BETWEEN 0 AND 1),
  notes text,
  
  -- Approval workflow
  approval_status public.approval_status_enum DEFAULT 'draft',
  approved_by uuid,
  approved_at timestamptz,
  approval_note text,
  
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(pipeline_id, opportunity_id)
);

-- Pipeline item history (append-only)
CREATE TABLE IF NOT EXISTS public.pipeline_item_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_item_id uuid NOT NULL REFERENCES public.pipeline_items(id),
  from_status public.deal_status_enum,
  to_status public.deal_status_enum NOT NULL,
  changed_by uuid NOT NULL,
  changed_at timestamptz DEFAULT now(),
  note text
);

-- Notifications for close date warnings
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pipeline_item_id uuid REFERENCES public.pipeline_items(id),
  type text NOT NULL,
  severity text NOT NULL,
  message text NOT NULL,
  due_in_days integer,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pipeline_items_pipeline ON public.pipeline_items(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_items_status ON public.pipeline_items(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_items_close_date ON public.pipeline_items(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_pipeline_item ON public.notifications(pipeline_item_id);

-- ============================================================================
-- 7. AUTOMATION TRIGGERS
-- ============================================================================

-- Updated timestamp trigger function (reuse existing if available)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- End user defaulting trigger
CREATE OR REPLACE FUNCTION public.set_end_user_default()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.end_user_id IS NULL THEN
    NEW.end_user_id := NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Close date warning trigger
CREATE OR REPLACE FUNCTION public.check_close_date_warning()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  due_days integer;
  owner_id uuid;
  division_head_id uuid;
  severity_level text;
BEGIN
  -- Calculate days until close
  due_days := NEW.expected_close_date - CURRENT_DATE;
  
  -- Only create notifications if within 14 days or overdue
  IF due_days <= 14 THEN
    -- Get opportunity owner (account manager)
    SELECT o.owner_id INTO owner_id
    FROM public.opportunities o
    WHERE o.id = NEW.opportunity_id;
    
    -- Get division head
    SELECT up.id INTO division_head_id
    FROM public.user_profiles up
    JOIN public.user_profiles owner ON owner.division_id = up.division_id
    WHERE owner.id = owner_id 
      AND up.role = 'division_head'
      AND up.is_active = true
    LIMIT 1;
    
    -- Set severity
    severity_level := CASE WHEN due_days < 0 THEN 'critical' ELSE 'warning' END;
    
    -- Create notifications
    INSERT INTO public.notifications (user_id, pipeline_item_id, type, severity, message, due_in_days)
    VALUES 
      (owner_id, NEW.id, 'close_date_warning', severity_level, 
       'Pipeline item due in ' || due_days || ' days', due_days),
      (division_head_id, NEW.id, 'close_date_warning', severity_level, 
       'Pipeline item due in ' || due_days || ' days', due_days);
  END IF;
  
  RETURN NEW;
END;
$$;