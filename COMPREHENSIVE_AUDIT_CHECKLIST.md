# 🔍 Comprehensive Audit Checklist - All Levels

## 📋 **Audit Scope: Head → Manager → Account Manager**

Date: 2025-10-30  
Status: In Progress

---

## 🎯 **LEVEL 1: HEAD**

### **Dashboard & Monitoring**

#### **Strategic Dashboard** (`/head/strategic-dashboard`)
- [ ] Shows all Managers in division
- [ ] Revenue totals aggregate from all Managers
- [ ] Margin totals aggregate from all Managers
- [ ] Charts display division-wide data
- [ ] Target vs Achievement calculation correct

#### **Sales Target** (`/head/sales-target`)
- [ ] Can assign targets to Managers
- [ ] Can view all Manager targets
- [ ] Department/Division metrics correct
- [ ] Achieved values aggregate from Managers' teams

#### **Team Dashboard** (`/head/team-dashboard` if exists)
- [ ] Lists all Managers
- [ ] Shows Manager performance
- [ ] Drill-down to Manager's team works

#### **Sales Summary** (`/head/sales-summary`)
- [ ] Total Revenue = sum of all division revenue
- [ ] Total Margin = sum of all division margin
- [ ] Deals closed count correct
- [ ] Target Achievement % correct

### **Target Flow (Head → Manager)**
- [ ] Head can create target for Manager
- [ ] Manager receives target from Head
- [ ] Target appears in Manager's dashboard
- [ ] Target amount flows correctly

### **Data Visibility**
- [ ] Head sees ALL Managers in division
- [ ] Head sees ALL Account Managers under Managers
- [ ] Head sees ALL opportunities in division
- [ ] RLS policy allows division-wide access

---

## 🎯 **LEVEL 2: MANAGER**

### **Dashboard & Monitoring**

#### **Team Dashboard** (`/manager/team-dashboard`)
- [ ] Shows Account Managers in department
- [ ] Revenue/Margin aggregate from AM team
- [ ] Charts display team performance
- [ ] Period selector (Q1-Q4) works
- [ ] Overall Attainment chart shows correct %

#### **Sales Target** (`/manager/sales-target`)
- [ ] Shows Manager's own target (from Head)
- [ ] Can assign targets to Account Managers
- [ ] Department metrics show AM performance
- [ ] Achieved values from AM opportunities
- [ ] Margin table shows AM data
- [ ] Revenue table shows AM data

#### **Sales Summary** (`/manager/sales-summary`)
- [ ] Total Revenue = Manager + AM team revenue
- [ ] Total Margin = Manager + AM team margin
- [ ] Target Revenue = Manager's own target (not AM)
- [ ] Target Margin = Manager's own target (not AM)
- [ ] Deals closed = Manager + AM deals

