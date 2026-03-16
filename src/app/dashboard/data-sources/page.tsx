import { DashboardSection } from "@/components/dashboard/DashboardSection";
import styles from "../dashboard.module.css";

export default function DataSourcesPage() {
  return (
    <div className={styles.stack}>
      <DashboardSection
        eyebrow="Public data ingestion"
        title="Live feeds powering the spatio-temporal forecast model"
      >
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Source</th>
                <th>Signal type</th>
                <th>Status</th>
                <th>Sync Latency</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>OneService Portal</td>
                <td>Historical complaint volume (Spatio-temporal)</td>
                <td>
                  <span className={styles.statusSynced}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className={styles.statusIcon}><circle cx="12" cy="12" r="10"/></svg>
                    Synced
                  </span>
                </td>
                <td>4h</td>
              </tr>
              <tr>
                <td>BCA Permit Database</td>
                <td>Construction/Renovation density features</td>
                <td>
                  <span className={styles.statusSynced}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className={styles.statusIcon}><circle cx="12" cy="12" r="10"/></svg>
                    Synced
                  </span>
                </td>
                <td>12h</td>
              </tr>
              <tr>
                <td>LTA Road Works</td>
                <td>Temporal disruption uplift</td>
                <td>
                  <span className={styles.statusSynced}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className={styles.statusIcon}><circle cx="12" cy="12" r="10"/></svg>
                    Synced
                  </span>
                </td>
                <td>1w</td>
              </tr>
              <tr>
                <td>NEA Weather API</td>
                <td>Precipitation & Temperature drivers</td>
                <td>
                  <span className={styles.statusRealtime}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className={styles.statusIcon}><circle cx="12" cy="12" r="10"/></svg>
                    Realtime
                  </span>
                </td>
                <td>&lt; 1m</td>
              </tr>
              <tr>
                <td>NEA IoT Sensor Net</td>
                <td>Real-time dB thresholds & frequency analysis</td>
                <td>
                  <span className={styles.statusRealtime}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className={styles.statusIcon}><circle cx="12" cy="12" r="10"/></svg>
                    Realtime
                  </span>
                </td>
                <td>&lt; 5s</td>
              </tr>


            </tbody>
          </table>

        </div>
      </DashboardSection>

      <div className={styles.gridTwo}>
        <DashboardSection
          eyebrow="Feature engine"
          title="Contextual weights"
        >
          <div className={styles.chipRow}>
            <div className={styles.chip}>Public holidays (High Weight)</div>
            <div className={styles.chip}>School breaks</div>
            <div className={styles.chip}>Festive seasons</div>
            <div className={styles.chip}>Estate Age Profile</div>
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Targeted impact"
          title="Potential efficiency gains"
        >
          <div className={styles.listCard}>
            <ul className={styles.list}>
              <li><strong>15–25% Reduction</strong> in total complaint volume through deterrence.</li>
              <li><strong>Zero-Travel Staging:</strong> Proactive position within 500m of clusters.</li>
              <li><strong>Multi-Output:</strong> Distinct models for Noise, Dumping, and Pests.</li>
            </ul>
          </div>
        </DashboardSection>
      </div>

    </div>
  );
}
