import { DashboardSection } from "@/components/dashboard/DashboardSection";
import styles from "../dashboard.module.css";

const actions = [
  {
    title: "Jurong West patrol staging",
    time: "Today · 18:00",
    detail: "Position officers near renovation-dense blocks before evening complaint peak.",
  },
  {
    title: "Woodlands inspection sweep",
    time: "Tomorrow · 08:30",
    detail: "Coordinate pest, waste, and drainage checks after overnight rain forecast.",
  },
  {
    title: "Bukit Merah night watch",
    time: "Friday · 21:00",
    detail: "Target nightlife-adjacent residential edges with mobile monitoring units.",
  },
];

export default function OperationsPage() {
  return (
    <div className={styles.stack}>
      <DashboardSection
        eyebrow="AI-Generated Operations"
        title="Proactive pre-positioning recommendations for NEA/TC officers"
      >
        <div className={styles.timeline}>
          {actions.map((action) => (
            <div className={styles.timelineItem} key={action.title}>
              <div className={styles.timelineHeader}>
                <strong>{action.title}</strong>
                <span className={styles.riskBadge}>High Risk Cluster</span>
              </div>
              <span className={styles.timeLabel}>{action.time}</span>
              <p className={styles.actionDetail}>{action.detail}</p>
              <div className={styles.logicNode}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                <span>Trigger: BCA Renovation Density &gt; 0.85 (z-score)</span>
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>

      <div className={styles.gridTwo}>
        <DashboardSection eyebrow="Impact Goal" title="Reactive to Proactive Shift">
          <div className={styles.listCard}>
            <ul className={styles.list}>
              <li><strong>Target:</strong> 15–25% Reduction in OneService complaint volume.</li>
              <li><strong>Efficiency:</strong> Reduce travel-to-incident time by pre-staging.</li>
              <li><strong>Satisfaction:</strong> Visible enforcement creates psychological deterrence.</li>
            </ul>
          </div>
        </DashboardSection>

        <DashboardSection eyebrow="Agency posture" title="Deployment Readiness">
          <div className={styles.listCard}>
            <ul className={styles.list}>
              <li>Teams staged at predicted clusters 30m prior to forecast peak.</li>
              <li>Inspection packs tailored by model output (Noise vs Pest focus).</li>
              <li>Outcome feedback loop feeds back into TFT temporal weights.</li>
            </ul>
          </div>
        </DashboardSection>
      </div>

      <DashboardSection
        eyebrow="Active Feedback Loop"
        title="Field verification of recent AI predictions"
      >
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Operation ID</th>
                <th>Predicted Risk</th>
                <th>Field Outcome</th>
                <th>Validation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>#OPS-4421</td>
                <td>High (Renovation)</td>
                <td>4 incidents deterred, 1 warning issued</td>
                <td><span className={styles.statusSynced}>Confirmed Match</span></td>
              </tr>
              <tr>
                <td>#OPS-4418</td>
                <td>Moderate (Pest)</td>
                <td>Pre-treatment of 2 drainage nodes completed</td>
                <td><span className={styles.statusSynced}>Outcome Positive</span></td>
              </tr>
              <tr>
                <td>#OPS-4409</td>
                <td>High (Spike)</td>
                <td>Atypical surge verified as illegal dumping block</td>
                <td><span className={styles.statusRealtime}>Anomaly Validated</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </DashboardSection>


    </div>
  );
}
