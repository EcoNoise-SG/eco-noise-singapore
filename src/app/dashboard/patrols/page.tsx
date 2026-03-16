import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { MockMap } from "@/components/dashboard/MockMap";
import styles from "../dashboard.module.css";

const patrols = [
  {
    id: "PAT-2024-0188",
    team: "Alpha Unit 3",
    officers: "Cpt. Ravi Kumar + 2 officers",
    area: "Jurong West — Blk 440–450 corridor",
    startTime: "Today · 17:30",
    endTime: "Today · 21:30",
    objective: "Pre-staged at renovation cluster. Key trigger: BCA permit density z-score 1.2.",
    status: "active",
    outcome: null,
  },
  {
    id: "PAT-2024-0187",
    team: "Bravo Unit 1",
    officers: "Insp. Fiona Ng + 1 officer",
    area: "Woodlands — Industrial Park N",
    startTime: "Today · 08:00",
    endTime: "Today · 12:00",
    objective: "Pest and drainage pre-inspection following rain forecast. Joint NEA/TC sweep.",
    status: "completed",
    outcome: "2 drainage nodes treated. No violations. Proactive advisory issued to 3 households.",
  },
  {
    id: "PAT-2024-0186",
    team: "Charlie Unit 2",
    officers: "Marcus Chia + 2 officers",
    area: "Bukit Merah — Nightlife Zone",
    startTime: "Tomorrow · 21:00",
    endTime: "Tomorrow · 01:00",
    objective: "Late-hour compliance monitoring. Festive weekend cluster detected in forecast.",
    status: "scheduled",
    outcome: null,
  },
  {
    id: "PAT-2024-0184",
    team: "Delta Unit 4",
    officers: "Priya Nair + 1 officer",
    area: "Tampines — Ave 9 Road Works Zone",
    startTime: "Yesterday · 09:00",
    endTime: "Yesterday · 13:00",
    objective: "Illegal dumping risk sweep near LTA works. Debris sensor flag triggered dispatch.",
    status: "completed",
    outcome: "1 summons issued. 2 advisory flyers distributed. Site cleared of debris accumulation.",
  },
];

const statusStyle: Record<string, { color: string; bg: string }> = {
  active: { color: "#166534", bg: "#f0fdf4" },
  completed: { color: "#1d4ed8", bg: "#eff6ff" },
  scheduled: { color: "#b45309", bg: "#fffbeb" },
};

const weeklyStats = [
  { area: "Jurong West", patrols: 8, deterred: 14, value: 88 },
  { area: "Woodlands", patrols: 6, deterred: 9, value: 75 },
  { area: "Tampines", patrols: 5, deterred: 7, value: 62 },
  { area: "Bukit Merah", patrols: 4, deterred: 5, value: 50 },
  { area: "Sengkang", patrols: 3, deterred: 4, value: 40 },
];

export default function PatrolsPage() {
  return (
    <div className={styles.stack}>
      <MockMap title="Active patrol staging zones — W12" />

      <div className={styles.gridThree}>
        <div className={styles.metricCard}>
          <p>Patrols This Week</p>
          <strong>26</strong>
          <span className={styles.metaLabel}>Across 5 planning areas</span>
        </div>
        <div className={styles.metricCard}>
          <p>Incidents Deterred</p>
          <strong className={styles.positive}>39</strong>
          <span className={styles.metaLabel}>Confirmed by field officers</span>
        </div>
        <div className={styles.metricCard}>
          <p>Average Team Size</p>
          <strong>2.4 officers</strong>
          <span className={styles.metaLabel}>Per patrol deployment</span>
        </div>
      </div>

      <DashboardSection eyebrow="Patrol dispatch" title="Active, scheduled, and completed patrol missions">
        <div className={styles.timeline}>
          {patrols.map((p) => (
            <div className={styles.timelineItem} key={p.id}>
              <div className={styles.timelineHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <strong>{p.team} — {p.area}</strong>
                  <span style={{
                    background: statusStyle[p.status].bg,
                    color: statusStyle[p.status].color,
                    padding: "3px 10px", borderRadius: "4px",
                    fontSize: "0.6875rem", fontWeight: 700,
                  }}>
                    {p.status.toUpperCase()}
                  </span>
                </div>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{p.id}</span>
              </div>
              <span className={styles.timeLabel}>{p.startTime} → {p.endTime} · {p.officers}</span>
              <p className={styles.actionDetail}><strong>Objective:</strong> {p.objective}</p>
              {p.outcome && (
                <div className={styles.logicNode} style={{ background: "#f0fdf4", color: "#166534" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Outcome: {p.outcome}</span>
                </div>
              )}
              {!p.outcome && (
                <div className={styles.logicNode}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>Outcome pending — patrol {p.status === "active" ? "in progress" : "not yet started"}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </DashboardSection>

      <DashboardSection eyebrow="Weekly impact" title="Patrol effectiveness by planning area">
        <div className={styles.listCard}>
          <div className={styles.bars}>
            {weeklyStats.map((s) => (
              <div className={styles.barRow} key={s.area}>
                <span>{s.area}</span>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${s.value}%` } as React.CSSProperties} />
                </div>
                <span>{s.patrols} patrols</span>
              </div>
            ))}
          </div>
          <div className={styles.metaText} style={{ marginTop: "16px" }}>
            Bar width represents the proportional patrol coverage score for each area based on predicted risk vs resources deployed.
          </div>
        </div>
      </DashboardSection>
    </div>
  );
}
