# 🚀 Quick Start Testing Guide

**Objective:** Execute all pre-deployment tests in ~2 hours  
**For:** Non-technical testers & stakeholders

---

## ⏱️ **TIME ESTIMATE**

| Phase | Duration | What You'll Do |
|-------|----------|----------------|
| **Phase 1** | 30 min | Manual UI Testing (UAT) |
| **Phase 2** | 20 min | Database Security Checks (RLS) |
| **Phase 3** | 40 min | Performance Testing |
| **Phase 4** | 20 min | Document Results |
| **TOTAL** | **~2 hours** | Complete testing |

---

## 📋 **WHAT YOU NEED**

### **Access:**
- [ ] Login credentials for each role:
  - Head user
  - Manager user
  - Account Manager user
- [ ] Access to Supabase database (for SQL tests)
- [ ] Browser (Chrome/Firefox recommended)

### **Tools:**
- [ ] Browser with developer tools (F12)
- [ ] Screenshot tool
- [ ] Timer/stopwatch
- [ ] Text editor for notes

---

## ⚡ **PHASE 1: MANUAL UI TESTING (30 MIN)**

### **Step 1.1: Test Strategic Dashboard (10 min)**

**What to test:** Head can see real managers (not fake data)

**Actions:**
1. Login sebagai **Head**
2. Go to: `/head/strategic-dashboard`
3. Look at manager dropdown
4. **CHECK:**
   - ✅ Does it show real manager names?
   - ❌ Does it show "Sales Manager", "Marketing Manager"? (This is BAD - old mock data!)

**How to verify:**
```
✅ PASS: Dropdown shows actual manager names from your organization
❌ FAIL: Dropdown shows generic names like "Sales Manager"
```

**Take screenshot:** Manager dropdown

---

### **Step 1.2: Test Activities Page (10 min)**

**What to test:** Manager sees team activities (not just own)

**Actions:**
1. Login sebagai **Manager**
2. Go to: `/manager/activities` or `/activities`
3. Count activities shown
4. **CHECK:**
   - How many activities total? ______
   - Do you see activities from different people? YES / NO
   - Can you see Account Manager names? YES / NO

**How to verify:**
```
✅ PASS: You see activities from Manager + 5-10 Account Managers
❌ FAIL: You only see Manager's own activities
```

**Quick test:**
- Filter by person/owner
- Should see multiple names, not just Manager

**Take screenshot:** Activities list showing different owners

---

### **Step 1.3: Test Calendar Page (10 min)**

**What to test:** Manager sees team calendar

**Actions:**
1. Login sebagai **Manager** (same login as above)
2. Go to: `/manager/calendar` or `/calendar`
3. Look at events in current month
4. **CHECK:**
   - Total events: ______
   - Events from different people? YES / NO

**How to verify:**
```
✅ PASS: Calendar shows events from Manager + team members
❌ FAIL: Calendar only shows Manager's events
```

**Take screenshot:** Calendar view

---

### **PHASE 1 RESULT:**

- [ ] Strategic Dashboard: PASS / FAIL
- [ ] Activities Page: PASS / FAIL
- [ ] Calendar Page: PASS / FAIL

**If ANY test FAILS → Stop and report issue**

---

## 🔐 **PHASE 2: DATABASE SECURITY (20 MIN)**

### **Step 2.1: Access Supabase SQL Editor**

1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Create new query

---

### **Step 2.2: Run Security Tests**

**Copy-paste each query below and run it:**

#### **Test A: Manager Isolation**

```sql
-- This should show ONLY your department's users
SELECT 
  up.full_name,
  up.role,
  up.department_id,
  COUNT(o.id) as opportunity_count
FROM user_profiles up
LEFT JOIN opportunities o ON o.owner_id = up.user_id
WHERE up.department_id = (
  SELECT department_id 
  FROM user_profiles 
  WHERE email = 'your_manager_email@company.com'  -- REPLACE THIS!
)
GROUP BY up.full_name, up.role, up.department_id;
```

