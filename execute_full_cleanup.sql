-- Eksekusi Full Cleanup untuk halaman Admin
-- Skrip ini akan menghapus SEMUA data yang terlihat di halaman admin kecuali data admin

-- 1. Hapus semua audit logs yang bukan dari admin
DELETE FROM public.audit_log 
WHERE actor_id NOT IN (
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

-- 2. Hapus pipeline items yang bukan milik admin
DELETE FROM public.pipeline_items 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 3. Hapus opportunities yang bukan milik admin
DELETE FROM public.opportunities 
WHERE owner_id NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 4. Hapus opportunity stage history yang bukan milik admin
DELETE FROM public.opportunity_stage_history 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 5. Hapus companies yang bukan milik admin
DELETE FROM public.companies 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 6. Hapus customer contacts yang bukan milik admin
DELETE FROM public.customer_contacts 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 7. Hapus customer org units yang bukan milik admin
DELETE FROM public.customer_org_units 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 8. Hapus sales targets yang bukan milik admin
DELETE FROM public.sales_targets 
WHERE assigned_to NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 9. Hapus department targets yang bukan milik admin
DELETE FROM public.department_targets 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 10. Hapus target cascades yang tidak terkait admin
DELETE FROM public.target_cascades tc
WHERE tc.source_id NOT IN (
  SELECT dt.id FROM public.department_targets dt
  JOIN public.user_profiles up ON dt.created_by = up.id
  JOIN auth.users au ON au.id = up.id
  WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
) AND tc.target_id NOT IN (
  SELECT up.id FROM public.user_profiles up
  JOIN auth.users au ON au.id = up.id
  WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 11. Hapus teams yang bukan milik admin
DELETE FROM public.teams 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 12. Hapus departments yang bukan milik admin
DELETE FROM public.departments 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 13. Hapus divisions yang bukan milik admin
DELETE FROM public.divisions 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 14. Hapus titles yang bukan milik admin
DELETE FROM public.titles 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 15. Hapus regions yang bukan milik admin
DELETE FROM public.regions 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 16. Hapus fiscal calendars yang bukan milik admin
DELETE FROM public.fiscal_calendars 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 17. Hapus stage settings yang bukan milik admin
DELETE FROM public.stage_settings 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 18. Hapus pipelines yang bukan milik admin
DELETE FROM public.pipelines 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 19. Hapus pipeline stages yang bukan milik admin
DELETE FROM public.pipeline_stages 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 20. Hapus organizations yang bukan milik admin
DELETE FROM public.organizations 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 21. Hapus organization contacts yang bukan milik admin
DELETE FROM public.organization_contacts 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 22. Hapus system settings yang bukan milik admin
DELETE FROM public.system_settings 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 23. Hapus activities yang bukan milik admin
DELETE FROM public.activities 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 24. Hapus sales activities yang bukan milik admin
DELETE FROM public.sales_activities 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 25. Hapus loss reasons yang bukan milik admin
DELETE FROM public.loss_reasons 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 26. Hapus entities yang bukan milik admin
DELETE FROM public.entities 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 27. Hapus projects yang bukan milik admin
DELETE FROM public.projects 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 28. Hapus notifikasi yang bukan milik admin
DELETE FROM public.notifications 
WHERE user_id NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 29. Hapus user notification preferences yang bukan milik admin
DELETE FROM public.user_notification_prefs 
WHERE user_id NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 30. Hapus user_profiles yang bukan admin
DELETE FROM public.user_profiles 
WHERE id NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 31. Hapus user dari auth.users yang bukan admin (HATI-HATI: ini permanen)
DELETE FROM auth.users WHERE email NOT IN ('admin@gmail.com', 'hidayat.suli@gmail.com');

-- 32. Reset sequence
ALTER SEQUENCE IF EXISTS public.user_profiles_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.organizations_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.opportunities_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.audit_log_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.companies_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.sales_targets_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.department_targets_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.target_cascades_id_seq RESTART WITH 1;

-- 33. Verifikasi hasil cleanup
SELECT '=== FULL CLEANUP RESULTS ===' as info;
SELECT 'User Profiles (should be 2):' as table_info, COUNT(*) as count FROM public.user_profiles;
SELECT 'Auth Users (should be 2):' as table_info, COUNT(*) as count FROM auth.users;
SELECT 'Admin Users:' as table_info, email as data FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com');
SELECT 'Organizations:' as table_info, COUNT(*) as count FROM public.organizations;
SELECT 'Opportunities:' as table_info, COUNT(*) as count FROM public.opportunities;
SELECT 'Companies:' as table_info, COUNT(*) as count FROM public.companies;
SELECT 'Sales Targets:' as table_info, COUNT(*) as count FROM public.sales_targets;
SELECT 'Department Targets:' as table_info, COUNT(*) as count FROM public.department_targets;
SELECT 'Target Cascades:' as table_info, COUNT(*) as count FROM public.target_cascades;
SELECT 'Teams:' as table_info, COUNT(*) as count FROM public.teams;
SELECT 'Departments:' as table_info, COUNT(*) as count FROM public.departments;
SELECT 'Divisions:' as table_info, COUNT(*) as count FROM public.divisions;
SELECT 'Audit Logs:' as table_info, COUNT(*) as count FROM public.audit_log;
SELECT 'Pipeline Items:' as table_info, COUNT(*) as count FROM public.pipeline_items;
SELECT 'Activities:' as table_info, COUNT(*) as count FROM public.activities;

SELECT 'FULL ADMIN CLEANUP COMPLETED SUCCESSFULLY!' as status;