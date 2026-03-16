'use client';

import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { MultiOutputRadarChart, AnomalyDetectionChart } from "@/components/dashboard/AnalyticsCharts";
import styles from "../dashboard.module.css";

const categoryMetrics = [
  {
    label: "Noise (Predicted 2w)",
    value: "750",
    direction: "up",
    driver: "Driver: Renovation Peak",
  },
  {
    label: "Dumping (Predicted 2w)",
    value: "290",
    direction: "down",
    driver: "Driver: Patrol Deterrence",
  },
  {
    label: "Pest (Predicted 2w)",
    value: "310",
    direction: "flat",
    driver: "Driver: High Humidity",
  },
];

const forecastDrivers = [
  { category: "Noise", driver: "BCA Renovation Permits + Festive Calendar", target: "20% through deterrence" },
  { category: "Illegal Dumping", driver: "LTA Road Works + Remote Sensing Signals", target: "25% via preemptive clearing" },
  { category: "Pests", driver: "Rain Intermittency + Drainage Sensor Data", target: "15% by early treatment" },
];

const complaintTrend = [
  { week: "W08", noise: 820, dumping: 310, pest: 290 },
  { week: "W09", noise: 795, dumping: 295, pest: 305 },
  { week: "W10", noise: 840, dumping: 280, pest: 315 },
  { week: "W11", noise: 810, dumping: 265, pest: 298 },
  { week: "W12", noise: 780, dumping: 290, pest: 310 },
];

const directionIcon = (d: string) => {
  if (d === "up") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
  );
  if (d === "down") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m19 12-7 7-7-7"/><path d="M12 5v14"/></svg>
  );
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
  );
};

export default function ComplaintsPage() {
  return (
    <div className={styles.stack}>

      <div className={styles.gridThree}>
        {categoryMetrics.map((m) => (
          <div className={styles.metricCard} key={m.label}>
            <p>{m.label}</p>
            <div className={styles.metricValue}>
              <strong>{m.value}</strong>
              {directionIcon(m.direction)}
            </div>
            <span className={styles.metaLabel}>{m.driver}</span>
          </div>
        ))}
      </div>

      <div className={styles.gridTwo}>
        <DashboardSection
          eyebrow="Specialised models"
          title="Multi-Output Model Performance — Noise vs Dumping vs Pest"
        >
          <div className={styles.chartCard}>
            <MultiOutputRadarChart height={280} />
            <div className={styles.metaText}>
              Separate ML models are trained for each category to capture domain-specific feature relationships and improve per-category forecast accuracy.
            </div>
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Anomaly detection"
          title="Intraday surge flags — Today"
        >
          <div className={styles.chartCard}>
            <AnomalyDetectionChart height={240} />
            <div className={styles.anomalyBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              <span>2 anomalies flagged at 12:00 and 18:00 — Choa Chu Kang sector</span>
            </div>
          </div>
        </DashboardSection>
      </div>

      <DashboardSection
        eyebrow="Multi-output forecasting"
        title="Category-specific predictive drivers"
      >
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Primary ML Driver</th>
                <th>Target Reduction</th>
              </tr>
            </thead>
            <tbody>
              {forecastDrivers.map((r) => (
                <tr key={r.category}>
                  <td><strong>{r.category}</strong></td>
                  <td>{r.driver}</td>
                  <td>{r.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardSection>

      <DashboardSection
        eyebrow="Historical trend"
        title="Weekly complaint volumes — W08 to W12"
      >
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Week</th>
                <th>Noise</th>
                <th>Illegal Dumping</th>
                <th>Pest</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {complaintTrend.map((row) => (
                <tr key={row.week}>
                  <td><strong>{row.week}</strong></td>
                  <td>{row.noise}</td>
                  <td>{row.dumping}</td>
                  <td>{row.pest}</td>
                  <td><strong>{row.noise + row.dumping + row.pest}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardSection>

      <DashboardSection
        eyebrow="Mission Impact"
        title="Projected state-wide reduction via proactive pre-positioning"
      >
        <div className={styles.listCard}>
          <ul className={styles.list}>
            <li><strong>Deterrence First:</strong> Presence of officers in predicted hotspots reduces incident density by ~18% in prototype clusters.</li>
            <li><strong>Travel Optimisation:</strong> Reducing response time from 45 mins to &lt; 10 mins by pre-staging near BCA construction nodes.</li>
            <li><strong>Resident Satisfaction:</strong> Measurable improvement in Q3 estate quality surveys due to lower noise baselines.</li>
          </ul>
        </div>
      </DashboardSection>

    </div>
  );
}
