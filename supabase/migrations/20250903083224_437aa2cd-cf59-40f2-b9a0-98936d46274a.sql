-- Option A Migration: Augment existing deals table, convert status to enum, and add FKs/triggers

-- 1) Create enum deal_status ('hot','warm','cold') if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deal_status') THEN
    CREATE TYPE public.deal_status AS ENUM ('hot','warm','cold');
  END IF;
END
$$;

-- 2) Add new columns (idempotent)
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS customer_id uuid,
  ADD COLUMN IF NOT EXISTS pic_id uuid,
  ADD COLUMN IF NOT EXISTS opportunity_id uuid,
  ADD COLUMN IF NOT EXISTS value_idr numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS created_from_activity_id uuid;

-- 3) Indexes
CREATE INDEX IF NOT EXISTS idx_deals_customer_created_at ON public.deals (customer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_deals_created_from_activity ON public.deals (created_from_activity_id);

-- 4) Backfill created_by from existing user_id
UPDATE public.deals SET created_by = user_id WHERE created_by IS NULL;

-- 5) Normalize status values before type change
UPDATE public.deals SET status = LOWER(status) WHERE status IS NOT NULL;
UPDATE public.deals SET status = 'warm' WHERE status IS NULL OR status NOT IN ('hot','warm','cold');

-- 6) Convert status column to enum type with safe casting
ALTER TABLE public.deals ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.deals
  ALTER COLUMN status TYPE public.deal_status USING (
    CASE
      WHEN LOWER(status) = 'hot' THEN 'hot'::public.deal_status
      WHEN LOWER(status) = 'cold' THEN 'cold'::public.deal_status
      ELSE 'warm'::public.deal_status
    END
  );
ALTER TABLE public.deals ALTER COLUMN status SET DEFAULT 'warm'::public.deal_status;

-- 7) Foreign keys (idempotent via constraint name checks)
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

-- 8) Helpful triggers: ensure created_by/user_id set and updated_at maintained
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

-- Recreate triggers idempotently
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
