-- Set all public views to SECURITY INVOKER to avoid definer-privilege escalation
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT table_schema, table_name
    FROM information_schema.views
    WHERE table_schema = 'public'
  LOOP
    EXECUTE format('ALTER VIEW %I.%I SET (security_invoker = true)', r.table_schema, r.table_name);
  END LOOP;
END $$;