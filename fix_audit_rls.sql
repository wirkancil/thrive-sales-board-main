-- Fix RLS policies untuk audit log agar frontend bisa akses
-- Jalankan di Supabase Dashboard SQL Editor

-- Step 1: Cek RLS policies yang ada di audit_log_v2
SELECT '=== CEK RLS POLICIES DI AUDIT_LOG_V2 ===' as info;
SELECT 
  polname as policy_name,
  polcmd as command,
  polroles::regrole[] as roles,
  polqual as using_qual,
  polwithcheck as with_check_qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'audit_log_v2';

-- Step 2: Drop existing policies yang problematic
SELECT '=== DROP EXISTING POLICIES ===' as info;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_log_v2;
DROP POLICY IF EXISTS "Heads can view their entity audit logs" ON public.audit_log_v2;
DROP POLICY IF EXISTS "System can create audit logs" ON public.audit_log_v2;
DROP POLICY IF EXISTS "Users can view audit logs based on role" ON public.audit_log_v2;

-- Step 3: Buat policy sederhana untuk testing
SELECT '=== BUAT POLICY SEDERHANA ===' as info;
CREATE POLICY "Allow select for authenticated users" ON public.audit_log_v2
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow insert for authenticated users" ON public.audit_log_v2
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Step 4: Cek apakah RLS enabled
SELECT '=== CEK STATUS RLS ===' as info;
SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled
FROM pg_class 
WHERE relname = 'audit_log_v2';

-- Step 5: Test query seperti frontend
SELECT '=== TEST QUERY SEPERTI FRONTEND ===' as info;
SELECT 
  al.id,
  al.action_type,
  al.table_name,
  al.created_at,
  COALESCE(up.full_name, au.email, 'Unknown User') as user_name,
  e.name as entity_name
FROM public.audit_log_v2 al
LEFT JOIN auth.users au ON al.user_id = au.id
LEFT JOIN public.user_profiles up ON al.user_id = up.id
LEFT JOIN public.entities e ON al.entity_id = e.id
ORDER BY al.created_at DESC
LIMIT 5;

-- Step 6: Test dari view
SELECT '=== TEST DARI VIEW ===' as info;
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

SELECT 'RLS policies updated! Coba test dengan user admin.' as status;