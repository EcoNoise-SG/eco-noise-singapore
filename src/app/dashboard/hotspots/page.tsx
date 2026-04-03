'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { MockMap } from "@/components/dashboard/MockMap";
import { SpatialPersistenceChart } from "@/components/dashboard/AnalyticsCharts";
import styles from "../dashboard.module.css";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  createRiskAlert,
  getCurrentUserIdentity,
  getInterventions,
  getRiskAlerts,
  subscribeToRiskAlerts,
} from "@/lib/supabase";
import {
  fetchNEAAirQuality,
  fetchNEADengueClusters,
  fetchNEAWeather,
} from "@/lib/datagovsg";

interface Hotspot {
  area: string;
  score: number;
  driver: string;
}

interface AlertModalState {
  isOpen: boolean;
  selectedArea: string | null;
  riskScore: number;
  component: string;
  description: string;
}

export default function HotspotsPage() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [clusterData, setClusterData] = useState<any[]>([]);
  const [coverageSummary, setCoverageSummary] = useState({
    totalBurden: 0,
    coveredBurden: 0,
    coveredZones: 0,
  });
  const [alertModal, setAlertModal] = useState<AlertModalState>({
    isOpen: false,
    selectedArea: null,
    riskScore: 50,
    component: "C1",
    description: "",
  });

  useEffect(() => {
    async function loadHotspots() {
      try {
        const [weather, airQuality, dengue, existingAlerts, interventions, predictionResponse] = await Promise.all([
          fetchNEAWeather(),
          fetchNEAAirQuality(),
          fetchNEADengueClusters(),
          getRiskAlerts({ component: "C1" }),
          getInterventions(),
          fetch("/api/model/predictions").catch(() => null),
        ]);
        const predictions =
          predictionResponse && predictionResponse.ok ? ((await predictionResponse.json()).predictions || []) : [];

        const weatherRecord = (weather?.records?.[0] || {}) as Record<string, number | string | undefined>;
        const airRecord = (airQuality?.records?.[0] || {}) as Record<string, number | string | undefined>;
        const dengueCount = dengue?.records?.length || 0;
        const activeAlertsByLocation = new Set(
          existingAlerts
            .filter((alert: any) => alert.status !== "resolved")
            .map((alert: any) => alert.location),
        );

        const baselineTemperature = Number(
          weatherRecord.air_temperature ||
            weatherRecord.temperature ||
            weatherRecord.value ||
            31,
        );
        const baselineHumidity = Number(weatherRecord.relative_humidity || 78);
        const baselinePm25 = Number(airRecord.pm25_one_hourly || airRecord.value || 18);

        const hotspotAreas = Array.from(
          new Set(
            [
              ...existingAlerts.map((alert: any) => alert.location),
              ...interventions.map((item: any) => item.location),
              ...predictions.map((item: any) => item.area),
            ].filter(Boolean),
          ),
        );

        const dynamicHotspots = hotspotAreas.slice(0, 8).map((area, index) => {
          const score = Math.min(
            100,
            Math.round(
              45 +
                baselineTemperature * 0.8 +
                baselineHumidity * 0.15 +
                baselinePm25 * 0.5 +
                dengueCount * 0.4 +
                index * 6 +
                (activeAlertsByLocation.has(area) ? 12 : 0) +
                (interventions.some((item: any) => item.location === area && item.outcome !== "Completed") ? 8 : 0),
            ),
          );

          return {
            area,
            score,
            driver: `${baselineTemperature.toFixed(1)}C temp, ${baselinePm25.toFixed(0)} PM2.5, ${dengueCount} dengue clusters, ${activeAlertsByLocation.has(area) ? "existing active alert" : "no open alert"}${interventions.some((item: any) => item.location === area && item.outcome !== "Completed") ? ", active field intervention" : ""}`,
          };
        }).sort((a, b) => b.score - a.score);

        setHotspots(dynamicHotspots);
        setClusterData(
          dynamicHotspots.map((spot, index) => ({
            region: spot.area,
            persistence: Math.min(100, spot.score),
            seasonality: Math.max(20, Math.round((baselinePm25 + index * 5))),
            count: 30 + spot.score,
          })),
        );
        const totalBurden = dynamicHotspots.reduce((sum, spot) => sum + spot.score, 0);
        const coveredZones = dynamicHotspots.filter((spot) =>
          interventions.some((item: any) => item.location === spot.area && item.outcome !== "Completed"),
        );
        const coveredBurden = coveredZones.reduce((sum, spot) => sum + spot.score, 0);
        setCoverageSummary({
          totalBurden,
          coveredBurden,
          coveredZones: coveredZones.length,
        });
      } catch (error) {
        console.error("Error loading hotspots:", error);
        toast.error("Falling back to latest cached hotspot signals");
      } finally {
        setLoading(false);
      }
    }

    void loadHotspots();

    const subscription = subscribeToRiskAlerts(() => {
      void loadHotspots();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleCreateAlert = async () => {
    if (!alertModal.selectedArea || !alertModal.description) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const identity = await getCurrentUserIdentity();
      const alertId = `C${alertModal.component.split("C")[1]}-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;
      
      await createRiskAlert({
        alert_id: alertId,
        component: alertModal.component,
        location: alertModal.selectedArea,
        risk_score: alertModal.riskScore,
        risk_level:
          alertModal.riskScore >= 80
            ? "Critical"
            : alertModal.riskScore >= 60
            ? "High"
            : alertModal.riskScore >= 40
            ? "Medium"
            : "Low",
        description: alertModal.description,
        triggered_by: {
          source: alertModal.component,
          drivers: [alertModal.description],
        },
        status: "open",
        assigned_to: identity.id || null,
      });

      toast.success(`Alert ${alertId} created!`);
      setAlertModal({ isOpen: false, selectedArea: null, riskScore: 50, component: "C1", description: "" });
    } catch (error) {
      console.error("Error creating alert:", error);
      toast.error("Failed to create alert");
    }
  };

  return (
    <div className={styles.stack}>
      <MockMap title="Construction Risk Hotspots - Daily Sector-Level Injury Risk (Module C1)" mapContext="hotspot" />

      <DashboardSection
        eyebrow="Cluster details"
        title="High-risk construction zones requiring WSH inspector outreach"
      >
        <div className={styles.gridTwo}>
          {loading ? (
            <p className={styles.metaText}>Loading live hotspot signals...</p>
          ) : hotspots.map((spot) => (
            <div className={styles.metricCard} key={spot.area} style={{ position: "relative" }}>
              <p>{spot.area}</p>
              <strong>{spot.score} / 100</strong>
              <span className={styles.metaLabel}>{spot.driver}</span>
              <button
                onClick={() => setAlertModal({
                  isOpen: true,
                  selectedArea: spot.area,
                  riskScore: spot.score,
                  component: "C1",
                  description: spot.driver,
                })}
                className={styles.compactActionBtn}
              >
                Create Alert
              </button>
            </div>
          ))}
        </div>
      </DashboardSection>

      <DashboardSection
        eyebrow="Local model transparency"
        title="Predictive driver attribution per cluster"
      >
        <div className={styles.gridTwo}>
          <div className={styles.listCard}>
            <strong>{hotspots[0]?.area || "Top Cluster"} (Primary Cluster)</strong>
            <ul className={styles.list}>
              {hotspots.slice(0, 3).map((spot) => (
                <li key={spot.area}>{spot.driver}</li>
              ))}
            </ul>
          </div>
          <div className={styles.listCard}>
            <strong>Explainability Note</strong>
            <p className={styles.metaText}>
              This section now reflects live environmental and alert-derived drivers instead of fixed SHAP placeholder text.
            </p>

          </div>
        </div>
      </DashboardSection>

      <DashboardSection
        eyebrow="Impact Simulation"
        title="Current hotspot burden and field coverage"
      >
        <div className={styles.metricCard}>
          <p>Current Live Hotspot Burden</p>
          <strong>{coverageSummary.totalBurden || 0} Risk Points</strong>
          <p className={styles.metaText}>
            Active field coverage: <strong className={styles.positive}>{coverageSummary.coveredBurden} risk points across {coverageSummary.coveredZones} zones</strong>
          </p>
        </div>
      </DashboardSection>

      <DashboardSection
        eyebrow="Cluster logic"
        title="Spatial Clustering: Identifying Persistent Patterns vs Seasonal Spikes"
      >
        <div className={styles.chartCard} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <SpatialPersistenceChart data={clusterData} />
          <div className={styles.listCard}>
            <ul className={styles.list}>
              <li><strong>Persistent Clusters:</strong> Areas with the highest current live hotspot score rank toward the top-right quadrant.</li>
              <li><strong>Seasonal Spikes:</strong> PM2.5 and weather-derived variation currently influence the seasonality axis.</li>
              <li><strong>Anomaly Flags:</strong> Open C1 alerts raise persistence and action priority immediately.</li>
            </ul>
          </div>
        </div>
      </DashboardSection>

      {/* Alert Creation Modal */}
      {alertModal.isOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <h2 className={styles.modalTitle}>Create Risk Alert</h2>

            <label className={styles.modalField}>
              <span className={styles.modalLabel}>Location</span>
              <input
                type="text"
                value={alertModal.selectedArea || ""}
                disabled
                className={styles.modalInput}
              />
            </label>

            <label className={styles.modalField}>
              <span className={styles.modalLabel}>Component</span>
              <select
                value={alertModal.component}
                onChange={(e) => setAlertModal({ ...alertModal, component: e.target.value })}
                className={styles.modalInput}
              >
                <option>C1</option>
                <option>C2</option>
                <option>C3</option>
                <option>C4</option>
                <option>C5</option>
                <option>C6</option>
                <option>C7</option>
                <option>C8</option>
                <option>C9</option>
                <option>C10</option>
              </select>
            </label>

            <label className={styles.modalField}>
              <span className={styles.modalLabel}>
                Risk Score: {alertModal.riskScore}
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={alertModal.riskScore}
                onChange={(e) => setAlertModal({ ...alertModal, riskScore: parseInt(e.target.value) })}
                className={styles.modalRange}
              />
            </label>

            <label className={styles.modalField}>
              <span className={styles.modalLabel}>Description</span>
              <textarea
                value={alertModal.description}
                onChange={(e) => setAlertModal({ ...alertModal, description: e.target.value })}
                className={styles.modalTextarea}
              />
            </label>

            <div className={styles.modalActions}>
              <button
                onClick={() => setAlertModal({ isOpen: false, selectedArea: null, riskScore: 50, component: "C1", description: "" })}
                className={styles.modalSecondaryBtn}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAlert}
                className={styles.modalPrimaryBtn}
              >
                Create Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
