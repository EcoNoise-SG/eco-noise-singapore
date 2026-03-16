import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { MockMap } from "@/components/dashboard/MockMap";
import { MultiOutputRadarChart, AnomalyDetectionChart, SpatialPersistenceChart } from "@/components/dashboard/AnalyticsCharts";
import styles from "../dashboard.module.css";

const forecastRows: string[][] = [
  ["Jurong West", "High", "Moderate", "Deploy two evening patrol units"],
  ["Woodlands", "Moderate", "High", "Increase pest inspection coverage"],
  ["Tampines", "Moderate", "High", "Pair dumping enforcement with market sweep"],
  ["Bukit Merah", "High", "Low", "Focus on Friday and Saturday night patrols"],
];


export default function ForecastsPage() {
  return (
    <div className={styles.stack}>
      <MockMap title="Predicted nuisance hotspots for W12 - W14" />

      <DashboardSection
        eyebrow="Forecast breakdown"
        title="Weekly activity projections"
      >

        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Planning area</th>
                <th>Noise risk</th>
                <th>Environmental risk</th>
                <th>Recommended deployment</th>
              </tr>
            </thead>
            <tbody>
              {forecastRows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell) => (
                    <td key={cell}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardSection>

      <div className={styles.gridTwo}>
        <DashboardSection
          eyebrow="Scenario planning"
          title="Resource allocation impact simulator"
        >
          <div className={styles.simulatorCard}>
            <div className={styles.simControl}>
              <span className={styles.metaLabel}>Deployment Level</span>
              <div className={styles.simToggle}>
                <button className={styles.active}>Proactive (High)</button>
                <button>Standard</button>
                <button>Reactive</button>
              </div>
            </div>
            <div className={styles.simResult}>
              <div className={styles.simMetric}>
                <p>Predicted Complaint Suppression</p>
                <strong className={styles.positive}>-22%</strong>
              </div>
              <div className={styles.simMetric}>
                <p>Allocated Man-Hours</p>
                <strong>450h/wk</strong>
              </div>
            </div>
          </div>
        </DashboardSection>
      </div>

      <div className={styles.gridTwo}>
        <DashboardSection
          eyebrow="Specialized Models"
          title="Multi-Output Model Performance"
        >
          <div className={styles.chartCard}>
            <MultiOutputRadarChart />
            <div className={styles.metaText}>
              Separate specialized models for noise, illegal dumping, and pest complaints.
            </div>
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Intelligence signals"
          title="Anomaly Detection & Real-time Flags"
        >
          <div className={styles.chartCard} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <AnomalyDetectionChart />
            <div className={styles.anomalyBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              <span>Urgent: Unusual evening surge detected in Jurong Industrial Estate</span>
            </div>
          </div>
        </DashboardSection>
      </div>

      <DashboardSection
        eyebrow="Spatial Intelligence"
        title="Spatial Clustering: Persistence vs Seasonality"
      >
        <div className={styles.chartCard}>
          <SpatialPersistenceChart />
          <div className={styles.metaText}>
            This cluster analysis identifies persistent high-complaint patterns versus seasonal spikes across regions, allowing for more strategic resource allocation.
          </div>
        </div>
      </DashboardSection>

      <div className={styles.gridThree}>
        <div className={styles.metricCard}>
          <p>Global model confidence</p>
          <strong>84%</strong>
          <span className={styles.metaLabel}>W12 Ensemble Score</span>
        </div>
        <div className={styles.metricCard}>
          <p>Training Data Horizon</p>
          <strong>5 Years</strong>
          <span className={styles.metaLabel}>Historical baseline depth</span>
        </div>
        <div className={styles.metricCard}>
          <p>Active Clusters</p>
          <strong>14</strong>
          <span className={styles.metaLabel}>High-persistence hotspots</span>
        </div>
      </div>

    </div>
  );
}
