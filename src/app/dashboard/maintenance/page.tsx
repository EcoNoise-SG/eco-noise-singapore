'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import styles from "../dashboard.module.css";
import { fetchNEAWeather } from "@/lib/datagovsg";
import { getInterventions, getRiskAlerts, subscribeToInterventions, subscribeToRiskAlerts } from "@/lib/supabase";

export default function MaintenancePage() {
  const [summary, setSummary] = useState({
    monitored: 0,
    highRisk: 0,
    avgHeat: "0C",
  });
  const [areas, setAreas] = useState<Array<{ area: string; heatScore: number }>>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [postureNotes, setPostureNotes] = useState<string[]>([]);
  const [slaNotes, setSlaNotes] = useState<string[]>([]);

  useEffect(() => {
    async function loadMaintenance() {
      const [weather, alerts, interventions] = await Promise.all([
        fetchNEAWeather(),
        getRiskAlerts(),
        getInterventions(),
      ]);

      const weatherRecord = (weather?.records?.[0] || {}) as Record<string, number | string | undefined>;
      const baselineTemp = Number(weatherRecord.air_temperature || 30);
      const heatAlerts = alerts.filter((alert: any) => ["C5", "C6", "C7"].includes(alert.component));
      const healthInterventions = interventions.filter((item: any) =>
        ["Health_Screening", "Cooling_Measures", "Ventilation_Audit"].includes(item.intervention_type),
      );
      const activeHealthInterventions = healthInterventions.filter((item: any) => item.outcome !== "Completed");
      const interventionAgeBuckets = activeHealthInterventions.reduce(
        (acc: { under4h: number; sameShift: number; overShift: number }, item: any) => {
          const ageHours = Math.max(0, (Date.now() - new Date(item.start_time).getTime()) / 36e5);
          if (ageHours <= 4) acc.under4h += 1;
          else if (ageHours <= 12) acc.sameShift += 1;
          else acc.overShift += 1;
          return acc;
        },
        { under4h: 0, sameShift: 0, overShift: 0 },
      );

      const byArea = heatAlerts.reduce((acc: Record<string, number>, alert: any) => {
        acc[alert.location] = Math.max(acc[alert.location] || 0, Number(alert.risk_score || 0));
        return acc;
      }, {});

      const liveAreas = Object.entries(byArea)
        .map(([area, heatScore]) => ({ area, heatScore }))
        .sort((a, b) => b.heatScore - a.heatScore);

      setSummary({
        monitored: liveAreas.length,
        highRisk: liveAreas.filter((item) => item.heatScore >= 70).length,
        avgHeat: `${baselineTemp.toFixed(1)}C`,
      });
      setAreas(liveAreas);
      setTasks(
        healthInterventions.slice(0, 6).map((item: any) => ({
          id: item.intervention_id,
          area: item.location,
          issue: typeof item.objectives === "string" ? item.objectives : JSON.stringify(item.objectives || {}),
          priority: item.outcome === "Completed" ? "Low" : "High",
          status: item.outcome || "In Progress",
          date: new Date(item.start_time).toLocaleDateString(),
        })),
      );
      const completedSameDay = healthInterventions.filter((item: any) => {
        if (item.outcome !== "Completed" || !item.end_time) return false;
        return new Date(item.end_time).toDateString() === new Date(item.start_time).toDateString();
      }).length;
      setPostureNotes([
        `${activeHealthInterventions.filter((item: any) => item.intervention_type === "Cooling_Measures").length} cooling workflows are open in the current live queue.`,
        `${activeHealthInterventions.filter((item: any) => item.intervention_type === "Health_Screening").length} health screening deployments are tied to present dormitory-linked signals.`,
        `${heatAlerts.filter((alert: any) => Number(alert.risk_score || 0) >= 75).length} locations are sitting above the elevated heat threshold right now.`,
        `Coverage updates will change as ${activeHealthInterventions.length} live interventions move through outcome logging.`,
      ]);
      setSlaNotes([
        `${interventionAgeBuckets.under4h} open welfare interventions were created within the last 4 hours.`,
        `${interventionAgeBuckets.sameShift} active cases are still within the same-shift response window.`,
        `${interventionAgeBuckets.overShift} open cases have run beyond a single shift and need escalation review.`,
        `${completedSameDay} completed interventions were closed within the same calendar day.`,
      ]);
    }

    void loadMaintenance();
    const alertSubscription = subscribeToRiskAlerts(() => {
      void loadMaintenance();
    });
    const interventionSubscription = subscribeToInterventions(() => {
      void loadMaintenance();
    });

    return () => {
      alertSubscription.unsubscribe();
      interventionSubscription.unsubscribe();
    };
  }, []);

  return (
    <div className={styles.stack}>
      <div className={styles.gridThree}>
        <div className={styles.metricCard}>
          <p>Dormitories Monitored</p>
          <strong className={styles.positive}>{summary.monitored}</strong>
          <span className={styles.metaLabel}>Areas with live wellness or heat signals</span>
        </div>
        <div className={styles.metricCard}>
          <p>High Heat Stress Risk</p>
          <strong style={{ color: "#f59e0b" }}>{summary.highRisk}</strong>
          <span className={styles.metaLabel}>Live C5-C7 signals above threshold</span>
        </div>
        <div className={styles.metricCard}>
          <p>Avg Heat Index (C6)</p>
          <strong>{summary.avgHeat}</strong>
          <span className={styles.metaLabel}>Based on current NEA weather aggregation</span>
        </div>
      </div>

      <DashboardSection eyebrow="Heat Stress Index (C6)" title="Dormitory heat exposure by live risk score">
        <div className={styles.listCard}>
          <div className={styles.bars}>
            {areas.map((item) => (
              <div className={styles.barRow} key={item.area}>
                <span>{item.area}</span>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${item.heatScore}%` } as React.CSSProperties} />
                </div>
                <span>{item.heatScore}/100</span>
              </div>
            ))}
          </div>
        </div>
      </DashboardSection>

      <DashboardSection eyebrow="Open tickets" title="Active wellness interventions">
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Intervention ID</th>
                <th>Area</th>
                <th>Issue</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td><code style={{ fontSize: "0.8125rem" }}>{task.id}</code></td>
                  <td style={{ fontSize: "0.875rem", fontWeight: 500 }}>{task.area}</td>
                  <td style={{ fontSize: "0.8125rem", color: "#475569", maxWidth: "280px" }}>{task.issue}</td>
                  <td style={{ color: task.priority === "High" ? "#b45309" : "#475569", fontWeight: 700 }}>{task.priority}</td>
                  <td style={{ color: task.status === "Completed" ? "#22c55e" : "#2563eb", fontWeight: 700 }}>{task.status}</td>
                  <td style={{ fontSize: "0.875rem" }}>{task.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardSection>

      <div className={styles.gridTwo}>
        <DashboardSection eyebrow="Preventive schedule" title="Current operational posture">
          <div className={styles.listCard}>
            <ul className={styles.list}>
              {postureNotes.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </DashboardSection>

        <DashboardSection eyebrow="SLA compliance" title="Response benchmarks from live interventions">
          <div className={styles.listCard}>
            <ul className={styles.list}>
              {slaNotes.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}
