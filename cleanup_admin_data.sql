-- Skrip untuk membersihkan semua data kecuali user admin
-- Admin emails yang akan dipertahankan: admin@gmail.com, hidayat.suli@gmail.com

-- 1. Hapus data dari tabel yang memiliki foreign key dependencies
-- Mulai dari tabel anak ke tabel induk

-- Hapus audit logs (kecuali yang berkaitan dengan admin)
DELETE FROM public.audit_log WHERE user_id NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.audit_log_v2 WHERE user_id NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.rbac_audit_log WHERE user_id NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.security_audit_log WHERE user_id NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 2. Hapus data pipeline dan opportunity
DELETE FROM public.pipeline_item_history WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.pipeline_items WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.opportunity_stage_history WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.opportunity_stage_history_new WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.opportunity_stage_history_crm WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.opportunities WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.pipeline_stages WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.pipelines WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 3. Hapus data customer dan kontak
DELETE FROM public.customer_contacts WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.customer_org_units WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.organization_contacts WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.companies WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.organizations WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 4. Hapus data sales dan target
DELETE FROM public.sales_targets WHERE user_id NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.department_targets WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.target_cascades WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 5. Hapus data master (titles, regions, fiscal_calendars)
DELETE FROM public.titles WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.regions WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.fiscal_calendars WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 6. Hapus data struktur organisasi
DELETE FROM public.teams WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.departments WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.divisions WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 7. Hapus data settings dan konfigurasi
DELETE FROM public.system_settings WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.stage_settings WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.fx_rates WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 8. Hapus data aktivitas dan laporan
DELETE FROM public.activities WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.loss_reasons WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.entities WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.projects WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 9. Hapus data notifikasi
DELETE FROM public.notifications WHERE user_id NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

DELETE FROM public.user_notification_prefs WHERE user_id NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 10. Hapus user_profiles yang bukan admin
DELETE FROM public.user_profiles WHERE id NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com')
);

-- 11. Hapus data dari auth.users yang bukan admin (opsional, hati-hati)
-- Ini akan menghapus user secara permanen
DELETE FROM auth.users WHERE email NOT IN ('admin@gmail.com', 'hidayat.suli@gmail.com');

-- 12. Reset sequence jika ada
ALTER SEQUENCE IF EXISTS public.user_profiles_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.organizations_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.opportunities_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.audit_log_id_seq RESTART WITH 1;

-- 13. Verifikasi data yang tersisa
SELECT 'User Profiles remaining:' as info, COUNT(*) as count FROM public.user_profiles;
SELECT 'Admin Users remaining:' as info, COUNT(*) as count FROM auth.users WHERE email IN ('admin@gmail.com', 'hidayat.suli@gmail.com');
SELECT 'Audit Logs remaining:' as info, COUNT(*) as count FROM public.audit_log;

SELECT 'Cleanup completed successfully!' as status;