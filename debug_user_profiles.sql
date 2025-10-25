-- Debug query untuk memeriksa data user_profiles terbaru
-- Jalankan query ini di Supabase SQL Editor untuk melihat data aktual

-- 1. Lihat semua user profiles dengan informasi lengkap
SELECT 
    id,
    full_name,
    role,
    division_id,
    department_id,
    created_at,
    updated_at
FROM user_profiles 
ORDER BY created_at DESC
LIMIT 20;

-- 2. Lihat user profiles yang memiliki role tertentu tapi belum ada assignment
SELECT 
    up.id,
    up.full_name,
    up.role,
    up.division_id,
    up.department_id,
    d.name as division_name,
    dept.name as department_name,
    up.created_at
FROM user_profiles up
LEFT JOIN divisions d ON up.division_id = d.id
LEFT JOIN departments dept ON up.department_id = dept.id
WHERE up.role IN ('account_manager', 'head', 'manager')
ORDER BY up.created_at DESC;

-- 3. Cek user yang seharusnya pending berdasarkan kriteria
SELECT 
    up.id,
    up.full_name,
    up.role,
    up.division_id,
    up.department_id,
    CASE 
        WHEN up.role = 'head' AND up.division_id IS NULL THEN 'PENDING - Missing Division'
        WHEN up.role IN ('manager', 'account_manager') AND up.department_id IS NULL THEN 'PENDING - Missing Department'
        ELSE 'COMPLETE'
    END as status
FROM user_profiles up
WHERE up.role IN ('account_manager', 'head', 'manager')
ORDER BY up.created_at DESC;

-- 4. Test fungsi admin_update_profile (ganti UUID dengan ID user yang ingin ditest)
-- SELECT admin_update_profile(
--     'USER_ID_HERE'::uuid,
--     'manager',
--     'DIVISION_ID_HERE'::uuid,
--     'DEPARTMENT_ID_HERE'::uuid
-- );

-- 5. Lihat audit logs terbaru untuk melihat aktivitas update
SELECT 
    table_name,
    operation,
    old_values,
    new_values,
    user_id,
    created_at
FROM audit_logs 
WHERE table_name = 'user_profiles'
ORDER BY created_at DESC
LIMIT 10;