-- 1) Add approval workflow columns to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS approval_status approval_status_enum NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approval_note text;

-- 2) Enforcement trigger: only admins can approve; set approver metadata
CREATE OR REPLACE FUNCTION public.enforce_organizations_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    -- Only admins can set to approved or move away from approved
    IF (NEW.approval_status = 'approved' AND NOT public.is_admin(auth.uid())) THEN
      RAISE EXCEPTION 'Only admins can change approval status to approved';
    END IF;

    IF (OLD.approval_status = 'approved' AND NEW.approval_status <> 'approved' AND NOT public.is_admin(auth.uid())) THEN
      RAISE EXCEPTION 'Only admins can modify approved records';
    END IF;

    -- Set approver metadata when moving to approved; clear when moving away
    IF NEW.approval_status = 'approved' THEN
      NEW.approved_by := auth.uid();
      NEW.approved_at := now();
    ELSE
      NEW.approved_by := NULL;
      NEW.approved_at := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_organizations_approval ON public.organizations;
CREATE TRIGGER trg_enforce_organizations_approval
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.enforce_organizations_approval();

-- Keep updated_at fresh
DROP TRIGGER IF EXISTS trg_organizations_updated_at ON public.organizations;
CREATE TRIGGER trg_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3) RLS policy updates for organizations
-- Remove overly permissive existing policies and replace with approval-aware ones
DROP POLICY IF EXISTS "Users can view all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can update organizations they created" ON public.organizations;

-- Admins and dept heads can view everything
CREATE POLICY "Admins and dept heads can view all organizations"
ON public.organizations
FOR SELECT
USING (public.is_admin_or_dept_head(auth.uid()));

-- Regular users: see approved or own drafts
CREATE POLICY "Users can view approved or own organizations"
ON public.organizations
FOR SELECT
USING (approval_status = 'approved' OR created_by = auth.uid());

-- Regular users: can update their own records until approved
CREATE POLICY "Users can update own organizations until approved"
ON public.organizations
FOR UPDATE
USING (created_by = auth.uid() AND approval_status <> 'approved')
WITH CHECK (created_by = auth.uid() AND approval_status <> 'approved');

-- 4) Expand pipelines management beyond admins/dept heads
-- Allow creators to manage their own pipelines
CREATE POLICY "Creators can manage own pipelines"
ON public.pipelines
FOR ALL
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Allow creators to manage stages belonging to their pipelines
CREATE POLICY "Creators can manage stages of own pipelines"
ON public.pipeline_stages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.pipelines p
    WHERE p.id = pipeline_stages.pipeline_id
      AND p.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pipelines p
    WHERE p.id = pipeline_stages.pipeline_id
      AND p.created_by = auth.uid()
  )
);
