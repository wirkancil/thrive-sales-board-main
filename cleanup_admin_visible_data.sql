-- Skrip cleanup untuk data yang terlihat di halaman admin
-- Fokus pada user management dan data yang ditampilkan di admin panel

-- 1. Hapus audit logs yang bukan dari admin (untuk keamanan dan performance)
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
-- Ini akan otomatis menghapus data terkait mereka karena ON DELETE CASCADE
DELETE FROM public.user_profiles 
WHERE id NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 3. Hapus data sales target yang bukan milik admin
DELETE FROM public.sales_targets 
WHERE user_id NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 4. Hapus data department target yang bukan milik admin
DELETE FROM public.department_targets 
WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 5. Hapus data target cascades yang bukan milik admin
DELETE FROM public.target_cascades 
WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 6. Hapus data organisasi yang bukan milik admin
DELETE FROM public.teams 
WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.departments 
WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.divisions 
WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 7. Hapus data master yang bukan milik admin
DELETE FROM public.titles 
WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.regions 
WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.fiscal_calendars 
WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 8. Hapus data settings yang bukan milik admin
DELETE FROM public.system_settings 
WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.stage_settings 
WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 9. Hapus notifikasi yang bukan milik admin
DELETE FROM public.notifications 
WHERE user_id NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.user_notification_prefs 
WHERE user_id NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 10. Verifikasi hasil cleanup
SELECT '=== CLEANUP RESULTS ===' as info;

SELECT 'User Profiles (should be 2):' as table_info, COUNT(*) as count FROM public.user_profiles;
SELECT 'Admin Users (should be 2):' as table_info, COUNT(*) as count FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com');
SELECT 'Sales Targets:' as table_info, COUNT(*) as count FROM public.sales_targets;
SELECT 'Department Targets:' as table_info, COUNT(*) as count FROM public.department_targets;
SELECT 'Teams:' as table_info, COUNT(*) as count FROM public.teams;
SELECT 'Departments:' as table_info, COUNT(*) as count FROM public.departments;
SELECT 'Divisions:' as table_info, COUNT(*) as count FROM public.divisions;
SELECT 'Titles:' as table_info, COUNT(*) as count FROM public.titles;
SELECT 'Regions:' as table_info, COUNT(*) as count FROM public.regions;
SELECT 'System Settings:' as table_info, COUNT(*) as count FROM public.system_settings;
SELECT 'Audit Logs (admin only):' as table_info, COUNT(*) as count FROM public.audit_log;

SELECT 'Admin data cleanup completed successfully!' as status;