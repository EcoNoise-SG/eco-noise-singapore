'use client';

import { useState } from "react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import styles from "../dashboard.module.css";
import alertStyles from "./alerts.module.css";

const alerts = [
  {
    id: "ALT-0091",
    severity: "critical",
    title: "Noise Surge — Jurong West Blk 442",
    time: "Today · 22:14",
    description: "Acoustic sensor recorded 94dB over 12-minute window. Exceeds residential threshold by 29dB. Immediate response recommended.",
    area: "Jurong West",
    category: "Noise",
    status: "open",
  },
  {
    id: "ALT-0090",
    severity: "high",
    title: "Anomaly Detected — Choa Chu Kang Industrial",
    time: "Today · 18:07",
    description: "TFT model flagged an unexpected evening surge in complaint volume (+3.2σ above baseline). Likely linked to unregistered construction activity.",
    area: "Choa Chu Kang",
    category: "Anomaly",
    status: "open",
  },
  {
    id: "ALT-0088",
    severity: "high",
    title: "Illegal Dumping Risk — Tampines Ave 9",
    time: "Today · 15:30",
    description: "Remote sensing signal identified new debris accumulation near LTA road works corridor. Pre-treatment team dispatched.",
    area: "Tampines",
    category: "Dumping",
    status: "actioned",
  },
  {
    id: "ALT-0085",
    severity: "medium",
    title: "Pest Activity Spike — Woodlands North",
    time: "Yesterday · 09:00",
    description: "Drainage sensor pressure drop combined with overnight rain forecast triggered elevated pest risk score (0.82). Inspection team scheduled.",
    area: "Woodlands",
    category: "Pest",
    status: "actioned",
  },
  {
    id: "ALT-0081",
    severity: "medium",
    title: "Weekend Event Noise Risk — Bukit Merah",
    time: "Yesterday · 07:30",
    description: "Festive calendar signal detected: 3 events within 500m of residential cluster this weekend. Patrol pre-staging recommended Friday night.",
    area: "Bukit Merah",
    category: "Noise",
    status: "scheduled",
  },
  {
    id: "ALT-0079",
    severity: "low",
    title: "Sensor Connectivity — Sengkang Node 7",
    time: "2 days ago",
    description: "IoT sensor offline for >4h. Data gap recorded. Last reading: 68dB at 10:00. Maintenance team notified.",
    area: "Sengkang",
    category: "System",
    status: "resolved",
  },
];

const severityStyle: Record<string, string> = {
  critical: alertStyles.badgeCritical,
  high: alertStyles.badgeHigh,
  medium: alertStyles.badgeMedium,
  low: alertStyles.badgeLow,
};

const statusStyle: Record<string, string> = {
  open: alertStyles.statusOpen,
  actioned: alertStyles.statusActioned,
  scheduled: alertStyles.statusScheduled,
  resolved: alertStyles.statusResolved,
};

export default function AlertsPage() {
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? alerts : alerts.filter((a) => a.status === filter);

  const counts = {
    critical: alerts.filter((a) => a.severity === "critical").length,
    high: alerts.filter((a) => a.severity === "high").length,
    open: alerts.filter((a) => a.status === "open").length,
  };

  return (
    <div className={styles.stack}>
      <div className={styles.gridThree}>
        <div className={styles.metricCard}>
          <p>Critical Alerts</p>
          <strong style={{ color: "#dc2626" }}>{counts.critical}</strong>
          <span className={styles.metaLabel}>Requiring immediate response</span>
        </div>
        <div className={styles.metricCard}>
          <p>High Priority</p>
          <strong style={{ color: "#f59e0b" }}>{counts.high}</strong>
          <span className={styles.metaLabel}>Actionable within 2 hours</span>
        </div>
        <div className={styles.metricCard}>
          <p>Open Alerts</p>
          <strong>{counts.open}</strong>
          <span className={styles.metaLabel}>Pending officer response</span>
        </div>
      </div>

      <DashboardSection
        eyebrow="Live alert feed"
        title="All system and field alerts — ranked by severity"
      >
        <div className={alertStyles.filterRow}>
          {["all", "open", "actioned", "scheduled", "resolved"].map((f) => (
            <button
              key={f}
              className={`${alertStyles.filterBtn} ${filter === f ? alertStyles.filterActive : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.timeline}>
          {filtered.map((alert) => (
            <div className={styles.timelineItem} key={alert.id}>
              <div className={styles.timelineHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <strong>{alert.title}</strong>
                  <span className={severityStyle[alert.severity]}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
                <span className={statusStyle[alert.status]}>
                  {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                </span>
              </div>
              <span className={styles.timeLabel}>{alert.time} · {alert.area} · {alert.category}</span>
              <p className={styles.actionDetail}>{alert.description}</p>
              <div className={styles.logicNode}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6"/><path d="M12 9v6"/><circle cx="12" cy="12" r="10"/></svg>
                <span>Alert ID: {alert.id}</span>
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>
    </div>
  );
}
