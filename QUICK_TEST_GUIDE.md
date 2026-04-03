# 🧪 QUICK TEST GUIDE

**Run your app:** `npm run dev`  
**Open:** `http://localhost:3000`  
**Login:** test@migirantpulse.com.sg / MPulse#0085

---

## TEST 1: Create & View Alert (Hotspots → Alerts)

### Step-by-Step:
1. Click "Dashboard" in sidebar
2. Navigate to **"Hotspots"**
3. See 4 hotspot cards (Bukit Merah, Jurong East, Bedok, Woodlands)
4. Click **"Create Alert"** button on "Bukit Merah" card
5. Modal appears with form
6. Fill form:
   - Component: Select "C1" ✅
   - Risk Score: Move slider to 75 ✅
   - Description: Type "Testing alert creation" ✅
7. Click **"Create Alert"** button
8. ✅ Toast should say: "Alert C1-2024-XXXX created!"
9. Navigate to **"Alerts"** page
10. ✅ Your new alert should appear in the list
11. Click **"Acknowledge"** button
12. ✅ Alert status changes to "Acknowledged"

**Expected Result:** Alert stored in `risk_alerts` table, appears on alerts page, status updates work

---

## TEST 2: Create & Track Intervention (Complaints → Operations)

### Step-by-Step:
1. Navigate to **"Complaints"** page
2. Scroll down to "Active Interventions" section
3. Click **"+ Create Intervention"** button
4. Modal appears
5. Fill form:
   - Type: Select "WSH_Inspection" ✅
   - Location: Type "Jurong East" ✅
   - Officer ID: Leave as "Officer_001" ✅
   - Objectives: Type "Safety audit" ✅
6. Click **"Create"** button
7. ✅ Toast should say: "Intervention INT-2024-XXXX created!"
8. Scroll up & see intervention appears in the table above
9. Navigate to **"Operations"** page
10. ✅ Your intervention appears in "Real-Time Interventions" section
11. Click **"Update Outcome"** button on your intervention
12. Modal appears
13. Change Outcome to "Completed" ✅
14. Type findings: "All checks passed" ✅
15. Click **"Save Outcome"** button
16. ✅ Toast says "Intervention outcome updated!"
17. ✅ Intervention status changes to "Completed"

**Expected Result:** Intervention stored in `interventions` table, appears on operations page, outcome updates persist

---

## TEST 3: Sync Contractors (Data-Sources)

### Step-by-Step:
1. Navigate to **"Data-Sources"** page
2. Scroll to "Contractor Management" section
3. Click **"Sync Contractors from ACRA"** button
4. ✅ Button changes to "Syncing..." (loading state)
5. ⏳ Wait 2-3 seconds for API call
6. ✅ Toast appears: "Synced X contractors from ACRA!"
7. Scroll down to see contractor table
8. ✅ Should see 4 contractors:
   - SafeBuild Construction (UEN001, Provisional)
   - Premier Engineering (UEN002, Certified)
   - SG Heavy Machinery (UEN003, Conditional)
   - Integrated Works (UEN004, Certified)

**Expected Result:** Contractors fetched from ACRA API & stored in `contractors` table

---

## TEST 4: Real-Time Alert Counter (Analytics)

### Step-by-Step:
1. Navigate to **"Analytics"** page
2. Look at KPI cards at top
3. Find **"Active Alerts (7d)"** card
4. Note the number
5. Go back to **"Hotspots"**
6. Create another alert
7. Return to **"Analytics"**
8. ✅ "Active Alerts (7d)" should increment by 1
9. Find **"Risk Clusters"** card
10. ✅ Should show number of unique locations with high-risk alerts

**Expected Result:** KPIs update dynamically from database

---

## TEST 5: 30-Second Auto-Refresh (Alerts Page)

### Step-by-Step:
1. Open **"Alerts"** page
2. Note the timestamp at bottom: "Last validation: [time]"
3. Wait 30 seconds...
4. ✅ Timestamp updates (page auto-fetched)
5. If you have a colleague, have them create alert on different browser
6. ✅ After 30 seconds, you see their alert appear on your page (no manual refresh needed!)

**Expected Result:** Data refreshes every 30 seconds automatically

---

## TEST 6: Filter & Status Updates (Alerts)

### Step-by-Step:
1. Go to **"Alerts"** page
2. Create 3-4 new alerts from hotspots page (different statuses)
3. On alerts page, use filter buttons:
   - **"All"** - Shows all alerts ✅
   - **"Open"** - Shows only open alerts ✅
   - **"Acknowledged"** - Shows only acknowledged ✅
   - **"Resolved"** - Shows only resolved ✅
4. Acknowledge some alerts
5. Resolve some alerts
6. ✅ Filters update correctly

**Expected Result:** Filtering works, status updates persist

---

## TEST 7: Form Validation (Error Handling)

### Step-by-Step:
1. Go to **"Hotspots"** → Create Alert modal
2. Try to submit without filling description
3. ✅ Toast: "Please fill all fields"
4. Fill all fields & submit
5. ✅ Success toast appears

**Expected Result:** Basic validation works

---

## EXPECTED DATA FLOW

```
User Action          → Function Called        → Database Table       → Result
─────────────────────────────────────────────────────────────────────────────
Create Alert         → createRiskAlert()      → risk_alerts          Saved ✅
View Alerts          → getRiskAlerts()        → risk_alerts          Fetched ✅
Update Alert Status  → updateAlertStatus()    → risk_alerts          Updated ✅
Create Intervention  → createIntervention()   → interventions        Saved ✅
View Interventions   → getInterventions()     → interventions        Fetched ✅
Update Outcome       → updateInterventionOutcome() → interventions   Updated ✅
Sync Contractors     → fetchACRACompanies()   → ACRA API first!      Fetched ✅
                   → syncContractorData()     → contractors          Saved ✅
Calculate KPIs       → getRiskAlerts()        → risk_alerts          Calculated ✅
```

---

## DEBUGGING TIPS

### If alerts don't appear:
```javascript
// In browser console
import { getRiskAlerts } from './src/lib/supabase';
const alerts = await getRiskAlerts();
console.log('Alerts:', alerts); // Should return array
```

### If contractor sync fails:
```javascript
// Check if API key works
import { fetchACRACompanies } from './src/lib/datagovsg';
const companies = await fetchACRACompanies(0, 10);
console.log('Companies:', companies);
```

### If status updates don't work:
- Check Supabase RLS policies (should allow INSERT/UPDATE)
- Verify auth token is valid
- Check network tab for API errors

### If page doesn't refresh:
- Browser console should show no errors
- Check if `setInterval` is running (should refresh every 30s)
- Clear browser cache & reload

---

## SUCCESS CHECKLIST ✅

When all tests pass:
- [x] Alerts created & saved to DB
- [x] Alerts displayed on alerts page
- [x] Alert status updates persist
- [x] Interventions created & saved to DB
- [x] Interventions displayed on operations page
- [x] Intervention outcomes update
- [x] Contractors synced from ACRA
- [x] Analytics KPIs update dynamically
- [x] Auto-refresh every 30 seconds works
- [x] Filtering works correctly
- [x] Toast notifications appear
- [x] No console errors

**= SYSTEM FULLY FUNCTIONAL** 🚀

---

## NEXT STEPS (If you want more)

1. **Create more sample data** - Generate 20 alerts for testing
2. **Test contractor audit trail** - See if contractor changes log to audit_logs
3. **Setup notification** - When alert created, notify assigned officer
4. **Reports generation** - Export alerts as CSV/JSON
5. **WebSocket subscription** - Real-time updates (not just 30-second refresh)

Enjoy! 🎉

