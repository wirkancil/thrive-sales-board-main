-- Ensure remote enums align with frontend expectations
ALTER TYPE stage_enum ADD VALUE IF NOT EXISTS 'Prospecting';
ALTER TYPE stage_enum ADD VALUE IF NOT EXISTS 'Qualification';
ALTER TYPE stage_enum ADD VALUE IF NOT EXISTS 'Approach/Discovery';
ALTER TYPE stage_enum ADD VALUE IF NOT EXISTS 'Presentation/POC';
ALTER TYPE stage_enum ADD VALUE IF NOT EXISTS 'Proposal/Negotiation';
ALTER TYPE stage_enum ADD VALUE IF NOT EXISTS 'Closed Won';
ALTER TYPE stage_enum ADD VALUE IF NOT EXISTS 'Closed Lost';