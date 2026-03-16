import { DashboardSection } from "@/components/dashboard/DashboardSection";
import styles from "../dashboard.module.css";

const reports = [
  {
    id: "RPT-2024-W12",
    title: "Weekly Complaint Intelligence Brief — W12",
    date: "24 Mar 2024",
    type: "Weekly",
    status: "Published",
    summary: "1,284 complaints predicted for W13. Jurong West and Woodlands remain primary hotspots. 7 patrol deployments recommended. Deterrence efficiency at 18.4%.",
    downloadUrl: "#",
  },
  {
    id: "RPT-2024-W11",
    title: "Weekly Complaint Intelligence Brief — W11",
    date: "17 Mar 2024",
    type: "Weekly",
    status: "Published",
    summary: "1,110 complaints recorded vs 1,098 predicted (MAPE: 1.1%). Anomaly surge resolved in Bukit Merah after late-hour patrol. Pest pre-treatment successful in Woodlands.",
    downloadUrl: "#",
  },
  {
    id: "RPT-2024-M02",
    title: "Monthly Operations Review — February 2024",
    date: "01 Mar 2024",
    type: "Monthly",
    status: "Published",
    summary: "18.6% reduction in night renovation noise complaints vs Jan 2024. Pre-positioning strategy validated across 4 planning areas. Resource ROI: 4.2x.",
    downloadUrl: "#",
  },
  {
    id: "RPT-2024-Q4",
    title: "Q4 2023 System Performance Audit",
    date: "15 Jan 2024",
    type: "Quarterly",
    status: "Published",
    summary: "TFT model achieved 88.2% ensemble forecast accuracy. Multi-output models stable. SHAP driver attributions updated. Spatial cluster count: 14 active zones.",
    downloadUrl: "#",
  },
  {
    id: "RPT-2024-W13-DRAFT",
    title: "Weekly Complaint Intelligence Brief — W13 (Draft)",
    date: "In Progress",
    type: "Weekly",
    status: "Draft",
    summary: "Forecast generation in progress. Expected publication: Sunday 31 Mar 2024.",
    downloadUrl: "#",
  },
];

const typeColors: Record<string, { bg: string; color: string }> = {
  Weekly: { bg: "#eff6ff", color: "#1d4ed8" },
  Monthly: { bg: "#f0fdf4", color: "#166534" },
  Quarterly: { bg: "#faf5ff", color: "#7c3aed" },
};

export default function ReportsPage() {
  return (
    <div className={styles.stack}>
      <div className={styles.gridThree}>
        <div className={styles.metricCard}>
          <p>Reports Published</p>
          <strong>47</strong>
          <span className={styles.metaLabel}>Since system inception</span>
        </div>
        <div className={styles.metricCard}>
          <p>Avg. Forecast Accuracy</p>
          <strong className={styles.positive}>88.2%</strong>
          <span className={styles.metaLabel}>Across all published reports</span>
        </div>
        <div className={styles.metricCard}>
          <p>Next Report Due</p>
          <strong>31 Mar 2024</strong>
          <span className={styles.metaLabel}>W13 Weekly Brief</span>
        </div>
      </div>

      <DashboardSection
        eyebrow="Report archive"
        title="Intelligence briefs and operational reviews"
      >
        <div className={styles.timeline}>
          {reports.map((r) => (
            <div className={styles.timelineItem} key={r.id}>
              <div className={styles.timelineHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <strong>{r.title}</strong>
                  <span
                    style={{
                      background: typeColors[r.type]?.bg ?? "#f1f5f9",
                      color: typeColors[r.type]?.color ?? "#475569",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                    }}
                  >
                    {r.type}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: r.status === "Draft" ? "#d97706" : "#22c55e",
                  }}
                >
                  {r.status}
                </span>
              </div>
              <span className={styles.timeLabel}>{r.id} · {r.date}</span>
              <p className={styles.actionDetail}>{r.summary}</p>
              <div className={styles.logicNode}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>{r.status === "Draft" ? "Draft — not yet available for download" : "Download PDF Report"}</span>
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>

      <div className={styles.gridTwo}>
        <DashboardSection eyebrow="Report cadence" title="Publication schedule">
          <div className={styles.listCard}>
            <ul className={styles.list}>
              <li><strong>Weekly Briefs:</strong> Every Sunday by 08:00 — covered Mon–Sun complaint data.</li>
              <li><strong>Monthly Reviews:</strong> 1st of each month — includes patrol ROI, deterrence stats.</li>
              <li><strong>Quarterly Audits:</strong> Model accuracy, SHAP drift, cluster validation.</li>
              <li><strong>Ad-hoc Reports:</strong> Generated on anomaly or policy-flagged events.</li>
            </ul>
          </div>
        </DashboardSection>

        <DashboardSection eyebrow="Distribution" title="Report recipients">
          <div className={styles.listCard}>
            <ul className={styles.list}>
              <li><strong>NEA Enforcement HQ</strong> — All weekly + monthly reports</li>
              <li><strong>Town Council Ops Leads</strong> — Weekly summaries for their planning areas</li>
              <li><strong>MND Policy Team</strong> — Quarterly performance audits</li>
              <li><strong>Data Science & Tech Unit</strong> — Full model audit logs</li>
            </ul>
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}
