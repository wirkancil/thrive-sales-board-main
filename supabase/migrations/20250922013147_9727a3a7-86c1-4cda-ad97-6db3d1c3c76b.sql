-- Phase 3: Dashboard Scoping & Audit

-- Create comprehensive audit log table
CREATE TABLE public.audit_log_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID REFERENCES public.entities(id),
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'ROLE_CHANGE', etc.
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id TEXT
);

-- Enable RLS on audit_log_v2
ALTER TABLE public.audit_log_v2 ENABLE ROW LEVEL SECURITY;

-- Create policies for audit_log_v2
CREATE POLICY "Admins can view all audit logs" 
ON public.audit_log_v2 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Heads can view their entity audit logs" 
ON public.audit_log_v2 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() 
      AND up.role = 'head' 
      AND up.entity_id = audit_log_v2.entity_id
  )
);

CREATE POLICY "System can create audit logs" 
ON public.audit_log_v2 
FOR INSERT 
WITH CHECK (true);

-- Create function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action_type TEXT,
  p_table_name TEXT,
  p_record_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  audit_id UUID;
  user_entity_id UUID;
BEGIN
  -- Get user's entity_id
  SELECT entity_id INTO user_entity_id
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  INSERT INTO public.audit_log_v2 (
    entity_id,
    user_id,
    action_type,
    table_name,
    record_id,
    old_values,
    new_values,
    metadata
  ) VALUES (
    user_entity_id,
    auth.uid(),
    p_action_type,
    p_table_name,
    p_record_id,
    p_old_values,
    p_new_values,
    p_metadata
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to get entity-scoped data for dashboards
CREATE OR REPLACE FUNCTION public.get_entity_scoped_opportunities(
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  amount NUMERIC,
  stage TEXT,
  owner_id UUID,
  customer_id UUID,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  user_role TEXT;
  user_entity_id UUID;
  user_head_id UUID;
BEGIN
  -- Get user details
  SELECT role, entity_id, head_id 
  INTO user_role, user_entity_id, user_head_id
  FROM public.user_profiles
  WHERE public.user_profiles.id = p_user_id;
  
  -- Admin sees all
  IF user_role = 'admin' THEN
    RETURN QUERY
    SELECT o.id, o.name, o.amount, o.stage::TEXT, o.owner_id, o.customer_id, o.created_at
    FROM public.opportunities o
    WHERE o.is_active = true;
    
  -- Head sees all in their entity
  ELSIF user_role = 'head' THEN
    RETURN QUERY
    SELECT o.id, o.name, o.amount, o.stage::TEXT, o.owner_id, o.customer_id, o.created_at
    FROM public.opportunities o
    JOIN public.user_profiles up ON o.owner_id = up.id
    WHERE o.is_active = true 
      AND up.entity_id = user_entity_id;
      
  -- Manager sees their team + own opportunities
  ELSIF user_role = 'manager' THEN
    RETURN QUERY
    SELECT o.id, o.name, o.amount, o.stage::TEXT, o.owner_id, o.customer_id, o.created_at
    FROM public.opportunities o
    JOIN public.user_profiles up ON o.owner_id = up.id
    WHERE o.is_active = true 
      AND (up.department_id = p_user_id OR o.owner_id = p_user_id)
      AND up.entity_id = user_entity_id;
      
  -- Account Manager sees only their own
  ELSE
    RETURN QUERY
    SELECT o.id, o.name, o.amount, o.stage::TEXT, o.owner_id, o.customer_id, o.created_at
    FROM public.opportunities o
    WHERE o.is_active = true 
      AND o.owner_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to get entity-scoped sales targets
CREATE OR REPLACE FUNCTION public.get_entity_scoped_targets(
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  id UUID,
  assigned_to UUID,
  amount NUMERIC,
  period_start DATE,
  period_end DATE,
  measure TEXT
) AS $$
DECLARE
  user_role TEXT;
  user_entity_id UUID;
BEGIN
  -- Get user details
  SELECT role, entity_id 
  INTO user_role, user_entity_id
  FROM public.user_profiles
  WHERE public.user_profiles.id = p_user_id;
  
  -- Admin sees all
  IF user_role = 'admin' THEN
    RETURN QUERY
    SELECT st.id, st.assigned_to, st.amount, st.period_start, st.period_end, st.measure
    FROM public.sales_targets st;
    
  -- Head sees all in their entity
  ELSIF user_role = 'head' THEN
    RETURN QUERY
    SELECT st.id, st.assigned_to, st.amount, st.period_start, st.period_end, st.measure
    FROM public.sales_targets st
    JOIN public.user_profiles up ON st.assigned_to = up.id
    WHERE up.entity_id = user_entity_id;
      
  -- Manager sees their team targets
  ELSIF user_role = 'manager' THEN
    RETURN QUERY
    SELECT st.id, st.assigned_to, st.amount, st.period_start, st.period_end, st.measure
    FROM public.sales_targets st
    JOIN public.user_profiles up ON st.assigned_to = up.id
    WHERE up.department_id = p_user_id OR st.assigned_to = p_user_id;
      
  -- Account Manager sees only their own
  ELSE
    RETURN QUERY
    SELECT st.id, st.assigned_to, st.amount, st.period_start, st.period_end, st.measure
    FROM public.sales_targets st
    WHERE st.assigned_to = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create comprehensive audit triggers for key tables
CREATE OR REPLACE FUNCTION public.audit_table_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    PERFORM public.log_audit_event(
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      row_to_json(OLD)::jsonb,
      NULL,
      jsonb_build_object('timestamp', now())
    );
    RETURN OLD;
  END IF;
  
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      'CREATE',
      TG_TABLE_NAME,
      NEW.id,
      NULL,
      row_to_json(NEW)::jsonb,
      jsonb_build_object('timestamp', now())
    );
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Only log if there are actual changes
    IF row_to_json(OLD) IS DISTINCT FROM row_to_json(NEW) THEN
      PERFORM public.log_audit_event(
        'UPDATE',
        TG_TABLE_NAME,
        NEW.id,
        row_to_json(OLD)::jsonb,
        row_to_json(NEW)::jsonb,
        jsonb_build_object('timestamp', now())
      );
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create audit triggers for key tables
CREATE TRIGGER audit_opportunities_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_table_changes();

CREATE TRIGGER audit_pipeline_items_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.pipeline_items
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_table_changes();

CREATE TRIGGER audit_user_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_table_changes();

CREATE TRIGGER audit_sales_targets_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.sales_targets
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_table_changes();

CREATE TRIGGER audit_entities_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.entities
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_table_changes();

CREATE TRIGGER audit_system_settings_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_table_changes();

-- Create index for better audit log performance
CREATE INDEX idx_audit_log_v2_entity_created ON public.audit_log_v2(entity_id, created_at DESC);
CREATE INDEX idx_audit_log_v2_user_created ON public.audit_log_v2(user_id, created_at DESC);
CREATE INDEX idx_audit_log_v2_table_created ON public.audit_log_v2(table_name, created_at DESC);

-- Create updated_at trigger for audit_log_v2
CREATE TRIGGER update_audit_log_v2_updated_at
  BEFORE UPDATE ON public.audit_log_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();