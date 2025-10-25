-- Skrip untuk mengecek data yang ada sebelum cleanup
-- Fokus pada data yang terlihat di halaman admin

-- 1. Cek user profiles
SELECT '=== USER PROFILES ===' as info;
SELECT 
    id,
    full_name,
    role,
    email,
    created_at,
    created_by
FROM public.user_profiles 
ORDER BY created_at DESC;

-- 2. Cek total data per tabel utama
SELECT '=== DATA SUMMARY ===' as info;
SELECT 'user_profiles' as table_name, COUNT(*) as total_records FROM public.user_profiles
UNION ALL
SELECT 'organizations' as table_name, COUNT(*) as total_records FROM public.organizations
UNION ALL
SELECT 'opportunities' as table_name, COUNT(*) as total_records FROM public.opportunities
UNION ALL
SELECT 'pipelines' as table_name, COUNT(*) as total_records FROM public.pipelines
UNION ALL
SELECT 'sales_targets' as table_name, COUNT(*) as total_records FROM public.sales_targets
UNION ALL
SELECT 'audit_log' as table_name, COUNT(*) as total_records FROM public.audit_log
UNION ALL
SELECT 'audit_log_v2' as table_name, COUNT(*) as total_records FROM public.audit_log_v2
UNION ALL
SELECT 'rbac_audit_log' as table_name, COUNT(*) as total_records FROM public.rbac_audit_log
UNION ALL
SELECT 'security_audit_log' as table_name, COUNT(*) as total_records FROM public.security_audit_log;

-- 3. Cek admin users
SELECT '=== ADMIN USERS ===' as info;
SELECT 
    au.id,
    au.email,
    au.created_at,
    up.full_name,
    up.role
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
ORDER BY au.created_at DESC;

-- 4. Cek data yang dibuat oleh non-admin
SELECT '=== NON-ADMIN DATA OVERVIEW ===' as info;
SELECT 
    'Organizations by non-admin' as description,
    COUNT(*) as count
FROM public.organizations o
WHERE o.created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
) OR o.created_by IS NULL;

SELECT 
    'Opportunities by non-admin' as description,
    COUNT(*) as count
FROM public.opportunities o
WHERE o.created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
) OR o.created_by IS NULL;

SELECT 
    'User Profiles non-admin' as description,
    COUNT(*) as count
FROM public.user_profiles up
WHERE up.id NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 5. Cek data terbaru untuk referensi
SELECT '=== RECENT DATA (Last 5 entries) ===' as info;
SELECT 'Recent Organizations:' as table_info;
SELECT name, created_by, created_at 
FROM public.organizations 
ORDER BY created_at DESC LIMIT 5;

SELECT 'Recent Opportunities:' as table_info;
SELECT name, created_by, created_at 
FROM public.opportunities 
ORDER BY created_at DESC LIMIT 5;

SELECT 'Recent User Profiles:' as table_info;
SELECT full_name, role, email, created_at 
FROM public.user_profiles 
ORDER BY created_at DESC LIMIT 5;