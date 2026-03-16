import { DashboardSection } from "@/components/dashboard/DashboardSection";
import styles from "../dashboard.module.css";

const logs = [
  { id: "LOG-20240324-0891", user: "Insp. Sarah Lim", action: "Generated W12 forecast report", module: "Reports", timestamp: "24 Mar 2024 · 09:14:32", severity: "info" },
  { id: "LOG-20240324-0890", user: "System (TFT Scheduler)", action: "Model inference completed: 14-day multi-step forecast", module: "ML Engine", timestamp: "24 Mar 2024 · 09:00:01", severity: "info" },
  { id: "LOG-20240323-0889", user: "Cpt. Ravi Kumar", action: "Logged field outcome: #OPS-4421 — 4 incidents deterred", module: "Operations", timestamp: "23 Mar 2024 · 21:43:16", severity: "info" },
  { id: "LOG-20240323-0888", user: "System (Anomaly Detector)", action: "ALERT generated: Choa Chu Kang evening surge +3.2σ", module: "Alerts", timestamp: "23 Mar 2024 · 18:07:44", severity: "warning" },
  { id: "LOG-20240323-0887", user: "Daniel Tan", action: "Feature weights updated: BCA permit density coefficient +0.05", module: "ML Engine", timestamp: "23 Mar 2024 · 15:22:09", severity: "info" },
  { id: "LOG-20240323-0886", user: "Loh Wei Ming", action: "User account created: Aigerim Bekova (MND Policy — read-only)", module: "Users", timestamp: "23 Mar 2024 · 11:05:47", severity: "info" },
  { id: "LOG-20240322-0885", user: "Marcus Chia", action: "Maintenance ticket MNT-439 updated: Status → Dispatched", module: "Maintenance", timestamp: "22 Mar 2024 · 10:31:22", severity: "info" },
  { id: "LOG-20240322-0884", user: "System (IoT Gateway)", action: "CRITICAL: Sensor SG-SK-03 offline >4h. Ticket auto-created.", module: "Maintenance", timestamp: "22 Mar 2024 · 06:18:05", severity: "critical" },
  { id: "LOG-20240321-0883", user: "Priya Nair", action: "Compliance case ENF-2024-0437 filed: Advisory issued, Tampines", module: "Compliance", timestamp: "21 Mar 2024 · 14:02:48", severity: "info" },
  { id: "LOG-20240321-0882", user: "System (Data Pipeline)", action: "BCA permit data sync complete: 1,842 records updated", module: "Data Sources", timestamp: "21 Mar 2024 · 02:00:00", severity: "info" },
];

const severityStyle: Record<string, { bg: string; color: string; label: string }> = {
  info: { bg: "#eff6ff", color: "#1d4ed8", label: "INFO" },
  warning: { bg: "#fffbeb", color: "#b45309", label: "WARN" },
  critical: { bg: "#fef2f2", color: "#dc2626", label: "ERROR" },
};

const moduleColors: Record<string, string> = {
  Reports: "#7c3aed",
  "ML Engine": "#0d9488",
  Operations: "#1d4ed8",
  Alerts: "#dc2626",
  Users: "#475569",
  Maintenance: "#d97706",
  Compliance: "#166534",
  "Data Sources": "#0f766e",
};

export default function LogsPage() {
  return (
    <div className={styles.stack}>
      <div className={styles.gridThree}>
        <div className={styles.metricCard}>
          <p>Log Entries (24h)</p>
          <strong>216</strong>
          <span className={styles.metaLabel}>Across all modules</span>
        </div>
        <div className={styles.metricCard}>
          <p>Warnings / Errors (24h)</p>
          <strong style={{ color: "#f59e0b" }}>5</strong>
          <span className={styles.metaLabel}>2 warnings, 1 critical</span>
        </div>
        <div className={styles.metricCard}>
          <p>Scheduled System Jobs</p>
          <strong className={styles.positive}>All Running</strong>
          <span className={styles.metaLabel}>7/7 pipeline jobs healthy</span>
        </div>
      </div>

      <DashboardSection
        eyebrow="Audit trail"
        title="System and user activity log — last 24 hours"
      >
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Severity</th>
                <th>Log ID</th>
                <th>User / Source</th>
                <th>Action</th>
                <th>Module</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <span style={{
                      background: severityStyle[log.severity].bg,
                      color: severityStyle[log.severity].color,
                      padding: "3px 8px", borderRadius: "4px",
                      fontSize: "0.6875rem", fontWeight: 700,
                    }}>
                      {severityStyle[log.severity].label}
                    </span>
                  </td>
                  <td><code style={{ fontSize: "0.75rem", color: "#64748b" }}>{log.id}</code></td>
                  <td style={{ fontSize: "0.8125rem", fontWeight: 500 }}>{log.user}</td>
                  <td style={{ fontSize: "0.8125rem", color: "#334155", maxWidth: "320px" }}>{log.action}</td>
                  <td>
                    <span style={{ color: moduleColors[log.module] ?? "#475569", fontSize: "0.8125rem", fontWeight: 600 }}>
                      {log.module}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardSection>

      <div className={styles.gridTwo}>
        <DashboardSection eyebrow="Scheduled jobs" title="Automated pipeline health">
          <div className={styles.listCard}>
            <ul className={styles.list}>
              <li><strong>Daily BCA Permit Sync</strong> — Runs 02:00 daily. Last run: OK (1,842 records).</li>
              <li><strong>NEA Weather Pull</strong> — Real-time, 1min interval. Status: Live.</li>
              <li><strong>TFT Inference Job</strong> — Daily at 09:00. Next: 25 Mar, 09:00.</li>
              <li><strong>LTA Road Works Sync</strong> — Weekly Monday. Last run: OK.</li>
              <li><strong>Anomaly Detector</strong> — Continuous sliding window (15 min). Status: Active.</li>
              <li><strong>Report Generator</strong> — Sunday at 07:00. Next: 31 Mar, 07:00.</li>
              <li><strong>Model Retraining</strong> — Monthly. Last run: 01 Mar 2024.</li>
            </ul>
          </div>
        </DashboardSection>

        <DashboardSection eyebrow="Retention policy" title="Log data governance">
          <div className={styles.listCard}>
            <ul className={styles.list}>
              <li><strong>User Actions:</strong> Retained for 365 days in compliance with NEA data governance policy.</li>
              <li><strong>System Events:</strong> Retained for 90 days; compressed archives kept for 3 years.</li>
              <li><strong>Critical Errors:</strong> Escalated to IT Security within 15 minutes. Flagged in audit trail.</li>
              <li><strong>Export Format:</strong> JSON + CSV available for compliance audit downloads.</li>
            </ul>
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}
