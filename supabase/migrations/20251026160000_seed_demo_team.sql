-- Seed demo Account Managers and link to the first available manager
-- This is a temporary dataset to unblock UI selection on Add Target
BEGIN;

-- Insert two demo AMs linked to the first manager found
INSERT INTO public.user_profiles (full_name, email, role, is_active, manager_id, department_id, division_id)
SELECT x.full_name, x.email, 'account_manager', true, mgr.id, mgr.department_id, mgr.division_id
FROM (
  SELECT 'Demo AM 1' AS full_name, 'demo_am_1@example.com' AS email
  UNION ALL
  SELECT 'Demo AM 2' AS full_name, 'demo_am_2@example.com' AS email
) AS x
CROSS JOIN LATERAL (
  SELECT id, department_id, division_id
  FROM public.user_profiles
  WHERE role = 'manager'
  ORDER BY created_at
  LIMIT 1
) AS mgr
ON CONFLICT (email) DO NOTHING;

-- Ensure mapping exists in manager_team_members for AMs linked via manager_id
INSERT INTO public.manager_team_members (manager_id, account_manager_id)
SELECT mgr.id, up.id
FROM (
  SELECT id
  FROM public.user_profiles
  WHERE role = 'manager'
  ORDER BY created_at
  LIMIT 1
) AS mgr
JOIN public.user_profiles up ON up.manager_id = mgr.id AND up.role = 'account_manager'
ON CONFLICT DO NOTHING;

COMMIT;