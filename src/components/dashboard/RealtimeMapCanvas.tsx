"use client";

import { useEffect } from "react";
import type { Feature, Geometry } from "geojson";
import L from "leaflet";
import { Circle, GeoJSON, MapContainer, Pane, TileLayer, Tooltip, useMap } from "react-leaflet";
import styles from "./map.module.css";

type OverlayLayer = "all" | "alerts" | "ops" | "ml-nea";

type ZoneOverlay = {
  area: string;
  coordinates: [number, number];
  geometry?: Geometry;
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
  metadata?: Record<string, any>;
};

function layerColors(layer: OverlayLayer, status: string) {
  if (layer === "alerts") return { stroke: "#ef4444", fill: "#f97316" };
  if (layer === "ops") return { stroke: "#0f172a", fill: "#2563eb" };
  if (layer === "ml-nea") return { stroke: "#0f766e", fill: "#10b981" };
  if (status === "Critical") return { stroke: "#b91c1c", fill: "#ef4444" };
  if (status === "High") return { stroke: "#ea580c", fill: "#f97316" };
  if (status === "Elevated") return { stroke: "#0369a1", fill: "#38bdf8" };
  return { stroke: "#475569", fill: "#94a3b8" };
}

function radiusFromScore(score: number) {
  return Math.max(240, score * 11);
}

function MapViewportSync({
  zones,
  selectedArea,
}: {
  zones: ZoneOverlay[];
  selectedArea: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!zones.length) return;

    const selectedZone = zones.find((zone) => zone.area === selectedArea);
    if (selectedZone?.geometry) {
      const geometryLayer = L.geoJSON(selectedZone.geometry);
      map.flyToBounds(geometryLayer.getBounds().pad(0.15), {
        animate: true,
        duration: 1.1,
      });
      return;
    }

    if (selectedZone) {
      map.flyTo(selectedZone.coordinates, Math.max(map.getZoom(), 11), {
        animate: true,
        duration: 1.1,
      });
      return;
    }

    const bounds = L.latLngBounds(zones.map((zone) => zone.coordinates));
    map.fitBounds(bounds.pad(0.22), { animate: true, duration: 0.9 });
  }, [map, selectedArea, zones]);

  useEffect(() => {
    map.invalidateSize();
  }, [map]);

  return null;
}

export default function RealtimeMapCanvas({
  zones,
  activeLayer,
  selectedArea,
  onZoneSelect,
}: {
  zones: ZoneOverlay[];
  activeLayer: OverlayLayer;
  selectedArea: string | null;
  onZoneSelect: (area: string) => void;
}) {
  return (
    <MapContainer
      center={[1.3521, 103.8198]}
      zoom={11}
      minZoom={10}
      maxZoom={19}
      scrollWheelZoom
      zoomControl
      className={styles.leafletMap}
      maxBounds={[
        [1.144, 103.535],
        [1.494, 104.502],
      ]}
      maxBoundsViscosity={1}
    >
      <TileLayer
        attribution='<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:18px;width:18px;vertical-align:middle;" alt="OneMap logo" /> <a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">OneMap</a> | <a href="https://www.sla.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Land Authority</a>'
        url="https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png"
        detectRetina
      />

      <Pane name="risk-rings" style={{ zIndex: 420 }}>
        {zones.map((zone) => {
          const palette = layerColors(activeLayer, zone.status);
          const isSelected = zone.area === selectedArea;

          return (
            zone.geometry ? (
              <GeoJSON
                key={`${zone.area}-${activeLayer}`}
                data={{ type: "Feature", properties: { area: zone.area }, geometry: zone.geometry } as Feature}
                style={{
                  color: palette.stroke,
                  weight: isSelected ? 3 : 2,
                  fillColor: palette.fill,
                  fillOpacity: isSelected ? 0.24 : 0.14,
                }}
                eventHandlers={{
                  click: () => onZoneSelect(zone.area),
                }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -8]}
                  opacity={1}
                  permanent
                  className={`${styles.mapTooltip} ${isSelected ? styles.mapTooltipActive : ""}`}
                >
                  <div className={styles.tooltipInner}>
                    <strong>{zone.area}</strong>
                    <span>{zone.status}</span>
                    <p>{zone.detail}</p>
                    {zone.metadata && (zone.metadata.HOMES || zone.metadata.PUBLIC_PLACES || zone.metadata.CONSTRUCTION_SITES) && (
                      <div className={styles.metadataGrid}>
                        {zone.metadata.HOMES !== undefined && <span>🏠 {zone.metadata.HOMES} Homes</span>}
                        {zone.metadata.PUBLIC_PLACES !== undefined && <span>🏢 {zone.metadata.PUBLIC_PLACES} Public</span>}
                        {zone.metadata.CONSTRUCTION_SITES !== undefined && <span>🏗️ {zone.metadata.CONSTRUCTION_SITES} Const.</span>}
                      </div>
                    )}
                    <small>
                      {zone.alerts} alerts · {zone.interventions} ops
                      {zone.predictionScore ? ` · ML ${zone.predictionScore}` : ""}
                    </small>
                  </div>
                </Tooltip>
              </GeoJSON>
            ) : (
              <Circle
                key={`${zone.area}-${activeLayer}`}
                center={zone.coordinates}
                radius={radiusFromScore(zone.score)}
                pathOptions={{
                  color: palette.stroke,
                  weight: isSelected ? 3 : 2,
                  fillColor: palette.fill,
                  fillOpacity: isSelected ? 0.28 : 0.18,
                }}
                eventHandlers={{
                  click: () => onZoneSelect(zone.area),
                }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -8]}
                  opacity={1}
                  permanent
                  className={`${styles.mapTooltip} ${isSelected ? styles.mapTooltipActive : ""}`}
                >
                  <div className={styles.tooltipInner}>
                    <strong>{zone.area}</strong>
                    <span>{zone.status}</span>
                    <p>{zone.detail}</p>
                    {zone.metadata && (zone.metadata.HOMES || zone.metadata.PUBLIC_PLACES || zone.metadata.CONSTRUCTION_SITES) && (
                      <div className={styles.metadataGrid}>
                        {zone.metadata.HOMES !== undefined && <span>🏠 {zone.metadata.HOMES} Homes</span>}
                        {zone.metadata.PUBLIC_PLACES !== undefined && <span>🏢 {zone.metadata.PUBLIC_PLACES} Public</span>}
                        {zone.metadata.CONSTRUCTION_SITES !== undefined && <span>🏗️ {zone.metadata.CONSTRUCTION_SITES} Const.</span>}
                      </div>
                    )}
                    <small>
                      {zone.alerts} alerts · {zone.interventions} ops
                      {zone.predictionScore ? ` · ML ${zone.predictionScore}` : ""}
                    </small>
                  </div>
                </Tooltip>
              </Circle>
            )
          );
        })}
      </Pane>

      <MapViewportSync zones={zones} selectedArea={selectedArea} />
    </MapContainer>
  );
}
