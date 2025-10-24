-- Buat view sederhana untuk audit log
-- Jalankan di Supabase Dashboard SQL Editor

-- Step 1: Buat view sederhana untuk audit log dengan user information
CREATE OR REPLACE VIEW public.v_audit_log_complete AS
SELECT 
  al.id,
  al.entity_id,
  al.user_id,
  al.action_type,
  al.table_name,
  al.record_id,
  al.old_values,
  al.new_values,
  al.metadata,
  al.ip_address,
  al.user_agent,
  al.created_at,
  al.session_id,
  -- User information
  COALESCE(up.full_name, au.email, 'Unknown User') as user_name,
  up.role as user_role,
  -- Entity information
  e.name as entity_name
FROM public.audit_log_v2 al
LEFT JOIN auth.users au ON al.user_id = au.id
LEFT JOIN public.user_profiles up ON al.user_id = up.id
LEFT JOIN public.entities e ON al.entity_id = e.id;

-- Step 2: Grant permissions untuk view ini
GRANT SELECT ON public.v_audit_log_complete TO authenticated;
GRANT SELECT ON public.v_audit_log_complete TO anon;

-- Step 3: Verifikasi view sudah dibuat
SELECT '=== VERIFIKASI VIEW V_AUDIT_LOG_COMPLETE ===' as info;
SELECT 
  table_name,
  view_definition
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name = 'v_audit_log_complete';

-- Step 4: Test view dengan query sederhana
SELECT '=== TEST VIEW V_AUDIT_LOG_COMPLETE ===' as info;
SELECT 
  id,
  action_type,
  table_name,
  created_at,
  user_name,
  entity_name
FROM public.v_audit_log_complete
ORDER BY created_at DESC
LIMIT 5;

SELECT 'View audit log complete telah dibuat! Sekarang frontend bisa query dari v_audit_log_complete.' as status;