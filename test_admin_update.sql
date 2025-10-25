-- Test script untuk fungsi admin_update_profile
-- Jalankan di Supabase SQL Editor untuk test langsung

-- 1. Lihat user yang akan ditest (ganti dengan ID user yang sebenarnya)
SELECT id, full_name, role, division_id, department_id 
FROM user_profiles 
WHERE role IN ('account_manager', 'head', 'manager')
ORDER BY created_at DESC
LIMIT 5;

-- 2. Lihat divisi dan departemen yang tersedia
SELECT 'DIVISIONS:' as type, id, name FROM divisions
UNION ALL
SELECT 'DEPARTMENTS:' as type, id, name FROM departments
ORDER BY type, name;

-- 3. Test fungsi admin_update_profile
-- GANTI USER_ID, DIVISION_ID, dan DEPARTMENT_ID dengan nilai yang sebenarnya
/*
SELECT admin_update_profile(
    'USER_ID_HERE'::uuid,
    'manager',
    'DIVISION_ID_HERE'::uuid,
    'DEPARTMENT_ID_HERE'::uuid
);
*/

-- 4. Verifikasi hasil update
/*
SELECT id, full_name, role, division_id, department_id, updated_at
FROM user_profiles 
WHERE id = 'USER_ID_HERE'::uuid;
*/

-- 5. Cek current_user_role untuk memastikan admin permissions
SELECT current_user_role() as my_role;

-- 6. Cek apakah user saat ini adalah admin
SELECT 
    id,
    role,
    CASE WHEN role = 'admin' THEN 'YES' ELSE 'NO' END as is_admin
FROM user_profiles 
WHERE id = auth.uid();