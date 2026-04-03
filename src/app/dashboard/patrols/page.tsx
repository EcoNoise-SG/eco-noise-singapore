'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { MockMap } from "@/components/dashboard/MockMap";
import styles from "../dashboard.module.css";
import { getInterventions, subscribeToInterventions } from "@/lib/supabase";

export default function PatrolsPage() {
  const [patrols, setPatrols] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    patrols: 0,
    completed: 0,
    teamSize: "0.0 officers",
  });
  const [dispatchTable, setDispatchTable] = useState<any[]>([]);
  const [liveNarrative, setLiveNarrative] = useState<string[]>([]);

  useEffect(() => {
    async function loadPatrols() {
      const interventions = await getInterventions();
      const patrolLike = interventions.filter((item: any) =>
        ["WSH_Inspection", "Health_Screening", "Cooling_Measures", "Contractor_Audit"].includes(item.intervention_type),
      );

      setPatrols(patrolLike);
      const averageTeam = patrolLike.length
        ? (
            patrolLike.reduce(
              (sum: number, item: any) => sum + ((item.team_members as any[])?.length || 1),
              0,
            ) / patrolLike.length
          ).toFixed(1)
        : "0.0";
      setMetrics({
        patrols: patrolLike.length,
        completed: patrolLike.filter((item: any) => item.outcome === "Completed").length,
        teamSize: `${averageTeam} officers`,
      });
      setDispatchTable(
        patrolLike.slice(0, 6).map((item: any) => ({
          id: item.intervention_id,
          area: item.location,
          workflow: item.intervention_type.replace(/_/g, " "),
          status: item.outcome || "In Progress",
          officers: ((item.team_members as any[])?.length || 1),
          started: new Date(item.start_time).toLocaleString(),
        })),
      );
      setLiveNarrative([
        `${patrolLike.filter((item: any) => item.outcome !== "Completed").length} patrol-like workflows are still active in the field.`,
        `${new Set(patrolLike.map((item: any) => item.location)).size} planning areas currently have staged patrol coverage.`,
        `${patrolLike.filter((item: any) => item.intervention_type === "WSH_Inspection").length} inspections are acting as patrol dispatch equivalents right now.`,
      ]);
    }

    void loadPatrols();
    const subscription = subscribeToInterventions(() => {
      void loadPatrols();
    });
    return () => subscription.unsubscribe();
  }, []);

  const weeklyStats = patrols.reduce((acc: Record<string, { patrols: number; value: number }>, item: any) => {
    const area = item.location || "Unknown";
    acc[area] = acc[area] || { patrols: 0, value: 0 };
    acc[area].patrols += 1;
    acc[area].value = Math.min(100, acc[area].value + (item.outcome === "Completed" ? 30 : 18));
    return acc;
  }, {});

  return (
    <div className={styles.stack}>
      <MockMap title="Active patrol staging zones — live operations" mapContext="patrol" />

      <div className={styles.gridThree}>
        <div className={styles.metricCard}>
          <p>Patrol Workflows This Week</p>
          <strong>{metrics.patrols}</strong>
          <span className={styles.metaLabel}>Live intervention workflows currently acting as patrol coverage</span>
        </div>
        <div className={styles.metricCard}>
          <p>Completed Outcomes</p>
          <strong className={styles.positive}>{metrics.completed}</strong>
          <span className={styles.metaLabel}>Based on recorded intervention outcomes</span>
        </div>
        <div className={styles.metricCard}>
          <p>Average Team Size</p>
          <strong>{metrics.teamSize}</strong>
          <span className={styles.metaLabel}>Derived from intervention team_members</span>
        </div>
      </div>

      <DashboardSection eyebrow="Patrol dispatch" title="Live patrol-equivalent field missions">
        <div className={styles.timeline}>
          {patrols.map((patrol: any) => (
            <div className={styles.timelineItem} key={patrol.intervention_id}>
              <div className={styles.timelineHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <strong>{patrol.intervention_type.replace(/_/g, " ")} — {patrol.location}</strong>
                  <span style={{ color: patrol.outcome === "Completed" ? "#166534" : "#2563eb", fontWeight: 700 }}>
                    {(patrol.outcome || "In Progress").toUpperCase()}
                  </span>
                </div>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{patrol.intervention_id}</span>
              </div>
              <span className={styles.timeLabel}>
                {new Date(patrol.start_time).toLocaleString()} · {(patrol.team_members || []).join(", ") || patrol.assigned_to}
              </span>
              <p className={styles.actionDetail}>
                <strong>Objective:</strong> {typeof patrol.objectives === "string" ? patrol.objectives : JSON.stringify(patrol.objectives || {})}
              </p>
              <div className={styles.logicNode}>
                <span>
                  Outcome: {patrol.outcome || "In Progress"}{patrol.findings ? ` · ${typeof patrol.findings === "string" ? patrol.findings : JSON.stringify(patrol.findings)}` : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>

      <DashboardSection eyebrow="Weekly impact" title="Patrol effectiveness by planning area">
        <div className={styles.listCard}>
          <div className={styles.bars}>
            {Object.entries(weeklyStats).map(([area, stat]) => (
              <div className={styles.barRow} key={area}>
                <span>{area}</span>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${stat.value}%` } as React.CSSProperties} />
                </div>
                <span>{stat.patrols} patrols</span>
              </div>
            ))}
          </div>
          <div className={styles.metaText} style={{ marginTop: "16px" }}>
            {liveNarrative.join(" ")}
          </div>
        </div>
      </DashboardSection>

      <DashboardSection eyebrow="Dispatch table" title="Live patrol-equivalent deployment records">
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Area</th>
                <th>Workflow</th>
                <th>Status</th>
                <th>Assigned</th>
                <th>Started</th>
              </tr>
            </thead>
            <tbody>
              {dispatchTable.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.area}</td>
                  <td>{row.workflow}</td>
                  <td>{row.status}</td>
                  <td>{row.officers} officers</td>
                  <td>{row.started}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardSection>
    </div>
  );
}
