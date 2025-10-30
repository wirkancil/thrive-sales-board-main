-- Seed default pipeline and stages
BEGIN;

-- Insert default pipeline
INSERT INTO public.pipelines (id, name, description, is_active)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Default Sales Pipeline',
  'Standard sales pipeline for all opportunities',
  true
) ON CONFLICT (id) DO NOTHING;

-- Insert default pipeline stages
INSERT INTO public.pipeline_stages (pipeline_id, name, sort_order, default_probability, is_active, is_won, is_lost)
VALUES 
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Prospecting', 1, 10, true, false, false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Qualification', 2, 25, true, false, false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Proposal', 3, 50, true, false, false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Negotiation', 4, 75, true, false, false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Closed Won', 5, 100, true, true, false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Closed Lost', 6, 0, true, false, true)
ON CONFLICT (pipeline_id, name) DO NOTHING;

COMMIT;