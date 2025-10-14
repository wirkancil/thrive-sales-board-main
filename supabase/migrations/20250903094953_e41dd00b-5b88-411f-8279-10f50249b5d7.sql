-- Two-Phase CRM: RLS Policies and Security Implementation

-- ============================================================================
-- 1. ENABLE RLS ON ALL NEW TABLES
-- ============================================================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_org_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_stage_history_crm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_item_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. COMPANIES (Customer & End User) RLS POLICIES
-- ============================================================================

-- Admin can manage all companies
CREATE POLICY "Admins can manage all companies" 
ON public.companies FOR ALL 
TO authenticated 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Users can view all active companies (for dropdowns, etc.)
CREATE POLICY "Users can view active companies" 
ON public.companies FOR SELECT 
TO authenticated 
USING (is_active = true);

-- Account managers can insert companies (subject to approval)
CREATE POLICY "Account managers can create companies" 
ON public.companies FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('sales_rep', 'account_manager', 'division_head', 'department_head', 'admin')
  )
  AND created_by = auth.uid()
);

-- Users can update companies they created (if not approved yet)
CREATE POLICY "Users can update draft companies" 
ON public.companies FOR UPDATE 
TO authenticated 
USING (created_by = auth.uid() AND approval_status = 'draft')
WITH CHECK (created_by = auth.uid());

-- ============================================================================
-- 3. CUSTOMER ORGANIZATIONAL STRUCTURES RLS
-- ============================================================================

-- Customer org units policies
CREATE POLICY "Users can view customer org units" 
ON public.customer_org_units FOR SELECT 
TO authenticated 
USING (is_active = true);

CREATE POLICY "Account managers can create customer org units" 
ON public.customer_org_units FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('sales_rep', 'account_manager', 'division_head', 'department_head', 'admin')
  )
  AND created_by = auth.uid()
);

CREATE POLICY "Users can update draft customer org units" 
ON public.customer_org_units FOR UPDATE 
TO authenticated 
USING (created_by = auth.uid() AND approval_status = 'draft')
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update all customer org units" 
ON public.customer_org_units FOR UPDATE 
TO authenticated 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Customer contacts policies
CREATE POLICY "Users can view customer contacts" 
ON public.customer_contacts FOR SELECT 
TO authenticated 
USING (is_active = true);

CREATE POLICY "Account managers can create customer contacts" 
ON public.customer_contacts FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('sales_rep', 'account_manager', 'division_head', 'department_head', 'admin')
  )
  AND created_by = auth.uid()
);

CREATE POLICY "Users can update draft customer contacts" 
ON public.customer_contacts FOR UPDATE 
TO authenticated 
USING (created_by = auth.uid() AND approval_status = 'draft')
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update all customer contacts" 
ON public.customer_contacts FOR UPDATE 
TO authenticated 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================================
-- 4. PIPELINE ITEMS (Phase 2) RLS POLICIES
-- ============================================================================

-- Users can view pipeline items they own or in their division/department
CREATE POLICY "Users can view accessible pipeline items" 
ON public.pipeline_items FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.opportunities o
    JOIN public.user_profiles up_owner ON o.owner_id = up_owner.id
    JOIN public.user_profiles up_current ON up_current.id = auth.uid()
    WHERE o.id = pipeline_items.opportunity_id
    AND (
      o.owner_id = auth.uid() -- Own opportunities
      OR up_current.role = 'admin' -- Admins see all
      OR (up_current.role = 'department_head' AND up_current.department_id = up_owner.department_id) -- Same department
      OR (up_current.role = 'division_head' AND up_current.division_id = up_owner.division_id) -- Same division
    )
  )
);

-- Account managers can create pipeline items for their opportunities
CREATE POLICY "Account managers can create pipeline items" 
ON public.pipeline_items FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.opportunities o
    WHERE o.id = pipeline_items.opportunity_id
    AND o.owner_id = auth.uid()
  )
  AND created_by = auth.uid()
);

-- Users can update pipeline items they created (account managers only for expected_close_date)
CREATE POLICY "Users can update their pipeline items" 
ON public.pipeline_items FOR UPDATE 
TO authenticated 
USING (created_by = auth.uid() OR public.is_admin(auth.uid()))
WITH CHECK (created_by = auth.uid() OR public.is_admin(auth.uid()));

