-- Fix the search path for the new function
CREATE OR REPLACE FUNCTION set_forecast_from_stage() RETURNS trigger LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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