/**
 * Supabase Setup & Database Schema
 * Run all SQL in Supabase Editor to initialize
 */

-- ==================== 1. RISK ALERTS (C1-C10 Storage) ====================
CREATE TABLE risk_alerts (
  id BIGSERIAL PRIMARY KEY,
  alert_id TEXT NOT NULL UNIQUE, -- e.g., "C1-2024-0891"
  component TEXT NOT NULL, -- C1, C2, C3, ... C10
  location TEXT NOT NULL,
  risk_score NUMERIC NOT NULL, -- 0-100
  risk_level TEXT NOT NULL, -- "Low" | "Medium" | "High" | "Critical"
  description TEXT,
  triggered_by JSONB, -- {"source": "C1", "drivers": [...]}
  status TEXT DEFAULT 'active', -- active | acknowledged | resolved
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_to UUID, -- FK to auth.users
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_risk_alerts_component ON risk_alerts(component);
CREATE INDEX idx_risk_alerts_location ON risk_alerts(location);
CREATE INDEX idx_risk_alerts_status ON risk_alerts(status);
CREATE INDEX idx_risk_alerts_created_at ON risk_alerts(created_at DESC);

-- ==================== 2. INTERVENTIONS LOG ====================
CREATE TABLE interventions (
  id BIGSERIAL PRIMARY KEY,
  intervention_id TEXT NOT NULL UNIQUE, -- e.g., "INT-2024-0521"
  alert_id TEXT REFERENCES risk_alerts(alert_id),
  intervention_type TEXT NOT NULL, -- "WSH_Inspection" | "Health_Screening" | "Counseling" | "Cooling_Measures" | etc
  location TEXT NOT NULL,
  assigned_to UUID NOT NULL, -- FK to auth.users (officer/worker)
  team_members TEXT[] DEFAULT '{}', -- Array of officer names
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  objectives JSONB, -- {"primary": "...", "secondary": [...]}
  outcome TEXT, -- "Completed" | "In Progress" | "Deferred"
  findings JSONB, -- {"violations": [...], "recommendations": [...]}
  workers_affected INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_interventions_alert_id ON interventions(alert_id);
CREATE INDEX idx_interventions_assigned_to ON interventions(assigned_to);
CREATE INDEX idx_interventions_type ON interventions(intervention_type);
CREATE INDEX idx_interventions_status ON interventions(outcome);

-- ==================== 3. AUDIT TRAIL (Compliance) ====================
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL, -- FK to auth.users
  action TEXT NOT NULL, -- "viewed_alert" | "created_intervention" | "resolved_alert" | etc
  resource_type TEXT, -- "alert" | "intervention" | "contractor" | "worker"
  resource_id TEXT,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ==================== 4. DATA SOURCE CACHE ====================
CREATE TABLE data_source_cache (
  id BIGSERIAL PRIMARY KEY,
  source_name TEXT NOT NULL, -- "NEA_Weather" | "ACRA_Companies" | etc
  data JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  api_endpoint TEXT,
  status TEXT DEFAULT 'valid' -- "valid" | "stale" | "error"
);

CREATE INDEX idx_data_cache_source ON data_source_cache(source_name);
CREATE INDEX idx_data_cache_expires_at ON data_source_cache(expires_at);

-- ==================== 5. RISK HISTORY (Time Series) ====================
CREATE TABLE risk_scores_history (
  id BIGSERIAL PRIMARY KEY,
  location TEXT NOT NULL,
  component TEXT NOT NULL, -- C1, C2, ... C10
  score NUMERIC NOT NULL, -- 0-100
  score_date DATE NOT NULL,
  data_drivers JSONB, -- What factors contributed to this score
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_risk_history_location_component ON risk_scores_history(location, component);
CREATE INDEX idx_risk_history_score_date ON risk_scores_history(score_date DESC);

-- ==================== 6. USER PREFERENCES ====================
CREATE TABLE user_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE, -- FK to auth.users
  dashboard_theme TEXT DEFAULT 'light', -- light | dark
  notification_settings JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
  alert_filter_components TEXT[] DEFAULT '{}', -- Which C components to show
  alert_filter_locations TEXT[] DEFAULT '{}',
  sidebar_collapsed BOOLEAN DEFAULT FALSE,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- ==================== 7. NOTIFICATIONS ====================
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL, -- FK to auth.users
  title TEXT NOT NULL,
  message TEXT,
  notification_type TEXT, -- "alert_created" | "intervention_assigned" | "report_ready"
  related_alert_id TEXT, -- FK to risk_alerts
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ==================== 8. CONTRACTORS (C4 Data) ====================
CREATE TABLE contractors (
  id BIGSERIAL PRIMARY KEY,
  uen TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  crs_status TEXT, -- "Certified" | "Conditional" | "Provisional"
  safety_score NUMERIC,
  last_inspection_date DATE,
  stop_work_orders INT DEFAULT 0,
  incident_count INT DEFAULT 0,
  last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contractors_uen ON contractors(uen);
CREATE INDEX idx_contractors_crs_status ON contractors(crs_status);

-- ==================== 9. REPORTS ====================
CREATE TABLE reports (
  id BIGSERIAL PRIMARY KEY,
  report_id TEXT NOT NULL UNIQUE, -- "RPT-2024-W12"
  title TEXT NOT NULL,
  report_type TEXT, -- "Weekly" | "Monthly" | "Quarterly"
  status TEXT DEFAULT 'draft', -- "draft" | "published"
  summary TEXT,
  data JSONB, -- Full report data
  generated_by UUID, -- FK to auth.users
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reports_report_id ON reports(report_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- ==================== 10. ENABLE RLS ====================
ALTER TABLE risk_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_source_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scores_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ==================== 11. RLS POLICIES ====================

-- Anyone can view active alerts
CREATE POLICY "Users can view active alerts" ON risk_alerts
  FOR SELECT
  USING (status = 'active' OR auth.uid() = assigned_to);

-- Users can only view interventions they created or are assigned to
CREATE POLICY "Users can view interventions" ON interventions
  FOR SELECT
  USING (auth.uid() = assigned_to OR created_at > NOW() - INTERVAL '30 days');

-- Users can insert interventions
CREATE POLICY "Users can create interventions" ON interventions
  FOR INSERT
  WITH CHECK (auth.uid() = assigned_to);

-- Audit logs are read-only for users
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- User preferences are private
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Notifications are private
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- ==================== SAMPLE DATA ====================

-- Insert sample contractors for testing
INSERT INTO contractors (uen, company_name, crs_status, safety_score) VALUES
  ('UEN001', 'SafeBuild Construction', 'Provisional', 38),
  ('UEN002', 'Premier Engineering', 'Certified', 72),
  ('UEN003', 'SG Heavy Machinery', 'Conditional', 42),
  ('UEN004', 'Integrated Works', 'Certified', 81);

-- Insert sample alert
INSERT INTO risk_alerts (alert_id, component, location, risk_score, risk_level, description) VALUES
  ('C1-2024-0891', 'C1', 'Bukit Merah', 94, 'Critical', 'High construction injury risk due to HDB renovation + steep terrain + rainfall forecast');

COMMIT;
