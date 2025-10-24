-- Skrip cleanup data yang aman - hanya data yang terlihat di halaman admin
-- Ini akan menjaga user admin dan data yang mereka buat

-- 1. Dapatkan ID user admin
DO $$
DECLARE
    admin_user_ids uuid[];
BEGIN
    -- Dapatkan semua user admin
    SELECT array_agg(id) INTO admin_user_ids
    FROM auth.users 
    WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com');
    
    RAISE NOTICE 'Admin user IDs: %', admin_user_ids;

    -- 2. Hapus audit logs yang bukan dari admin
    DELETE FROM public.audit_log 
    WHERE user_id != ALL(admin_user_ids);
    
    DELETE FROM public.audit_log_v2 
    WHERE user_id != ALL(admin_user_ids);
    
    DELETE FROM public.rbac_audit_log 
    WHERE user_id != ALL(admin_user_ids);
    
    DELETE FROM public.security_audit_log 
    WHERE user_id != ALL(admin_user_ids);
    
    RAISE NOTICE 'Audit logs cleaned up';

    -- 3. Hapus data pipeline dan opportunity yang bukan dari admin
    DELETE FROM public.pipeline_item_history 
    WHERE created_by != ALL(admin_user_ids);
    
    DELETE FROM public.pipeline_items 
    WHERE created_by != ALL(admin_user_ids);
    
    DELETE FROM public.opportunity_stage_history 
    WHERE created_by != ALL(admin_user_ids);
    
    DELETE FROM public.opportunity_stage_history_new 
    WHERE created_by != ALL(admin_user_ids);
    
    DELETE FROM public.opportunity_stage_history_crm 
    WHERE created_by != ALL(admin_user_ids);
    
    DELETE FROM public.opportunities 
    WHERE created_by != ALL(admin_user_ids);
    
    DELETE FROM public.pipeline_stages 
    WHERE created_by != ALL(admin_user_ids);
    
    DELETE FROM public.pipelines 
    WHERE created_by != ALL(admin_user_ids);
    
    RAISE NOTICE 'Pipeline data cleaned up';

    -- 4. Hapus data customer dan kontak yang bukan dari admin
    DELETE FROM public.customer_contacts 
    WHERE created_by != ALL(admin_user_ids);
    
    DELETE FROM public.customer_org_units 
    WHERE created_by != ALL(admin_user_ids);
    
    DELETE FROM public.organization_contacts 
    WHERE created_by != ALL(admin_user_ids);
    
    DELETE FROM public.companies 
    WHERE created_by != ALL(admin_user_ids);
    
    DELETE FROM public.organizations 
    WHERE created_by != ALL(admin_user_ids);
    
    RAISE NOTICE 'Customer data cleaned up';

    -- 5. Hapus data sales target yang bukan dari admin
    DELETE FROM public.sales_targets 
    WHERE user_id != ALL(admin_user_ids);
    
    DELETE FROM public.department_targets 
    WHERE created_by != ALL(admin_user_ids);
    
    DELETE FROM public.target_cascades 
    WHERE created_by != ALL(admin_user_ids);
    
    RAISE NOTICE 'Sales targets cleaned up';

    -- 6. Hapus data master yang bukan dari admin
    DELETE FROM public.titles 
    WHERE created_by != ALL(admin_user_ids);
    
    DELETE FROM public.regions 
    WHERE created_by != ALL(admin_user_ids);
    
    DELETE FROM public.fiscal_calendars 
    WHERE created_by != ALL(admin_user_ids);
    
    RAISE NOTICE 'Master data cleaned up';

    -- 7. Hapus data struktur organisasi yang bukan dari admin
    DELETE FROM public.teams 
    WHERE created_by != ALL(admin_user_ids);
    
    DELETE FROM public.departments 
    WHERE created_by != ALL(admin_user_ids);
    
    DELETE FROM public.divisions 
    WHERE created_by != ALL(admin_user_ids);
    
    RAISE NOTICE 'Organization structure cleaned up';

    -- 8. Hapus data settings dan konfigurasi yang bukan dari admin
    DELETE FROM public.system_settings 
    WHERE created_by != ALL(admin_user_ids);
    
    DELETE FROM public.stage_settings 
    WHERE created_by != ALL(admin_user_ids);
    
    DELETE FROM public.fx_rates 
    WHERE created_by != ALL(admin_user_ids);
    
    RAISE NOTICE 'Settings cleaned up';

    -- 9. Hapus data aktivitas dan laporan yang bukan dari admin
    DELETE FROM public.activities 
    WHERE created_by != ALL(admin_user_ids);
    
    DELETE FROM public.loss_reasons 
    WHERE created_by != ALL(admin_user_ids);
    
    DELETE FROM public.entities 
    WHERE created_by != ALL(admin_user_ids);
    
    DELETE FROM public.projects 
    WHERE created_by != ALL(admin_user_ids);
    
    RAISE NOTICE 'Activities and reports cleaned up';

    -- 10. Hapus data notifikasi yang bukan dari admin
    DELETE FROM public.notifications 
    WHERE user_id != ALL(admin_user_ids);
    
    DELETE FROM public.user_notification_prefs 
    WHERE user_id != ALL(admin_user_ids);
    
    RAISE NOTICE 'Notifications cleaned up';

    -- 11. Hapus user_profiles yang bukan admin
    DELETE FROM public.user_profiles 
    WHERE id != ALL(admin_user_ids);
    
    RAISE NOTICE 'User profiles cleaned up';

    -- 12. Hapus users yang bukan admin (opsional - hati-hati!)
    -- DELETE FROM auth.users WHERE id != ALL(admin_user_ids);
    
    RAISE NOTICE 'Cleanup completed successfully!';

EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during cleanup: %', SQLERRM;
        RAISE;
END $$;

-- 13. Verifikasi hasil cleanup
SELECT '=== POST-CLEANUP VERIFICATION ===' as info;

SELECT 'User Profiles remaining:' as table_info, COUNT(*) as count FROM public.user_profiles;
SELECT 'Admin Users remaining:' as table_info, COUNT(*) as count FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com');
SELECT 'Organizations remaining:' as table_info, COUNT(*) as count FROM public.organizations;
SELECT 'Opportunities remaining:' as table_info, COUNT(*) as count FROM public.opportunities;
SELECT 'Audit Logs remaining:' as table_info, COUNT(*) as count FROM public.audit_log;
SELECT 'Pipeline Items remaining:' as table_info, COUNT(*) as count FROM public.pipeline_items;
SELECT 'Sales Targets remaining:' as table_info, COUNT(*) as count FROM public.sales_targets;

SELECT 'Cleanup verification completed!' as status;