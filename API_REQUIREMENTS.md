# Comprehensive API Requirements - Migrant Worker Safety & Dormitory Wellness Platform

## Overview
This document lists all APIs required for the complete worker safety intelligence platform covering Modules A-D with all 12 risk components (C1-C12).

---

## MODULE A: Construction Site Safety (C1–C4)

### Component C1: Daily Sector-Level Injury Risk Scoring
**Purpose:** Predict daily construction injury risk by sector and location  
**Data Sources:** BCA project data + incident history + weather

**Required APIs:**

| Endpoint | Method | Authentication | Description | Data Frequency |
|----------|--------|-----------------|-------------|-----------------|
| `/api/bca/projects/active` | GET | API Key | List active BCA-permitted construction projects with location, sector, timeline | Daily |
| `/api/bca/projects/{projectId}/permits` | GET | API Key | Permit status, contractor assigned, safety certifications | Real-time |
| `/api/bca/incident-history/{sector}/{location}` | GET | API Key | Historical injury incidents by construction sector + location | Daily |
| `/api/bca/weather-risk/{location}` | GET | API Key | Rainfall, wind speed, temperature impact on construction hazards | Hourly |
| `/api/nea/weather-realtime` | GET | API Key | Real-time NEA weather data (wind, temp, humidity) | 30-min intervals |
| `/api/mom/injury-database/{sector}` | GET | API Key | MOM registered construction injury database filtered by sector | Daily |
| `/api/models/c1-daily-risk` | POST | OAuth 2.0 | Submit daily location/weather/project data → returns C1 risk score (0–100) | Daily |

**Mock Data Source (Current):** Pre-calculated scores for Bukit Merah (94), Jurong East (87), Bedok (78), Woodlands (71)

---

### Component C2: Fall-from-Height Risk Flagging
**Purpose:** Identify high-risk construction sites for fall incidents  
**Data Sources:** BCA permit lifecycle + incident patterns + site conditions

**Required APIs:**

| Endpoint | Method | Authentication | Description | Data Frequency |
|----------|--------|-----------------|-------------|-----------------|
| `/api/bca/projects/{projectId}/lifecycle` | GET | API Key | Project phase (foundation/frame/finishing) → determines fall risk elevation | Real-time |
| `/api/bca/projects/{projectId}/site-conditions` | GET | API Key | Scaffolding type, fall protection measures, height of work | Weekly |
| `/api/mom/fall-incidents/{location}/{timeframe}` | GET | API Key | MOM database: fall injuries by location (past 6–12 months) | Daily |
| `/api/models/c2-fall-risk` | POST | OAuth 2.0 | Submit lifecycle + conditions + weather → returns C2 fall risk flags | Daily |
| `/api/alerts/c2-fall-risk/{projectId}` | POST | OAuth 2.0 | Create/update fall risk alert for WSH officer intervention | Real-time |

**Mock Data Source:** 18 sites flagged for fall-from-height risk in complaints page

---

### Component C3: Machinery & Vehicle Incident Risk
**Purpose:** Flag sites with high machinery/vehicle incident probability  
**Data Sources:** Machinery phase schedules + contractor track records + incident patterns

**Required APIs:**

| Endpoint | Method | Authentication | Description | Data Frequency |
|----------|--------|-----------------|-------------|-----------------|
| `/api/bca/projects/{projectId}/machinery-schedule` | GET | API Key | Machinery phase timeline, type of equipment, contractor assigned | Weekly |
| `/api/c4/contractor/{contractorId}/incident-history` | GET | API Key | Contractor's historic machinery incident count + fatality rate | Daily |
| `/api/mom/machinery-incidents/{location}` | GET | API Key | MOM database: machinery/vehicle incidents by location + sector | Daily |
| `/api/nea/wind-alerts` | GET | API Key | High wind warnings → machinery incident correlation | Hourly |
| `/api/models/c3-machinery-risk` | POST | OAuth 2.0 | Submit phase + contractor + wind data → returns C3 machinery risk | Daily |
| `/api/operations/deploy-machinery-prevention` | POST | OAuth 2.0 | Log machinery incident prevention deployment + outcome | Real-time |

**Mock Data Source:** 12 sites flagged for machinery incidents in operations page

---

