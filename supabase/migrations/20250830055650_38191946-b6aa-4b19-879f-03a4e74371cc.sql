-- Fix linter WARN: set stable search_path on function without it
CREATE OR REPLACE FUNCTION public.update_deals_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;