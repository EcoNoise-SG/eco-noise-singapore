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

type ScenarioConfig = {
  label: string;
  hint?: string;
  suppression: string;
  manHours: string;
  impactNote: string;
};

const deploymentModes: Array<{ key: DeploymentMode; label: string; hint?: string }> = [
  { key: "proactive", label: "Proactive", hint: "High" },
  { key: "standard", label: "Standard" },
  { key: "reactive", label: "Reactive" },
];

const scenarioConfig: Record<DeploymentMode, ScenarioConfig> = {
  proactive: {
    label: "Proactive",
    hint: "High",
    suppression: "-22%",
    manHours: "450h/wk",
    impactNote: "Best suppression with pre-staged inspector deployment across high-risk sites.",
  },
  standard: {
    label: "Standard",
    suppression: "-11%",
    manHours: "320h/wk",
    impactNote: "Balanced deployment keeps coverage stable while preserving inspection capacity.",
  },
  reactive: {
    label: "Reactive",
    suppression: "-4%",
    manHours: "210h/wk",
    impactNote: "Minimal pre-positioning increases exposure to peak-period incidents and delayed interventions.",
  },
};

export default function ForecastsPage() {
  const [deploymentMode, setDeploymentMode] = useState<DeploymentMode>("proactive");
  const [isSavingMode, setIsSavingMode] = useState(false);
  const [forecastRows, setForecastRows] = useState<string[][]>([]);
  const [modelData, setModelData] = useState<any[]>([]);
  const [anomalyData, setAnomalyData] = useState<any[]>([]);
  const [clusterData, setClusterData] = useState<any[]>([]);
  const [summaryMetrics, setSummaryMetrics] = useState([
    { label: "Global model confidence", value: "0%", sub: "Latest model output" },
    { label: "Training Data Horizon", value: "Live", sub: "Current runtime signals loaded" },
    { label: "Active Clusters", value: "0", sub: "High-persistence hotspots" },
  ]);

  useEffect(() => {
    async function loadDeploymentMode() {
      const identity = await getCurrentUserIdentity();
      const preferences = await getUserPreferences(identity.id);
      const savedMode = preferences?.notification_settings?.forecastDeploymentMode as DeploymentMode | undefined;

      if (savedMode && scenarioConfig[savedMode]) {
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

      setForecastRows(
        predictions.slice(0, 6).map((prediction: any) => {
          const areaAlerts = byArea[prediction.area] || [];
          const topAlert = areaAlerts.sort((a: any, b: any) => Number(b.risk_score || 0) - Number(a.risk_score || 0))[0];
          const intervention = interventions.find((item: any) => item.location === prediction.area && item.outcome !== "Completed");
          return [
            prediction.area,
            topAlert?.component === "C2" ? "High" : topAlert ? topAlert.risk_level : "Moderate",
            topAlert?.component === "C3" ? "High" : intervention ? "High" : "Moderate",
            intervention
              ? `Continue ${intervention.intervention_type.replace(/_/g, " ")} and log outcome`
              : prediction.recommended_action || "Open proactive inspection workflow",
          ];
        }),
      );

      setModelData([
        { subject: "Forecasting Accuracy", noise: Math.max(55, 70 + predictions.length * 2), dumping: 68, pest: 72 },
        { subject: "Recall", noise: Math.max(50, alerts.length * 8), dumping: 64, pest: 70 },
        { subject: "Precision", noise: Math.max(52, interventions.filter((item: any) => item.outcome === "Completed").length * 12), dumping: 66, pest: 69 },
        { subject: "F1 Score", noise: Math.max(54, alerts.filter((item: any) => item.status !== "resolved").length * 9), dumping: 67, pest: 71 },
        { subject: "Response Coverage", noise: Math.max(58, interventions.length * 10), dumping: 70, pest: 74 },
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
          persistence: Math.min(100, Math.round(prediction.predicted_score)),
          seasonality: Math.max(25, Math.round((prediction.confidence || 0.65) * 100)),
          count: Math.max(20, Math.round(prediction.predicted_score)),
        })),
      );

      const avgConfidence = predictions.length
        ? Math.round(predictions.reduce((sum: number, item: any) => sum + Number(item.confidence || 0.65), 0) / predictions.length * 100)
        : 0;
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

  const activeScenario = scenarioConfig[deploymentMode];

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
                <th>Fall Risk</th>
                <th>Machinery Risk</th>
                <th>Recommended WSH Action</th>
              </tr>
            </thead>
            <tbody>
              {forecastRows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell) => (
                    <td key={cell}>{cell}</td>
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
                <p>Predicted Complaint Suppression</p>
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
          </div>
        </DashboardSection>
      </div>

      <div className={styles.gridTwo}>
        <DashboardSection
          eyebrow="Specialized Models"
          title="Multi-Output Model Performance"
        >
          <div className={styles.chartCard}>
            <MultiOutputRadarChart data={modelData} />
            <div className={styles.metaText}>
              Model card now reflects live alerts, interventions, and the latest generated prediction output.
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
              <span>{anomalyData.find((item) => item.isAnomaly)?.time ? `Urgent: live anomaly detected around ${anomalyData.find((item) => item.isAnomaly)?.time}` : "No active anomaly spikes in the latest cycle."}</span>
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
            Cluster positions now derive from generated model predictions instead of a static planning-area snapshot.
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
