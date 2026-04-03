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
import { HeatStressMonitor } from "@/components/dashboard/HeatStressMonitor";
import { ComplianceMonitor } from "@/components/dashboard/ComplianceMonitor";

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
  const [openAlerts, setOpenAlerts] = useState<any[]>([]);

  useEffect(() => {
    async function loadOverview() {
      const [alerts, interventions, reports, predictionResponse] = await Promise.all([
        getRiskAlerts(),
        getInterventions(),
        getReports(),
        fetch("/api/model/predictions").catch(() => null),
      ]);
      const predictions =
        predictionResponse && predictionResponse.ok ? ((await predictionResponse.json()).predictions || []) : [];

      const openAlerts = alerts.filter((alert: any) => ["open", "active", "acknowledged"].includes(alert.status));
      const criticalAlerts = openAlerts.filter((alert: any) => ["Critical", "High"].includes(alert.risk_level));
      const activeLocations = new Set(openAlerts.map((alert: any) => alert.location));
      const activeInterventions = interventions.filter((item: any) => item.outcome !== "Completed");
      const completedInterventions = interventions.filter((item: any) => item.outcome === "Completed");
      const publishedReports = reports.filter((report: any) => report.status === "published").length;
      const avgOpenRisk = openAlerts.length
        ? Math.round(openAlerts.reduce((sum: number, alert: any) => sum + Number(alert.risk_score || 0), 0) / openAlerts.length)
        : 0;

      const responseCoverage = openAlerts.length
        ? Math.round((activeInterventions.length / openAlerts.length) * 100)
        : 100;
      const completionRate = interventions.length
        ? Math.round((completedInterventions.length / interventions.length) * 100)
        : 0;
      const reportCoverage = activeLocations.size
        ? Math.round((reports.length / activeLocations.size) * 100)
        : reports.length > 0
          ? 100
          : 0;

      setTopMetrics([
        {
          label: "Active risk zones",
          value: String(activeLocations.size),
          sub: `${criticalAlerts.length} high-severity alerts currently active`,
        },
        {
          label: "Open field workflows",
          value: String(activeInterventions.length),
          sub: `${completedInterventions.length} interventions have completed outcomes recorded`,
        },
        {
          label: "Published operational reports",
          value: String(publishedReports),
          sub: `${reports.length} total reports generated from the live workspace`,
        },
      ]);

      setImpactMetrics([
        {
          label: "Completed Outcome Rate",
          value: `${completionRate}%`,
          sub: `${completedInterventions.length} of ${interventions.length} interventions have recorded outcomes`,
          positive: true,
        },
        {
          label: "Live Alert Coverage",
          value: `${Math.min(100, responseCoverage)}%`,
          sub: "Open alerts with active intervention coverage",
        },
        {
          label: "Average Open Risk",
          value: `${avgOpenRisk}/100`,
          sub: `${Math.min(100, reportCoverage)}% report coverage across active zones`,
        },
      ]);

      const orderedAlerts = openAlerts
        .slice()
        .sort((a: any, b: any) => Number(b.risk_score || 0) - Number(a.risk_score || 0));

      setForecastData(
        (predictions.length ? predictions.slice(0, 8) : orderedAlerts.slice(0, 8)).map((item: any, index: number) => {
          const predicted = Math.round(Number(item.predicted_score ?? item.risk_score ?? 0));
          const actual = Math.round(
            orderedAlerts.find((alert: any) => alert.location === item.area || alert.location === item.location)?.risk_score
              ?? predicted,
          );
          const confidenceRadius = Math.max(4, Math.round((1 - Number(item.confidence ?? 0.8)) * 20));
          return {
            day: item.area || item.location || `Zone ${index + 1}`,
            actual,
            predicted,
            confidence: [
              Math.max(0, predicted - confidenceRadius),
              Math.min(100, predicted + confidenceRadius),
            ],
          };
        }),
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
        orderedAlerts.slice(0, 5).map((alert: any) => ({
          day: new Date(alert.created_at || Date.now()).toLocaleDateString("en-US", { weekday: "long" }),
          area: alert.location,
          issue: `${alert.component} ${alert.risk_level.toLowerCase()} risk`,
          action: activeInterventions.find((item: any) => item.location === alert.location)
            ? "Continue active intervention and record field outcome"
            : predictions.find((item: any) => item.area === alert.location)?.recommended_action || "Stage inspection team and open intervention workflow",
        })),
      );

      const anomalyAlert = orderedAlerts[0];
      setAnomalyText(
        anomalyAlert
          ? `Live anomaly focus: ${anomalyAlert.location} flagged at ${anomalyAlert.risk_score}/100 for ${anomalyAlert.component}.`
          : "No anomalous risk spikes detected in the latest live cycle.",
      );
      setOpenAlerts(openAlerts);
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

      <div className={styles.gridTwo}>
        <HeatStressMonitor />
        <ComplianceMonitor alerts={openAlerts} />
      </div>

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
