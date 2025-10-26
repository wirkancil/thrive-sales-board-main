-- Core extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums
DO $$
BEGIN
  -- Role enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_enum') THEN
    CREATE TYPE role_enum AS ENUM ('admin', 'head', 'manager', 'account_manager');
  END IF;

  -- Opportunity status
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opportunity_status') THEN
    CREATE TYPE opportunity_status AS ENUM ('open', 'won', 'lost', 'on_hold', 'archived', 'cancelled');
  END IF;

  -- Forecast categories
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'forecast_enum') THEN
    CREATE TYPE forecast_enum AS ENUM ('Pipeline', 'Best Case', 'Commit', 'Closed');
  END IF;

  -- Approval status
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status_enum') THEN
    CREATE TYPE approval_status_enum AS ENUM ('pending', 'approved', 'rejected');
  END IF;

  -- Stage enum (textual stage names used by UI)
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stage_enum') THEN
    CREATE TYPE stage_enum AS ENUM (
      'Prospecting',
      'Qualification',
      'Approach/Discovery',
      'Presentation/POC',
      'Proposal/Negotiation',
      'Closed Won',
      'Closed Lost'
    );
  END IF;

  -- Opportunity sub-stage enum used in UI analytics
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opp_stage_enum') THEN
    CREATE TYPE opp_stage_enum AS ENUM (
      'contacted', 'visit', 'presentation', 'poc', 'proposal', 'negotiation', 'closed_won', 'closed_lost'
    );
  END IF;

  -- User status enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status_enum') THEN
    CREATE TYPE user_status_enum AS ENUM ('active', 'inactive', 'suspended');
  END IF;

  -- Organization type enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_type_enum') THEN
    CREATE TYPE org_type_enum AS ENUM ('customer', 'end_user', 'partner', 'vendor');
  END IF;
END
$$;

-- Ensure stage_enum contains required values even if pre-existed remotely
ALTER TYPE stage_enum ADD VALUE IF NOT EXISTS 'Prospecting';
ALTER TYPE stage_enum ADD VALUE IF NOT EXISTS 'Qualification';
ALTER TYPE stage_enum ADD VALUE IF NOT EXISTS 'Approach/Discovery';
ALTER TYPE stage_enum ADD VALUE IF NOT EXISTS 'Presentation/POC';
ALTER TYPE stage_enum ADD VALUE IF NOT EXISTS 'Proposal/Negotiation';
ALTER TYPE stage_enum ADD VALUE IF NOT EXISTS 'Closed Won';
ALTER TYPE stage_enum ADD VALUE IF NOT EXISTS 'Closed Lost';