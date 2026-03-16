import { DashboardSection } from "@/components/dashboard/DashboardSection";
import styles from "../dashboard.module.css";

const maintenanceTasks = [
  { id: "MNT-441", sensor: "Sensor Node SG-JW-07", area: "Jurong West", issue: "Battery low (<15%). Scheduled battery swap.", priority: "High", status: "Scheduled", date: "25 Mar 2024" },
  { id: "MNT-440", sensor: "Sensor Node SG-WL-12", area: "Woodlands", issue: "Data packet loss >5% over 48h. Firmware update required.", priority: "Medium", status: "In Progress", date: "24 Mar 2024" },
  { id: "MNT-439", sensor: "Sensor Node SG-SK-03", area: "Sengkang", issue: "Offline >4h. Physical inspection needed.", priority: "Critical", status: "Dispatched", date: "24 Mar 2024" },
  { id: "MNT-438", sensor: "Gateway Node SG-TP-GW1", area: "Tampines", issue: "Intermittent connectivity. Router reset resolved issue partially.", priority: "Low", status: "Monitoring", date: "22 Mar 2024" },
  { id: "MNT-437", sensor: "Sensor Node SG-BM-04", area: "Bukit Merah", issue: "Microphone element degraded. dB readings ±8dB outlier. Replacement approved.", priority: "Medium", status: "Completed", date: "20 Mar 2024" },
];

const sensorHealth = [
  { area: "Jurong West", online: 18, total: 20, pct: 90 },
  { area: "Woodlands", online: 14, total: 15, pct: 93 },
  { area: "Tampines", online: 12, total: 13, pct: 92 },
  { area: "Bukit Merah", online: 11, total: 12, pct: 92 },
  { area: "Sengkang", online: 9, total: 10, pct: 90 },
  { area: "Choa Chu Kang", online: 15, total: 16, pct: 94 },
];

const priorityStyle: Record<string, { color: string; bg: string }> = {
  Critical: { color: "#dc2626", bg: "#fef2f2" },
  High: { color: "#b45309", bg: "#fffbeb" },
  Medium: { color: "#2563eb", bg: "#eff6ff" },
  Low: { color: "#475569", bg: "#f8fafc" },
};

const statusColor: Record<string, string> = {
  Scheduled: "#2563eb",
  "In Progress": "#d97706",
  Dispatched: "#dc2626",
  Monitoring: "#64748b",
  Completed: "#22c55e",
};

export default function MaintenancePage() {
  return (
    <div className={styles.stack}>
      <div className={styles.gridThree}>
        <div className={styles.metricCard}>
          <p>Sensors Online</p>
          <strong className={styles.positive}>142 / 152</strong>
          <span className={styles.metaLabel}>93.4% network uptime</span>
        </div>
        <div className={styles.metricCard}>
          <p>Open Maintenance Tasks</p>
          <strong style={{ color: "#f59e0b" }}>4</strong>
          <span className={styles.metaLabel}>Across all planning areas</span>
        </div>
        <div className={styles.metricCard}>
          <p>Avg. Resolution Time</p>
          <strong>6.2 hrs</strong>
          <span className={styles.metaLabel}>From ticket to resolution</span>
        </div>
      </div>

      <DashboardSection eyebrow="Network health" title="IoT sensor coverage by planning area">
        <div className={styles.listCard}>
          <div className={styles.bars}>
            {sensorHealth.map((s) => (
              <div className={styles.barRow} key={s.area}>
                <span>{s.area}</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${s.pct}%` } as React.CSSProperties}
                  />
                </div>
                <span>{s.online}/{s.total}</span>
              </div>
            ))}
          </div>
        </div>
      </DashboardSection>

      <DashboardSection eyebrow="Open tickets" title="Active maintenance workorders">
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Sensor / Node</th>
                <th>Area</th>
                <th>Issue</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceTasks.map((t) => (
                <tr key={t.id}>
                  <td><code style={{ fontSize: "0.8125rem" }}>{t.id}</code></td>
                  <td style={{ fontSize: "0.875rem", fontWeight: 500 }}>{t.sensor}</td>
                  <td style={{ fontSize: "0.875rem" }}>{t.area}</td>
                  <td style={{ fontSize: "0.8125rem", color: "#475569", maxWidth: "280px" }}>{t.issue}</td>
                  <td>
                    <span style={{
                      background: priorityStyle[t.priority]?.bg,
                      color: priorityStyle[t.priority]?.color,
                      padding: "3px 8px", borderRadius: "4px",
                      fontSize: "0.6875rem", fontWeight: 700,
                    }}>
                      {t.priority}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: statusColor[t.status], fontWeight: 700, fontSize: "0.75rem" }}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.875rem" }}>{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardSection>

      <div className={styles.gridTwo}>
        <DashboardSection eyebrow="Preventive schedule" title="Upcoming planned maintenance">
          <div className={styles.listCard}>
            <ul className={styles.list}>
              <li><strong>Q2 2024 Firmware Rollout</strong> — All nodes updated to v3.4.1 with improved anomaly detection sensitivity.</li>
              <li><strong>Battery Replacement Cycle</strong> — 28 sensors due for battery swap before June monsoon season.</li>
              <li><strong>Sensor Calibration</strong> — Annual dB calibration across all nodes in April.</li>
              <li><strong>Gateway Upgrade</strong> — 3 gateway nodes upgraded to 5G-capable hardware by end Q2.</li>
            </ul>
          </div>
        </DashboardSection>

        <DashboardSection eyebrow="SLA compliance" title="Response time benchmarks">
          <div className={styles.listCard}>
            <ul className={styles.list}>
              <li><strong>Critical (Offline):</strong> Dispatch within 1 hour. Resolution SLA: 4 hours.</li>
              <li><strong>High (Battery/Data Loss):</strong> Response within 4 hours. Resolution SLA: 24 hours.</li>
              <li><strong>Medium:</strong> Response within 24 hours. Resolution SLA: 3 days.</li>
              <li><strong>Low:</strong> Next scheduled maintenance cycle.</li>
            </ul>
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}
