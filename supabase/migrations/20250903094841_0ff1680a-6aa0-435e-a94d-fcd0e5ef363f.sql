-- Two-Phase CRM Master Data Model Implementation (Corrected)

-- ============================================================================
-- 1. CREATE ENUMS
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opp_stage_enum') THEN
    CREATE TYPE public.opp_stage_enum AS ENUM ('contacted', 'visit', 'presentation', 'poc');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deal_status_enum') THEN
    CREATE TYPE public.deal_status_enum AS ENUM ('negotiation', 'won', 'lost');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency_enum') THEN
    CREATE TYPE public.currency_enum AS ENUM ('IDR', 'USD', 'JPY', 'EUR', 'SGD');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status_enum') THEN
    CREATE TYPE public.approval_status_enum AS ENUM ('draft', 'submitted', 'approved', 'rejected');
  END IF;
END $$;

-- ============================================================================
-- 2. UTILITY FUNCTIONS
-- ============================================================================

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

-- ============================================================================
-- 3. MASTER DATA - COMPANIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.companies (
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
  approval_status public.approval_status_enum DEFAULT 'draft',
  approved_by uuid,
  approved_at timestamptz,
  approval_note text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Migrate from organizations if companies is empty
INSERT INTO public.companies (
  id, org_id, name, tax_id, website, phone, email, industry, type,
  billing_address, shipping_address, is_active, created_by, created_at, updated_at
)
SELECT 
  id, org_id, name, tax_id, website, phone, email, industry,
  COALESCE(type, 'customer'),
  addresses, addresses, is_active, created_by, created_at, updated_at
FROM public.organizations
WHERE NOT EXISTS (SELECT 1 FROM public.companies LIMIT 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. CUSTOMER ORGANIZATIONAL STRUCTURES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.customer_org_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.companies(id),
  parent_unit_id uuid REFERENCES public.customer_org_units(id),
  name text NOT NULL,
  description text,
  level integer NOT NULL CHECK (level IN (1, 2, 3)),
  is_active boolean DEFAULT true,
  approval_status public.approval_status_enum DEFAULT 'draft',
  approved_by uuid,
  approved_at timestamptz,
  approval_note text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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
  approval_status public.approval_status_enum DEFAULT 'draft',
  approved_by uuid,
  approved_at timestamptz,
  approval_note text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 5. ENHANCE EXISTING TABLES
-- ============================================================================

-- Enhance user_profiles
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Enhance opportunities (Phase 1)
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS opp_stage public.opp_stage_enum DEFAULT 'contacted',
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS approval_status public.approval_status_enum DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approval_note text;

-- Backfill end_user_id
UPDATE public.opportunities SET end_user_id = customer_id WHERE end_user_id IS NULL;

-- ============================================================================
-- 6. PHASE 2 - PIPELINE ITEMS
-- ============================================================================

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
  approval_status public.approval_status_enum DEFAULT 'draft',
  approved_by uuid,
  approved_at timestamptz,
  approval_note text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(pipeline_id, opportunity_id)
);

-- History tables
CREATE TABLE IF NOT EXISTS public.opportunity_stage_history_crm (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id),
  from_stage public.opp_stage_enum,
  to_stage public.opp_stage_enum NOT NULL,
  changed_by uuid NOT NULL,
  changed_at timestamptz DEFAULT now(),
  note text
);

CREATE TABLE IF NOT EXISTS public.pipeline_item_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_item_id uuid NOT NULL REFERENCES public.pipeline_items(id),
  from_status public.deal_status_enum,
  to_status public.deal_status_enum NOT NULL,
  changed_by uuid NOT NULL,
  changed_at timestamptz DEFAULT now(),
  note text
);

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

-- ============================================================================
-- 7. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_companies_type ON public.companies(type);
CREATE INDEX IF NOT EXISTS idx_companies_active ON public.companies(is_active);
CREATE INDEX IF NOT EXISTS idx_customer_org_units_customer ON public.customer_org_units(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_contacts_customer ON public.customer_contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_opp_stage ON public.opportunities(opp_stage);
CREATE INDEX IF NOT EXISTS idx_pipeline_items_pipeline ON public.pipeline_items(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_items_status ON public.pipeline_items(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_items_close_date ON public.pipeline_items(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);

-- ============================================================================
-- 8. TRIGGERS (Fixed typo)
-- ============================================================================

DROP TRIGGER IF EXISTS trg_opportunities_set_end_user ON public.opportunities;
CREATE TRIGGER trg_opportunities_set_end_user
  BEFORE INSERT OR UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.set_end_user_default();

DROP TRIGGER IF EXISTS trg_companies_updated_at ON public.companies;
CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_customer_org_units_updated_at ON public.customer_org_units;
CREATE TRIGGER trg_customer_org_units_updated_at
  BEFORE UPDATE ON public.customer_org_units
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_customer_contacts_updated_at ON public.customer_contacts;
CREATE TRIGGER trg_customer_contacts_updated_at
  BEFORE UPDATE ON public.customer_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_pipeline_items_updated_at ON public.pipeline_items;
CREATE TRIGGER trg_pipeline_items_updated_at
  BEFORE UPDATE ON public.pipeline_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();