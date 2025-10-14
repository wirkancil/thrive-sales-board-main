-- Fix security definer issues by ensuring views don't have security definer property
-- and fix function search path

-- Drop and recreate views without any security definer properties
DROP VIEW IF EXISTS public.v_master_opportunity;
CREATE VIEW public.v_master_opportunity AS
SELECT 
  o.id,
  o.org_id,
  o.pipeline_id,
  o.stage_id,
  o.owner_id,
  o.customer_id,
  o.end_user_id,
  o.end_user_mode,
  o.name,
  o.description,
  o.opp_stage,
  o.status,
  o.amount,
  o.currency,
  o.probability,
  o.expected_close_date,
  o.source,
  o.tags,
  o.created_by,
  o.created_at,
  o.updated_at,
  
  -- Pipeline and stage details
  p.name as pipeline_name,
  ps.name as stage_name,
  ps.sort_order as stage_sort_order,
  ps.default_probability as stage_default_probability,
  ps.is_won as stage_is_won,
  ps.is_lost as stage_is_lost,
  
  -- Customer details
  c.name as customer_name,
  c.type as customer_type,
  c.industry as customer_industry,
  
  -- End user details
  eu.name as end_user_name,
  
  -- Account manager details
  am.full_name as account_manager_name,
  am.role as account_manager_role,
  
  -- Created by details
  cb.full_name as created_by_name

FROM public.opportunities o
LEFT JOIN public.pipelines p ON o.pipeline_id = p.id
LEFT JOIN public.pipeline_stages ps ON o.stage_id = ps.id
LEFT JOIN public.organizations c ON o.customer_id = c.id
LEFT JOIN public.organizations eu ON o.end_user_id = eu.id
LEFT JOIN public.user_profiles am ON o.owner_id = am.id
LEFT JOIN public.user_profiles cb ON o.created_by = cb.id
WHERE o.is_active = true;

-- Drop and recreate v_customer_org_units view
DROP VIEW IF EXISTS public.v_customer_org_units;
CREATE VIEW public.v_customer_org_units AS
SELECT 
  cou.id,
  cou.customer_id,
  cou.parent_unit_id,
  cou.name,
  cou.description,
  cou.level,
  cou.is_active,
  cou.created_by,
  cou.created_at,
  cou.updated_at,
  c.name as customer_name,
  parent_unit.name as parent_unit_name,
  cb.full_name as created_by_name
FROM public.customer_org_units cou
LEFT JOIN public.organizations c ON cou.customer_id = c.id
LEFT JOIN public.customer_org_units parent_unit ON cou.parent_unit_id = parent_unit.id
LEFT JOIN public.user_profiles cb ON cou.created_by = cb.id
WHERE cou.is_active = true;

-- Drop and recreate v_customer_contacts view
DROP VIEW IF EXISTS public.v_customer_contacts;
CREATE VIEW public.v_customer_contacts AS
SELECT 
  cc.id,
  cc.customer_id,
  cc.org_unit_id,
  cc.full_name,
  cc.title,
  cc.email,
  cc.phone,
  cc.is_primary,
  cc.is_active,
  cc.created_by,
  cc.created_at,
  cc.updated_at,
  c.name as customer_name,
  cou.name as org_unit_name,
  cb.full_name as created_by_name
FROM public.customer_contacts cc
LEFT JOIN public.organizations c ON cc.customer_id = c.id
LEFT JOIN public.customer_org_units cou ON cc.org_unit_id = cou.id
LEFT JOIN public.user_profiles cb ON cc.created_by = cb.id
WHERE cc.is_active = true;

-- Fix function search path for handle_end_user_creation
CREATE OR REPLACE FUNCTION public.handle_end_user_creation()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  existing_end_user_id uuid;
  customer_record record;
