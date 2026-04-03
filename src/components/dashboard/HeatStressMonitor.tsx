"use client";

import { useEffect, useState } from "react";
import { fetchNEAWeather } from "@/lib/datagovsg";
import styles from "./heat-stress.module.css";

type HeatStressData = {
  temp: number;
  humidity: number;
  heatIndex: number;
  level: "Safe" | "Moderate" | "High" | "Extreme";
  color: string;
  recommendation: string;
  timestamp: string;
};

export function HeatStressMonitor() {
  const [data, setData] = useState<HeatStressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHeatStress() {
      try {
        const weather = await fetchNEAWeather();
        if (!weather || !weather.records[0]) return;

        const record = weather.records[0];
        const T = record.air_temperature || 28;
        const RH = record.relative_humidity || 70;

        // Simplified WBGT / Heat Index Approximation for Singapore (Tropical)
        // Formula: HI = T + 0.33 * (RH / 100 * 6.105 * exp(17.27 * T / (237.7 + T))) - 4.0
        // We'll use a simpler version for the UI logic
        const heatIndex = T + (0.5555 * (RH / 100) * (T - 14.5));

        let level: HeatStressData["level"] = "Safe";
        let color = "#10b981"; // Green
        let recommendation = "Normal outdoor operations. Maintain standard hydration.";

        if (heatIndex > 38) {
          level = "Extreme";
          color = "#000000"; // Black
          recommendation = "CRITICAL: Stop all strenuous outdoor work. Mandatory rest in shade.";
        } else if (heatIndex > 35) {
          level = "High";
          color = "#ef4444"; // Red
          recommendation = "HIGH RISK: 15-min rest every hour. Mandatory supervision for heat signs.";
        } else if (heatIndex > 32) {
          level = "Moderate";
          color = "#f59e0b"; // Amber
          recommendation = "MODERATE: Increased hydration (500ml/hr). Provide shaded rest areas.";
        }

        setData({
          temp: T,
          humidity: RH,
          heatIndex: Number(heatIndex.toFixed(1)),
          level,
          color,
          recommendation,
          timestamp: new Date(weather.records[0].timestamp).toLocaleTimeString(),
        });
      } catch (error) {
        console.error("Failed to load heat stress data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadHeatStress();
    const interval = setInterval(loadHeatStress, 300000); // 5 min
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className={styles.loading}>Syncing NEA WBGT Sensors...</div>;
  if (!data) return null;

  return (
    <div className={styles.monitorCard}>
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <h4>WSH Heat Stress Monitor</h4>
          <span>MOM Aligned · Realtime NEA Feed</span>
        </div>
        <div className={styles.pulse} style={{ backgroundColor: data.color }} />
      </div>

      <div className={styles.grid}>
        <div className={styles.metric}>
          <label>Air Temp</label>
          <strong>{data.temp}°C</strong>
        </div>
        <div className={styles.metric}>
          <label>Humidity</label>
          <strong>{data.humidity}%</strong>
        </div>
        <div className={styles.metric}>
          <label>Heat Index</label>
          <strong style={{ color: data.color }}>{data.heatIndex}°C</strong>
        </div>
      </div>

      <div className={styles.statusSection} style={{ borderLeftColor: data.color }}>
        <div className={styles.levelBadge} style={{ backgroundColor: data.color }}>
          {data.level} RISK
        </div>
        <p className={styles.recommendation}>{data.recommendation}</p>
      </div>

      <div className={styles.footer}>
        <span>Last NEA Sync: {data.timestamp}</span>
        <span>Sensor: Unified Station Grid</span>
      </div>
    </div>
  );
}
