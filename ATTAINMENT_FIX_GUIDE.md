# 🎯 Overall Attainment Chart - Troubleshooting Guide

## 📊 **Masalah: Chart Menampilkan 0%**

### **Screenshot Masalah:**
```
Overall Attainment
Revenue Attainment
         0%
```

---

## 🔍 **Root Cause Analysis**

Chart "Overall Attainment" menghitung dari data Account Managers:

```typescript
const attainmentData = useMemo(() => {
  const totalTarget = accountManagerPerformanceData.reduce((sum, am) => sum + am.target, 0);
  const totalAchieved = accountManagerPerformanceData.reduce((sum, am) => sum + am.achieved, 0);
  const achievementRate = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;
  
  return [
    { name: 'Achieved', value: Math.round(achievementRate), fill: 'hsl(var(--primary))' },
    { name: 'Remaining', value: Math.round(100 - achievementRate), fill: 'hsl(var(--muted))' },
  ];
}, [accountManagerPerformanceData]);
```

**Masalah Utama:**
- `totalTarget` = 0 (Account Manager belum punya target untuk periode tersebut)
- `totalAchieved` = Rp 2.000.000 (ada data achieved dari staff2)
- `achievementRate` = totalAchieved / totalTarget = 2.000.000 / 0 = **0%** ❌

---

## ✅ **SOLUSI**

### **1. Assign Target ke Account Manager**

Chart ini akan berfungsi **hanya jika** Account Manager (staff2) sudah punya target untuk periode yang dipilih.

**Langkah-langkah:**

1. **Buka halaman Sales Target** (`/manager/sales-target`)
2. **Klik "+ Add Target"**
3. **Isi form:**
   - **Measure**: Revenue (atau Margin)
   - **Assigned to**: staff2 (Account Manager)
   - **Amount**: Rp 1.000.000 (atau jumlah target yang diinginkan)
   - **Period**: Q4 2025 (sesuai periode yang dipilih di Team Dashboard)
4. **Klik Save**

Setelah itu:
```
Overall Attainment
Revenue Attainment
         200%  ✅
         
(karena Achieved Rp 2.000.000 / Target Rp 1.000.000 = 200%)
```

---

### **2. Workflow yang Benar**

**Hierarki Target:**
1. **Head** assign target ke **Manager**
2. **Manager** assign target ke **Account Manager**
3. **Account Manager** execute dan achieve target

**Untuk Chart "Overall Attainment" berfungsi:**
- ✅ **Account Manager HARUS punya target** untuk periode yang dipilih
- ✅ **Target harus sesuai periode** (Q1 2025, Q2 2025, dll)
- ✅ **Measure harus sama** dengan yang dipilih di dropdown (Revenue atau Margin)

---

## 🎨 **Alternatif: Tampilkan Achieved Only (Jika No Target)**

Jika Anda ingin chart tetap menampilkan sesuatu meskipun belum ada target, bisa modifikasi logic:

```typescript
const attainmentData = useMemo(() => {
  const totalTarget = accountManagerPerformanceData.reduce((sum, am) => sum + am.target, 0);
  const totalAchieved = accountManagerPerformanceData.reduce((sum, am) => sum + am.achieved, 0);
  
  // Jika tidak ada target, tampilkan achieved saja
  if (totalTarget === 0) {
    if (totalAchieved > 0) {
      return [
        { name: 'Achieved', value: 100, fill: 'hsl(var(--primary))' },
        { name: 'No Target Set', value: 0, fill: 'hsl(var(--muted))' },
      ];
    }
    return [
      { name: 'No Data', value: 0, fill: 'hsl(var(--muted))' },
      { name: 'No Target', value: 100, fill: 'hsl(var(--muted-foreground))' },
    ];
  }
  
  const achievementRate = (totalAchieved / totalTarget) * 100;
  return [
    { name: 'Achieved', value: Math.round(achievementRate), fill: 'hsl(var(--primary))' },
    { name: 'Remaining', value: Math.round(100 - achievementRate), fill: 'hsl(var(--muted))' },
  ];
}, [accountManagerPerformanceData]);
```

**Tapi saya TIDAK rekomendasikan** ini karena lebih baik user assign target terlebih dahulu.

---

## 🔧 **Debugging Steps**

Jika setelah assign target chart masih 0%:

### **1. Cek Data di Console (F12)**

Sudah tidak ada log karena sudah dibersihkan. Tapi bisa tambahkan sementara:

```typescript
console.log('Account Managers:', accountManagers);
console.log('Targets:', targets);
console.log('Performance Data:', accountManagerPerformanceData);
console.log('Attainment Data:', attainmentData);
```

### **2. Cek di Database (Supabase SQL Editor)**

```sql
-- Cek targets untuk Account Manager di periode tertentu
SELECT 
  st.id,
  st.measure,
  st.amount,
  st.period_start,
  st.period_end,
  up.full_name as assigned_to_name
FROM sales_targets st
JOIN user_profiles up ON up.id = st.assigned_to
WHERE up.full_name = 'staff2'
  AND st.period_start <= '2025-12-31'
  AND st.period_end >= '2025-10-01'
ORDER BY st.created_at DESC;
```

### **3. Cek Periode**

Pastikan periode yang dipilih di **Period Selector** sama dengan periode target yang sudah dibuat.

Contoh:
- ✅ Period: **Q4 2025** → Target: period_start = 2025-10-01, period_end = 2025-12-31
- ❌ Period: **Q4 2025** → Target: period_start = 2026-01-01 (salah periode!)

---

## 📝 **Summary**

**Penyebab 0%:**
- Account Manager (staff2) belum punya target untuk periode yang dipilih

**Solusi:**
1. ✅ Assign target ke staff2 via menu "Sales Target"
2. ✅ Pastikan periode target sama dengan periode yang dipilih
3. ✅ Pastikan measure (Revenue/Margin) sesuai dengan dropdown

**Expected Result:**
```
Overall Attainment
Revenue Attainment
         200%
         
(jika Achieved = Rp 2.000.000, Target = Rp 1.000.000)
```

---

## 🎯 **Performance Optimization**

Saya sudah menghapus **semua console.log yang tidak perlu**:
- ✅ `DepartmentPerformanceOverview.tsx` → 8 log dihapus
- ✅ `SalesTarget.tsx` → 6 log dihapus
- ✅ `SalesSummary.tsx` → 14 log dihapus

**Total: 28 console.log dihapus** untuk mengurangi beban client! 🚀