BEGIN
  -- Only process if end_user_mode is same_as_customer
  IF NEW.end_user_mode = 'same_as_customer' THEN
    -- Check if we already have an end user cloned from this customer
    SELECT o.id INTO existing_end_user_id
    FROM public.organizations o
    WHERE o.type = 'end_user' 
      AND o.name = (SELECT name FROM public.organizations WHERE id = NEW.customer_id)
      AND o.created_by = NEW.created_by
    LIMIT 1;
    
    IF existing_end_user_id IS NOT NULL THEN
      -- Reuse existing end user
      NEW.end_user_id := existing_end_user_id;
    ELSE
      -- Create new end user by cloning customer
      SELECT * INTO customer_record 
      FROM public.organizations 
      WHERE id = NEW.customer_id;
      
      IF FOUND THEN
        INSERT INTO public.organizations (
          org_id, name, type, tax_id, website, phone, email, 
          industry, addresses, is_active, created_by
        ) VALUES (
          customer_record.org_id,
          customer_record.name,
          'end_user',
          customer_record.tax_id,
          customer_record.website,
          customer_record.phone,
          customer_record.email,
          customer_record.industry,
          customer_record.addresses,
          true,
          NEW.created_by
        ) RETURNING id INTO NEW.end_user_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix function search path for check_pipeline_close_date
CREATE OR REPLACE FUNCTION public.check_pipeline_close_date()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  days_until_close integer;
  opportunity_record record;
  account_manager_id uuid;
  division_head_id uuid;
BEGIN
  -- Calculate days until close
  days_until_close := NEW.expected_close_date - CURRENT_DATE;
  
  -- Get opportunity and account manager details
  SELECT o.*, o.owner_id INTO opportunity_record
  FROM public.opportunities o
  WHERE o.id = NEW.opportunity_id;
  
  account_manager_id := opportunity_record.owner_id;
  
  -- Get division head for the account manager
  SELECT up_div.id INTO division_head_id
  FROM public.user_profiles up_am
  JOIN public.user_profiles up_div ON (up_div.division_id = up_am.division_id AND up_div.role = 'division_head')
  WHERE up_am.id = account_manager_id
  LIMIT 1;
  
  -- Create notifications if close date is within 14 days
  IF days_until_close <= 14 AND days_until_close >= 0 THEN
    -- Notification for Account Manager
    INSERT INTO public.notifications (
      user_id, pipeline_item_id, type, severity, message, due_in_days
    ) VALUES (
      account_manager_id,
      NEW.id,
      'close_date_warning',
      CASE WHEN days_until_close <= 7 THEN 'high' ELSE 'medium' END,
      'Pipeline item "' || opportunity_record.name || '" is due to close in ' || days_until_close || ' days',
      days_until_close
    );
    
    -- Notification for Division Head (if exists)
    IF division_head_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id, pipeline_item_id, type, severity, message, due_in_days
      ) VALUES (
        division_head_id,
        NEW.id,
        'close_date_warning',
        CASE WHEN days_until_close <= 7 THEN 'high' ELSE 'medium' END,
        'Team pipeline item "' || opportunity_record.name || '" is due to close in ' || days_until_close || ' days',
        days_until_close
      );
    END IF;
  END IF;
  
  -- Create overdue notifications
  IF days_until_close < 0 THEN
    -- Notification for Account Manager
    INSERT INTO public.notifications (
      user_id, pipeline_item_id, type, severity, message, due_in_days
    ) VALUES (
      account_manager_id,
      NEW.id,
      'close_date_overdue',
      'critical',
      'Pipeline item "' || opportunity_record.name || '" is ' || ABS(days_until_close) || ' days overdue',
      days_until_close
    );
    
    -- Notification for Division Head (if exists)
    IF division_head_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id, pipeline_item_id, type, severity, message, due_in_days
      ) VALUES (
        division_head_id,
        NEW.id,
        'close_date_overdue',
        'critical',
        'Team pipeline item "' || opportunity_record.name || '" is ' || ABS(days_until_close) || ' days overdue',
        days_until_close
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;