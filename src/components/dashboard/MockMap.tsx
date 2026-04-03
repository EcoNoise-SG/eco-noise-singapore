"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import styles from "./map.module.css";
import { fetchNEAAirQuality, fetchNEAWeather } from "@/lib/datagovsg";
import {
  getInterventions,
  getRiskAlerts,
  subscribeToInterventions,
  subscribeToRiskAlerts,
} from "@/lib/supabase";

type MapContext = "overview" | "forecast" | "hotspot" | "patrol";
type OverlayLayer = "all" | "alerts" | "ops" | "ml-nea";

type MapPrediction = {
  area: string;
  predicted_score: number;
  confidence?: number;
  primary_driver?: string;
  recommended_action?: string;
};

type ZoneOverlay = {
  area: string;
  coordinates: [number, number];
  score: number;
  status: string;
  detail: string;
  alerts: number;
  interventions: number;
  predictionScore?: number;
  weatherDetail: string;
  sources: {
    alerts: string[];
    ops: string[];
    model: string[];
  };
};

type AreaAggregate = {
  area: string;
  coordinates: [number, number];
  score: number;
  alerts: number;
  interventions: number;
  predictionScore?: number;
  weatherDetail: string;
  sources: {
    alerts: string[];
    ops: string[];
    model: string[];
  };
};

const RealtimeMapCanvas = dynamic(() => import("./RealtimeMapCanvas"), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Loading live map layers...</div>,
});

const AREA_COORDINATES: Record<string, [number, number]> = {
  Singapore: [1.3521, 103.8198],
  "Bukit Merah": [1.2852, 103.8198],
  Bedok: [1.3236, 103.9273],
  Woodlands: [1.4382, 103.789],
  "Jurong East": [1.3329, 103.7436],
  "Jurong West": [1.35, 103.704],
  "Jurong Industrial": [1.3215, 103.7052],
  "Choa Chu Kang": [1.3854, 103.7443],
  Clementi: [1.3151, 103.7654],
  Queenstown: [1.2942, 103.7861],
  Yishun: [1.4294, 103.8354],
  Sembawang: [1.4491, 103.8185],
  Bishan: [1.3508, 103.8485],
  AngMoKio: [1.3691, 103.8454],
  "Ang Mo Kio": [1.3691, 103.8454],
  Hougang: [1.3612, 103.8863],
  Sengkang: [1.3868, 103.8914],
  Punggol: [1.4043, 103.902],
  Serangoon: [1.3521, 103.869],
  Tampines: [1.3496, 103.9568],
  "Pasir Ris": [1.3731, 103.9493],
  Geylang: [1.3188, 103.887],
  Kallang: [1.3106, 103.866],
  ToaPayoh: [1.3343, 103.8563],
  "Toa Payoh": [1.3343, 103.8563],
  Novena: [1.3201, 103.8439],
  Orchard: [1.3048, 103.8318],
  Marina: [1.276, 103.8546],
  "Marina Bay": [1.276, 103.8546],
  Changi: [1.3644, 103.9915],
  Tuas: [1.2942, 103.635],
  BoonLay: [1.3386, 103.705],
  "Boon Lay": [1.3386, 103.705],
};

const LOCATION_MATCHERS = Object.entries(AREA_COORDINATES).sort((a, b) => b[0].length - a[0].length);

const LAYER_META: Record<Exclude<OverlayLayer, "all">, { label: string; description: string }> = {
  alerts: { label: "Alerts", description: "Live risk alerts from Supabase" },
  ops: { label: "Ops", description: "Open intervention activity" },
  "ml-nea": { label: "ML + NEA", description: "Predictions blended with environmental signals" },
};

function resolveCoordinates(area: string): [number, number] {
  const normalized = area.trim();
  if (AREA_COORDINATES[normalized]) {
    return AREA_COORDINATES[normalized];
  }

  const match = LOCATION_MATCHERS.find(([candidate]) => normalized.toLowerCase().includes(candidate.toLowerCase()));
  return match ? match[1] : AREA_COORDINATES.Singapore;
}

function getZoneStatus(score: number) {
  if (score >= 85) return "Critical";
  if (score >= 70) return "High";
  if (score >= 50) return "Elevated";
  return "Monitor";
}

function buildLayerDetail(zone: AreaAggregate, layer: OverlayLayer) {
  if (layer === "alerts") {
    return zone.sources.alerts.slice(0, 2).join(" • ") || "No live alerts";
  }

  if (layer === "ops") {
    return zone.sources.ops.slice(0, 2).join(" • ") || "No active intervention";
  }

  if (layer === "ml-nea") {
    return [...zone.sources.model.slice(0, 2), zone.weatherDetail].filter(Boolean).join(" • ");
  }

  return [
    zone.sources.alerts[0],
    zone.sources.ops[0],
    zone.sources.model[0],
    zone.weatherDetail,
  ]
    .filter(Boolean)
    .slice(0, 3)
    .join(" • ");
}

