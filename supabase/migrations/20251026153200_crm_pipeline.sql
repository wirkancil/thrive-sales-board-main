-- CRM & Pipeline structures

-- Organizations unify customers and end users
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  org_type org_type_enum NOT NULL DEFAULT 'customer',
  industry TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization contacts
CREATE TABLE IF NOT EXISTS public.organization_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  whatsapp_number TEXT,
  title TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Personal contacts (simple table used by Contacts UI)
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  notes TEXT,
  owner_id UUID REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pipelines
CREATE TABLE IF NOT EXISTS public.pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pipeline stages
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL,
  default_probability INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_won BOOLEAN NOT NULL DEFAULT false,
  is_lost BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_stage_per_pipeline UNIQUE (pipeline_id, name)
);

-- Opportunities
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(18,2),
  currency TEXT NOT NULL DEFAULT 'IDR',
  probability INT,
  expected_close_date DATE,
  status opportunity_status NOT NULL DEFAULT 'open',
  forecast_category forecast_enum,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  is_won BOOLEAN NOT NULL DEFAULT false,
  opp_stage opp_stage_enum,
  owner_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE RESTRICT,
  customer_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  end_user_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE SET NULL,
  stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
  stage stage_enum DEFAULT 'Prospecting',
  stage_entered_at TIMESTAMPTZ,
  next_step_title TEXT,
  next_step_due_date DATE,
  created_by UUID REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
  created_from_activity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pipeline items referencing opportunities (final closing phase items)
CREATE TABLE IF NOT EXISTS public.pipeline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  amount NUMERIC(18,2),
  currency TEXT NOT NULL DEFAULT 'IDR',
  probability INT,
  status TEXT,
  expected_close_date DATE,
  quotation_no TEXT,
  cost_of_goods NUMERIC(18,2),
  service_costs NUMERIC(18,2),
  other_expenses NUMERIC(18,2),
  product TEXT,
  source TEXT,
  stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Per-opportunity stage metrics used by UI
CREATE TABLE IF NOT EXISTS public.opportunity_stage_metrics (
  id UUID PRIMARY KEY, -- equals opportunity_id
  days_in_stage INT NOT NULL DEFAULT 0,
  is_overdue BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_metrics_opportunity FOREIGN KEY (id) REFERENCES public.opportunities(id) ON DELETE CASCADE
);