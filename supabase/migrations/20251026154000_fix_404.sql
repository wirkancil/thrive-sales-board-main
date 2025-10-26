-- Create missing resources to resolve 404 errors from frontend

-- 1) Notification type enum (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type_enum') THEN
    CREATE TYPE public.notification_type_enum AS ENUM ('alert', 'target', 'task', 'ai', 'system');
  END IF;
END
$$;

-- 2) notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_role text,
  type public.notification_type_enum NOT NULL,
  title text,
  message text NOT NULL,
  link text,
  meta jsonb DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_user_fk FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select ON public.notifications
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_insert ON public.notifications;
CREATE POLICY notifications_insert ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_update ON public.notifications;
CREATE POLICY notifications_update ON public.notifications
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;

-- 3) system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb,
  updated_by uuid,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS system_settings_select ON public.system_settings;
CREATE POLICY system_settings_select ON public.system_settings
FOR SELECT TO authenticated
USING (true);

GRANT SELECT ON public.system_settings TO authenticated;

-- 4) fx_rates table
CREATE TABLE IF NOT EXISTS public.fx_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency text NOT NULL,
  to_currency text NOT NULL,
  rate numeric(18,6) NOT NULL,
  rate_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fx_rates_select ON public.fx_rates;
CREATE POLICY fx_rates_select ON public.fx_rates
FOR SELECT TO authenticated
USING (true);

GRANT SELECT ON public.fx_rates TO authenticated;

-- 5) v_audit_log_complete view (compatible with frontend)
CREATE OR REPLACE VIEW public.v_audit_log_complete AS
SELECT 
  al.id,
  al.user_id,
  al.action AS action_type,
  al.table_name,
  al.record_id,
  NULL::jsonb AS old_values,
  al.changes AS new_values,
  NULL::jsonb AS metadata,
  NULL::text AS ip_address,
  NULL::text AS user_agent,
  al.created_at,
  NULL::text AS session_id,
  up.full_name AS user_name,
  up.role::text AS user_role,
  up.entity_id,
  NULL::text AS entity_name
FROM public.audit_logs al
LEFT JOIN public.user_profiles up ON up.user_id = al.user_id
ORDER BY al.created_at DESC;

GRANT SELECT ON public.v_audit_log_complete TO authenticated;

-- 6) RPCs used by frontend

-- Drop earlier signature to avoid PostgREST confusion
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_users_with_profiles'
      AND pg_get_function_arguments(p.oid) = 'p_division_id uuid DEFAULT NULL::uuid, p_department_id uuid DEFAULT NULL::uuid'
  ) THEN
    DROP FUNCTION public.get_users_with_profiles(uuid, uuid);
  END IF;
END $$;

-- Recreate with expected signature
CREATE OR REPLACE FUNCTION public.get_users_with_profiles(
  p_query text DEFAULT NULL,
  p_role text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
  division_id uuid,
  department_id uuid,
  title_id uuid,
  status text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    up.user_id AS id,
    au.email,
    up.full_name,
    up.role::text AS role,
    up.division_id,
    up.department_id,
    up.title_id,
    CASE WHEN up.is_active THEN 'active' ELSE 'inactive' END AS status
  FROM public.user_profiles up
  LEFT JOIN auth.users au ON au.id = up.user_id
  WHERE (p_query IS NULL OR up.full_name ILIKE '%' || p_query || '%' OR au.email ILIKE '%' || p_query || '%')
    AND (p_role IS NULL OR up.role::text = p_role)
  ORDER BY up.full_name;
$$;

GRANT EXECUTE ON FUNCTION public.get_users_with_profiles(text, text) TO authenticated;

-- Mark notification read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true
  WHERE id = p_id AND user_id = auth.uid();
END;
$$;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated;

-- Mark all notifications read for current user
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true
  WHERE user_id = auth.uid();
END;
$$;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;