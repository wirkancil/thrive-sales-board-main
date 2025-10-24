-- Fix missing user profiles untuk audit log
-- Script ini menangani user yang ada di auth.users tapi tidak ada di user_profiles
-- Jalankan di Supabase Dashboard SQL Editor

-- Step 1: Cek user yang missing di user_profiles
SELECT '=== CEK USER YANG MISSING DI USER_PROFILES ===' as info;
SELECT 
  au.id as auth_user_id,
  au.email,
  au.created_at,
  'Missing in user_profiles' as status
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL
AND au.email != 'admin@gmail.com'; -- Kecuali admin

-- Step 2: Buat user_profiles untuk user yang missing
SELECT '=== BUAT USER_PROFILES UNTUK USER YANG MISSING ===' as info;
INSERT INTO public.user_profiles (
  id,
  full_name,
  role,
  created_at
)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
  'account_manager' as role, -- Default role
  au.created_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL
AND au.email != 'admin@gmail.com';

-- Step 3: Verifikasi user_profiles sekarang lengkap
SELECT '=== VERIFIKASI USER_PROFILES SEKARANG LENGKAP ===' as info;
SELECT 
  'Total auth.users' as info,
  COUNT(*) as count
FROM auth.users;

SELECT 
  'Total user_profiles' as info,
  COUNT(*) as count
FROM public.user_profiles;

SELECT 
  'Missing profiles (harusnya 0)' as info,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Step 4: Test audit log dengan user yang baru dibuat
SELECT '=== TEST AUDIT LOG DENGAN USER BARU ===' as info;

-- Coba insert test audit log
DO $$
DECLARE
  test_audit_id UUID;
  test_user_id UUID;
BEGIN
  -- Ambil salah satu user yang baru dibuat
  SELECT au.id INTO test_user_id
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON au.id = up.id
  WHERE up.id IS NOT NULL
  AND au.email != 'admin@gmail.com'
  LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Coba insert audit log
    INSERT INTO public.audit_log_v2 (
      user_id,
      action_type,
      table_name,
      record_id,
      created_at
    ) VALUES (
      test_user_id,
      'TEST_ACTION',
      'test_table',
      gen_random_uuid(),
      now()
    ) RETURNING id INTO test_audit_id;
    
    RAISE NOTICE 'Test audit log berhasil dibuat dengan role account_manager: %', test_audit_id;
  ELSE
    RAISE NOTICE 'Tidak ada user yang bisa di-test';
  END IF;
END $$;

-- Step 5: Final check - coba query seperti frontend
SELECT '=== FINAL CHECK - QUERY SEPERTI FRONTEND ===' as info;
SELECT 
  al.id,
  al.action_type,
  al.table_name,
  al.created_at,
  up.full_name as user_name
FROM public.audit_log_v2 al
LEFT JOIN public.user_profiles up ON al.user_id = up.id
ORDER BY al.created_at DESC
LIMIT 5;

SELECT 'User profiles sekarang lengkap! Audit log harusnya sudah bisa berjalan normal.' as status;