import { DashboardSection } from "@/components/dashboard/DashboardSection";
import styles from "../dashboard.module.css";

export default function ComplaintsPage() {
  return (
    <div className={styles.stack}>
      <div className={styles.gridThree}>
        <div className={styles.metricCard}>
          <p>Noise (Predicted 2w)</p>
          <div className={styles.metricValue}>
            <strong>750</strong>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
          </div>
          <span className={styles.metaLabel}>Driver: Renovation Peak</span>
        </div>
        <div className={styles.metricCard}>
          <p>Dumping (Predicted 2w)</p>
          <div className={styles.metricValue}>
            <strong>290</strong>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m19 12-7 7-7-7"/><path d="M12 5v14"/></svg>
          </div>
          <span className={styles.metaLabel}>Driver: Patrol Deterrence</span>
        </div>
        <div className={styles.metricCard}>
          <p>Pest (Predicted 2w)</p>
          <div className={styles.metricValue}>
            <strong>310</strong>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
          </div>
          <span className={styles.metaLabel}>Driver: High Humidity</span>
        </div>

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
              <tr>
                <td><strong>Noise</strong></td>
                <td>BCA Renovation Permits + Festive Calendar</td>
                <td>20% through deterrence</td>
              </tr>
              <tr>
                <td><strong>Illegal Dumping</strong></td>
                <td>LTA Road Works + Remote Sensing Signals</td>
                <td>25% via preemptive clearing</td>
              </tr>
              <tr>
                <td><strong>Pests</strong></td>
                <td>Rain Intermittency + Drainage Sensor Data</td>
                <td>15% by early treatement</td>
              </tr>
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
            <li><strong>Travel Optimization:</strong> Reducing response time from 45 mins to &lt; 10 mins by pre-staging near BCA construction nodes.</li>
            <li><strong>Resident Satisfaction:</strong> Measurable improvement in Q3 estate quality surveys due to lower noise baselines.</li>
          </ul>
        </div>
      </DashboardSection>

    </div>
  );
}
