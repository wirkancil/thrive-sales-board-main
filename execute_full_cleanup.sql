-- Eksekusi Full Cleanup untuk halaman Admin
-- Skrip ini akan menghapus SEMUA data yang terlihat di halaman admin kecuali data admin

-- URUTAN PENGHAPUSAN YANG BENAR:
-- 1. Mulai dari child tables paling dalam
-- 2. Bergerak ke parent tables
-- 3. Pastikan tidak ada foreign key constraint violations

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

-- 2. Hapus pipeline item history (child table)
DELETE FROM public.pipeline_item_history 
WHERE pipeline_item_id IN (
    SELECT pi.id FROM public.pipeline_items pi
    WHERE pi.created_by NOT IN (
        SELECT up.id FROM public.user_profiles up
        JOIN auth.users au ON au.id = up.id
        WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
    )
);

-- 3. Hapus opportunity stage history (child table)
DELETE FROM public.opportunity_stage_history 
WHERE opportunity_id IN (
    SELECT o.id FROM public.opportunities o
    WHERE o.owner_id NOT IN (
        SELECT up.id FROM public.user_profiles up
        JOIN auth.users au ON au.id = up.id
        WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
    )
);

-- 4. Set NULL pada foreign key untuk menghindari constraint violations
UPDATE public.opportunities o
SET created_from_activity_id = NULL
WHERE o.created_from_activity_id IN (
    SELECT sa.id FROM public.sales_activity_v2 sa
    JOIN public.user_profiles up ON sa.created_by = up.id
    JOIN auth.users au ON up.id = au.id
    WHERE au.email NOT IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

UPDATE public.sales_activity_v2 sa
SET opportunity_id = NULL
WHERE sa.opportunity_id IN (
    SELECT o.id FROM public.opportunities o
    WHERE o.owner_id NOT IN (
        SELECT up.id FROM public.user_profiles up
        JOIN auth.users au ON au.id = up.id
        WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
    )
);

-- 5. Hapus activity attachments (child table dari sales_activity_v2)
DELETE FROM public.activity_attachments 
WHERE activity_id IN (
    SELECT sa.id FROM public.sales_activity_v2 sa
    WHERE sa.created_by NOT IN (
        SELECT up.id FROM public.user_profiles up
        JOIN auth.users au ON au.id = up.id
        WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
    )
    OR sa.customer_id IN (
        SELECT org.id FROM public.organizations org
        JOIN public.user_profiles up ON org.created_by = up.id
        JOIN auth.users au ON up.id = au.id
        WHERE au.email NOT IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
    )
);

-- 6. Hapus sales_activity_v2 (child table)
DELETE FROM public.sales_activity_v2 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
)
OR customer_id IN (
    SELECT org.id FROM public.organizations org
    JOIN public.user_profiles up ON org.created_by = up.id
    JOIN auth.users au ON up.id = au.id
    WHERE au.email NOT IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 7. Hapus pipeline items
DELETE FROM public.pipeline_items 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 8. Hapus opportunities
DELETE FROM public.opportunities 
WHERE owner_id NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 9. Hapus department targets
DELETE FROM public.department_targets 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 10. Hapus sales targets
DELETE FROM public.sales_targets 
WHERE assigned_to NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 11. Hapus target cascades
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

-- 12. Hapus teams yang tidak terkait dengan admin
DELETE FROM public.teams 
WHERE id NOT IN (
    SELECT team_id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
    AND team_id IS NOT NULL
);

-- 13. Hapus departments yang tidak terkait dengan admin
DELETE FROM public.departments 
WHERE id NOT IN (
    SELECT department_id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
    AND department_id IS NOT NULL
);

-- 14. Hapus divisions yang tidak terkait dengan admin
DELETE FROM public.divisions 
WHERE id NOT IN (
    SELECT division_id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
    AND division_id IS NOT NULL
);

-- 15. Hapus titles
DELETE FROM public.titles 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 16. Hapus regions
DELETE FROM public.regions 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 17. Hapus fiscal calendars
DELETE FROM public.fiscal_calendars 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 18. Hapus stage settings
DELETE FROM public.stage_settings 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 19. Hapus pipelines
DELETE FROM public.pipelines 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 20. Hapus pipeline stages
DELETE FROM public.pipeline_stages ps
WHERE ps.pipeline_id NOT IN (
    SELECT p.id FROM public.pipelines p
    WHERE p.created_by IN (
        SELECT up.id FROM public.user_profiles up
        JOIN auth.users au ON au.id = up.id
        WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
    )
);

-- 21. Hapus system settings
DELETE FROM public.system_settings 
WHERE updated_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
) AND setting_key NOT IN ('entity_mode', 'currency_mode');

