-- RLS write policies for pipeline_items (INSERT/UPDATE/DELETE)
-- This ensures pipeline_items can be created/updated/deleted along with opportunities

-- Ensure table exists and RLS enabled
ALTER TABLE public.pipeline_items ENABLE ROW LEVEL SECURITY;

-- INSERT policy: allow creating pipeline_items for opportunities they can access
DROP POLICY IF EXISTS pipeline_items_insert_policy ON public.pipeline_items;
CREATE POLICY pipeline_items_insert_policy ON public.pipeline_items
FOR INSERT TO authenticated
WITH CHECK (
  -- Can create pipeline_items for opportunities they own
  EXISTS (
    SELECT 1 FROM public.opportunities o
    WHERE o.id = public.pipeline_items.opportunity_id AND o.owner_id = auth.uid()
  )
  -- Or admin/head can create for any opportunity
  OR EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'head')
  )
  -- Or manager can create for team opportunities
  OR EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'manager'
      AND EXISTS (
        SELECT 1 FROM public.opportunities o
        JOIN public.user_profiles owner ON owner.user_id = o.owner_id
        WHERE o.id = public.pipeline_items.opportunity_id
          AND (owner.division_id = up.division_id OR owner.department_id = up.department_id)
      )
  )
);

-- UPDATE policy: allow updating pipeline_items for opportunities they can access
DROP POLICY IF EXISTS pipeline_items_update_policy ON public.pipeline_items;
CREATE POLICY pipeline_items_update_policy ON public.pipeline_items
FOR UPDATE TO authenticated
USING (
  -- Can update pipeline_items for opportunities they own
  EXISTS (
    SELECT 1 FROM public.opportunities o
    WHERE o.id = public.pipeline_items.opportunity_id AND o.owner_id = auth.uid()
  )
  -- Or admin/head can update any pipeline_item
  OR EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'head')
  )
  -- Or manager can update team pipeline_items
  OR EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'manager'
      AND EXISTS (
        SELECT 1 FROM public.opportunities o
        JOIN public.user_profiles owner ON owner.user_id = o.owner_id
        WHERE o.id = public.pipeline_items.opportunity_id
          AND (owner.division_id = up.division_id OR owner.department_id = up.department_id)
      )
  )
)
WITH CHECK (
  -- Same conditions for what they can update
  EXISTS (
    SELECT 1 FROM public.opportunities o
    WHERE o.id = public.pipeline_items.opportunity_id AND o.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'head')
  )
  OR EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'manager'
      AND EXISTS (
        SELECT 1 FROM public.opportunities o
        JOIN public.user_profiles owner ON owner.user_id = o.owner_id
        WHERE o.id = public.pipeline_items.opportunity_id
          AND (owner.division_id = up.division_id OR owner.department_id = up.department_id)
      )
  )
);

-- DELETE policy: allow deleting pipeline_items for opportunities they can access
DROP POLICY IF EXISTS pipeline_items_delete_policy ON public.pipeline_items;
CREATE POLICY pipeline_items_delete_policy ON public.pipeline_items
FOR DELETE TO authenticated
USING (
  -- Can delete pipeline_items for opportunities they own
  EXISTS (
    SELECT 1 FROM public.opportunities o
    WHERE o.id = public.pipeline_items.opportunity_id AND o.owner_id = auth.uid()
  )
  -- Or admin/head can delete any pipeline_item
  OR EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'head')
  )
  -- Or manager can delete team pipeline_items
  OR EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'manager'
      AND EXISTS (
        SELECT 1 FROM public.opportunities o
        JOIN public.user_profiles owner ON owner.user_id = o.owner_id
        WHERE o.id = public.pipeline_items.opportunity_id
          AND (owner.division_id = up.division_id OR owner.department_id = up.department_id)
      )
  )
);