**Expected:** Only shows users from Manager's department

✅ PASS: Shows 5-10 people from same department  
❌ FAIL: Shows people from other departments

---

#### **Test B: Account Manager Isolation**

```sql
-- AM should only see own data
SELECT 
  o.name,
  o.amount,
  up.full_name as owner
FROM opportunities o
JOIN user_profiles up ON up.user_id = o.owner_id
WHERE up.email = 'your_am_email@company.com'  -- REPLACE THIS!
LIMIT 10;
```

**Expected:** All opportunities belong to same AM

✅ PASS: All rows show same owner (the AM)  
❌ FAIL: Shows opportunities from different people

---

#### **Test C: Head Division Visibility**

```sql
-- Head should see all managers in division
SELECT 
  up.full_name,
  up.role,
  up.division_id
FROM user_profiles up
WHERE up.role = 'manager'
  AND up.division_id = (
    SELECT division_id 
    FROM user_profiles 
    WHERE email = 'your_head_email@company.com'  -- REPLACE THIS!
  );
```

**Expected:** Shows all managers in Head's division

✅ PASS: Shows 3-10 managers  
❌ FAIL: Shows 0 managers OR shows managers from other divisions

---

### **PHASE 2 RESULT:**

- [ ] Manager Isolation: PASS / FAIL
- [ ] AM Isolation: PASS / FAIL
- [ ] Head Visibility: PASS / FAIL

---

## ⚡ **PHASE 3: PERFORMANCE TESTING (40 MIN)**

### **Step 3.1: Test Page Load Speed**

**You'll need:** Browser with Developer Tools (F12)

#### **Test Activities Page Load:**

1. Login as Manager
2. Press F12 (open Developer Tools)
3. Go to "Network" tab
4. Refresh Activities page
5. Look at bottom: "Load: X.XX s"
6. Record time: ______ seconds

**Target:** < 5 seconds  
**Status:** ✅ PASS / ❌ FAIL

---

#### **Test Calendar Page Load:**

1. Stay logged in as Manager
2. Go to Calendar page
3. Check Network tab load time
4. Record time: ______ seconds

**Target:** < 4 seconds  
**Status:** ✅ PASS / ❌ FAIL

---

#### **Test Strategic Dashboard Load:**

1. Login as Head
2. Go to Strategic Dashboard
3. Check load time
4. Record time: ______ seconds

**Target:** < 5 seconds  
**Status:** ✅ PASS / ❌ FAIL

---

### **Step 3.2: Test with Large Data (if possible)**

**If you have a team with 10+ Account Managers:**

1. Login as their Manager
2. Go to Activities page
3. Count activities shown: ______
4. Check load time: ______ seconds

**Benchmark:**
- 100-500 activities: Should load in < 3s
- 500-1000 activities: Should load in < 5s
- 1000+ activities: May need pagination

---

### **Step 3.3: Database Performance (Advanced)**

**Run in Supabase SQL Editor:**

```sql
-- Check database response time
EXPLAIN ANALYZE
SELECT 
  sa.id,
  sa.activity_type,
  sa.scheduled_at,
  up.full_name
FROM sales_activity_v2 sa
JOIN user_profiles up ON up.user_id = sa.created_by
WHERE up.department_id = (
  SELECT department_id FROM user_profiles WHERE role = 'manager' LIMIT 1
)
ORDER BY sa.scheduled_at DESC
LIMIT 100;
```

**Look for:** `Execution Time: XXX ms`

✅ PASS: < 1000 ms (1 second)  
❌ FAIL: > 5000 ms (5 seconds)

---

### **PHASE 3 RESULT:**

| Page | Target | Actual | Status |
|------|--------|--------|--------|
| Activities | < 5s | ___s | ✅/❌ |
| Calendar | < 4s | ___s | ✅/❌ |
| Dashboard | < 5s | ___s | ✅/❌ |