function toZoneOverlay(zone: AreaAggregate, layer: OverlayLayer): ZoneOverlay {
  return {
    area: zone.area,
    coordinates: zone.coordinates,
    score: zone.score,
    status: getZoneStatus(zone.score),
    detail: buildLayerDetail(zone, layer),
    alerts: zone.alerts,
    interventions: zone.interventions,
    predictionScore: zone.predictionScore,
    weatherDetail: zone.weatherDetail,
    sources: zone.sources,
  };
}

export function MockMap({
  title,
  mapContext = "overview",
}: {
  title: string;
  mapContext?: MapContext;
}) {
  const [allZones, setAllZones] = useState<ZoneOverlay[]>([]);
  const [activeLayer, setActiveLayer] = useState<OverlayLayer>("all");
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    activeSignals: 0,
    alertThreshold: "--",
    weatherLabel: "Loading weather...",
    forecastLabel: "Syncing live context...",
  });

  useEffect(() => {
    async function loadSpatialData() {
      try {
        const [alerts, interventions, weather, airQuality, predictionResponse] = await Promise.all([
          getRiskAlerts(),
          getInterventions(),
          fetchNEAWeather(),
          fetchNEAAirQuality(),
          fetch("/api/model/predictions").catch(() => null),
        ]);

        let predictions: MapPrediction[] = [];
        if (predictionResponse && predictionResponse.ok) {
          const payload = await predictionResponse.json();
          predictions = payload.predictions || [];
        }

        const weatherRecord = (weather?.records?.[0] || {}) as Record<string, number | string | undefined>;
        const airRecord = (airQuality?.records?.[0] || {}) as Record<string, number | string | undefined>;
        const temp = Number(weatherRecord.air_temperature || weatherRecord.temperature || weatherRecord.value || 31);
        const pm25 = Number(airRecord.pm25_one_hourly || airRecord.value || 18);
        const weatherLabel = `${temp.toFixed(1)}C · PM2.5 ${pm25.toFixed(0)}`;
        const weatherDetail = `${weatherLabel} · ${String(weatherRecord.forecast || "Live field conditions")}`;

        const mergedByArea = new Map<string, AreaAggregate>();

        alerts.forEach((alert: any) => {
          const key = String(alert.location || "Singapore");
          const existing = mergedByArea.get(key) || {
            area: key,
            coordinates: resolveCoordinates(key),
            score: 0,
            alerts: 0,
            interventions: 0,
            weatherDetail,
            sources: { alerts: [], ops: [], model: [] },
          };

          existing.score = Math.max(existing.score, Number(alert.risk_score || 0));
          existing.alerts += 1;
          existing.sources.alerts.push(`${alert.component} ${alert.risk_level}`);
          mergedByArea.set(key, existing);
        });

        interventions.forEach((intervention: any) => {
          const key = String(intervention.location || "Singapore");
          const existing = mergedByArea.get(key) || {
            area: key,
            coordinates: resolveCoordinates(key),
            score: 48,
            alerts: 0,
            interventions: 0,
            weatherDetail,
            sources: { alerts: [], ops: [], model: [] },
          };

          existing.score = Math.max(existing.score, intervention.outcome === "Completed" ? 55 : 68);
          existing.interventions += 1;
          existing.sources.ops.push(`Ops ${intervention.intervention_type}`);
          mergedByArea.set(key, existing);
        });

        predictions.forEach((prediction) => {
          const key = prediction.area || "Singapore";
          const existing = mergedByArea.get(key) || {
            area: key,
            coordinates: resolveCoordinates(key),
            score: 0,
            alerts: 0,
            interventions: 0,
            weatherDetail,
            sources: { alerts: [], ops: [], model: [] },
          };

          const predictedScore = Math.round(prediction.predicted_score);
          existing.score = Math.max(existing.score, predictedScore);
          existing.predictionScore = predictedScore;
          existing.sources.model.push(`ML ${prediction.primary_driver || "forecast"}`);
          mergedByArea.set(key, existing);
        });

        const contextFilteredZones = Array.from(mergedByArea.values())
          .filter((zone) => {
            if (mapContext === "hotspot") return zone.score >= 55;
            if (mapContext === "forecast") return zone.sources.model.length > 0;
            if (mapContext === "patrol") return zone.interventions > 0;
            return zone.score > 0;
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)
          .map((zone) => toZoneOverlay(zone, "all"));

        setAllZones(contextFilteredZones);
        setSelectedArea((current) => {
          if (current && contextFilteredZones.some((zone) => zone.area === current)) {
            return current;
          }

          return contextFilteredZones[0]?.area || null;
        });
        setSummary({
          activeSignals: contextFilteredZones.length,
          alertThreshold: `${Math.max(...contextFilteredZones.map((zone) => zone.score), 0)}%`,
          weatherLabel,
          forecastLabel: String(weatherRecord.forecast || "Live field conditions"),
        });
      } catch (error) {
        console.error("Error loading spatial map overlay:", error);
      }
    }

    void loadSpatialData();
    const alertsSubscription = subscribeToRiskAlerts(() => {
      void loadSpatialData();
    });
    const interventionsSubscription = subscribeToInterventions(() => {
      void loadSpatialData();
    });

    return () => {
      alertsSubscription.unsubscribe();
      interventionsSubscription.unsubscribe();
    };
  }, [mapContext]);

  const visibleZones = useMemo(() => {
    const remapped = allZones
      .map((zone) =>
        toZoneOverlay(
          {
            area: zone.area,
            coordinates: zone.coordinates,
            score: zone.score,
            alerts: zone.alerts,
            interventions: zone.interventions,
            predictionScore: zone.predictionScore,
            weatherDetail: zone.weatherDetail,
            sources: zone.sources,
          },
          activeLayer,
        ),
      )
      .filter((zone) => {
        if (activeLayer === "alerts") return zone.alerts > 0;
        if (activeLayer === "ops") return zone.interventions > 0;
        if (activeLayer === "ml-nea") return Boolean(zone.predictionScore || zone.weatherDetail);
        return true;
      });

    return remapped;
  }, [activeLayer, allZones]);

  const selectedZone = visibleZones.find((zone) => zone.area === selectedArea) || visibleZones[0] || null;

  return (
    <div className={styles.mapWrapper}>
      <div className={styles.mapHeader}>
        <div className={styles.mapStatus}>
          <span className={styles.statusPulse}></span>
          Live Spatial Intel
        </div>
        <h3>{title}</h3>
      </div>

      <div className={styles.mapSurface}>
        <RealtimeMapCanvas
          zones={visibleZones}
          activeLayer={activeLayer}
          selectedArea={selectedZone?.area || null}
          onZoneSelect={setSelectedArea}
        />

        <div className={styles.mapOverlay}>
          <div className={styles.overlayCard}>
            <span>Active Zones</span>
            <strong>{visibleZones.length}</strong>
          </div>
          <div className={styles.overlayCard}>
            <span>Peak Risk</span>
            <strong>{summary.alertThreshold}</strong>
          </div>
          <div className={styles.overlayCard}>
            <span>Weather Feed</span>
            <strong>{summary.weatherLabel}</strong>
          </div>
        </div>

        <div className={styles.intelPanel}>
          <div className={styles.intelHeader}>
            <span>Zone Intelligence</span>
            <strong>Realtime overlay stack</strong>
          </div>
          <div className={styles.intelLegend}>
            <button
              type="button"
              className={activeLayer === "alerts" ? styles.legendActive : ""}
              onClick={() => setActiveLayer("alerts")}
            >
              Alerts
            </button>
            <button
              type="button"
              className={activeLayer === "ops" ? styles.legendActive : ""}
              onClick={() => setActiveLayer("ops")}
            >
              Ops
            </button>
            <button
              type="button"
              className={activeLayer === "ml-nea" ? styles.legendActive : ""}
              onClick={() => setActiveLayer("ml-nea")}
            >
              ML + NEA
            </button>
          </div>
          <button type="button" className={styles.layerReset} onClick={() => setActiveLayer("all")}>
            Show all layers
          </button>
          <p className={styles.intelWeather}>
            {activeLayer === "all"
              ? summary.forecastLabel
              : `${LAYER_META[activeLayer].description} · ${summary.forecastLabel}`}
          </p>
          <div className={styles.intelList}>
            {visibleZones.slice(0, 5).map((zone) => (
              <button
                type="button"
                key={`panel-${zone.area}`}
                className={`${styles.intelItem} ${selectedZone?.area === zone.area ? styles.intelItemActive : ""}`}
                onClick={() => setSelectedArea(zone.area)}
              >
                <div>
                  <strong>{zone.area}</strong>
                  <p>{zone.detail}</p>
                </div>
                <div className={styles.intelMeta}>
                  <span>{zone.alerts}A</span>
                  <span>{zone.interventions}O</span>
                  <strong>{zone.score}</strong>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.mapFooter}>
        <p>Realtime overlays are now pinned to live latitude and longitude coordinates, so alerts, ops, and ML + NEA signals move with the map during zoom and pan.</p>
      </div>
    </div>
  );
}
