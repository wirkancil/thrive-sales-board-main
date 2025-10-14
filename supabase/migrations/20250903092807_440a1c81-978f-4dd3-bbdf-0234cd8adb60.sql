-- Option A Migration (Final): Augment deals table without status column conflicts

-- 1) Add new columns (idempotent)
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS customer_id uuid,
  ADD COLUMN IF NOT EXISTS pic_id uuid,
  ADD COLUMN IF NOT EXISTS opportunity_id uuid,
  ADD COLUMN IF NOT EXISTS value_idr numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS created_from_activity_id uuid;

-- 2) Indexes
CREATE INDEX IF NOT EXISTS idx_deals_customer_created_at ON public.deals (customer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_deals_created_from_activity ON public.deals (created_from_activity_id);

-- 3) Backfill created_by from existing user_id where null
UPDATE public.deals SET created_by = user_id WHERE created_by IS NULL;

-- 4) Foreign keys (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deals_created_from_activity_id_fkey') THEN
    ALTER TABLE public.deals
      ADD CONSTRAINT deals_created_from_activity_id_fkey
      FOREIGN KEY (created_from_activity_id)
      REFERENCES public.sales_activity(id)
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deals_customer_id_fkey') THEN
    ALTER TABLE public.deals
      ADD CONSTRAINT deals_customer_id_fkey
      FOREIGN KEY (customer_id)
      REFERENCES public.organizations(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deals_pic_id_fkey') THEN
    ALTER TABLE public.deals
      ADD CONSTRAINT deals_pic_id_fkey
      FOREIGN KEY (pic_id)
      REFERENCES public.organization_contacts(id)
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deals_opportunity_id_fkey') THEN
    ALTER TABLE public.deals
      ADD CONSTRAINT deals_opportunity_id_fkey
      FOREIGN KEY (opportunity_id)
      REFERENCES public.opportunities(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 5) Triggers for auto-setting created_by and maintaining updated_at
CREATE OR REPLACE FUNCTION public.set_deal_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate triggers (drop first for idempotency)
DROP TRIGGER IF EXISTS trg_deals_set_user_id ON public.deals;
CREATE TRIGGER trg_deals_set_user_id
BEFORE INSERT ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.set_deal_user_id();

DROP TRIGGER IF EXISTS trg_deals_set_created_by ON public.deals;
CREATE TRIGGER trg_deals_set_created_by
BEFORE INSERT ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.set_deal_created_by();

DROP TRIGGER IF EXISTS trg_deals_update_updated_at ON public.deals;
CREATE TRIGGER trg_deals_update_updated_at
BEFORE UPDATE ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.update_deals_updated_at();

-- 6) Create the RPC function: create deal from activity
CREATE OR REPLACE FUNCTION public.create_deal_from_activity(
  p_activity_id uuid,
  p_value_idr numeric,
  p_status text DEFAULT 'warm',
  p_opportunity_id uuid DEFAULT null
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a record;
  new_id uuid;
  me record;
BEGIN
  -- Get current user profile
  SELECT * INTO me FROM user_profiles WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Fetch activity created by me or within my team (for heads/admin)
  SELECT sa.*, sa.user_id as activity_user_id
  INTO a
  FROM sales_activity sa
  JOIN user_profiles creator ON creator.id = sa.user_id
  WHERE sa.id = p_activity_id
    AND (
      sa.user_id = auth.uid()
      OR (me.role IN ('division_head','department_head','admin')
          AND (me.division_id = creator.division_id OR me.department_id = creator.department_id))
    )
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Activity not found or access denied';
  END IF;

  -- Insert deal
  INSERT INTO deals (
    company_name,
    deal_value,
    contact_person,
    stage,
    status,
    notes,
    user_id,
    created_by,
    created_from_activity_id,
    value_idr
  )
  VALUES (
    a.customer_name,
    COALESCE(p_value_idr, 0),
    a.customer_name,
    'Lead',
    p_status,
    a.notes,
    auth.uid(),
    auth.uid(),
    p_activity_id,
    COALESCE(p_value_idr, 0)
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END $$;