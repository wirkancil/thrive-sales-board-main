-- Activate account managers and auto-map manager teams by department
-- This migration ensures AMs are active and team mapping exists for managers

BEGIN;

-- 1) Activate account managers who belong to any department
UPDATE public.user_profiles AS up
SET is_active = true
WHERE up.role = 'account_manager'
  AND up.department_id IS NOT NULL
  AND (up.is_active IS DISTINCT FROM true);

-- 2) Auto-map manager -> account_manager for same department, avoid duplicates
INSERT INTO public.manager_team_members (manager_id, account_manager_id)
SELECT m.id AS manager_id, am.id AS account_manager_id
FROM public.user_profiles m
JOIN public.user_profiles am
  ON am.department_id = m.department_id
WHERE m.role = 'manager'
  AND am.role = 'account_manager'
  AND am.is_active = true
ON CONFLICT DO NOTHING;

COMMIT;