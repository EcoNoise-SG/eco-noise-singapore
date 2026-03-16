import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { AttentionWeightsChart } from "@/components/dashboard/AnalyticsCharts";
import styles from "../dashboard.module.css";

const dataSources = [
  {
    source: "OneService Portal",
    signal: "Historical complaint volume (Spatio-temporal)",
    status: "synced",
    latency: "4h",
    records: "2.4M",
    since: "2019",
  },
  {
    source: "BCA Permit Database",
    signal: "Construction/Renovation density features",
    status: "synced",
    latency: "12h",
    records: "184K",
    since: "2021",
  },
  {
    source: "LTA Road Works",
    signal: "Temporal disruption uplift",
    status: "synced",
    latency: "1w",
    records: "92K",
    since: "2021",
  },
  {
    source: "NEA Weather API",
    signal: "Precipitation & Temperature drivers",
    status: "realtime",
    latency: "< 1m",
    records: "Live",
    since: "2022",
  },
  {
    source: "NEA IoT Sensor Net",
    signal: "Real-time dB thresholds & frequency analysis",
    status: "realtime",
    latency: "< 5s",
    records: "Live",
    since: "2023",
  },
  {
    source: "HDB Estate Profiles",
    signal: "Housing density & age stratification",
    status: "synced",
    latency: "Monthly",
    records: "1.1M",
    since: "2020",
  },
  {
    source: "MOM Work Permit Data",
    signal: "Construction workforce density proxy",
    status: "synced",
    latency: "Weekly",
    records: "430K",
    since: "2022",
  },
  {
    source: "Cultural Event Calendar",
    signal: "Festive season + public holiday encoding",
    status: "synced",
    latency: "Manual",
    records: "3.2K events",
    since: "2021",
  },
];

const contextualFeatures = [
  { feature: "Public holidays (SG)", weight: "High", impact: "Noise +23%" },
  { feature: "School term breaks", weight: "Medium", impact: "Noise +11%" },
  { feature: "Chinese New Year (7d)", weight: "Very High", impact: "Noise +42%" },
  { feature: "BCA peak season (Q4)", weight: "High", impact: "Renovation +31%" },
  { feature: "Monsoon onset", weight: "High", impact: "Pest +28%" },
  { feature: "NDP + major events", weight: "Medium", impact: "Noise +18%" },
];

export default function DataSourcesPage() {
  return (
    <div className={styles.stack}>
      <div className={styles.gridThree}>
        <div className={styles.metricCard}>
          <p>Active Data Sources</p>
          <strong>8</strong>
          <span className={styles.metaLabel}>Public & government APIs</span>
        </div>
        <div className={styles.metricCard}>
          <p>Total Records Ingested</p>
          <strong>3.2M+</strong>
          <span className={styles.metaLabel}>Across all historical feeds</span>
        </div>
        <div className={styles.metricCard}>
          <p>Real-time Feeds</p>
          <strong className={styles.positive}>2 Live</strong>
          <span className={styles.metaLabel}>Weather API + IoT Sensor Net</span>
        </div>
      </div>

      <DashboardSection
        eyebrow="Public data ingestion"
        title="Live feeds powering the spatio-temporal forecast model"
      >
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Source</th>
                <th>Signal Type</th>
                <th>Status</th>
                <th>Sync Latency</th>
                <th>Records</th>
                <th>Since</th>
              </tr>
            </thead>
            <tbody>
              {dataSources.map((ds) => (
                <tr key={ds.source}>
                  <td style={{ fontWeight: 600, color: "#0f172a" }}>{ds.source}</td>
                  <td style={{ fontSize: "0.875rem", color: "#475569" }}>{ds.signal}</td>
                  <td>
                    <span className={ds.status === "realtime" ? styles.statusRealtime : styles.statusSynced}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className={styles.statusIcon}><circle cx="12" cy="12" r="10"/></svg>
                      {ds.status === "realtime" ? "Realtime" : "Synced"}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.875rem" }}>{ds.latency}</td>
                  <td style={{ fontSize: "0.875rem", fontWeight: 500 }}>{ds.records}</td>
                  <td style={{ fontSize: "0.875rem", color: "#64748b" }}>{ds.since}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardSection>

      <div className={styles.gridTwo}>
        <DashboardSection eyebrow="Feature engine" title="Contextual signal — weight & impact">
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Weight</th>
                  <th>Complaint Impact</th>
                </tr>
              </thead>
              <tbody>
                {contextualFeatures.map((f) => (
                  <tr key={f.feature}>
                    <td style={{ fontSize: "0.875rem" }}>{f.feature}</td>
                    <td>
                      <span style={{
                        fontWeight: 700, fontSize: "0.75rem",
                        color: f.weight === "Very High" ? "#dc2626" : f.weight === "High" ? "#d97706" : "#2563eb",
                      }}>
                        {f.weight}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: "0.875rem", color: "#22c55e" }}>{f.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardSection>

        <DashboardSection eyebrow="Attention weights" title="Model feature contribution (SHAP)">
          <div className={styles.chartCard}>
            <AttentionWeightsChart height={220} />
            <div className={styles.metaText}>
              SHAP values show which data sources have the most influence on model output during each weekly inference cycle.
            </div>
          </div>
        </DashboardSection>
      </div>

      <DashboardSection eyebrow="Targeted impact" title="What better data means for operations">
        <div className={styles.listCard}>
          <ul className={styles.list}>
            <li><strong>15–25% Reduction</strong> in total complaint volume through proactive deterrence enabled by accurate forecasts.</li>
            <li><strong>Zero-Travel Staging:</strong> Officers pre-positioned within 500m of predicted cluster centroid — sourced from spatial ML signals.</li>
            <li><strong>Multi-Output Models:</strong> Distinct models for Noise, Dumping, and Pests mean each category&apos;s unique data drivers are captured independently.</li>
            <li><strong>Continuous Improvement:</strong> Field outcome data feeds back into training, increasing accuracy by ~1.1% per monthly retrain cycle.</li>
          </ul>
        </div>
      </DashboardSection>
    </div>
  );
}