---

## 📄 **PHASE 4: DOCUMENT RESULTS (20 MIN)**

### **Step 4.1: Fill Out Report**

Open: `TEST_EXECUTION_REPORT.md`

Fill in:
- [ ] Your name & date
- [ ] All test results (PASS/FAIL)
- [ ] Actual performance numbers
- [ ] Any issues found

---

### **Step 4.2: Collect Evidence**

Gather:
- [ ] Screenshots (at least 4-5)
- [ ] Performance numbers
- [ ] SQL query results
- [ ] Any error messages

---

### **Step 4.3: Make Decision**

**Decision Matrix:**

| Scenario | Decision |
|----------|----------|
| All tests PASS | ✅ **APPROVED** - Deploy to production |
| 1-2 minor issues | ⚠️ **CONDITIONAL** - Fix and re-test |
| Any critical issue | ❌ **REJECTED** - Must fix before deploy |

**Critical issues:**
- ❌ Manager sees other department's data
- ❌ AM sees other AMs' data
- ❌ Page load > 10 seconds
- ❌ System crashes or errors

**Minor issues:**
- ⚠️ Page load 5-8 seconds (can optimize later)
- ⚠️ UI layout issues
- ⚠️ Missing data (but no incorrect data)

---

## ✅ **QUICK CHECKLIST**

### **Before You Start:**
- [ ] Have all login credentials ready
- [ ] Browser ready (F12 for dev tools)
- [ ] Supabase access confirmed
- [ ] Screenshot tool ready

### **During Testing:**
- [ ] Take screenshots of each test
- [ ] Record all load times
- [ ] Note any weird behavior
- [ ] Don't skip tests!

### **After Testing:**
- [ ] Fill out report completely
- [ ] Attach all screenshots
- [ ] Make clear decision
- [ ] Share with team

---

## 🆘 **TROUBLESHOOTING**

### **Problem: "No data showing"**
- Check: Are you logged in?
- Check: Does this user have data?
- Try: Refresh the page

### **Problem: "Page very slow (> 10s)"**
- Check: Internet connection
- Check: How much data (count in database)
- Report: This is a FAIL - needs optimization

### **Problem: "SQL query error"**
- Check: Did you replace email placeholders?
- Check: Copy-paste correctly?
- Ask: Developer for help

### **Problem: "Can't access Supabase"**
- Check: Permissions
- Ask: Admin for access
- Alternative: Skip Phase 2, mark as "Not Tested"

---

## 📊 **EXPECTED RESULTS (Reference)**

### **Good Results:**
- ✅ All pages load in < 5 seconds
- ✅ Manager sees 5-10 team members' data
- ✅ No data leakage between departments
- ✅ Strategic Dashboard shows real managers (3-10 names)

### **Bad Results:**
- ❌ Pages load in > 10 seconds
- ❌ Manager only sees own data
- ❌ Manager sees OTHER departments
- ❌ Strategic Dashboard shows "Sales Manager", "Marketing Manager" (mock)

---

## 📞 **NEED HELP?**

**Question:** Not sure if test passed?  
**Answer:** Take screenshot, share with team

**Question:** SQL query not working?  
**Answer:** Ask developer OR skip that specific test

**Question:** Everything seems slow?  
**Answer:** Note the times, document in report, mark as FAIL

---

## 🎯 **SUCCESS CRITERIA**

**Minimum to PASS:**
- ✅ 3/3 UAT tests pass
- ✅ 2/3 RLS tests pass (or not tested)
- ✅ 2/3 Performance tests pass

**Ideal PASS:**
- ✅ ALL tests pass
- ✅ All pages < 5 seconds
- ✅ No issues found

---

**Ready? Start with Phase 1!** 🚀

**Good luck! Remember:**
- Take your time
- Document everything
- When in doubt, ask
- Screenshots are your friend!

