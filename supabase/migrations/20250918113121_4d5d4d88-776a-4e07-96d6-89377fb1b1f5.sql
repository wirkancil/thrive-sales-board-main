-- ENUMS (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='stage_enum') THEN
    CREATE TYPE stage_enum AS ENUM (
      'Prospecting','Qualification','Approach/Discovery','Presentation / POC',
      'Proposal / Negotiation','Closed Won','Closed Lost'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='forecast_enum') THEN
    CREATE TYPE forecast_enum AS ENUM ('Pipeline','Best Case','Commit','Closed');
  END IF;
END$$;

-- COLUMNS (idempotent)
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS stage stage_enum NOT NULL DEFAULT 'Prospecting',
  ADD COLUMN IF NOT EXISTS forecast_category forecast_enum NOT NULL DEFAULT 'Pipeline',
  ADD COLUMN IF NOT EXISTS next_step_title TEXT,
  ADD COLUMN IF NOT EXISTS next_step_due_date DATE,
  ADD COLUMN IF NOT EXISTS is_closed BOOLEAN GENERATED ALWAYS AS
    (stage IN ('Closed Won','Closed Lost')) STORED,
  ADD COLUMN IF NOT EXISTS is_won BOOLEAN GENERATED ALWAYS AS
    (stage = 'Closed Won') STORED,
  ADD COLUMN IF NOT EXISTS probability NUMERIC GENERATED ALWAYS AS (
    CASE stage
      WHEN 'Prospecting'             THEN 0.10
      WHEN 'Qualification'           THEN 0.25
      WHEN 'Approach/Discovery'      THEN 0.45
      WHEN 'Presentation / POC'      THEN 0.60
      WHEN 'Proposal / Negotiation'  THEN 0.80
      WHEN 'Closed Won'              THEN 1.00
      WHEN 'Closed Lost'             THEN 0.00
    END
  ) STORED;

-- TRIGGER to keep forecast_category in sync with stage
CREATE OR REPLACE FUNCTION set_forecast_from_stage() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.forecast_category :=
    CASE NEW.stage
      WHEN 'Prospecting'            THEN 'Pipeline'
      WHEN 'Qualification'          THEN 'Pipeline'
      WHEN 'Approach/Discovery'     THEN 'Pipeline'
      WHEN 'Presentation / POC'     THEN 'Best Case'
      WHEN 'Proposal / Negotiation' THEN 'Commit'
      ELSE 'Closed'
    END::forecast_enum;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_opps_stage_forecast ON opportunities;
CREATE TRIGGER trg_opps_stage_forecast
BEFORE INSERT OR UPDATE OF stage ON opportunities
FOR EACH ROW EXECUTE FUNCTION set_forecast_from_stage();

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_opps_stage      ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opps_is_closed  ON opportunities(is_closed);
CREATE INDEX IF NOT EXISTS idx_opps_due_date   ON opportunities(next_step_due_date);

-- (Optional) VIEWS
CREATE OR REPLACE VIEW v_opportunities_open AS
  SELECT * FROM opportunities WHERE NOT is_closed;

CREATE OR REPLACE VIEW v_pipeline_progress AS
  SELECT *,
    CASE
      WHEN stage = 'Proposal / Negotiation' THEN 'proposal'
      WHEN stage = 'Closed Won'             THEN 'won'
      WHEN stage = 'Closed Lost'            THEN 'lost'
    END AS board_bucket
  FROM opportunities;