import { DashboardSection } from "@/components/dashboard/DashboardSection";
import styles from "../dashboard.module.css";

const complianceRecords = [
  { id: "ENF-2024-0441", area: "Jurong West", type: "Renovation Noise", outcome: "Warning Issued", officer: "Cpt. Ravi Kumar", date: "22 Mar 2024", followUp: "Yes — 7 day re-inspection" },
  { id: "ENF-2024-0439", area: "Woodlands", type: "Illegal Dumping", outcome: "Summons Issued", officer: "Marcus Chia", date: "21 Mar 2024", followUp: "No" },
  { id: "ENF-2024-0437", area: "Tampines", type: "Renovation Noise", outcome: "Advisory Issued", officer: "Priya Nair", date: "20 Mar 2024", followUp: "No" },
  { id: "ENF-2024-0435", area: "Bukit Merah", type: "Nightlife Noise", outcome: "Verbal Warning", officer: "Cpt. Ravi Kumar", date: "19 Mar 2024", followUp: "Yes — CCTV review" },
  { id: "ENF-2024-0430", area: "Sengkang", type: "Pest Infestation", outcome: "Treatment Administered", officer: "Marcus Chia", date: "17 Mar 2024", followUp: "Yes — 14 day check" },
  { id: "ENF-2024-0428", area: "Choa Chu Kang", type: "Illegal Dumping", outcome: "Summons Issued", officer: "Priya Nair", date: "16 Mar 2024", followUp: "No" },
];

const monthlyStats = [
  { metric: "Warnings Issued", value: "24", change: "+8 vs Feb", up: true },
  { metric: "Summons Filed", value: "7", change: "-2 vs Feb", up: false },
  { metric: "Compliance Rate", value: "91.4%", change: "+1.2% vs Feb", up: true },
  { metric: "Cases Resolved", value: "38", change: "+5 vs Feb", up: true },
  { metric: "Repeat Offenders", value: "3", change: "-1 vs Feb", up: false },
  { metric: "Active Case Files", value: "12", change: "Stable", up: null },
];

const outcomeColor: Record<string, string> = {
  "Warning Issued": "#d97706",
  "Summons Issued": "#dc2626",
  "Advisory Issued": "#2563eb",
  "Verbal Warning": "#64748b",
  "Treatment Administered": "#22c55e",
};

export default function CompliancePage() {
  return (
    <div className={styles.stack}>
      <div className={styles.gridThree}>
        {monthlyStats.slice(0, 3).map((s) => (
          <div className={styles.metricCard} key={s.metric}>
            <p>{s.metric}</p>
            <strong className={s.up === true ? styles.positive : s.up === false ? "" : ""}>{s.value}</strong>
            <span className={styles.metaLabel} style={{ color: s.up === true ? "#22c55e" : s.up === false ? "#ef4444" : "#64748b" }}>
              {s.change}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.gridThree}>
        {monthlyStats.slice(3).map((s) => (
          <div className={styles.metricCard} key={s.metric}>
            <p>{s.metric}</p>
            <strong>{s.value}</strong>
            <span className={styles.metaLabel} style={{ color: s.up === true ? "#22c55e" : s.up === false ? "#ef4444" : "#64748b" }}>
              {s.change}
            </span>
          </div>
        ))}
      </div>

      <DashboardSection eyebrow="Enforcement log" title="Recent compliance actions and case outcomes">
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Area</th>
                <th>Issue Type</th>
                <th>Outcome</th>
                <th>Officer</th>
                <th>Date</th>
                <th>Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {complianceRecords.map((r) => (
                <tr key={r.id}>
                  <td><code style={{ fontSize: "0.8125rem" }}>{r.id}</code></td>
                  <td style={{ fontSize: "0.875rem" }}>{r.area}</td>
                  <td style={{ fontSize: "0.875rem" }}>{r.type}</td>
                  <td>
                    <span style={{ color: outcomeColor[r.outcome] ?? "#475569", fontWeight: 700, fontSize: "0.8125rem" }}>
                      {r.outcome}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.875rem" }}>{r.officer}</td>
                  <td style={{ fontSize: "0.875rem", color: "#64748b" }}>{r.date}</td>
                  <td style={{ fontSize: "0.8125rem", color: r.followUp !== "No" ? "#2563eb" : "#94a3b8" }}>{r.followUp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardSection>

      <div className={styles.gridTwo}>
        <DashboardSection eyebrow="Regulatory framework" title="Key compliance thresholds">
          <div className={styles.listCard}>
            <ul className={styles.list}>
              <li><strong>Residential Noise Limit:</strong> ≤65 dBA (7am–10pm) / ≤55 dBA (10pm–7am)</li>
              <li><strong>Renovation Hours:</strong> Mon–Sat, 9am–6pm only. No Sunday/public holiday work.</li>
              <li><strong>Industrial Zone Limit:</strong> ≤75 dBA at site boundary.</li>
              <li><strong>Penalty Framework:</strong> First offence advisory, second warning, repeat summons up to S$100,000.</li>
            </ul>
          </div>
        </DashboardSection>

        <DashboardSection eyebrow="Repeat offender watch" title="High-priority monitored premises">
          <div className={styles.listCard}>
            <ul className={styles.list}>
              <li><strong>Jurong West Ave 5 — Blk 442:</strong> 3rd noise violation in 60 days. Legal review in progress.</li>
              <li><strong>Woodlands Ind. Pk E — Unit 14:</strong> 2 dumping summons. Area placed under CCTV watch.</li>
              <li><strong>Bukit Merah — Clarke Quay Adj.:</strong> Repeat nightlife noise. Letter to premises owner issued.</li>
            </ul>
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}
