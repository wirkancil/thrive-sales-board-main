-- Extensions (once)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_role TEXT NOT NULL CHECK (org_role IN ('account_manager','manager','head','admin')),
  type TEXT NOT NULL CHECK (type IN ('alert','target','task','ai','system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,            -- e.g., '/opportunities/123?region=APAC'
  meta JSONB DEFAULT '{}'::jsonb,  -- {opportunity_id, region_id, manager_id, ...}
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- User -> role mapping view (read-only helper)
CREATE OR REPLACE VIEW public.v_user_role AS
SELECT u.id as user_id, p.role as org_role, p.department_id as manager_id, p.head_id, p.region_id
FROM auth.users u
JOIN public.user_profiles p ON p.id = u.id;

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: a user only sees their own notifications
CREATE POLICY "notifs_self_read" ON public.notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifs_self_insert" ON public.notifications
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifs_self_update" ON public.notifications
FOR UPDATE USING (user_id = auth.uid());

-- Mark single notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_id UUID)
RETURNS VOID LANGUAGE SQL SECURITY DEFINER AS $$
  UPDATE public.notifications SET is_read = true WHERE id = p_id AND user_id = auth.uid();
$$;

-- Mark all as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS VOID LANGUAGE SQL SECURITY DEFINER AS $$
  UPDATE public.notifications SET is_read = true WHERE user_id = auth.uid() AND is_read = false;
$$;

-- Fetch latest for dropdown
CREATE OR REPLACE FUNCTION public.fetch_notifications_dropdown(limit_n INT DEFAULT 10)
RETURNS SETOF public.notifications
LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT * FROM public.notifications
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT limit_n;
$$;

-- User notification preferences table
CREATE TABLE IF NOT EXISTS public.user_notification_prefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  prefs JSONB DEFAULT '{
    "in_app": {"alert": true, "target": true, "task": true, "ai": true, "system": true},
    "email": {"daily": false, "weekly": false},
    "quiet_hours": {"enabled": false, "start": "22:00", "end": "08:00"}
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_notification_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prefs_self_access" ON public.user_notification_prefs
FOR ALL USING (user_id = auth.uid());

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;