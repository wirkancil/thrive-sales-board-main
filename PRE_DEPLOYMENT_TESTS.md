# 🧪 Pre-Deployment Testing Guide

**Date:** 2025-10-30  
**Status:** Testing in Progress  
**Objective:** Validate all fixes before production deployment

---

## 📋 **TESTING CHECKLIST**

- [ ] 1. User Acceptance Testing (UAT)
- [ ] 2. Test dengan Data Real Production
- [ ] 3. Verify RLS Policies di Supabase
- [ ] 4. Performance Testing dengan Large Dataset

---

## 🧪 **TEST 1: USER ACCEPTANCE TESTING (UAT)**

### **Test Case 1.1: Strategic Dashboard - Real Managers**

**Role:** Head  
**Feature:** Strategic Dashboard shows real managers

**Steps:**
1. Login sebagai Head
2. Navigate to `/head/strategic-dashboard`
3. Check manager dropdown

**Expected Results:**
- ✅ Dropdown shows real manager names from database
- ✅ NOT showing mock data (sales, marketing, operations, support)
- ✅ Shows "All Managers" as first option
- ✅ Managers sorted alphabetically
- ✅ Empty state handled if no managers

**Acceptance Criteria:**
```
PASS: Dropdown contains real manager names
FAIL: Dropdown contains "Sales Manager", "Marketing Manager", etc (mock data)
```

---

### **Test Case 1.2: Activities Page - Team Visibility (Manager)**

**Role:** Manager  
**Feature:** Activities page shows Manager + Team activities

**Steps:**
1. Login sebagai Manager
2. Navigate to `/manager/activities` or `/activities`
3. Check activities list

**Expected Results:**
- ✅ Shows Manager's own activities
- ✅ Shows Account Managers' activities (team members)
- ✅ Activities from multiple people visible
- ✅ Can filter by activity type
- ✅ Can search activities

**Acceptance Criteria:**
```
PASS: Activities list contains entries from Manager AND Account Managers
FAIL: Only shows Manager's own activities
```

**How to Verify:**
1. Check "created_by" or owner of activities
2. Should see different names (Manager + AMs)
3. Count should be > Manager's individual activities

---

### **Test Case 1.3: Calendar Page - Team Calendar (Manager)**

**Role:** Manager  
**Feature:** Calendar shows Manager + Team events

**Steps:**
1. Login sebagai Manager
2. Navigate to calendar page
3. Check calendar events

**Expected Results:**
- ✅ Shows Manager's own calendar events
- ✅ Shows Account Managers' events (team members)
- ✅ Events from multiple people visible
- ✅ Can navigate between months
- ✅ Can add new events

**Acceptance Criteria:**
```
PASS: Calendar shows events from Manager AND Account Managers
FAIL: Only shows Manager's own events
```

---

### **Test Case 1.4: Hierarchy Consistency (Head)**

**Role:** Head  
**Feature:** Sales Summary uses division_id

**Steps:**
1. Login sebagai Head
2. Navigate to `/head/sales-summary`
3. Check revenue/margin totals

**Expected Results:**
- ✅ Revenue aggregates from all division members
- ✅ Margin aggregates from all division members
- ✅ Top Performers shows Managers + AMs
- ✅ Charts display division-wide data

**Acceptance Criteria:**
```
PASS: Data shows division-wide aggregation
FAIL: Only shows Head's personal data
```

---

## 📊 **TEST 2: TEST DENGAN DATA REAL PRODUCTION**

### **Test Scenario 2.1: Multiple Managers Under Head**

**Setup:**
- 1 Head with `division_id` set
- 3 Managers in same division
- Each Manager has 2-3 Account Managers

**Test:**
1. Head opens Strategic Dashboard
2. Verify dropdown shows all 3 managers
3. Select each manager individually
4. Verify dashboard filters correctly

**Expected:**
- ✅ All 3 managers appear in dropdown
- ✅ Selecting manager filters data
- ✅ "All Managers" shows combined data

---

### **Test Scenario 2.2: Manager with Multiple AMs**

**Setup:**
- 1 Manager with `department_id` set
- 5 Account Managers in same department
- Each AM has 3-5 activities/events

**Test:**
1. Manager opens Activities page
2. Count total activities shown
3. Verify activities from all 5 AMs appear

**Expected:**
- ✅ Activities count = Manager activities + (5 AMs × 3-5 activities)
- ✅ At least 15-25 activities total
- ✅ Can identify different AM names

---

### **Test Scenario 2.3: Large Team Performance**

