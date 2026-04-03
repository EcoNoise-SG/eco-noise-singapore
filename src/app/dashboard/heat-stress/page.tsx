"use client";

import { useEffect, useState } from "react";
import { fetchNEAWeather } from "@/lib/datagovsg";
import { computeHeatRisk, HeatStressSignal } from "@/lib/wsh";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import dormData from "@/lib/dormitories.json";
import styles from "../dashboard.module.css"; // Using global dashboard styles
import localStyles from "./heat-stress.module.css";

export default function HeatStressPage() {
  const [currentSignal, setCurrentSignal] = useState<HeatStressSignal | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const weather = await fetchNEAWeather();
      if (!weather || !weather.records[0]) return;

      const record = weather.records[0];
      const signal = computeHeatRisk({
        temp: record.air_temperature,
        humidity: record.relative_humidity,
      }, dormData);

      setCurrentSignal(signal);
      setLoading(false);
    }

    loadData();
    const interval = setInterval(loadData, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !currentSignal) {
    return <div className={localStyles.loader}>Syncing Singapore Dormitory Thermal Grid...</div>;
  }

  const riskColor = currentSignal.riskLevel === "Extreme" ? "#ef4444" :
    currentSignal.riskLevel === "High" ? "#ef4444" :
      currentSignal.riskLevel === "Moderate" ? "#f59e0b" : "#10b981";

  const filteredDorms = currentSignal.dormitories.filter(d =>
    (d.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.address || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.stack}>
      {/* 🏅 Compliance & Trust Layer */}
      <div className={styles.pageActionBar} style={{ justifyContent: 'space-between', marginBottom: '0', paddingTop: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className={styles.statusSynced} style={{ fontSize: '0.875rem', padding: '8px 16px', borderRadius: '4px' }}>
            ● ALIGNED WITH MOM WSH HEAT STRESS ADVISORY (AUG 2024)
          </div>
          <div className={styles.simToggleHint} style={{ fontSize: '0.875rem', padding: '8px 16px', borderRadius: '4px' }}>
            100% PUBLIC DATA (DATA.GOV.SG)
          </div>
        </div>
        <button className={styles.primaryActionBtn} style={{ borderRadius: '50px', padding: '0 24px' }}>
          Generate WSH Inspection Brief (PDF)
        </button>
      </div>


      {/* 📊 Top Metrics aligned with global style */}
      <div className={localStyles.topMetricsGrid}>
        <div className={styles.metricCard}>
          <p>Avg Temperature</p>
          <strong>{currentSignal.temp}°C</strong>
          <span className={styles.metaLabel}>NEA Grid 4 Sensor Sync</span>
        </div>
        <div className={styles.metricCard}>
          <p>Wet Bulb Globe (WBGT)</p>
          <strong>{currentSignal.wbgt}°C</strong>
          <span className={styles.metaLabel}>MOM advisory calibrated</span>
        </div>
        <div className={styles.metricCard}>
          <p>High-Risk Assets</p>
          <strong className={currentSignal.impact.highRiskDorms > 0 ? styles.negative : ""}>
            {currentSignal.impact.highRiskDorms}
          </strong>
          <span className={styles.metaLabel}>Assets above threshold</span>
        </div>
        <div className={styles.metricCard}>
          <p>ML Prediction Confidence</p>
          <strong style={{ color: '#0f172a' }}>{currentSignal.prediction.confidence}</strong>
          <span className={styles.metaLabel}>XGBoost Inference Engine</span>
        </div>
      </div>

      <div className={styles.gridTwo}>
        {/* 🎯 Real-time Decisions Section */}
        <DashboardSection title="MOM Heat Stress Decisions" eyebrow="Live Advisory">
          <div className={styles.listCard} style={{ borderLeft: `6px solid ${riskColor}` }}>
            <span className={styles.timeLabel}>CURRENT RISK: {currentSignal.riskLevel.toUpperCase()}</span>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
              {currentSignal.action}
            </h4>
            <div className={styles.actionDetail}>
              The system has detected a WBGT of {currentSignal.wbgt}°C. {currentSignal.impact.priorityFlag}.
            </div>

            {/* Explainability Block */}
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
              <span className={styles.metaLabel} style={{ marginTop: 0, fontSize: '0.75rem' }}>Risk high due to:</span>
              <div style={{ display: 'flex', gap: '20px', marginTop: '4px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>🌡️ WBGT: {currentSignal.factors.wbgt}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>💧 Humidity: {currentSignal.factors.humidity}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>🧍 Location Exposure: {currentSignal.factors.exposure}</div>
              </div>
            </div>

            <div className={styles.logicNode}>
              System Confidence: {currentSignal.prediction.confidence} (XGBoost Regressor)
            </div>
          </div>
        </DashboardSection>

        {/* 🧍 Population Impact Section */}
        <DashboardSection title="Worker Exposure Estimates" eyebrow="Policy Analytics">
          <div className={styles.metricCard} style={{ background: '#0f172a', color: '#fff' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Estimated Workers Exposed</p>
            <strong style={{ color: '#fff', fontSize: '2.5rem' }}>{currentSignal.impact.workersAtRisk.toLocaleString()}</strong>
            <span className={styles.metaLabel} style={{ color: 'rgba(255,255,255,0.4)' }}>
              Based on sector density modeling
            </span>
          </div>
        </DashboardSection>
      </div>

      {/* 🔴 Top 5 Risk Zones */}
      <DashboardSection title="Immediate Priority: Top Risk Dormitories Today" eyebrow="Hotspot Detection">
        <div className={localStyles.priorityGrid} style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
          {currentSignal.dormitories.sort((a, b) => b.currentRisk - a.currentRisk).slice(0, 5).map(dorm => (
            <div key={dorm.id} className={localStyles.dormItemMini} style={{ borderBottom: '4px solid #ef4444', overflow: 'hidden' }}>
              <div className={localStyles.dormHeader}>
                <span className={localStyles.regionBadge} style={{ background: '#fee2e2', color: '#b91c1c' }}>HIGH RISK</span>
                <span className={localStyles.riskValueSmall} style={{ color: '#ef4444', fontSize: '1rem' }}>{dorm.currentRisk}</span>
              </div>
              <div className={localStyles.dormContent}>
                <div className={localStyles.dormName} style={{ fontSize: '0.75rem' }}>{dorm.name}</div>
                <div className={localStyles.dormAddr} style={{ fontSize: '0.65rem' }}>{dorm.address}</div>
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>

      {/* 🏢 Full Registry Section */}
      <DashboardSection title={`Singapore Dormitory Thermal Registry (${currentSignal.dormitories.length})`} eyebrow="Continuous Monitoring">
        <div className={styles.tableCard}>
          <div className={styles.pageActionBar}>
            <input
              type="text"
              placeholder="Filter assets by name, address or operator..."
              className={styles.modalInput}
              style={{ maxWidth: '400px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className={styles.simToggleHint}>Real-time Sensor Syncing</div>
          </div>

          <div className={localStyles.dormListGrid}>
            {(searchTerm ? filteredDorms : currentSignal.dormitories.slice(0, 16)).map(dorm => (
              <div key={dorm.id} className={localStyles.dormItemMini}>
                <div className={localStyles.dormHeader}>
                  <span className={localStyles.regionBadge}>{dorm.region}</span>
                  <span className={localStyles.riskDot} style={{
                    backgroundColor: dorm.riskLevel === "Extreme" ? "#000" :
                      dorm.riskLevel === "High" ? "#ef4444" :
                        dorm.riskLevel === "Moderate" ? "#f59e0b" : "#10b981"
                  }} />
                </div>
                <div className={localStyles.dormContent}>
                  <div className={localStyles.dormName}>{dorm.name}</div>
                  <div className={localStyles.dormAddr}>{dorm.address}</div>
                </div>
                <div className={localStyles.riskValueSmall}>{dorm.currentRisk}</div>
              </div>
            ))}
          </div>

          {!searchTerm && currentSignal.dormitories.length > 16 && (
            <div className={localStyles.moreIndicator}>
              + {currentSignal.dormitories.length - 16} more assets monitored. Use search to filter full dataset.
            </div>
          )}
        </div>
      </DashboardSection>
    </div>
  );
}