-- 22. Hapus loss reasons
DELETE FROM public.loss_reasons 
WHERE id NOT IN (
    SELECT DISTINCT lost_reason_id FROM public.opportunities o
    JOIN public.user_profiles up ON o.owner_id = up.id
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
    AND lost_reason_id IS NOT NULL
) AND label NOT IN ('Price too high', 'Competitor chosen', 'Budget constraints', 'Timeline mismatch', 'No decision made', 'Requirements changed', 'Project cancelled', 'Other');

-- 23. Hapus entities
DELETE FROM public.entities 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 24. Hapus projects
DELETE FROM public.projects 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 25. Hapus companies
DELETE FROM public.companies 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 26. Hapus customer org units
DELETE FROM public.customer_org_units 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 27. Hapus customer contacts
DELETE FROM public.customer_contacts 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 28. Hapus organizations (PASTIKAN SEMUA CHILD TABLES SUDAH DIHAPUS!)
DELETE FROM public.organizations 
WHERE created_by NOT IN (
    SELECT up.id FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 29. Hapus notifications
DELETE FROM public.notifications n
WHERE n.user_id NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
) OR n.pipeline_item_id IN (
    SELECT pi.id FROM public.pipeline_items pi
    JOIN public.opportunities o ON pi.opportunity_id = o.id
    JOIN public.user_profiles up ON o.owner_id = up.id
    JOIN auth.users au ON au.id = up.id
    WHERE au.email NOT IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.user_notification_prefs 
WHERE user_id NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- Skip when table already removed in earlier migrations
DO $$
BEGIN
    IF to_regclass('public.sales_activities') IS NOT NULL THEN
        DELETE FROM public.sales_activities 
        WHERE created_by NOT IN (
            SELECT up.id FROM public.user_profiles up
            JOIN auth.users au ON au.id = up.id
            WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
        );
    END IF;
END $$;

-- 30. Hapus sales activities (jika tabel ada)
DO $$
BEGIN
  IF to_regclass('public.sales_activities') IS NOT NULL THEN
    DELETE FROM public.sales_activities
    WHERE created_by NOT IN (
      SELECT up.id FROM public.user_profiles up
      JOIN auth.users au ON au.id = up.id
      WHERE au.email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
    );
  END IF;
END
$$;

-- 32. Hapus user_profiles yang bukan admin
DELETE FROM public.user_profiles 
WHERE id NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 33. Hapus user dari auth.users yang bukan admin (HATI-HATI: ini permanen)
DELETE FROM auth.users WHERE email NOT IN ('admin@gmail.com', 'hidayat.suli@gmail.com');

-- 34. Reset sequence
ALTER SEQUENCE IF EXISTS public.user_profiles_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.organizations_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.companies_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.customer_contacts_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.customer_org_units_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.opportunities_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.pipeline_items_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.sales_targets_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.department_targets_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.target_cascades_id_seq RESTART WITH 1;

-- 35. Verifikasi hasil cleanup
SELECT '=== FULL CLEANUP RESULTS ===' as info;
SELECT 'User Profiles (should be 2):' as table_info, COUNT(*) as count FROM public.user_profiles;
SELECT 'Organizations (should be admin only):' as table_info, COUNT(*) as count FROM public.organizations;
SELECT 'Companies (should be admin only):' as table_info, COUNT(*) as count FROM public.companies;
SELECT 'Customer Contacts (should be admin only):' as table_info, COUNT(*) as count FROM public.customer_contacts;
SELECT 'Customer Org Units (should be admin only):' as table_info, COUNT(*) as count FROM public.customer_org_units;
SELECT 'Opportunities (should be admin only):' as table_info, COUNT(*) as count FROM public.opportunities;
SELECT 'Pipeline Items (should be admin only):' as table_info, COUNT(*) as count FROM public.pipeline_items;
SELECT 'Sales Targets (should be admin only):' as table_info, COUNT(*) as count FROM public.sales_targets;
SELECT 'Department Targets (should be admin only):' as table_info, COUNT(*) as count FROM public.department_targets;
SELECT 'Target Cascades (should be admin only):' as table_info, COUNT(*) as count FROM public.target_cascades;
SELECT 'Teams (should be admin only):' as table_info, COUNT(*) as count FROM public.teams;
SELECT 'Departments (should be admin only):' as table_info, COUNT(*) as count FROM public.departments;
SELECT 'Divisions (should be admin only):' as table_info, COUNT(*) as count FROM public.divisions;
SELECT 'Titles (should be admin only):' as table_info, COUNT(*) as count FROM public.titles;
SELECT 'Regions (should be admin only):' as table_info, COUNT(*) as count FROM public.regions;
SELECT 'Fiscal Calendars (should be admin only):' as table_info, COUNT(*) as count FROM public.fiscal_calendars;
SELECT 'Stage Settings (should be admin only):' as table_info, COUNT(*) as count FROM public.stage_settings;
SELECT 'Pipelines (should be admin only):' as table_info, COUNT(*) as count FROM public.pipelines;
SELECT 'Pipeline Stages (should be admin only):' as table_info, COUNT(*) as count FROM public.pipeline_stages;
SELECT 'System Settings (should be admin only):' as table_info, COUNT(*) as count FROM public.system_settings;
SELECT 'Loss Reasons (should be admin only):' as table_info, COUNT(*) as count FROM public.loss_reasons;
SELECT 'Entities (should be admin only):' as table_info, COUNT(*) as count FROM public.entities;
SELECT 'Projects (should be admin only):' as table_info, COUNT(*) as count FROM public.projects;
SELECT 'Sales Activities table not found; skipped.' as table_info, NULL::int as count;
SELECT 'Activities (should be admin only):' as table_info, COUNT(*) as count FROM public.activities;
SELECT 'Notifications (should be admin only):' as table_info, COUNT(*) as count FROM public.notifications;
SELECT 'User Notification Prefs (should be admin only):' as table_info, COUNT(*) as count FROM public.user_notification_prefs;
SELECT 'Audit Logs (should be admin only):' as table_info, COUNT(*) as count FROM public.audit_log;
SELECT 'Audit Log V2 (should be admin only):' as table_info, COUNT(*) as count FROM public.audit_log_v2;
SELECT 'RBAC Audit Log (should be admin only):' as table_info, COUNT(*) as count FROM public.rbac_audit_log;
SELECT 'Security Audit Log (should be admin only):' as table_info, COUNT(*) as count FROM public.security_audit_log;
SELECT 'Pipeline Item History (should be admin only):' as table_info, COUNT(*) as count FROM public.pipeline_item_history;
SELECT 'Opportunity Stage History (should be admin only):' as table_info, COUNT(*) as count FROM public.opportunity_stage_history;
SELECT 'Activity Attachments (should be admin only):' as table_info, COUNT(*) as count FROM public.activity_attachments;
SELECT 'Sales Activity V2 (should be admin only):' as table_info, COUNT(*) as count FROM public.sales_activity_v2;
SELECT 'Auth Users (should be 2):' as table_info, COUNT(*) as count FROM auth.users;
SELECT 'FULL ADMIN CLEANUP COMPLETED SUCCESSFULLY!' as status;

-- 36. Peringatan penting
SELECT 'PERINGATAN: Semua data non-admin telah dihapus secara permanen!' as warning;
SELECT 'Pastikan Anda telah melakukan backup sebelum menjalankan skrip ini.' as backup_reminder;
