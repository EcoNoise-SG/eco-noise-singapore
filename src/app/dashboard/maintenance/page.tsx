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
              <li><strong>Cooling measures:</strong> Derived from open heat and wellness interventions.</li>
              <li><strong>Health screenings:</strong> Triggered when live dormitory-linked risk signals stay elevated.</li>
              <li><strong>Ventilation audits:</strong> Prioritized where repeated heat or disease alerts cluster.</li>
              <li><strong>Coverage updates:</strong> Refreshed through intervention outcome logging.</li>
            </ul>
          </div>
        </DashboardSection>

        <DashboardSection eyebrow="SLA compliance" title="Response benchmarks from live interventions">
          <div className={styles.listCard}>
            <ul className={styles.list}>
              <li><strong>Critical:</strong> Areas above 80/100 should have an intervention opened immediately.</li>
              <li><strong>High:</strong> Health or cooling intervention should be active in the same shift.</li>
              <li><strong>Moderate:</strong> Monitor next cycle and escalate if signals persist.</li>
              <li><strong>Completed:</strong> Outcomes should feed back into the audit and forecasting loop.</li>
            </ul>
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}
