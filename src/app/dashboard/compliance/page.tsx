'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import styles from "../dashboard.module.css";
import { getContractors, getRiskAlerts, subscribeToRiskAlerts } from "@/lib/supabase";

type ContractorRecord = {
  uen: string;
  company_name: string;
  crs_status?: string;
  safety_score?: number;
  stop_work_orders?: number;
  incident_count?: number;
  last_synced?: string;
};

export default function CompliancePage() {
  const [contractors, setContractors] = useState<ContractorRecord[]>([]);
  const [stats, setStats] = useState([
    { metric: "High-Risk Contractors", value: "0", change: "Live sync pending", up: null as boolean | null },
    { metric: "CRS Certified", value: "0", change: "From contractor registry", up: true },
    { metric: "Contractor Compliance", value: "0%", change: "Derived from safety scores", up: true },
    { metric: "Active C4 Alerts", value: "0", change: "Open contractor-related alerts", up: null as boolean | null },
    { metric: "Stop Work Orders", value: "0", change: "From contractor sync records", up: false },
    { metric: "Outreach Actions", value: "0", change: "Contractors below threshold", up: null as boolean | null },
  ]);

  useEffect(() => {
    async function loadCompliance() {
      const [contractorRows, alerts] = await Promise.all([
        getContractors(),
        getRiskAlerts({ component: "C4" }),
      ]);

      const sorted = contractorRows
        .slice()
        .sort((a: any, b: any) => Number(a.safety_score || 0) - Number(b.safety_score || 0));

      const highRisk = sorted.filter((row: any) => Number(row.safety_score || 0) < 50).length;
      const certified = sorted.filter((row: any) => row.crs_status === "Certified").length;
      const avgScore = sorted.length
        ? Math.round(sorted.reduce((sum: number, row: any) => sum + Number(row.safety_score || 0), 0) / sorted.length)
        : 0;
      const stopWorkOrders = sorted.reduce((sum: number, row: any) => sum + Number(row.stop_work_orders || 0), 0);
      const outreach = sorted.filter((row: any) => Number(row.incident_count || 0) > 1 || Number(row.safety_score || 0) < 60).length;
      const activeC4Alerts = alerts.filter((alert: any) => ["open", "active", "acknowledged"].includes(alert.status)).length;

      setContractors(sorted.slice(0, 8));
      setStats([
        { metric: "High-Risk Contractors", value: String(highRisk), change: "Safety score below 50", up: false },
        { metric: "CRS Certified", value: String(certified), change: `${sorted.length} synced contractors`, up: true },
        { metric: "Contractor Compliance", value: `${avgScore}%`, change: "Average live contractor safety score", up: true },
        { metric: "Active C4 Alerts", value: String(activeC4Alerts), change: "Open contractor risk thresholds", up: null },
        { metric: "Stop Work Orders", value: String(stopWorkOrders), change: "Captured in contractor registry", up: false },
        { metric: "Outreach Actions", value: String(outreach), change: "Contractors requiring review", up: null },
      ]);
    }

    void loadCompliance();
    const subscription = subscribeToRiskAlerts(() => {
      void loadCompliance();
    });

    return () => subscription.unsubscribe();
  }, []);

  const repeatOffenders = contractors
    .filter((row) => Number(row.incident_count || 0) > 0 || Number(row.stop_work_orders || 0) > 0)
    .slice(0, 3);

  return (
    <div className={styles.stack}>
      <div className={styles.gridThree}>
        {stats.slice(0, 3).map((s) => (
          <div className={styles.metricCard} key={s.metric}>
            <p>{s.metric}</p>
            <strong className={s.up === true ? styles.positive : ""}>{s.value}</strong>
            <span className={styles.metaLabel} style={{ color: s.up === false ? "#ef4444" : "#64748b" }}>
              {s.change}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.gridThree}>
        {stats.slice(3).map((s) => (
          <div className={styles.metricCard} key={s.metric}>
            <p>{s.metric}</p>
            <strong>{s.value}</strong>
            <span className={styles.metaLabel} style={{ color: s.up === false ? "#ef4444" : "#64748b" }}>
              {s.change}
            </span>
          </div>
        ))}
      </div>

      <DashboardSection eyebrow="Module C4" title="Contractor safety track record and synced compliance view">
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>UEN</th>
                <th>Company Name</th>
                <th>Safety Score</th>
                <th>CRS Status</th>
                <th>Stop Work Orders</th>
                <th>Incident Count</th>
                <th>Last Sync</th>
              </tr>
            </thead>
            <tbody>
              {contractors.map((record) => (
                <tr key={record.uen}>
                  <td><code style={{ fontSize: "0.8125rem" }}>{record.uen}</code></td>
                  <td style={{ fontSize: "0.875rem" }}>{record.company_name}</td>
                  <td style={{ fontSize: "0.875rem", fontWeight: 700 }}>{record.safety_score || 0} / 100</td>
                  <td>
                    <span style={{ color: record.crs_status === "Certified" ? "#22c55e" : record.crs_status === "Conditional" ? "#d97706" : "#2563eb", fontWeight: 700, fontSize: "0.8125rem" }}>
                      {record.crs_status || "Unknown"}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.875rem" }}>{record.stop_work_orders || 0}</td>
                  <td style={{ fontSize: "0.875rem" }}>{record.incident_count || 0}</td>
                  <td style={{ fontSize: "0.875rem", color: "#64748b" }}>
                    {record.last_synced ? new Date(record.last_synced).toLocaleString() : "Pending sync"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardSection>

      <div className={styles.gridTwo}>
        <DashboardSection eyebrow="Regulatory framework" title="Current compliance thresholds">
          <div className={styles.listCard}>
            <ul className={styles.list}>
              <li><strong>High-risk contractor threshold:</strong> Safety score below 50 or repeated stop-work orders.</li>
              <li><strong>Enhanced monitoring:</strong> Incident count above 1 with unresolved C4 alerts.</li>
              <li><strong>Outreach priority:</strong> Conditional or provisional CRS with low live safety score.</li>
              <li><strong>Review cadence:</strong> Registry sync plus active alert follow-up.</li>
            </ul>
          </div>
        </DashboardSection>

        <DashboardSection eyebrow="Repeat offender watch" title="Live contractors requiring follow-up">
          <div className={styles.listCard}>
            <ul className={styles.list}>
              {repeatOffenders.map((record) => (
                <li key={record.uen}>
                  <strong>{record.company_name}:</strong> {record.incident_count || 0} incidents and {record.stop_work_orders || 0} stop-work orders on record.
                </li>
              ))}
            </ul>
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}