### Component C4: Contractor Safety Track Record (CRS)
**Purpose:** Score contractor safety compliance → identify high-risk contractors  
**Data Sources:** MOM CRS + MOM Checksafe + historical incident data

**Required APIs:**

| Endpoint | Method | Authentication | Description | Data Frequency |
|----------|--------|-----------------|-------------|-----------------|
| `/api/mom/crs/contractor/{contractorId}` | GET | OAuth 2.0 | MOM Contractor Registration System status (Certified/Conditional/Provisional) | Real-time |
| `/api/mom/checksafe/{contractorId}/stop-work-orders` | GET | OAuth 2.0 | MOM Checksafe: Stop Work Orders flagged against contractor | Real-time |
| `/api/mom/checksafe/{contractorId}/inspection-history` | GET | OAuth 2.0 | MOM inspection outcomes (Pass/Conditional/Fail) + violation count | Weekly |
| `/api/mom/incident-database/contractor/{contractorId}` | GET | OAuth 2.0 | MOM incidents attributed to contractor (falls, machinery, electrocution) | Daily |
| `/api/acra/contractor/{companyName}` | GET | API Key | ACRA company health (active/dormant), directors, financial status | Monthly |
| `/api/models/c4-contractor-safety-score` | POST | OAuth 2.0 | Submit CRS + violations + incident data → returns C4 safety score (0–100) | Daily |
| `/api/compliance/contractors` | GET | OAuth 2.0 | List all contractors with C4 scores, CRS status, flagged incidents | Daily |

**Mock Data Source:** 8 high-risk contractors + 28 certified contractors on compliance page

---

## MODULE B: Dormitory Wellness & Heat Stress (C5–C8)

### Component C5: Dormitory Baseline Risk Profile
**Purpose:** Establish baseline dormitory health/wellness risk  
**Data Sources:** FEDA/HDB occupancy + ventilation data + worker demographics

**Required APIs:**

| Endpoint | Method | Authentication | Description | Data Frequency |
|----------|--------|-----------------|-------------|-----------------|
| `/api/feda/dormitory/{dormId}/occupancy` | GET | OAuth 2.0 | Current occupancy rate, capacity, block composition | Real-time |
| `/api/feda/dormitory/{dormId}/ventilation` | GET | OAuth 2.0 | Ventilation ratios, air quality standards compliance (CLAUSE 14) | Weekly |
| `/api/feda/dormitory/{dormId}/isolation-facilities` | GET | OAuth 2.0 | Isolation facility bed count, capacity status | Real-time |
| `/api/hdb/dormitory/{dormId}/demographics` | GET | API Key | Worker nationality, age, sector employment, length of stay | Monthly |
| `/api/models/c5-baseline-wellness` | POST | OAuth 2.0 | Submit occupancy + ventilation + demographics → returns C5 wellness baseline | Weekly |

**Mock Data Source:** Dormitory baseline data for Bukit Merah, Jurong, Woodlands, Pasir Ris

---

### Component C6: Heat Stress Exposure Index
**Purpose:** Monitor real-time heat stress risk in dormitories + construction sites  
**Data Sources:** NEA real-time heat index + dormitory location + work site proximity

**Required APIs:**

| Endpoint | Method | Authentication | Description | Data Frequency |
|----------|--------|-----------------|-------------|-----------------|
| `/api/nea/heat-index/realtime/{location}` | GET | API Key | NEA real-time heat index, wet-bulb temperature, heat stress warnings | 30-min |
| `/api/feda/dormitory/{dormId}/outdoor-exposure` | GET | OAuth 2.0 | Average outdoor work exposure hours/day for dormitory residents | Weekly |
| `/api/models/c6-heat-stress-index` | POST | OAuth 2.0 | Submit heat index + outdoor exposure + occupancy → returns C6 score | Hourly |
| `/api/alerts/c6-heat-stress/{dormId}` | POST | OAuth 2.0 | Create heat stress alert for health team intervention | Real-time |
| `/api/maintenance/cooling-measures/{dormId}` | GET | OAuth 2.0 | Log cooling measures (water stations, reduced hours, relocation) + effectiveness | Daily |

**Mock Data Source:** Dormitories at risk table with heat scores: Bukit Merah (87), Jurong (85), Woodlands (79)

---

### Component C7: Disease Outbreak Early Warning
**Purpose:** Predict disease outbreaks in dormitories (dengue, respiratory, etc.)  
**Data Sources:** NEA dengue clusters + NEA air quality + MOM health screenings

