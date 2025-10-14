-- Refresh PostgREST schema cache by notifying it of schema changes
NOTIFY pgrst, 'reload schema';