**Setup:**
- 1 Manager
- 10 Account Managers
- Each AM has 10 won opportunities

**Test:**
1. Manager opens Team Dashboard
2. Check revenue aggregation
3. Verify all AMs appear in performance table

**Expected:**
- ✅ All 10 AMs listed
- ✅ Total revenue = sum of all AM revenues
- ✅ Performance chart shows all 10 AMs
- ✅ No missing data

---

## 🔐 **TEST 3: VERIFY RLS POLICIES**

### **RLS Test 3.1: Manager Cannot See Other Departments**

**Setup:**
- Department A: Manager A with AM1, AM2
- Department B: Manager B with AM3, AM4

**Test:**
1. Login as Manager A
2. Check Activities page
3. Verify ONLY shows AM1, AM2 activities (NOT AM3, AM4)

**SQL Verification:**
```sql
-- Run this query to verify RLS is working
-- Should return ONLY activities from Manager A's department

SELECT 
  sa.id,
  sa.created_by,
  up.full_name,
  up.department_id
FROM sales_activity_v2 sa
JOIN user_profiles up ON up.user_id = sa.created_by
WHERE up.department_id = (
  SELECT department_id 
  FROM user_profiles 
  WHERE user_id = '[MANAGER_A_USER_ID]'
);
```

**Expected:**
- ✅ Query returns only Department A activities
- ✅ AM3, AM4 activities NOT visible
- ✅ RLS policy enforced

---

### **RLS Test 3.2: Account Manager Only Sees Own Data**

**Setup:**
- AM1 with 5 opportunities
- AM2 with 5 opportunities (same department)

**Test:**
1. Login as AM1
2. Check Opportunities page
3. Verify ONLY shows AM1's 5 opportunities (NOT AM2's)

**SQL Verification:**
```sql
-- Should return ONLY AM1's opportunities
SELECT 
  o.id,
  o.name,
  o.owner_id,
  up.full_name
FROM opportunities o
JOIN user_profiles up ON up.user_id = o.owner_id
WHERE o.owner_id = '[AM1_USER_ID]';
```

**Expected:**
- ✅ Only 5 opportunities shown
- ✅ All belong to AM1
- ✅ AM2's opportunities NOT visible

---

### **RLS Test 3.3: Head Cannot See Other Divisions**

**Setup:**
- Division 1: Head1 with Manager1
- Division 2: Head2 with Manager2

**Test:**
1. Login as Head1
2. Check Strategic Dashboard
3. Verify dropdown ONLY shows Manager1 (NOT Manager2)

**SQL Verification:**
```sql
-- Should return ONLY Division 1 managers
SELECT 
  up.id,
  up.full_name,
  up.division_id
FROM user_profiles up
WHERE up.role = 'manager'
  AND up.division_id = (
    SELECT division_id 
    FROM user_profiles 
    WHERE user_id = '[HEAD1_USER_ID]'
  );
```

**Expected:**
- ✅ Only Manager1 returned
- ✅ Manager2 NOT visible
- ✅ Division isolation enforced

---

## ⚡ **TEST 4: PERFORMANCE TESTING**

### **Performance Test 4.1: Large Activities Dataset**

**Setup:**
- 1 Manager
- 20 Account Managers
- 100 activities per AM = 2000 total activities

**Test:**
1. Login as Manager
2. Navigate to Activities page
3. Measure load time

**Performance Metrics:**
```
Page Load Time: Target < 3 seconds
Query Execution: Target < 1 second
Rendering: Target < 500ms
Total: Target < 5 seconds
```

**Acceptance Criteria:**
- ✅ Page loads in < 5 seconds
- ✅ Activities display correctly
- ✅ Filter/search works smoothly
- ⚠️ If > 5 seconds, implement pagination

---

### **Performance Test 4.2: Large Calendar Dataset**

**Setup:**
- 1 Manager
- 15 Account Managers
- 50 events per month per AM = 750 events/month

**Test:**
1. Login as Manager
2. Navigate to Calendar page
3. Measure load time

**Performance Metrics:**
```
Calendar Load: Target < 3 seconds
Month Navigation: Target < 1 second
Event Rendering: Target < 500ms
```

**Acceptance Criteria:**
- ✅ Calendar loads in < 4 seconds
- ✅ Month navigation smooth
- ✅ All events visible
- ⚠️ If slow, implement lazy loading

---

### **Performance Test 4.3: Strategic Dashboard with Many Managers**

**Setup:**
- 1 Head
- 50 Managers
- Each Manager has different performance data