**Required APIs:**

| Endpoint | Method | Authentication | Description | Data Frequency |
|----------|--------|-----------------|-------------|-----------------|
| `/api/nea/dengue-clusters/realtime` | GET | API Key | NEA dengue cluster alerts, 500m radius detection, case intensity | Daily |
| `/api/nea/air-quality/{location}` | GET | API Key | PM2.5, PM10, O3, AQI readings (respiratory risk indicator) | Hourly |
| `/api/feda/dormitory/{dormId}/health-screenings` | GET | OAuth 2.0 | Recent health screening results, respiratory symptoms flagged | Weekly |
| `/api/mom/cpf-data/{workerId}` | GET | OAuth 2.0 | Worker medical history flags (chronic respiratory, immunocompromised) | Monthly |
| `/api/models/c7-outbreak-alert` | POST | OAuth 2.0 | Submit dengue + air quality + health data → returns C7 outbreak risk | Daily |
| `/api/alerts/c7-disease-outbreak/{dormId}` | POST | OAuth 2.0 | Create outbreak alert with isolation facility recommendations | Real-time |

**Mock Data Source:** 4 disease outbreak alerts showing dengue + PM2.5 + respiratory risks

---

### Component C8: DTS Dormitory Prioritization (Composite Risk Ranking)
**Purpose:** Rank dormitories by composite risk (C5 + C6 + C7 weighted)  
**Data Sources:** C5 baseline + C6 heat + C7 disease + C9 salary disputes + C10 mental health

**Required APIs:**

| Endpoint | Method | Authentication | Description | Data Frequency |
|----------|--------|-----------------|-------------|-----------------|
| `/api/models/c8-composite-dts-rank` | POST | OAuth 2.0 | Submit C5 + C6 + C7 + C9 + C10 scores → returns C8 DTS rank (1–N) | Daily |
| `/api/dts/deployments/{dormId}` | GET | OAuth 2.0 | List Dormitory Task Squad deployments by priority rank | Real-time |
| `/api/dts/create-deployment` | POST | OAuth 2.0 | Log new DTS deployment with objectives, team, intervention type | Real-time |
| `/api/dts/deployment/{deploymentId}/outcome` | PUT | OAuth 2.0 | Update deployment outcome: workers screened, interventions deployed | Daily |

**Mock Data Source:** DTS patrols page showing 4 deployment priorities by composite risk

---

## MODULE C: Worker Welfare & Wellbeing (C9–C10)

### Component C9: Salary Non-Payment & Financial Distress Alerts
**Purpose:** Identify workers experiencing salary disputes or financial hardship  
**Data Sources:** MOM salary dispute registry + CPF adequacy + contractor CRS status

**Required APIs:**

| Endpoint | Method | Authentication | Description | Data Frequency |
|----------|--------|-----------------|-------------|-----------------|
| `/api/mom/salary-disputes` | GET | OAuth 2.0 | MOM registered salary dispute complaints, resolution status | Daily |
| `/api/mom/dispute/{workerId}` | GET | OAuth 2.0 | Worker's salary dispute history, amount, contractor, status | Real-time |
| `/api/cpf-board/adequacy/{workerId}` | GET | OAuth 2.0 | CPF contribution rate, current balance, shortfall (if <60% legal minimum) | Monthly |
| `/api/c4/contractor/{contractorId}/salary-compliance` | GET | OAuth 2.0 | Contractor's salary non-payment history (flagged repeats) | Weekly |
| `/api/models/c9-financial-distress` | POST | OAuth 2.0 | Submit salary + CPF + contractor CRS → returns C9 financial distress score | Daily |
| `/api/alerts/c9-salary-dispute/{workerId}` | POST | OAuth 2.0 | Create salary non-payment alert + link to CPF/MOM resolution | Real-time |
| `/api/reports/c9-weekly-brief` | GET | OAuth 2.0 | Weekly report: salary disputes by region, contractor, resolution rate | Weekly |

**Mock Data Source:** Reports page showing 42 weekly complaints, 28 flagged as financial distress

---

### Component C10: Mental Health Risk Index
**Purpose:** Identify workers at risk of mental health decline (isolation, stress, financial hardship)  
**Data Sources:** Overcrowding (C5) + salary disputes (C9) + work injuries + social isolation signals

