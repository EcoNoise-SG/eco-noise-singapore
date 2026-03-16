import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { MockMap } from "@/components/dashboard/MockMap";
import { TFTForecastChart, AttentionWeightsChart } from "@/components/dashboard/AnalyticsCharts";
import styles from "./dashboard.module.css";

const hotspotIntensity: { area: string; value: number }[] = [
  { area: "Jurong West", value: 88 },
  { area: "Woodlands", value: 81 },
  { area: "Tampines", value: 72 },
  { area: "Bukit Merah", value: 64 },
];


export default function DashboardOverviewPage() {
  return (
    <div className={styles.stack}>
      <MockMap title="National Municipal Nuisance Status" />
      
      <div className={styles.gridThree}>
        <div className={styles.metricCard}>
          <p>Predicted complaints next week</p>
          <strong>1,284</strong>
        </div>
        <div className={styles.metricCard}>
          <p>Areas above intervention threshold</p>
          <strong>11</strong>
        </div>
        <div className={styles.metricCard}>
          <p>Recommended patrol teams</p>
          <strong>7 deployments</strong>
        </div>
      </div>

      <div className={styles.gridThree}>
        <div className={styles.metricCard}>
          <p>Deterrence Efficiency</p>
          <strong className={styles.positive}>18.4%</strong>
          <span className={styles.metaLabel}>Reduction in predicted volume</span>
        </div>
        <div className={styles.metricCard}>
          <p>Officer Readiness</p>
          <strong>92%</strong>
          <span className={styles.metaLabel}>Proactive staging coverage</span>
        </div>
        <div className={styles.metricCard}>
          <p>Resource ROI</p>
          <strong>4.2x</strong>
          <span className={styles.metaLabel}>Incident prevent ratio</span>
        </div>
      </div>


      <div className={styles.gridTwo}>
        <DashboardSection
          eyebrow="Forecast health"
          title="TFT Multi-step Complaint Forecasting"
        >
          <div className={styles.chartCard}>
            <TFTForecastChart />
            <div className={styles.chartMeta}>
              <p>Model Architecture: <span>Temporal Fusion Transformer (TFT)</span></p>
              <p>Forecast Horizon: <span>14 Days (Multi-step)</span></p>
            </div>
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Model intelligence"
          title="Attention Mechanisms: Signal Contributions"
        >
          <div className={styles.chartCard}>
            <AttentionWeightsChart />
            <div className={styles.anomalyBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              <span>Anomaly Detected: 2 atypical surges flagged in Choa Chu Kang</span>
            </div>
          </div>
        </DashboardSection>
      </div>

      <DashboardSection
        eyebrow="Command view"
        title="Weekly intervention schedule for joint enforcement teams"
      >
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Day</th>
                <th>Area</th>
                <th>Primary issue</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Monday</td>
                <td>Jurong West</td>
                <td>Renovation noise</td>
                <td>Evening patrol near permit clusters</td>
              </tr>
              <tr>
                <td>Wednesday</td>
                <td>Woodlands</td>
                <td>Pest complaints</td>
                <td>Drain and waste joint inspection sweep</td>
              </tr>
              <tr>
                <td>Friday</td>
                <td>Bukit Merah</td>
                <td>Nightlife spillover noise</td>
                <td>Late-hour compliance patrol deployment</td>
              </tr>
            </tbody>
          </table>
        </div>
      </DashboardSection>
    </div>
  );
}
