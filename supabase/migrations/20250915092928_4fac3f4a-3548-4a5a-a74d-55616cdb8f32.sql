-- Update log_rbac_changes function to handle null auth.uid() during migrations
CREATE OR REPLACE FUNCTION public.log_rbac_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log role changes
  IF OLD.new_role IS DISTINCT FROM NEW.new_role THEN
    INSERT INTO public.rbac_audit_log (
      user_id, changed_by, action, table_name, record_id,
      old_values, new_values
    ) VALUES (
      NEW.id, 
      COALESCE(auth.uid(), NEW.id), -- Use the user's own ID if auth.uid() is null (during migrations)
      'role_change', 
      TG_TABLE_NAME, 
      NEW.id,
      json_build_object('role', OLD.new_role, 'is_read_only', OLD.is_read_only),
      json_build_object('role', NEW.new_role, 'is_read_only', NEW.is_read_only)
    );
  END IF;
  
  -- Log status changes
  IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
    INSERT INTO public.rbac_audit_log (
      user_id, changed_by, action, table_name, record_id,
      old_values, new_values
    ) VALUES (
      NEW.id, 
      COALESCE(auth.uid(), NEW.id),
      'status_change', 
      TG_TABLE_NAME, 
      NEW.id,
      json_build_object('is_active', OLD.is_active),
      json_build_object('is_active', NEW.is_active)
    );
  END IF;
  
  -- Log read-only toggle changes
  IF OLD.is_read_only IS DISTINCT FROM NEW.is_read_only THEN
    INSERT INTO public.rbac_audit_log (
      user_id, changed_by, action, table_name, record_id,
      old_values, new_values
    ) VALUES (
      NEW.id, 
      COALESCE(auth.uid(), NEW.id),
      'read_only_change', 
      TG_TABLE_NAME, 
      NEW.id,
      json_build_object('is_read_only', OLD.is_read_only),
      json_build_object('is_read_only', NEW.is_read_only)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Now update admin user's new_role
UPDATE public.user_profiles 
SET new_role = 'admin'::simplified_role 
WHERE role = 'admin' AND new_role != 'admin';