**Required APIs:**

| Endpoint | Method | Authentication | Description | Data Frequency |
|----------|--------|-----------------|-------------|-----------------|
| `/api/c5/dormitory/{dormId}/occupancy-stress` | GET | OAuth 2.0 | Occupancy rate, overcrowding index (C5 signal) | Real-time |
| `/api/c9/salary-distress/{workerId}` | GET | OAuth 2.0 | Worker's salary dispute status + months unpaid (C9 signal) | Daily |
| `/api/mom/work-injury/{workerId}` | GET | OAuth 2.0 | Recent work injuries (fall, machinery, heat), recovery timeline | Monthly |
| `/api/feda/worker/{workerId}/family-contact-freq` | GET | OAuth 2.0 | Frequency of family video calls (isolation fatigue proxy) | Weekly |
| `/api/models/c10-mental-health-index` | POST | OAuth 2.0 | Submit overcrowding + salary + injury + isolation → returns C10 score (0–100) | Daily |
| `/api/alerts/c10-mental-health/{workerId}` | POST | OAuth 2.0 | Create mental health alert for counseling intervention | Real-time |
| `/api/amkts/counseling-services` | GET | OAuth 2.0 | Available counseling slots, services, scheduling | Real-time |
| `/api/users/c10-mental-health-list` | GET | OAuth 2.0 | List all workers with C10 scores for intervention prioritization | Daily |

**Mock Data Source:** Users page showing 5 workers with C10 scores (38–78 range) + risk drivers

---

## MODULE D: Dashboard & Intelligence (C11–C12)

### Component C11: Cross-Component Analytics & Forecasting
**Purpose:** Combine all components (C1–C10) for predictive modeling and analytics  
**Data Sources:** All upstream components + ensemble forecasting models

**Required APIs:**

| Endpoint | Method | Authentication | Description | Data Frequency |
|----------|--------|-----------------|-------------|-----------------|
| `/api/models/c11-ensemble-forecast` | POST | OAuth 2.0 | Submit C1–C10 data → returns ensemble injury/wellness prediction + confidence | Daily |
| `/api/analytics/attention-weights` | GET | OAuth 2.0 | SHAP value analysis: which C1–C10 features drive predictions | Weekly |
| `/api/analytics/performance-metrics` | GET | OAuth 2.0 | Model accuracy by component, MAPE, precision, recall | Weekly |
| `/api/analytics/dashboard-summary` | GET | OAuth 2.0 | Aggregated KPIs for executive dashboard (high-risk sites, etc.) | Real-time |
| `/api/forecasts/injury-risk-7day` | GET | OAuth 2.0 | 7-day injury risk forecast by location + sector | Daily |
| `/api/forecasts/wellness-risk-7day` | GET | OAuth 2.0 | 7-day dormitory wellness risk forecast by facility | Daily |

**Mock Data Source:** Analytics page showing TFT forecasts, attention weights, performance logs

---

### Component C12: Inspector Dashboard & Intervention Outcomes
**Purpose:** WSH/health officer dashboards for viewing alerts, logging outcomes, reporting  
**Data Sources:** All previous components + field intervention logs

**Required APIs:**

| Endpoint | Method | Authentication | Description | Data Frequency |
|----------|--------|-----------------|-------------|-----------------|
| `/api/dashboard/officer-alerts/{officerId}` | GET | OAuth 2.0 | Personalized alert feed for WSH officer (C1–C10 filtered by jurisdiction) | Real-time |
| `/api/dashboard/hotspots` | GET | OAuth 2.0 | Map of all high-risk construction sites (C1 hotspots) | Real-time |
| `/api/dashboard/forecasts` | GET | OAuth 2.0 | Weekly injury risk forecasts by area + recommended actions | Weekly |
| `/api/dashboard/compliance` | GET | OAuth 2.0 | Contractor track records + compliance status (C4) | Real-time |
| `/api/interventions/create` | POST | OAuth 2.0 | Log WSH/health officer intervention (patrol, inspection, counseling) | Real-time |
| `/api/interventions/{interventionId}/outcome` | PUT | OAuth 2.0 | Update intervention outcome (violations, recommendations, follow-up) | Real-time |
| `/api/reports/generate` | POST | OAuth 2.0 | Generate custom report (weekly brief, monthly review, audit) | On-demand |
| `/api/reports/list` | GET | OAuth 2.0 | List generated reports for download + sharing | On-demand |

