-- Phase 1: Simplified RBAC Schema Design (Clean)

-- Create new simplified role enum (skip if exists)
DO $$ BEGIN
    CREATE TYPE public.simplified_role AS ENUM ('admin', 'head', 'manager', 'account_manager');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add missing columns to user_profiles for the new RBAC system
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS is_read_only boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS new_role simplified_role DEFAULT 'account_manager',
ADD COLUMN IF NOT EXISTS organization_id uuid;

-- Create organizations table (top level of hierarchy)
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on organizations (skip if already enabled)
DO $$ BEGIN
    ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;

-- Create RLS policies for organizations
CREATE POLICY "Admins can manage all organizations" 
ON public.organizations FOR ALL 
USING (current_user_role() = 'admin');

CREATE POLICY "Users can view their organization" 
ON public.organizations FOR SELECT 
USING (id = (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

-- Add organization_id to existing tables to complete hierarchy
ALTER TABLE public.divisions 
ADD COLUMN IF NOT EXISTS organization_id uuid;

-- Add foreign key constraints safely
DO $$ BEGIN
    ALTER TABLE public.user_profiles 
    ADD CONSTRAINT fk_user_profiles_organization_id 
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.divisions 
    ADD CONSTRAINT fk_divisions_organization_id 
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create audit log table for RBAC changes
CREATE TABLE IF NOT EXISTS public.rbac_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  changed_by uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  table_name text NOT NULL,
  record_id uuid,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
DO $$ BEGIN
    ALTER TABLE public.rbac_audit_log ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- Drop and recreate audit log policy
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.rbac_audit_log;
CREATE POLICY "Only admins can view audit logs" 
ON public.rbac_audit_log FOR SELECT 
USING (current_user_role() = 'admin');

-- Create helper functions for new RBAC system
CREATE OR REPLACE FUNCTION public.current_user_new_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT new_role::text FROM public.user_profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin_new()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT new_role = 'admin' FROM public.user_profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_head_or_above()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT new_role IN ('admin', 'head') FROM public.user_profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_manager_or_above()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT new_role IN ('admin', 'head', 'manager') FROM public.user_profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_user_read_only(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(is_read_only, false) FROM public.user_profiles WHERE id = user_id;
$$;

-- Create trigger function for RBAC audit logging
CREATE OR REPLACE FUNCTION public.log_rbac_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log role changes
  IF OLD.new_role IS DISTINCT FROM NEW.new_role THEN
    INSERT INTO public.rbac_audit_log (
      user_id, changed_by, action, table_name, record_id,
      old_values, new_values
    ) VALUES (
      NEW.id, auth.uid(), 'role_change', TG_TABLE_NAME, NEW.id,
      json_build_object('role', OLD.new_role, 'is_read_only', OLD.is_read_only),
      json_build_object('role', NEW.new_role, 'is_read_only', NEW.is_read_only)
    );
  END IF;
  
  -- Log status changes
  IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
    INSERT INTO public.rbac_audit_log (
      user_id, changed_by, action, table_name, record_id,
      old_values, new_values
    ) VALUES (
      NEW.id, auth.uid(), 'status_change', TG_TABLE_NAME, NEW.id,
      json_build_object('is_active', OLD.is_active),
      json_build_object('is_active', NEW.is_active)
    );
  END IF;
  
  -- Log read-only toggle changes
  IF OLD.is_read_only IS DISTINCT FROM NEW.is_read_only THEN
    INSERT INTO public.rbac_audit_log (
      user_id, changed_by, action, table_name, record_id,
      old_values, new_values
    ) VALUES (
      NEW.id, auth.uid(), 'read_only_change', TG_TABLE_NAME, NEW.id,
      json_build_object('is_read_only', OLD.is_read_only),
      json_build_object('is_read_only', NEW.is_read_only)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create/recreate trigger for RBAC audit logging
DROP TRIGGER IF EXISTS rbac_audit_trigger ON public.user_profiles;
CREATE TRIGGER rbac_audit_trigger
  AFTER UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_rbac_changes();

-- Add indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_user_profiles_new_role ON public.user_profiles(new_role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_read_only ON public.user_profiles(is_read_only);
CREATE INDEX IF NOT EXISTS idx_user_profiles_organization_id ON public.user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_rbac_audit_log_user_id ON public.rbac_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_rbac_audit_log_created_at ON public.rbac_audit_log(created_at);