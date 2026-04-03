'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { MockMap } from "@/components/dashboard/MockMap";
import { MultiOutputRadarChart, AnomalyDetectionChart, SpatialPersistenceChart } from "@/components/dashboard/AnalyticsCharts";
import styles from "../dashboard.module.css";
import {
  getCurrentUserIdentity,
  getInterventions,
  getRiskAlerts,
  getUserPreferences,
  subscribeToInterventions,
  subscribeToRiskAlerts,
  subscribeToUserPreferences,
  updateUserPreferences,
} from "@/lib/supabase";

type DeploymentMode = "proactive" | "standard" | "reactive";

const deploymentModes: Array<{ key: DeploymentMode; label: string; hint?: string }> = [
  { key: "proactive", label: "Proactive", hint: "High" },
  { key: "standard", label: "Standard" },
  { key: "reactive", label: "Reactive" },
];

export default function ForecastsPage() {
  const [deploymentMode, setDeploymentMode] = useState<DeploymentMode>("proactive");
  const [isSavingMode, setIsSavingMode] = useState(false);
  const [forecastRows, setForecastRows] = useState<string[][]>([]);
  const [modelData, setModelData] = useState<any[]>([]);
  const [anomalyData, setAnomalyData] = useState<any[]>([]);
  const [clusterData, setClusterData] = useState<any[]>([]);
  const [simulatorMetrics, setSimulatorMetrics] = useState<Record<DeploymentMode, { suppression: string; manHours: string; impactNote: string }>>({
    proactive: { suppression: "-0%", manHours: "0h/wk", impactNote: "Waiting for live signals." },
    standard: { suppression: "-0%", manHours: "0h/wk", impactNote: "Waiting for live signals." },
    reactive: { suppression: "-0%", manHours: "0h/wk", impactNote: "Waiting for live signals." },
  });
  const [summaryMetrics, setSummaryMetrics] = useState([
    { label: "Global model confidence", value: "0%", sub: "Latest model output" },
    { label: "Training Data Horizon", value: "Live", sub: "Current runtime signals loaded" },
    { label: "Active Clusters", value: "0", sub: "High-persistence hotspots" },
  ]);
  const [scenarioBadge, setScenarioBadge] = useState("Live forecast posture");

  useEffect(() => {
    async function loadDeploymentMode() {
      const identity = await getCurrentUserIdentity();
      const preferences = await getUserPreferences(identity.id);
      const savedMode = preferences?.notification_settings?.forecastDeploymentMode as DeploymentMode | undefined;

      if (savedMode && deploymentModes.some((mode) => mode.key === savedMode)) {
        setDeploymentMode(savedMode);
      }
    }

    void loadDeploymentMode();

    const subscription = subscribeToUserPreferences(() => {
      void loadDeploymentMode();
    });
    const alertSubscription = subscribeToRiskAlerts(() => {
      void loadForecastData();
    });
    const interventionSubscription = subscribeToInterventions(() => {
      void loadForecastData();
    });

    async function loadForecastData() {
      const [alerts, interventions] = await Promise.all([
        getRiskAlerts(),
        getInterventions(),
      ]);

      const predictionResponse = await fetch("/api/model/predictions").catch(() => null);
      const predictions = predictionResponse && predictionResponse.ok ? ((await predictionResponse.json()).predictions || []) : [];

      const byArea = alerts.reduce((acc: Record<string, any[]>, alert: any) => {
        acc[alert.location] = acc[alert.location] || [];
        acc[alert.location].push(alert);
        return acc;
      }, {});

      const openAlerts = alerts.filter((item: any) => item.status !== "resolved").length;
      const activeInterventions = interventions.filter((item: any) => item.outcome !== "Completed").length;

      setForecastRows(
        predictions.slice(0, 6).map((prediction: any) => {
          const areaAlerts = byArea[prediction.area] || [];
          const topAlert = areaAlerts.sort((a: any, b: any) => Number(b.risk_score || 0) - Number(a.risk_score || 0))[0];
          const intervention = interventions.find((item: any) => item.location === prediction.area && item.outcome !== "Completed");
          return [
            prediction.area,
            topAlert ? `${topAlert.risk_score}/100` : "No live alert",
            `${Math.round(Number(prediction.predicted_score || 0))}/100`,
            intervention
              ? `Continue ${intervention.intervention_type.replace(/_/g, " ")} and log outcome`
              : prediction.recommended_action || "Open proactive inspection workflow",
          ];
        }),
      );

      setModelData([
        {
          subject: "Predicted Clusters",
          noise: Math.min(100, predictions.filter((item: any) => Number(item.predicted_score || 0) >= 60).length * 16),
          dumping: Math.min(100, predictions.filter((item: any) => Number(item.predicted_score || 0) >= 75).length * 20),
          pest: Math.min(100, predictions.filter((item: any) => Number(item.confidence || 0) >= 0.75).length * 18),
        },
        {
          subject: "Open Alerts",
          noise: Math.min(100, openAlerts * 10),
          dumping: Math.min(100, alerts.filter((item: any) => ["High", "Critical"].includes(item.risk_level)).length * 12),
          pest: Math.min(100, alerts.filter((item: any) => item.status === "acknowledged").length * 14),
        },
        {
          subject: "Field Coverage",
          noise: Math.min(100, activeInterventions * 14),
          dumping: Math.min(100, interventions.filter((item: any) => item.outcome === "Completed").length * 16),
          pest: Math.min(100, new Set(interventions.map((item: any) => item.location)).size * 18),
        },
      ]);

      setAnomalyData(
        alerts.slice(0, 8).map((alert: any, index: number) => ({
          time: new Date(alert.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || `T${index + 1}`,
          value: Number(alert.risk_score || 0),
          isAnomaly: Number(alert.risk_score || 0) >= 80,
        })),
      );

      setClusterData(
        predictions.map((prediction: any) => ({
          region: prediction.area,
          persistence: Math.min(100, Math.round(Number(prediction.predicted_score || 0))),
          seasonality: Math.max(25, Math.round(Number(prediction.confidence || 0.65) * 100)),
          count: Math.max(20, Math.round((byArea[prediction.area]?.filter((item: any) => item.status !== "resolved").length || 1) * 18)),
        })),
      );

      const avgConfidence = predictions.length
        ? Math.round(predictions.reduce((sum: number, item: any) => sum + Number(item.confidence || 0.65), 0) / predictions.length * 100)
        : 0;
      const activePredictions = predictions.filter((item: any) => Number(item.predicted_score || 0) >= 60).length;
      setSimulatorMetrics({
        proactive: {
          suppression: `${activePredictions} clusters pre-staged`,
          manHours: `${Math.max(180, activePredictions * 42 + activeInterventions * 18)}h/wk`,
          impactNote: `${activePredictions} predicted hotspots and ${activeInterventions} live workflows justify pre-staged deployments before the next risk spike.`,
        },
        standard: {
          suppression: `${Math.max(activePredictions - 1, 1)} leading zones staffed`,
          manHours: `${Math.max(140, activePredictions * 30 + activeInterventions * 14)}h/wk`,
          impactNote: `Balanced staging focuses on ${Math.max(activePredictions - 1, 1)} leading clusters while keeping reserve capacity available.`,
        },
        reactive: {
          suppression: `${activeInterventions} active responses only`,
          manHours: `${Math.max(90, activeInterventions * 20 + 80)}h/wk`,
          impactNote: `Reactive posture follows current incident pressure and may trail ${activePredictions} predicted hotspots.`,
        },
      });
      setScenarioBadge(
        `${activePredictions} predicted clusters · ${openAlerts} open alerts · ${activeInterventions} active interventions`,
      );
      setSummaryMetrics([
        { label: "Global model confidence", value: `${avgConfidence}%`, sub: "Latest model output" },
        { label: "Training Data Horizon", value: `${Math.max(alerts.length, predictions.length)} live signals`, sub: "Current runtime signals loaded" },
        { label: "Active Clusters", value: String(predictions.filter((item: any) => Number(item.predicted_score || 0) >= 60).length), sub: "High-persistence hotspots" },
      ]);
    }

    void loadForecastData();

    return () => {
      subscription.unsubscribe();
      alertSubscription.unsubscribe();
      interventionSubscription.unsubscribe();
    };
  }, []);

  const handleModeChange = async (mode: DeploymentMode) => {
    setDeploymentMode(mode);
    setIsSavingMode(true);

    try {
      const identity = await getCurrentUserIdentity();
      const existingPreferences = await getUserPreferences(identity.id);

      await updateUserPreferences(identity.id, {
        dashboard_theme: existingPreferences?.dashboard_theme || "light",
        notification_settings: {
          ...(existingPreferences?.notification_settings || {}),
          forecastDeploymentMode: mode,
        },
        alert_filter_components: existingPreferences?.alert_filter_components || [],
        alert_filter_locations: existingPreferences?.alert_filter_locations || [],
        sidebar_collapsed: existingPreferences?.sidebar_collapsed || false,
        language: existingPreferences?.language || "en",
      });
    } finally {
      setIsSavingMode(false);
    }
  };

  const activeScenario = simulatorMetrics[deploymentMode];

  return (
    <div className={styles.stack}>
      <MockMap title="Projected Workplace Injury Risks - W12 to W14 (Module C1-C4)" mapContext="forecast" />

      <DashboardSection
        eyebrow="Forecast breakdown"
        title="Weekly construction safety projections and risk mitigation"
      >
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Project Area</th>
                <th>Observed Live Risk</th>
                <th>Predicted Risk</th>
                <th>Recommended WSH Action</th>
              </tr>
            </thead>
            <tbody>
              {forecastRows.map((row, rowIndex) => (
                <tr key={row[0]}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${rowIndex}-${cellIndex}-${cell}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardSection>

      <div className={styles.gridTwo}>
        <DashboardSection
          eyebrow="Scenario planning"
          title="Inspector deployment impact simulator"
        >
          <div className={styles.simulatorCard}>
            <div className={styles.simControl}>
              <span className={styles.metaLabel}>
                Deployment Level {isSavingMode ? "· syncing..." : "· live"}
              </span>
              <div className={styles.simToggle}>
                {deploymentModes.map((mode) => {
                  const isActive = mode.key === deploymentMode;
                  return (
                    <button
                      key={mode.key}
                      type="button"
                      className={isActive ? styles.simToggleActive : styles.simToggleQuiet}
                      aria-pressed={isActive}
                      onClick={() => void handleModeChange(mode.key)}
                    >
                      <span className={styles.simToggleLabel}>
                        {mode.label}
                        {mode.hint ? <span className={styles.simToggleHint}>{mode.hint}</span> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className={styles.simResult}>
              <div className={styles.simMetric}>
                <p>Cluster Staging Scope</p>
                <strong className={styles.positive}>{activeScenario.suppression}</strong>
              </div>
              <div className={styles.simMetric}>
                <p>Allocated Man-Hours</p>
                <strong>{activeScenario.manHours}</strong>
              </div>
            </div>
            <p className={styles.metaText} style={{ marginTop: "20px" }}>
              {activeScenario.impactNote}
            </p>
            <p className={styles.metaText} style={{ marginTop: "8px" }}>
              {scenarioBadge}
            </p>
          </div>
        </DashboardSection>
      </div>

      <div className={styles.gridTwo}>
        <DashboardSection
          eyebrow="Live forecast composition"
          title="Prediction pressure, alert load, and field coverage"
        >
          <div className={styles.chartCard}>
            <MultiOutputRadarChart data={modelData} />
            <div className={styles.metaText}>
              Radar axes now reflect the current prediction load, open alert pressure, and field workflow coverage.
            </div>
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Intelligence signals"
          title="Anomaly Detection & Real-time Flags"
        >
          <div className={styles.chartCard} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <AnomalyDetectionChart data={anomalyData} />
            <div className={styles.anomalyBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              <span>{anomalyData.find((item) => item.isAnomaly)?.time ? `Urgent: ${forecastRows[0]?.[0] || "a live zone"} is spiking around ${anomalyData.find((item) => item.isAnomaly)?.time}` : "No active anomaly spikes in the latest cycle."}</span>
            </div>
          </div>
        </DashboardSection>
      </div>

      <DashboardSection
        eyebrow="Spatial Intelligence"
        title="Spatial Clustering: Persistence vs Seasonality"
      >
        <div className={styles.chartCard}>
          <SpatialPersistenceChart data={clusterData} />
          <div className={styles.metaText}>
            Cluster positions now blend generated model predictions with live area alert volume.
          </div>
        </div>
      </DashboardSection>

      <div className={styles.gridThree}>
        {summaryMetrics.map((metric) => (
          <div className={styles.metricCard} key={metric.label}>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
            <span className={styles.metaLabel}>{metric.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
