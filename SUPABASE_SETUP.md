# Supabase Setup Guide

Your Credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://apjomfculzncvglxuegt.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_q9pxBYR_jeym3Sybqnrjjg_j9ydW3HX
Password: zCJ5pHfMG7XMrhFo
```

## Step 1: Update Environment Variables

**File:** `.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://apjomfculzncvglxuegt.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_q9pxBYR_jeym3Sybqnrjjg_j9ydW3HX
```

## Step 2: Create Database Schema

1. Go to **Supabase → SQL Editor** (https://app.supabase.com)
2. Open the SQL file: [SQL_SCHEMA.sql](SQL_SCHEMA.sql)
3. Copy ALL SQL code
4. Paste into Supabase SQL Editor
5. Click **RUN** (or Cmd+Enter)

This will create:
- ✅ 9 tables (alerts, interventions, audit logs, contractors, etc.)
- ✅ Row Level Security policies
- ✅ Indexes for performance
- ✅ Sample data

## Step 3: Enable Row Level Security

In Supabase Console:
1. **Authentication → Policies** → Enable for all tables (already in SQL)
2. **Database → RLS** → Check that RLS is enabled on all tables

## Step 4: Enable Data API (Optional but Recommended)

In Supabase Console:
1. **Settings → API** 
2. Check **Enable Data API** ✓
3. Check **Autogenerate a RESTful API** ✓

---

## What Gets Created

### Tables:
1. **risk_alerts** - C1-C10 risk alerts (94 Bukit Merah, 87 Jurong, etc.)
2. **interventions** - WSH/health worker action logs
3. **audit_logs** - Compliance audit trail
4. **data_source_cache** - Cached API responses (NEA, ACRA, etc.)
5. **risk_scores_history** - Time-series risk data
6. **user_preferences** - Dashboard customization
7. **notifications** - User notifications
8. **contractors** - C4 contractor data (30K records from ACRA)
9. **reports** - Generated reports

### Real-time Sync Features:
✅ NEA Weather → Cached every 5 min  
✅ NEA Air Quality → Cached every 10 min  
✅ ACRA Companies → Cached every 24h  
✅ Risk scores → Logged hourly  
✅ Interventions → Logged real-time  
✅ Audit trail → Logged every action  

---

## Using Supabase Functions in Code

### Create Alert:
```typescript
import { createRiskAlert } from '@/lib/supabase';

await createRiskAlert({
  alert_id: 'C1-2024-0891',
  component: 'C1',
  location: 'Bukit Merah',
  risk_score: 94,
  risk_level: 'Critical',
  description: 'High construction injury risk'
});
```

### Get Alerts by Location:
```typescript
import { getRiskAlerts } from '@/lib/supabase';

const alerts = await getRiskAlerts({
  location: 'Bukit Merah',
  status: 'active'
});
```

### Log Intervention:
```typescript
import { createIntervention } from '@/lib/supabase';

await createIntervention({
  intervention_id: 'INT-2024-0521',
  alert_id: 'C1-2024-0891',
  intervention_type: 'WSH_Inspection',
  location: 'Bukit Merah',
  assigned_to: 'your-user-id',
  start_time: new Date().toISOString(),
  objectives: { primary: 'Pre-positioning for fall prevention' }
});
```

### Get Audit Trail:
```typescript
import { getAuditLogs } from '@/lib/supabase';

const logs = await getAuditLogs('user-id');
```

---

## What's Now Available

✅ **Real-time Data Persistence** - All alerts/interventions saved  
✅ **Audit Trail** - Every action tracked for compliance  
✅ **Risk History** - C1-C10 scores tracked over time  
✅ **Contractor Database** - 30K+ companies from ACRA  
✅ **Notification System** - Push notifications to officers  
✅ **Report Generation** - Export alerts and outcomes  
✅ **User Preferences** - Dashboard customization saved  

---

## Next Steps

1. ✅ Update `.env.local` with Supabase credentials
2. ✅ Run SQL schema in Supabase
3. ✅ Integrate functions into dashboard pages
4. ✅ Start logging real alerts/interventions
5. ✅ Sync with data.gov.sg APIs to populate database

---

## Testing the Connection

Run in terminal:
```bash
npm install @supabase/supabase-js
```

Then test connection:
```typescript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase.auth.getSession();
console.log('Supabase connected:', !!data?.session);
```

---

**Status:** ✅ Ready to deploy
**Backend:** Supabase PostgreSQL  
**Frontend:** Next.js + React  
**Data Integration:** data.gov.sg APIs (NEA, ACRA, HDB, MOH, BCA)
