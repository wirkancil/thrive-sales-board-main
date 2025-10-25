# Panduan Full Cleanup Data Admin

## Tujuan
Skrip ini akan **MENGHAPUS SEMUA DATA** yang terlihat di halaman admin kecuali data pengguna admin.

## Data yang DIHAPUS
Skrip `execute_full_cleanup.sql` akan menghapus:
- ✅ **Semua log audit** kecuali milik admin
- ✅ **Semua profil pengguna** kecuali admin
- ✅ **Semua organisasi, kontak, dan data perusahaan** kecuali milik admin
- ✅ **Semua peluang dan pipeline** kecuali milik admin
- ✅ **Semua target penjualan dan departemen** kecuali milik admin
- ✅ **Semua tim, departemen, dan divisi** kecuali milik admin
- ✅ **Semua aktivitas dan proyek** kecuali milik admin
- ✅ **Semua notifikasi dan preferensi** kecuali milik admin
- ✅ **Semua pengguna dari auth.users** kecuali admin (PERMANEN!)

## Data yang DITAHAN
- 🔒 **Pengguna Admin**: `admin@gmail.com` dan `hidayat.suli@gmail.com`
- 🔒 **Semua data yang dibuat oleh admin**
- 🔒 **Struktur database dan tabel**

## Cara Menjalankan

### 1. Backup Database (WAJIB!)
```bash
# Backup database sebelum cleanup
supabase db dump --data-only > backup_before_cleanup.sql
```

### 2. Jalankan Skrip Cleanup
```bash
# Jalankan skrip cleanup
psql -h your_host -d your_db -U your_user -f execute_full_cleanup.sql
```

### 3. Verifikasi Hasil
Skrip akan menampilkan:
- Jumlah data yang tersisa di setiap tabel
- Daftar pengguna admin yang masih ada
- Status keberhasilan cleanup

## ⚠️ PERINGATAN
- **INI ADALAH OPERASI PERMANEN!**
- **SEMUA DATA NON-ADMIN AKAN DIHAPUS SELAMANYA!**
- **PASTIKAN ANDA TELAH MELAKUKAN BACKUP!**
- **ADMIN HANYA AKAN MELIHAT DATA MEREKA SENDIRI SETELAH CLEANUP!**

## Setelah Cleanup
- Halaman admin hanya akan menampilkan data dari admin
- Performa sistem akan meningkat drastis
- Semua data non-admin akan hilang permanen
- Pengguna non-admin tidak bisa login lagi

## Troubleshooting
Jika terjadi error:
1. Cek constraint foreign key
2. Pastikan admin users ada di database
3. Jalankan skrip `check_admin_data.sql` terlebih dahulu
4. Hubungi developer jika masalah berlanjut