**Mock Data Source:** All dashboard pages (overview, hotspots, complaints, operations, forecasts, compliance, analytics, maintenance, alerts, patrols, reports)

---

## SUPPORTING INFRASTRUCTURE APIS

### Authentication & Authorization
| Endpoint | Method | Description | Frequency |
|----------|--------|-------------|-----------|
| `/api/auth/login` | POST | Mock auth (email/password → localStorage token) | On-demand |
| `/api/auth/logout` | POST | Clear session + localStorage token | On-demand |
| `/api/auth/session` | GET | Validate current session + agency affiliation | On refresh |
| `/api/auth/permissions/{userRole}` | GET | Get action permissions by role (WSH officer vs. health worker) | On-demand |

### Notification & Alerting
| Endpoint | Method | Description | Frequency |
|----------|--------|-------------|-----------|
| `/api/notifications/create` | POST | Create alert (C1–C10 triggered alert) | Real-time |
| `/api/notifications/list/{userId}` | GET | Retrieve alerts for user + read status | Real-time |
| `/api/notifications/mark-read` | PUT | Mark notification as read | On-demand |
| `/api/notifications/dispatch` | POST | Send email/SMS/push notification to officer | Real-time |

### Data Export & Compliance
| Endpoint | Method | Description | Frequency |
|----------|--------|-------------|-----------|
| `/api/export/report-csv` | POST | Export report data as CSV | On-demand |
| `/api/export/audit-log` | GET | Export audit trail for compliance | On-demand |
| `/api/data/retention` | GET | Check data retention policy + deletion schedule | On-demand |

---

## THIRD-PARTY INTEGRATIONS

### ✅ Confirmed Available on data.gov.sg

#### NEA (National Environment Agency) - 840.3M API calls/year
- **Real-time Weather API:** Temperature, humidity, wind speed, rainfall
  - Endpoint: `data.gov.sg/v2/public/api/datasets/d_5c6d1f96f0a2c216c0e6e0eb09a94fbf`
  - Latency: < 5 minutes
  - Components: C1, C6, C7

- **Air Quality API (PM2.5, PSI):** 7 stations across Singapore
  - Endpoint: `data.gov.sg/v2/public/api/datasets/d_2deb7e5c903919c61c8ea3dfc3c0c8ac`
  - Latency: < 10 minutes
  - Components: C6, C7 (respiratory risk)

- **Dengue Cluster Data:** Active clusters + case counts
  - Endpoint: `data.gov.sg/v2/public/api/datasets/d_8735096cbc17788e0b3e4f9a73c62872`
  - Latency: Daily updates
  - Component: C7 (outbreak prediction)

#### ACRA (Accounting & Corporate Regulatory Authority) - 4.8M API calls/year
- **Company Registry (UEN Lookup):** Registration status, director info, company health
  - Endpoint: `data.gov.sg/v2/public/api/datasets/d_65a9a8e6982d52ac86e17527e1b39ee4`
  - Latency: 24 hours (daily updates)
  - Component: C4 (contractor verification)

#### HDB (Housing & Development Board) - 8.3M API calls/year
- **Housing Complex Master List:** Estate profiles, block info, occupancy
  - Endpoint: `data.gov.sg/v2/public/api/datasets/HDB_ESTATES`
  - Latency: Monthly
  - Components: C5 (dormitory baseline), C8 (prioritization)

#### MOH (Ministry of Health) - 121.9K API calls/year
- **Public Health Datasets:** Disease surveillance, health indicators
  - Endpoint: `data.gov.sg/v2/public/api/datasets?agency=MOH`
  - Latency: Weekly
  - Components: C7 (disease), C10 (worker health)

#### BCA (Building & Construction Authority) - 744 API calls/year (LOW USAGE)
- **Construction Projects:** Active BCA-permitted projects
  - Endpoint: `data.gov.sg/v2/public/api/datasets/BCA_PROJECTS`
  - Latency: Weekly
  - Components: C1–C4
  - ⚠️ **Note:** Very limited API usage suggests data may be available via CSV downloads instead

### 🔴 NOT Confirmed on data.gov.sg (Require Separate Integration)

