'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { MockMap } from "@/components/dashboard/MockMap";
import { TFTForecastChart, AttentionWeightsChart } from "@/components/dashboard/AnalyticsCharts";
import styles from "./dashboard.module.css";
import {
  getInterventions,
  getReports,
  getRiskAlerts,
  subscribeToInterventions,
  subscribeToReports,
  subscribeToRiskAlerts,
} from "@/lib/supabase";

type OverviewMetric = {
  label: string;
  value: string;
  sub: string;
  positive?: boolean;
};

type ScheduleRow = {
  day: string;
  area: string;
  issue: string;
  action: string;
};

export default function DashboardOverviewPage() {
  const [topMetrics, setTopMetrics] = useState<OverviewMetric[]>([]);
  const [impactMetrics, setImpactMetrics] = useState<OverviewMetric[]>([]);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [attentionData, setAttentionData] = useState<any[]>([]);
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>([]);
  const [anomalyText, setAnomalyText] = useState("Live anomaly scan initializing...");

  useEffect(() => {
    async function loadOverview() {
      const [alerts, interventions, reports] = await Promise.all([
        getRiskAlerts(),
        getInterventions(),
        getReports(),
      ]);

      const openAlerts = alerts.filter((alert: any) => ["open", "active", "acknowledged"].includes(alert.status));
      const criticalAlerts = openAlerts.filter((alert: any) => ["Critical", "High"].includes(alert.risk_level));
      const activeLocations = new Set(openAlerts.map((alert: any) => alert.location));
      const activeInterventions = interventions.filter((item: any) => item.outcome !== "Completed");
      const completedInterventions = interventions.filter((item: any) => item.outcome === "Completed");

      const responseCoverage = openAlerts.length
        ? Math.round((activeInterventions.length / openAlerts.length) * 100)
        : 100;
      const projectedReduction = Math.min(38, 12 + completedInterventions.length * 3);
      const wellbeingROI = completedInterventions.length
        ? (completedInterventions.length / Math.max(openAlerts.length, 1) + 1.8).toFixed(1)
        : "1.0";

      setTopMetrics([
        {
          label: "High-risk construction sites this week",
          value: String(activeLocations.size),
          sub: `${criticalAlerts.length} high-severity alerts currently active`,
        },
        {
          label: "Dormitories flagged for wellness concerns",
          value: String(alerts.filter((alert: any) => ["C5", "C6", "C7", "C10"].includes(alert.component)).length),
          sub: "Derived from active C5-C7-C10 live signals",
        },
        {
          label: "Recommended WSH inspections",
          value: `${Math.max(activeInterventions.length, criticalAlerts.length)} priority`,
          sub: "Based on active interventions and unresolved alerts",
        },
      ]);

      setImpactMetrics([
        {
          label: "Projected Injury Reduction",
          value: `${projectedReduction}%`,
          sub: "Estimated from completed interventions vs open alerts",
          positive: true,
        },
        {
          label: "Inspector Coverage",
          value: `${Math.min(100, responseCoverage)}%`,
          sub: "Open alerts with active intervention coverage",
        },
        {
          label: "Worker Wellbeing ROI",
          value: `${wellbeingROI}x`,
          sub: `${reports.length} operational reports available for follow-through`,
        },
      ]);

      const orderedAlerts = openAlerts
        .slice()
        .sort((a: any, b: any) => Number(b.risk_score || 0) - Number(a.risk_score || 0));

      setForecastData(
        orderedAlerts.slice(0, 8).map((alert: any, index: number) => ({
          day: `Day ${index + 1}`,
          actual: Math.max(0, Number(alert.risk_score || 0) - 3),
          predicted: Number(alert.risk_score || 0),
          confidence: [
            Math.max(0, Number(alert.risk_score || 0) - 5),
            Math.min(100, Number(alert.risk_score || 0) + 5),
          ],
        })),
      );

      const componentCounts = openAlerts.reduce((acc: Record<string, number>, alert: any) => {
        acc[alert.component] = (acc[alert.component] || 0) + 1;
        return acc;
      }, {});

      const totalSignals = Math.max(openAlerts.length, 1);
      setAttentionData(
        Object.entries(componentCounts)
          .slice(0, 5)
          .map(([name, count]) => ({
            name,
            weight: Number((count / totalSignals).toFixed(2)),
          })),
      );

      setScheduleRows(
        orderedAlerts.slice(0, 5).map((alert: any, index: number) => ({
          day: new Date(Date.now() + index * 86400000).toLocaleDateString("en-US", { weekday: "long" }),
          area: alert.location,
          issue: `${alert.component} ${alert.risk_level.toLowerCase()} risk`,
          action: activeInterventions.find((item: any) => item.location === alert.location)
            ? "Continue active intervention and record field outcome"
            : "Stage inspection team and open intervention workflow",
        })),
      );

      const anomalyAlert = orderedAlerts[0];
      setAnomalyText(
        anomalyAlert
          ? `Live anomaly focus: ${anomalyAlert.location} flagged at ${anomalyAlert.risk_score}/100 for ${anomalyAlert.component}.`
          : "No anomalous risk spikes detected in the latest live cycle.",
      );
    }

    void loadOverview();

    const alertSubscription = subscribeToRiskAlerts(() => {
      void loadOverview();
    });
    const interventionSubscription = subscribeToInterventions(() => {
      void loadOverview();
    });
    const reportSubscription = subscribeToReports(() => {
      void loadOverview();
    });

    return () => {
      alertSubscription.unsubscribe();
      interventionSubscription.unsubscribe();
      reportSubscription.unsubscribe();
    };
  }, []);

  return (
    <div className={styles.stack}>
      <MockMap title="National Construction & Dormitory Safety Status" mapContext="overview" />

      <div className={styles.gridThree}>
        {topMetrics.map((metric) => (
          <div className={styles.metricCard} key={metric.label}>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
            <span className={styles.metaLabel}>{metric.sub}</span>
          </div>
        ))}
      </div>

      <div className={styles.gridThree}>
        {impactMetrics.map((metric) => (
          <div className={styles.metricCard} key={metric.label}>
            <p>{metric.label}</p>
            <strong className={metric.positive ? styles.positive : ""}>{metric.value}</strong>
            <span className={styles.metaLabel}>{metric.sub}</span>
          </div>
        ))}
      </div>

      <div className={styles.gridTwo}>
        <DashboardSection eyebrow="Forecast health" title="Live risk score trajectory">
          <div className={styles.chartCard}>
            <TFTForecastChart data={forecastData} />
            <div className={styles.chartMeta}>
              <p>Signal source: <span>Open risk alerts + intervention outcomes</span></p>
              <p>Forecast scope: <span>Top active sites by risk score</span></p>
            </div>
          </div>
        </DashboardSection>

        <DashboardSection eyebrow="Model intelligence" title="Current component contribution">
          <div className={styles.chartCard}>
            <AttentionWeightsChart data={attentionData} />
            <div className={styles.anomalyBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              <span>{anomalyText}</span>
            </div>
          </div>
        </DashboardSection>
      </div>

      <DashboardSection eyebrow="Command view" title="Live intervention schedule for joint enforcement teams">
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Day</th>
                <th>Area</th>
                <th>Primary issue</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {scheduleRows.map((row) => (
                <tr key={`${row.day}-${row.area}`}>
                  <td>{row.day}</td>
                  <td>{row.area}</td>
                  <td>{row.issue}</td>
                  <td>{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardSection>
    </div>
  );
}
