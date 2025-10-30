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

... (truncated for brevity)
