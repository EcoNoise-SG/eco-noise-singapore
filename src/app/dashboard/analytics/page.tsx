'use client';

import { DashboardSection } from "@/components/dashboard/DashboardSection";
import {
  TFTForecastChart,
  AttentionWeightsChart,
  MultiOutputRadarChart,
  SpatialPersistenceChart,
  AnomalyDetectionChart
} from "@/components/dashboard/AnalyticsCharts";
import styles from "../dashboard.module.css";

const kpiCards = [
  { label: "Model MAPE", value: "8.4%", sub: "Mean Absolute Percentage Error", positive: true },
  { label: "Forecast Horizon", value: "14 Days", sub: "Multi-step temporal output", positive: false },
  { label: "Signal Dimensions", value: "24", sub: "Feature inputs across all models", positive: false },
  { label: "Ensemble Score", value: "88.2%", sub: "Weighted accuracy ensemble", positive: true },
  { label: "Anomaly Flags (7d)", value: "11", sub: "Real-time threshold violations", positive: false },
  { label: "Spatial Clusters", value: "14", sub: "Active high-persistence zones", positive: false },
];

const performanceLog = [
  { week: "W09", noise: "86%", dumping: "74%", pest: "79%", ensemble: "82%" },
  { week: "W10", noise: "87%", dumping: "76%", pest: "80%", ensemble: "84%" },
  { week: "W11", noise: "89%", dumping: "77%", pest: "82%", ensemble: "86%" },
  { week: "W12", noise: "88%", dumping: "76%", pest: "81%", ensemble: "85%" },
];

export default function AnalyticsPage() {
  return (
    <div className={styles.stack}>

      <div className={styles.gridThree}>
        {kpiCards.map((k) => (
          <div className={styles.metricCard} key={k.label}>
            <p>{k.label}</p>
            <strong className={k.positive ? styles.positive : ""}>{k.value}</strong>
            <span className={styles.metaLabel}>{k.sub}</span>
          </div>
        ))}
      </div>

      <div className={styles.gridTwo}>
        <DashboardSection
          eyebrow="Temporal forecasting"
          title="TFT Multi-step Forecast — Live vs Predicted"
        >
          <div className={styles.chartCard}>
            <TFTForecastChart height={280} />
            <div className={styles.chartMeta}>
              <p>Architecture: <span>Temporal Fusion Transformer</span></p>
              <p>Horizon: <span>14 Days</span></p>
            </div>
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Feature intelligence"
          title="Attention Weights — Signal Contribution"
        >
          <div className={styles.chartCard}>
            <AttentionWeightsChart height={200} />
            <div className={styles.metaText}>
              SHAP-derived attention weights show which real-world signals most
              influence the model's predictions each forecasting cycle.
            </div>
          </div>
        </DashboardSection>
      </div>

      <div className={styles.gridTwo}>
        <DashboardSection
          eyebrow="Specialised models"
          title="Multi-Output Model Performance Radar"
        >
          <div className={styles.chartCard}>
            <MultiOutputRadarChart height={320} />
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Real-time intelligence"
          title="Anomaly Detection — Intraday Surge Flags"
        >
          <div className={styles.chartCard}>
            <AnomalyDetectionChart height={280} />
            <div className={styles.anomalyBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              <span>2 anomalies flagged: 12:00 and 18:00 — Choa Chu Kang sector</span>
            </div>
          </div>
        </DashboardSection>
      </div>

      <DashboardSection
        eyebrow="Spatial intelligence"
        title="Spatial Persistence vs Seasonality — Planning Area Clusters"
      >
        <div className={styles.chartCard}>
          <SpatialPersistenceChart height={320} />
          <div className={styles.metaText}>
            Bubbles represent complaint volume. Top-right quadrant = persistent high-priority zones.
            Top-left = seasonal surges requiring event-driven response rather than permanent staging.
          </div>
        </div>
      </DashboardSection>

      <DashboardSection
        eyebrow="Weekly model audit"
        title="Model accuracy log — W09 to W12"
      >
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Week</th>
                <th>Noise Model</th>
                <th>Dumping Model</th>
                <th>Pest Model</th>
                <th>Ensemble Score</th>
              </tr>
            </thead>
            <tbody>
              {performanceLog.map((row) => (
                <tr key={row.week}>
                  <td><strong>{row.week}</strong></td>
                  <td>{row.noise}</td>
                  <td>{row.dumping}</td>
                  <td>{row.pest}</td>
                  <td><strong className={styles.positive}>{row.ensemble}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardSection>

    </div>
  );
}