**Test:**
1. Login as Head
2. Navigate to Strategic Dashboard
3. Measure load time

**Performance Metrics:**
```
Dashboard Load: Target < 4 seconds
Manager Dropdown: Target < 500ms
Chart Rendering: Target < 1 second
```

**Acceptance Criteria:**
- ✅ Dashboard loads in < 5 seconds
- ✅ Dropdown populates quickly
- ✅ Charts render smoothly
- ✅ No UI freezing

---

### **Performance Test 4.4: Sales Summary Aggregation**

**Setup:**
- 1 Head
- 10 Managers
- Each Manager has 10 AMs
- Each AM has 20 won opportunities = 2000 total opps

**Test:**
1. Login as Head
2. Navigate to Sales Summary
3. Measure aggregation time

**Performance Metrics:**
```
Data Fetch: Target < 2 seconds
Aggregation: Target < 1 second
Chart Rendering: Target < 1 second
Total: Target < 5 seconds
```

**Acceptance Criteria:**
- ✅ Page loads in < 5 seconds
- ✅ Revenue totals correct
- ✅ Top Performers chart accurate
- ✅ No timeout errors

---

## 📈 **PERFORMANCE OPTIMIZATION RECOMMENDATIONS**

### **If Activities/Calendar is Slow:**

1. **Implement Pagination**
```typescript
// Limit to 50 activities per page
.limit(50)
.range(page * 50, (page + 1) * 50 - 1)
```

2. **Add Date Range Filter**
```typescript
// Default to last 30 days
.gte('scheduled_at', thirtyDaysAgo)
.lte('scheduled_at', today)
```

3. **Lazy Load Calendar Events**
```typescript
// Only fetch events for visible month
.gte('scheduled_at', monthStart)
.lte('scheduled_at', monthEnd)
```

---

### **If Strategic Dashboard is Slow:**

1. **Cache Manager List**
```typescript
// Cache for 5 minutes
const { data, error } = await supabase
  .from('user_profiles')
  .select('id, full_name')
  .eq('role', 'manager')
  .maybeSingle();

localStorage.setItem('managers', JSON.stringify(data));
```

2. **Debounce Manager Selection**
```typescript
const handleManagerChange = debounce((managerId) => {
  // Refresh dashboard data
}, 300);
```

---

## 🎯 **TESTING EXECUTION PLAN**

### **Phase 1: Basic UAT (30 min)**
1. Test Strategic Dashboard with 1 Head, 3 Managers
2. Test Activities with 1 Manager, 5 AMs
3. Test Calendar with 1 Manager, 5 AMs
4. Document any UI issues

### **Phase 2: RLS Verification (20 min)**
1. Run SQL queries to verify RLS policies
2. Test cross-department isolation
3. Test cross-division isolation
4. Document any security issues

### **Phase 3: Performance Testing (40 min)**
1. Create large test dataset (if not exists)
2. Test Activities with 2000 records
3. Test Calendar with 750 events
4. Test Strategic Dashboard with 50 managers
5. Measure load times
6. Document performance bottlenecks

### **Phase 4: Analysis & Report (20 min)**
1. Compile all test results
2. Identify critical issues (if any)
3. Recommend fixes/optimizations
4. Create final deployment decision

**Total Estimated Time:** ~2 hours

---

## 📊 **TEST RESULTS TEMPLATE**

```markdown
## Test Execution Results

**Date:** [DATE]
**Tester:** [NAME]
**Environment:** [DEV/STAGING/PROD]

### UAT Results
- [ ] Strategic Dashboard: PASS / FAIL
- [ ] Activities Page: PASS / FAIL
- [ ] Calendar Page: PASS / FAIL
- [ ] Hierarchy Consistency: PASS / FAIL

### RLS Results
- [ ] Manager Isolation: PASS / FAIL
- [ ] AM Isolation: PASS / FAIL
- [ ] Head Isolation: PASS / FAIL

### Performance Results
| Test | Target | Actual | Status |
|------|--------|--------|--------|
| Activities (2000) | < 5s | [X]s | PASS/FAIL |
| Calendar (750) | < 4s | [X]s | PASS/FAIL |
| Strategic Dashboard | < 5s | [X]s | PASS/FAIL |
| Sales Summary | < 5s | [X]s | PASS/FAIL |

### Issues Found
1. [Issue description]
2. [Issue description]

### Recommendations
1. [Recommendation]
2. [Recommendation]

### Deployment Decision
- [ ] APPROVED for Production
- [ ] NEEDS FIXES before deployment
```

---

**Ready to execute these tests!** 🚀

