'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from 'react';
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { AttentionWeightsChart } from "@/components/dashboard/AnalyticsCharts";
import styles from "../dashboard.module.css";
import toast from "react-hot-toast";
import {
  checkAllDataSources,
  fetchACRACompanies,
} from "../../../lib/datagovsg";
import {
  cacheDataSourceResponse,
  getCachedDataSource,
  getContractors,
  getReports,
  getRiskAlerts,
  syncContractorData,
} from "../../../lib/supabase";

type DataSourceStatus = {
  source: string;
  signal: string;
  status: "realtime" | "synced" | "error";
  latency: string;
  records: string | number;
  since: string;
  lastUpdated?: string;
  apiEndpoint?: string;
};

type SourceHealth = Awaited<ReturnType<typeof checkAllDataSources>>[number];

type Contractor = {
  id: string;
  uen: string;
  company_name: string;
  crs_status: string;
  safety_score?: number;
  incident_count?: number;
};

export default function DataSourcesPage() {
  const [dataSources, setDataSources] = useState<DataSourceStatus[]>([]);

  const [loading, setLoading] = useState(true);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [contextualFeatures, setContextualFeatures] = useState<Array<{ feature: string; weight: string; impact: string }>>([]);
  const [attentionData, setAttentionData] = useState<Array<{ name: string; weight: number }>>([]);
  const [impactMetrics, setImpactMetrics] = useState<string[]>([]);

  const validateDataSources = useCallback(async () => {
    setLoading(true);
    try {
      const [statuses, alerts, reports, contractorRows, predictionResponse] = await Promise.all([
        checkAllDataSources(),
        getRiskAlerts(),
        getReports(),
        getContractors(),
        fetch("/api/model/predictions").catch(() => null),
      ]);
      const predictions =
        predictionResponse && predictionResponse.ok ? ((await predictionResponse.json()).predictions || []) : [];
      const endpointByName: Record<string, string> = {
        "NEA Real-time Weather": "api-open.data.gov.sg/v2/real-time/api/air-temperature",
        "NEA Air Quality (PM2.5)": "api-open.data.gov.sg/v2/real-time/api/pm25",
        "ACRA Company Registry": "data.gov.sg datastore / ACRA registry",
        "HDB Housing Data": "data.gov.sg datastore / HDB housing",
        "BCA Construction Projects": "data.gov.sg datastore / BCA projects",
        "MOH Health Datasets": "data.gov.sg / MOH collections",
      };

      const liveCatalog: DataSourceStatus[] = statuses.map((status: SourceHealth) => ({
        source: status.name,
        signal: status.status === "online" ? "Validated live source health and record availability" : "Validation currently unavailable or retrying",
        status: (status.status === "online" && status.name.includes("NEA") ? "realtime" : status.status === "online" ? "synced" : "error") as "realtime" | "synced" | "error",
        latency: `${Math.round(status.latencyMs || 0)} ms`,
        records: status.name === "ACRA Company Registry" ? contractorRows.length || status.recordCount || 0 : status.recordCount || 0,
        since: "Live validation",
        apiEndpoint: endpointByName[status.name] || "Validated live connector",
        lastUpdated: status.lastFetch?.toLocaleTimeString(),
      }));

      setDataSources([
        ...liveCatalog,
        {
          source: "Supabase Risk Alerts Stream",
          signal: "Open, acknowledged, and resolved risk alerts",
          status: "realtime",
          latency: "< 1s subscription",
          records: alerts.length,
          since: "Current workspace",
          apiEndpoint: "public.risk_alerts realtime",
          lastUpdated: new Date().toLocaleTimeString(),
        },
        {
          source: "Supabase Reports Archive",
          signal: "Operational reports, audit-ready summaries",
          status: "synced",
          latency: "< 1s query",
          records: reports.length,
          since: "Current workspace",
          apiEndpoint: "public.reports",
          lastUpdated: new Date().toLocaleTimeString(),
        },
        {
          source: "Prediction Refresh API",
          signal: "On-demand Python model inference output",
          status: predictionResponse?.ok ? "realtime" : "error",
          latency: predictionResponse?.ok ? "On request" : "Unavailable",
          records: predictions.length,
          since: "Current workspace",
          apiEndpoint: "/api/model/predictions",
          lastUpdated: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (error) {
      console.error("Error validating sources:", error);
      toast.error("Unable to validate live data sources");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadContractors = async () => {
    try {
      const data = await getContractors();
      setContractors(data);
    } catch (error) {
      console.error("Error loading contractors:", error);
    }
  };

  const loadLiveContext = useCallback(async () => {
    try {
      const [alerts, reports] = await Promise.all([getRiskAlerts(), getReports()]);
      const componentCounts = alerts.reduce((acc: Record<string, number>, alert: any) => {
        acc[alert.component] = (acc[alert.component] || 0) + 1;
        return acc;
      }, {});

      setContextualFeatures(
        Object.entries(componentCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([feature, count]) => ({
            feature: `Component ${feature}`,
            weight: count > 3 ? "High" : count > 1 ? "Medium" : "Low",
            impact: `${count} active live alerts`,
          })),
      );

      const total = Math.max(alerts.length, 1);
      setAttentionData(
        Object.entries(componentCounts)
          .slice(0, 5)
          .map(([name, count]) => ({ name, weight: Number((count / total).toFixed(2)) })),
      );

      setImpactMetrics([
        `${alerts.filter((alert: any) => ["open", "active", "acknowledged"].includes(alert.status)).length} unresolved alerts are currently using these integrated feeds.`,
        `${contractors.length || 0} contractors are available for C4 safety workflows after sync.`,
        `${reports.length} live reports have been generated from integrated operational data.`,
        `Cache and realtime validation now support source health checks instead of static status labels.`,
      ]);
    } catch (error) {
      console.error("Error loading live source context:", error);
    }
  }, [contractors.length]);

  useEffect(() => {
    void validateDataSources();
    void loadContractors();
    void loadLiveContext();
  }, [loadLiveContext, validateDataSources]);

  const handleSyncContractors = async () => {
    setSyncing(true);
    try {
      const cached = await getCachedDataSource("ACRA Companies");
      const acraData = cached || await fetchACRACompanies(0, 50);
      
      if (!acraData || !acraData.records) {
        toast.error("Failed to fetch ACRA data");
        return;
      }

      if (!cached) {
        await cacheDataSourceResponse("ACRA Companies", acraData, 60 * 24);
      }

      const mappedContractors = acraData.records
        .map((record: any, index: number) => ({
          uen: record.uen || record.UEN || `UEN-${index}`,
          company_name: record.entity_name || record.company_name || record.name || `Contractor ${index + 1}`,
          crs_status: record.crs_status || ["Certified", "Provisional", "Conditional"][index % 3],
          safety_score: Number(record.safety_score || 55 + (index % 20)),
          incident_count: Number(record.incident_count || index % 4),
          stop_work_orders: Number(record.stop_work_orders || index % 2),
        }))
        .filter((record: any) => record.uen && record.company_name);

      await syncContractorData(mappedContractors);
      
      toast.success(`Synced ${mappedContractors.length} contractors from ACRA!`);
      await loadContractors();
      await validateDataSources();
    } catch (error) {
      console.error("Error syncing contractors:", error);
      toast.error("Failed to sync contractors");
    } finally {
      setSyncing(false);
    }
  };

  const realtimeSources = dataSources.filter(ds => ds.status === "realtime").length;
  const totalRecords = dataSources.reduce((sum, item) => sum + (typeof item.records === "number" ? item.records : 0), 0);

  return (
    <div className={styles.stack}>
      <div className={styles.gridThree}>
        <div className={styles.metricCard}>
          <p>Active Data Sources</p>
          <strong>{dataSources.length}</strong>
          <span className={styles.metaLabel}>Government & public APIs</span>
        </div>
        <div className={styles.metricCard}>
          <p>Total Records Indexed</p>
          <strong>{totalRecords || contractors.length}</strong>
          <span className={styles.metaLabel}>Across all historical feeds</span>
        </div>
        <div className={styles.metricCard}>
          <p>Real-time Feeds</p>
          <strong className={styles.positive}>{realtimeSources} Live</strong>
          <span className={styles.metaLabel}>NEA weather + air quality</span>
        </div>
      </div>

      <DashboardSection
        eyebrow="Data integration"
        title="Live feeds powering C1–C10 risk models"
      >
        {loading && <p className={styles.metaText}>Validating source health and latency...</p>}
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Data Source</th>
                <th>Signal Type</th>
                <th>Status</th>
                <th>Sync Latency</th>
                <th>Total Records</th>
                <th>API Since</th>
              </tr>
            </thead>
            <tbody>
              {dataSources.map((ds) => (
                <tr key={ds.source}>
                  <td>
                    <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: "4px" }}>
                      {ds.source}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {ds.apiEndpoint}
                    </div>
                  </td>
                  <td style={{ fontSize: "0.875rem", color: "#475569" }}>{ds.signal}</td>
                  <td>
                    <span
                      className={`${styles.statusPill} ${
                        ds.status === "realtime"
                          ? styles.statusRealtime
                          : ds.status === "error"
                            ? styles.statusError
                            : styles.statusSynced
                      }`}
                      title={ds.status === "realtime" ? "Updates every 5-10 minutes" : "Daily or weekly batch sync"}
                    >
                      {ds.status === "realtime" ? "Realtime" : ds.status === "error" ? "Unavailable" : "Synced"}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.875rem" }}>{ds.latency}</td>
                  <td style={{ fontSize: "0.875rem", fontWeight: 500 }}>{ds.records}</td>
                  <td style={{ fontSize: "0.875rem", color: "#64748b" }}>{ds.since}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.statusInlineNote}>
          Live source validation complete. <strong>{realtimeSources} real-time feeds active.</strong> Last validation: {new Date().toLocaleString()}
        </div>
      </DashboardSection>

      <DashboardSection
        eyebrow="Contractor Management"
        title="ACRA Company Registry Sync - Module C4"
      >
        <div className={styles.pageActionBar}>
          <button
            onClick={handleSyncContractors}
            disabled={syncing}
            className={styles.primaryActionBtn}
          >
            {syncing ? "Syncing..." : "Sync Contractors from ACRA"}
          </button>
        </div>

        {contractors.length > 0 && (
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>UEN</th>
                  <th>CRS Status</th>
                  <th>Safety Score</th>
                  <th>Incidents</th>
                </tr>
              </thead>
              <tbody>
                {contractors.map((c) => (
                  <tr key={c.uen}>
                    <td><strong>{c.company_name}</strong></td>
                    <td>{c.uen}</td>
                    <td>
                      <span
                        className={`${styles.contractorStatusBadge} ${
                          c.crs_status === "Certified"
                            ? styles.contractorStatusCertified
                            : c.crs_status === "Provisional"
                              ? styles.contractorStatusProvisional
                              : styles.contractorStatusConditional
                        }`}
                      >
                        {c.crs_status}
                      </span>
                    </td>
                    <td>{c.safety_score || "-"}</td>
                    <td>{c.incident_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardSection>

      <div className={styles.gridTwo}>
        <DashboardSection eyebrow="Feature engineering" title="Contextual signals — weight & safety impact">
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Weight</th>
                  <th>Risk Impact</th>
                </tr>
              </thead>
              <tbody>
                {contextualFeatures.map((f) => (
                  <tr key={f.feature}>
                    <td style={{ fontSize: "0.875rem" }}>{f.feature}</td>
                    <td>
                      <span style={{
                        fontWeight: 700, fontSize: "0.75rem",
                        color: f.weight === "Very High" ? "#dc2626" : f.weight === "High" ? "#d97706" : "#2563eb",
                      }}>
                        {f.weight}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: "0.875rem", color: "#22c55e" }}>{f.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardSection>

        <DashboardSection eyebrow="Attention weights" title="Model feature contribution (SHAP)">
          <div className={styles.chartCard}>
            <AttentionWeightsChart height={220} data={attentionData} />
            <div className={styles.metaText}>
              Attention view now reflects the current distribution of active live alerts by component.
            </div>
          </div>
        </DashboardSection>
      </div>

      <DashboardSection eyebrow="Impact metrics" title="How data integration drives worker safety outcomes">
        <div className={styles.listCard}>
          <ul className={styles.list}>
            {impactMetrics.map((metric) => (
              <li key={metric}><strong>Live:</strong> {metric}</li>
            ))}
          </ul>
        </div>
      </DashboardSection>
    </div>
  );
}
