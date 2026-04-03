"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import styles from "./map.module.css";
import {
  fetchNEAAirQuality,
  fetchNEAWeather,
  fetchOneMapLocation,
  fetchPlanningAreaBoundaries,
} from "@/lib/datagovsg";
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
  geometry?: any;
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
  geometry?: any;
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

type PlanningBoundaryFeature = {
  type: string;
  properties?: {
    PLN_AREA_N?: string;
    [key: string]: unknown;
  };
  geometry?: any;
};

const RealtimeMapCanvas = dynamic(() => import("./RealtimeMapCanvas"), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Loading live map layers...</div>,
});

const LAYER_META: Record<Exclude<OverlayLayer, "all">, { label: string; description: string }> = {
  alerts: { label: "Alerts", description: "Live risk alerts from Supabase" },
  ops: { label: "Ops", description: "Open intervention activity" },
  "ml-nea": { label: "ML + NEA", description: "Predictions blended with environmental signals" },
};

function normalizeAreaName(area: string) {
  return area.toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9 ]/g, "").trim();
}

function getBoundaryCentroid(geometry: any): [number, number] | null {
  if (!geometry?.coordinates || !geometry?.type) return null;

  const coordinateGroups =
    geometry.type === "Polygon"
      ? geometry.coordinates.flat(1)
      : geometry.type === "MultiPolygon"
        ? geometry.coordinates.flat(2)
        : [];

  if (!coordinateGroups.length) return null;

  const [lngSum, latSum] = coordinateGroups.reduce(
    (sum: [number, number], point: [number, number]) => [sum[0] + point[0], sum[1] + point[1]],
    [0, 0],
  );

  return [latSum / coordinateGroups.length, lngSum / coordinateGroups.length];
}

function matchPlanningBoundary(area: string, features: PlanningBoundaryFeature[]) {
  const normalizedArea = normalizeAreaName(area);
  return features.find((feature) => normalizeAreaName(String(feature.properties?.PLN_AREA_N || "")) === normalizedArea)
    || features.find((feature) => normalizedArea.includes(normalizeAreaName(String(feature.properties?.PLN_AREA_N || ""))))
    || features.find((feature) => normalizeAreaName(String(feature.properties?.PLN_AREA_N || "")).includes(normalizedArea));
}

async function resolveAreaSpatial(area: string, features: PlanningBoundaryFeature[]) {
  const matchedBoundary = matchPlanningBoundary(area, features);
  const centroid = matchedBoundary?.geometry ? getBoundaryCentroid(matchedBoundary.geometry) : null;
  if (matchedBoundary?.geometry && centroid) {
    return {
      coordinates: centroid,
      geometry: matchedBoundary.geometry,
    };
  }

  const geocodedLocation = await fetchOneMapLocation(area);
  if (geocodedLocation?.coordinates) {
    return {
      coordinates: geocodedLocation.coordinates,
      geometry: undefined,
    };
  }

  return {
    coordinates: [1.3521, 103.8198] as [number, number],
    geometry: undefined,
  };
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
    geometry: zone.geometry,
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
        const [alerts, interventions, weather, airQuality, planningBoundaries, predictionResponse] = await Promise.all([
          getRiskAlerts(),
          getInterventions(),
          fetchNEAWeather(),
          fetchNEAAirQuality(),
          fetchPlanningAreaBoundaries(),
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
        const boundaryFeatures: PlanningBoundaryFeature[] = planningBoundaries?.features || [];
        const areas = new Set<string>();

        alerts.forEach((alert: any) => {
          areas.add(String(alert.location || "Singapore"));
        });

        interventions.forEach((intervention: any) => {
          areas.add(String(intervention.location || "Singapore"));
        });

        predictions.forEach((prediction) => {
          areas.add(prediction.area || "Singapore");
        });

        if (!areas.size) {
          areas.add("Singapore");
        }

        const spatialLookup = new Map<
          string,
          {
            coordinates: [number, number];
            geometry?: any;
          }
        >();

        await Promise.all(
          Array.from(areas).map(async (area) => {
            const spatial = await resolveAreaSpatial(area, boundaryFeatures);
            spatialLookup.set(area, spatial);
          }),
        );

        const ensureAreaAggregate = (area: string, score = 0) => {
          const existing = mergedByArea.get(area);
          if (existing) {
            return existing;
          }

          const spatial = spatialLookup.get(area) || {
            coordinates: [1.3521, 103.8198] as [number, number],
            geometry: undefined,
          };
          const aggregate: AreaAggregate = {
            area,
            coordinates: spatial.coordinates,
            geometry: spatial.geometry,
            score,
            alerts: 0,
            interventions: 0,
            weatherDetail,
            sources: { alerts: [], ops: [], model: [] },
          };

          mergedByArea.set(area, aggregate);
          return aggregate;
        };

        alerts.forEach((alert: any) => {
          const key = String(alert.location || "Singapore");
          const existing = ensureAreaAggregate(key);

          existing.score = Math.max(existing.score, Number(alert.risk_score || 0));
          existing.alerts += 1;
          existing.sources.alerts.push(`${alert.component} ${alert.risk_level}`);
          mergedByArea.set(key, existing);
        });

        interventions.forEach((intervention: any) => {
          const key = String(intervention.location || "Singapore");
          const existing = ensureAreaAggregate(key, 48);

          existing.score = Math.max(existing.score, intervention.outcome === "Completed" ? 55 : 68);
          existing.interventions += 1;
          existing.sources.ops.push(`Ops ${intervention.intervention_type}`);
          mergedByArea.set(key, existing);
        });

        predictions.forEach((prediction) => {
          const key = prediction.area || "Singapore";
          const existing = ensureAreaAggregate(key);

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
            geometry: zone.geometry,
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
        <p>Realtime overlays now use planning-area boundary geometry first and live OneMap geocoding for unmatched zones, so alerts, ops, and ML + NEA signals stay attached to the live map surface during zoom and pan.</p>
      </div>
    </div>
  );
}
