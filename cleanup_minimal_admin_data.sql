-- Skrip cleanup minimal untuk halaman admin
-- Hanya menghapus data yang terlihat di user management

-- 1. Hapus audit logs yang bukan dari admin (untuk performance)
DELETE FROM public.audit_log 
WHERE user_id NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.audit_log_v2 
WHERE user_id NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.rbac_audit_log 
WHERE user_id NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.security_audit_log 
WHERE user_id NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 2. Hapus user_profiles yang bukan admin
-- Ini akan membersihkan daftar user di halaman admin
DELETE FROM public.user_profiles 
WHERE id NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 3. Hapus sales targets yang bukan milik admin
DELETE FROM public.sales_targets 
WHERE user_id NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 4. Hapus department targets yang bukan milik admin
DELETE FROM public.department_targets 
WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 5. Hapus target cascades yang bukan milik admin
DELETE FROM public.target_cascades 
WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 6. Verifikasi hasil cleanupx
SELECT '=== MINIMAL CLEANUP RESULTS ===' as info;
SELECT 'User Profiles (should be 2):' as table_info, COUNT(*) as count FROM public.user_profiles;
SELECT 'Admin Users:' as table_info, email as data FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com');
SELECT 'Sales Targets:' as table_info, COUNT(*) as count FROM public.sales_targets;
SELECT 'Department Targets:' as table_info, COUNT(*) as count FROM public.department_targets;
SELECT 'Target Cascades:' as table_info, COUNT(*) as count FROM public.target_cascades;
SELECT 'Audit Logs (admin only):' as table_info, COUNT(*) as count FROM public.audit_log;

SELECT 'Minimal admin cleanup completed successfully!' as status;