#### MOM Checksafe (Ministry of Manpower)
- **Stop Work Orders & CRS Status**
  - Currently: Internal MOM system
  - Required for: C4 (contractor compliance)
  - Integration type: OAuth 2.0 (government agency partnership)
  - Status: ⏳ Needs separate MOM API agreement

#### MOM Work Injury Database
- **Injury incidents by contractor/sector**
  - Currently: Internal MOM records
  - Required for: C1–C4 (construction risk patterns)
  - Integration type: Direct database access (partnership required)
  - Status: ⏳ Requires MOM data sharing agreement

#### CPF Board APIs
- **Member CPF balance, contributions, adequacy**
  - Currently: Not on public portal
  - Required for: C9 (salary/financial distress)
  - Integration type: OAuth 2.0
  - Status: ⏳ Future phase (Phase 3)

### Authentication
- **data.gov.sg APIs:** API Key (`v2:d1488f0f...`)
- **MOM/CPF (Future):** OAuth 2.0 with government credentials

---

## DATA FLOW ARCHITECTURE

```
Real-time Data Collection:
├── NEA APIs (weather, air quality, dengue) → 30-min intervals
├── BCA Project Data → Daily updates
├── MOM Checksafe → Real-time compliance checks
├── FEDA Dormitory Occupancy → Real-time
└── CPF/Salary Dispute Registry → Daily syncs

↓

Risk Component Calculation:
├── C1 (Construction Risk) = f(BCA projects + weather + incidents)
├── C2 (Fall Risk) = f(project phase + site conditions + history)
├── C3 (Machinery Risk) = f(machinery schedule + contractor CRS + wind)
├── C4 (Contractor Safety) = f(CRS status + violations + incidents)
├── C5 (Baseline Wellness) = f(occupancy + ventilation + demographics)
├── C6 (Heat Stress) = f(NEA heat index + outdoor exposure)
├── C7 (Disease Outbreak) = f(NEA dengue + air quality + screenings)
├── C8 (DTS Rank) = f(C5 + C6 + C7 + C9 + C10 weighted)
├── C9 (Salary Distress) = f(MOM disputes + CPF adequacy + contractor history)
└── C10 (Mental Health) = f(overcrowding + salary + injury + isolation)

↓

Intelligence Layer:
├── C11 (Ensemble Forecast) = Combine C1–C10 for prediction
├── C12 (Officer Dashboard) = Filter alerts by jurisdiction + jurisdiction
└── Reports = Aggregate outcomes + intervention effectiveness

↓

Output & Actions:
├── Alerts to WSH Officers (C1–C4 construction safety)
├── Alerts to Health Workers (C5–C8 dormitory wellness)
├── Alerts to Welfare Officers (C9–C10 worker wellbeing)
├── DTS Prioritization Queue (C8 ranking)
└── Weekly/Monthly Reports (user-requested downloads)
```

---

## DEPLOYMENT NOTES

### Authentication Methods:
- **Internal APIs:** OAuth 2.0 (GovTech-issued tokens)
- **Third-party (MOM/NEA):** API Key + OAuth 2.0 hybrid
- **Frontend Mock Mode:** localStorage tokens (development only)

### Rate Limiting:
- Real-time endpoints (30-min NEA data): 100 req/min
- Daily analytics: 10 req/min
- Report generation: 5 req/min

### Data Privacy:
- All worker PII encrypted (NRIC, salary, health data)
- Audit logs for all data access (compliance)
- 30-day data retention for operational logs, 1-year for audit trails
- PDPA-compliant anonymization for research/analytics

### Scalability:
- Expected daily API calls: ~50,000 (C1–C10 calculations + dashboard loads)
- Recommended caching: Redis for C1–C10 daily scores (24hr TTL)
- Database: PostgreSQL for historical data + transactional logs

---

## IMPLEMENTATION PRIORITY

**Phase 1 (MVP):** C1, C2, C3, C4, C9 + supporting infrastructure
**Phase 2:** C5, C6, C7, C8 + dormitory wellness
**Phase 3:** C10 + mental health integration + AMKTS partnerships
**Phase 4:** C11, C12 + full analytics + executive reporting

---

**Document Version:** 1.0  
**Last Updated:** March 2024  
**Maintained By:** Platform Architecture Team  
**Status:** Complete ✓ All 12 components mapped