-- Division heads can approve pipeline items in their division
CREATE POLICY "Division heads can approve pipeline items" 
ON public.pipeline_items FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.opportunities o
    JOIN public.user_profiles up_owner ON o.owner_id = up_owner.id
    JOIN public.user_profiles up_current ON up_current.id = auth.uid()
    WHERE o.id = pipeline_items.opportunity_id
    AND up_current.role = 'division_head' 
    AND up_current.division_id = up_owner.division_id
  )
);

-- ============================================================================
-- 5. HISTORY TABLES RLS POLICIES
-- ============================================================================

-- Opportunity stage history - read-only for relevant users
CREATE POLICY "Users can view opportunity stage history" 
ON public.opportunity_stage_history_crm FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.opportunities o
    JOIN public.user_profiles up_owner ON o.owner_id = up_owner.id
    JOIN public.user_profiles up_current ON up_current.id = auth.uid()
    WHERE o.id = opportunity_stage_history_crm.opportunity_id
    AND (
      o.owner_id = auth.uid()
      OR up_current.role = 'admin'
      OR (up_current.role = 'department_head' AND up_current.department_id = up_owner.department_id)
      OR (up_current.role = 'division_head' AND up_current.division_id = up_owner.division_id)
    )
  )
);

CREATE POLICY "System can insert opportunity stage history" 
ON public.opportunity_stage_history_crm FOR INSERT 
TO authenticated 
WITH CHECK (changed_by = auth.uid());

-- Pipeline item history - read-only for relevant users
CREATE POLICY "Users can view pipeline item history" 
ON public.pipeline_item_history FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.pipeline_items pi
    JOIN public.opportunities o ON pi.opportunity_id = o.id
    JOIN public.user_profiles up_owner ON o.owner_id = up_owner.id
    JOIN public.user_profiles up_current ON up_current.id = auth.uid()
    WHERE pi.id = pipeline_item_history.pipeline_item_id
    AND (
      o.owner_id = auth.uid()
      OR up_current.role = 'admin'
      OR (up_current.role = 'department_head' AND up_current.department_id = up_owner.department_id)
      OR (up_current.role = 'division_head' AND up_current.division_id = up_owner.division_id)
    )
  )
);

CREATE POLICY "System can insert pipeline item history" 
ON public.pipeline_item_history FOR INSERT 
TO authenticated 
WITH CHECK (changed_by = auth.uid());

-- ============================================================================
-- 6. NOTIFICATIONS RLS POLICIES
-- ============================================================================

-- Users can only see and manage their own notifications
CREATE POLICY "Users can view own notifications" 
ON public.notifications FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" 
ON public.notifications FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create notifications" 
ON public.notifications FOR INSERT 
TO authenticated 
WITH CHECK (true); -- System-generated notifications

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" 
ON public.notifications FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- ============================================================================
-- 7. CREATE ENHANCED TRIGGERS FOR HISTORY TRACKING
-- ============================================================================

-- Opportunity stage change tracking
CREATE OR REPLACE FUNCTION public.track_opportunity_stage_change_crm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only track if opp_stage actually changed
  IF OLD.opp_stage IS DISTINCT FROM NEW.opp_stage THEN
    INSERT INTO public.opportunity_stage_history_crm (
      opportunity_id,
      from_stage,
      to_stage,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.opp_stage,
      NEW.opp_stage,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Pipeline item status change tracking
CREATE OR REPLACE FUNCTION public.track_pipeline_item_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only track if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.pipeline_item_history (
      pipeline_item_id,
      from_status,
      to_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Apply tracking triggers
DROP TRIGGER IF EXISTS trg_opportunity_stage_change ON public.opportunities;
CREATE TRIGGER trg_opportunity_stage_change
  AFTER UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.track_opportunity_stage_change_crm();

DROP TRIGGER IF EXISTS trg_pipeline_item_status_change ON public.pipeline_items;
CREATE TRIGGER trg_pipeline_item_status_change
  AFTER UPDATE ON public.pipeline_items
  FOR EACH ROW
  EXECUTE FUNCTION public.track_pipeline_item_status_change();