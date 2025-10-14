-- Phase 1: Foundation & Role Enhancement Migration (Fixed)

-- First, drop the existing role constraint
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Create enums for user status and other lookups
CREATE TYPE IF NOT EXISTS public.user_status_enum AS ENUM ('active', 'inactive', 'resigned', 'terminated', 'leave');
CREATE TYPE IF NOT EXISTS public.audit_event_type AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'export', 'approval', 'reassignment', 'closed_won', 'closed_lost');
CREATE TYPE IF NOT EXISTS public.audit_object_type AS ENUM ('user', 'customer', 'contact', 'end_user', 'opportunity', 'deal', 'activity', 'target', 'pipeline');

-- Update existing roles to new 4-role format
UPDATE public.user_profiles SET role = 'account_manager' WHERE role IN ('sales_rep', 'account_manager');
UPDATE public.user_profiles SET role = 'manager' WHERE role IN ('department_manager');
UPDATE public.user_profiles SET role = 'head' WHERE role IN ('division_head');
UPDATE public.user_profiles SET role = 'admin' WHERE role = 'admin';

-- Add new role constraint with updated values
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check 
  CHECK (role = ANY (ARRAY['account_manager'::text, 'manager'::text, 'head'::text, 'admin'::text, 'pending'::text]));

-- Create lookup tables for admin-managed dropdowns
CREATE TABLE IF NOT EXISTS public.titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fiscal_calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_month integer NOT NULL CHECK (start_month >= 1 AND start_month <= 12),
  region_code text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Comprehensive audit log table
CREATE TABLE IF NOT EXISTS public.audit_log (
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