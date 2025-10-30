-- Create loss_reasons table and link to opportunities
-- Safe to run multiple times; uses IF NOT EXISTS where possible

-- Ensure pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create table: loss_reasons
CREATE TABLE IF NOT EXISTS public.loss_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique index on normalized label to avoid duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'loss_reasons_label_lower_idx'
  ) THEN
    CREATE UNIQUE INDEX loss_reasons_label_lower_idx ON public.loss_reasons ((lower(label)));
  END IF;
END $$;

-- Enable RLS and allow read for authenticated users
ALTER TABLE public.loss_reasons ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'loss_reasons' AND policyname = 'loss_reasons_select_authenticated'
  ) THEN
    CREATE POLICY "loss_reasons_select_authenticated"
      ON public.loss_reasons
      FOR SELECT
      TO authenticated
      USING (active = TRUE);
  END IF;
END $$;

-- Link opportunities to loss_reasons via lost_reason_id
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS lost_reason_id UUID NULL;

DO $$
BEGIN
  -- Add FK constraint if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'opportunities_lost_reason_id_fkey'
  ) THEN
    ALTER TABLE public.opportunities
      ADD CONSTRAINT opportunities_lost_reason_id_fkey
      FOREIGN KEY (lost_reason_id)
      REFERENCES public.loss_reasons (id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Index for faster joins/filters
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_opportunities_lost_reason_id'
  ) THEN
    CREATE INDEX idx_opportunities_lost_reason_id ON public.opportunities (lost_reason_id);
  END IF;
END $$;

-- Seed default reasons (id auto-generated); ignore if already present
INSERT INTO public.loss_reasons (label)
VALUES
  ('Budget constraints'),
  ('Timeline mismatch'),
  ('Chose competitor'),
  ('No decision'),
  ('Scope changed'),
  ('Requirements not met')
ON CONFLICT DO NOTHING;