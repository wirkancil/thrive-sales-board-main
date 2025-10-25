# Instruksi Manual Cleanup Data Mockup

## ⚠️ PERINGATAN PENTING
**SKRIP INI AKAN MENGHAPUS SEMUA DATA KECUALI AKUN ADMIN!**
- Data yang akan dihapus: SEMUA pengguna, organisasi, peluang, pipeline, target, dll.
- Data yang dipertahankan: Akun admin (`admin@gmail.com` dan `hidayat.suli@gmail.com`)

## Langkah-langkah Cleanup

### 1. Buka Supabase Dashboard
1. Pergi ke [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Login ke akun Anda
3. Pilih project: `rztocwslaaskfnkevqxs`

### 2. Buka SQL Editor
1. Di sidebar kiri, klik **SQL Editor**
2. Klik **New Query** untuk membuat query baru

### 3. Jalankan Skrip Cleanup
1. Buka file `execute_full_cleanup.sql` di project ini
2. Copy seluruh isi file tersebut
3. Paste ke SQL Editor di Supabase Dashboard
4. Klik **Run** untuk menjalankan skrip

### 4. Verifikasi Hasil
Setelah skrip selesai, Anda akan melihat output seperti:
```
=== FULL CLEANUP RESULTS ===
User Profiles (should be 2): 2
Organizations (should be admin only): [jumlah data admin]
Companies (should be admin only): [jumlah data admin]
...
FULL ADMIN CLEANUP COMPLETED SUCCESSFULLY!
```

### 5. Refresh Aplikasi
1. Kembali ke aplikasi web
2. Refresh halaman (Ctrl+F5 atau Cmd+Shift+R)
3. Login sebagai admin untuk memverifikasi

## Data yang Akan Dihapus
- ✅ Semua pengguna kecuali admin
- ✅ Semua profil pengguna kecuali admin
- ✅ Semua organisasi dan kontak kecuali milik admin
- ✅ Semua peluang dan pipeline kecuali milik admin
- ✅ Semua target penjualan dan departemen kecuali milik admin
- ✅ Semua tim, divisi, dan departemen kecuali milik admin
- ✅ Semua aktivitas dan proyek kecuali milik admin
- ✅ Semua notifikasi dan log audit kecuali milik admin

## Data yang Dipertahankan
- 🔒 Akun admin: `admin@gmail.com` dan `hidayat.suli@gmail.com`
- 🔒 Semua data yang dibuat oleh admin
- 🔒 Struktur database dan tabel
- 🔒 Pengaturan sistem penting

## Setelah Cleanup
- Halaman admin hanya akan menampilkan data dari admin
- Semua data mockup akan hilang permanen
- Sistem akan berfungsi normal dengan data bersih