#### **Pipeline Overview** (`/pipeline/overview`)
- [ ] Shows opportunities from AM team
- [ ] Target displays AM targets (not Manager's)
- [ ] Can filter by Account Manager
- [ ] Stage breakdown shows team pipeline

#### **Pipeline Forecasting** (`/pipeline/forecasting`)
- [ ] Forecast based on AM opportunities
- [ ] Target shows AM targets
- [ ] Revenue projection includes team

#### **Advanced Pipeline**
- [ ] Auto-filters by department
- [ ] Shows team opportunities
- [ ] Stage management works

#### **Activities** (`/manager/activities`)
- [ ] ❌ Currently shows only Manager's activities
- [ ] ⚠️ Should show: Manager + AM team activities
- [ ] TODO: Fix to show team activities

#### **Calendar** (`/manager/calendar`)
- [ ] ❌ Currently shows only Manager's calendar
- [ ] ⚠️ Should show: Manager + AM team calendar
- [ ] TODO: Fix to show team calendar

### **Target Flow (Manager → AM)**
- [ ] Manager receives target from Head
- [ ] Manager can create target for AM
- [ ] AM receives target from Manager
- [ ] Target appears in AM's dashboard

### **Data Visibility**
- [ ] Manager sees own opportunities
- [ ] Manager sees AM team opportunities
- [ ] Manager sees department/division scope
- [ ] RLS policy allows department access

---

## 🎯 **LEVEL 3: ACCOUNT MANAGER**

### **Dashboard & Performance**

#### **Account Manager Dashboard** (`/am/dashboard` or `/dashboard`)
- [ ] Shows own opportunities
- [ ] Shows own activities
- [ ] Pipeline value displays correctly
- [ ] Deals by stage shows own pipeline

#### **Sales Summary** (`/am/sales-summary`)
- [ ] Shows own revenue
- [ ] Shows own margin
- [ ] Shows targets from Manager
- [ ] Target vs Achievement correct
- [ ] Monthly target displays
- [ ] Quarterly target displays

#### **Account Overview** (Component in AM dashboard)
- [ ] Revenue Target (from Manager) displays
- [ ] Revenue Achieved (from won opps) displays
- [ ] Margin Target (from Manager) displays
- [ ] Margin Achieved (revenue - costs) displays
- [ ] Progress bars show correct %
- [ ] All metrics update in real-time

#### **Opportunities** (`/opportunities`)
- [ ] Can create new opportunities
- [ ] Can view own opportunities
- [ ] Can edit opportunity details
- [ ] Can move through pipeline stages

#### **Add Project** (via Sales Summary)
- [ ] Can add project for opportunity
- [ ] Opportunity auto-marks as "Closed Won" (via trigger)
- [ ] PO amount recorded
- [ ] Costs (COGS, Service, Other) recorded
- [ ] Margin calculated correctly

#### **Pipeline**
- [ ] Shows own opportunities
- [ ] Kanban view works
- [ ] Drag & drop works
- [ ] Stage changes save correctly

### **Target Reception**
- [ ] Receives target from Manager
- [ ] Target displays in Sales Summary
- [ ] Target displays in Account Overview
- [ ] Can view target breakdown (monthly/quarterly)

### **Data Visibility**
- [ ] AM sees ONLY own opportunities
- [ ] AM sees ONLY own activities
- [ ] AM sees ONLY own calendar
- [ ] RLS policy restricts to owner_id

---

## 🔄 **CROSS-LEVEL INTEGRATION**

### **Hierarchy Flow**
```
HEAD
  ↓ assigns target
MANAGER (receives target from Head)
  ↓ assigns target
ACCOUNT MANAGER (receives target from Manager)
  ↓ creates opportunities & projects
DATA flows up for aggregation
```

#### **Target Assignment Chain**
- [ ] Head → Manager: Target creation works
- [ ] Manager → AM: Target creation works
- [ ] Targets appear in correct dashboards
- [ ] Target amounts are correct

#### **Data Aggregation Chain**
- [ ] AM creates opportunity → shows in Manager dashboard
- [ ] AM wins opportunity → counts in Manager revenue
- [ ] Manager + AM revenue → shows in Head dashboard
- [ ] Margin flows correctly up the chain

#### **Monitoring Chain**
- [ ] Head monitors Managers' performance
- [ ] Manager monitors AMs' performance
- [ ] Each level sees subordinate data
- [ ] Achievement % calculated correctly

---

## 🎨 **UI/UX CONSISTENCY**

### **All Levels**
- [ ] Currency format consistent (IDR)
- [ ] Date format consistent
- [ ] Period selectors work (Q1-Q4)
- [ ] Charts render correctly
- [ ] Tables sort/filter work
- [ ] Export buttons work (CSV/PDF)

### **Performance**
- [ ] Page load < 2 seconds
- [ ] Console clean (no spam logs)
- [ ] No memory leaks
- [ ] Smooth interactions

---

## 🔐 **SECURITY & RLS**

### **Row Level Security Checks**

#### **Head**
- [ ] Can see division-wide data
- [ ] Can assign targets to Managers
- [ ] Cannot see other divisions (if multi-division)

#### **Manager**
- [ ] Can see department data
- [ ] Can see own + AM opportunities
- [ ] Can assign targets to AMs
- [ ] Cannot see other departments

#### **Account Manager**
- [ ] Can see ONLY own data
- [ ] Cannot see other AMs' data
- [ ] Cannot assign targets
- [ ] Can create own opportunities

---

## 🐛 **KNOWN ISSUES**

### **Fixed ✅**
1. ✅ Manager target double-counting when assigning to AM
2. ✅ Opportunity not auto-closing when project created
3. ✅ Query not checking `stage = 'Closed Won'`
4. ✅ 51+ console.log causing performance issues
5. ✅ Account Manager hardcoded monthly target

### **Pending ⚠️**
1. ⚠️ Activities page - Manager only sees own activities (should see team)
2. ⚠️ Calendar page - Manager only sees own calendar (should see team)
3. ⚠️ Overall Attainment chart shows 0% if AM has no target

### **To Verify 🔍**
1. 🔍 Head's dashboard aggregation
2. 🔍 Division-level metrics
3. 🔍 Multi-department scenario
4. 🔍 RLS policies for all roles

---

## 📊 **TEST SCENARIOS**

### **Scenario 1: Complete Flow**
```
1. Head creates target for Manager (Rp 10M)
2. Manager creates target for AM1 (Rp 5M) and AM2 (Rp 5M)
3. AM1 creates opportunity → Rp 3M
4. AM1 adds project → opportunity closes won
5. Verify:
   - AM1 dashboard: Achieved Rp 3M / Target Rp 5M = 60%
   - Manager dashboard: Achieved Rp 3M / Target Rp 10M = 30%
   - Head dashboard: Achieved Rp 3M / Division target
```

### **Scenario 2: Multiple AMs**
```
1. Manager has 3 AMs: AM1, AM2, AM3
2. Each AM has different targets
3. Each AM has won opportunities
4. Verify:
   - Manager sees all 3 AMs' data
   - Total revenue = sum of all AMs
   - Total margin = sum of all AMs
   - Charts show all 3 AMs
```

### **Scenario 3: Period Change**
```
1. Create targets for Q1 2026
2. Create targets for Q2 2026
3. Change period selector to Q1
4. Verify: Only Q1 targets and achievements show
5. Change to Q2
6. Verify: Only Q2 targets and achievements show
```

---

## 🎯 **AUDIT EXECUTION PLAN**

### **Phase 1: Head Level** (30 min)
1. Login as Head
2. Check all dashboards
3. Create target for Manager
4. Verify data visibility
5. Document issues

### **Phase 2: Manager Level** (30 min)
1. Login as Manager
2. Check all dashboards
3. Verify received target from Head
4. Create target for AM
5. Check team monitoring
6. Document issues

### **Phase 3: Account Manager Level** (30 min)
1. Login as AM
2. Check dashboard
3. Verify received target from Manager
4. Create opportunity
5. Add project (close won)
6. Verify achievement update
7. Document issues

### **Phase 4: Cross-Level Verification** (30 min)
1. Check data flows up correctly
2. Verify aggregation at each level
3. Test period changes
4. Test filtering
5. Performance testing

### **Phase 5: Documentation & Fixes** (60 min)
1. Compile all issues
2. Prioritize by severity
3. Create fix plan
4. Implement critical fixes
5. Re-test

---

## 📝 **AUDIT RESULTS**

### **Critical Issues (P0 - Fix Immediately)**
- [ ] None found (to be updated)

### **High Priority (P1 - Fix This Week)**
- [ ] Activities page - show team data for Manager
- [ ] Calendar page - show team data for Manager

### **Medium Priority (P2 - Fix Next Sprint)**
- [ ] Overall Attainment chart when no target

### **Low Priority (P3 - Nice to Have)**
- [ ] None found (to be updated)

---

## ✅ **SIGN-OFF**

- [ ] All critical issues fixed
- [ ] All high priority issues fixed or documented
- [ ] All levels tested
- [ ] Documentation complete
- [ ] Performance verified
- [ ] Security verified

**Auditor:** AI Assistant  
**Date:** 2025-10-30  
**Status:** Ready for User Testing

---

**Next Steps:**
1. User to test each level
2. Report any issues found
3. Schedule fixes based on priority
4. Re-audit after fixes

