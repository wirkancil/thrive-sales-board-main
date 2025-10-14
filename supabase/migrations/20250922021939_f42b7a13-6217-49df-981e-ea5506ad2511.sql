-- Fix the audit_table_changes function to avoid JSON comparison issues
CREATE OR REPLACE FUNCTION public.audit_table_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    PERFORM public.log_audit_event(
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      row_to_json(OLD)::jsonb,
      NULL,
      jsonb_build_object('timestamp', now())
    );
    RETURN OLD;
  END IF;
  
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      'CREATE',
      TG_TABLE_NAME,
      NEW.id,
      NULL,
      row_to_json(NEW)::jsonb,
      jsonb_build_object('timestamp', now())
    );
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Only log if there are actual changes by comparing as text
    IF row_to_json(OLD)::text IS DISTINCT FROM row_to_json(NEW)::text THEN
      PERFORM public.log_audit_event(
        'UPDATE',
        TG_TABLE_NAME,
        NEW.id,
        row_to_json(OLD)::jsonb,
        row_to_json(NEW)::jsonb,
        jsonb_build_object('timestamp', now())
      );
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$function$