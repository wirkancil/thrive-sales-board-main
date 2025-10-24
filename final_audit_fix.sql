-- Final fix untuk audit log - pastikan semua permission dan view benar
-- Jalankan di Supabase Dashboard SQL Editor

-- Step 1: Buat view dengan nama yang tepat dan grant semua permission
SELECT '=== MEMBUAT VIEW V_AUDIT_LOG_COMPLETE ===' as info;

-- Drop view jika sudah ada
DROP VIEW IF EXISTS public.v_audit_log_complete;

-- Buat view baru
CREATE VIEW public.v_audit_log_complete AS
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

-- Grant semua permission yang diperlukan
GRANT SELECT ON public.v_audit_log_complete TO authenticated;
GRANT SELECT ON public.v_audit_log_complete TO anon;
GRANT SELECT ON public.v_audit_log_complete TO postgres;

-- Grant permission untuk tabel underlying juga
GRANT SELECT ON public.audit_log_v2 TO authenticated;
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.entities TO authenticated;

-- Step 2: Cek apakah view berhasil dibuat
SELECT '=== CEK VIEW ===' as info;
SELECT 
  table_name,
  view_definition
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name = 'v_audit_log_complete';

-- Step 3: Test view dengan user yang sedang login (admin)
SELECT '=== TEST VIEW DENGAN USER ADMIN ===' as info;
SELECT 
  current_user as current_user,
  current_database() as current_database;

-- Step 4: Test query sederhana
SELECT '=== TEST QUERY SEDERHANA ===' as info;
SELECT COUNT(*) as total_records FROM public.v_audit_log_complete;

-- Step 5: Test query lengkap
SELECT '=== TEST QUERY LENGKAP ===' as info;
SELECT 
  id,
  action_type,
  table_name,
  created_at,
  user_name,
  entity_name
FROM public.v_audit_log_complete
ORDER BY created_at DESC
LIMIT 3;

-- Step 6: Cek apakah ada data di audit_log_v2
SELECT '=== CEK DATA DI AUDIT_LOG_V2 ===' as info;
SELECT COUNT(*) as total_audit_logs FROM public.audit_log_v2;

-- Step 7: Cek struktur audit_log_v2 lagi
SELECT '=== CEK STRUKTUR AUDIT_LOG_V2 ===' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'audit_log_v2'
ORDER BY ordinal_position;

SELECT 'View audit log seharusnya sudah bisa diakses sekarang!' as status;