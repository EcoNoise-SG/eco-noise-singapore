'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { MockMap } from "@/components/dashboard/MockMap";
import styles from "../dashboard.module.css";
import alertStyles from "./alerts.module.css";
import toast from "react-hot-toast";
import {
  createNotification,
  getCurrentUserIdentity,
  getRiskAlerts,
  subscribeToRiskAlerts,
  updateAlertStatus,
} from "@/lib/supabase";
import { fetchNEADengueClusters } from "@/lib/datagovsg";

interface Alert {
  id: string;
  alert_id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  time: string;
  description: string;
  area: string;
  category: string;
  status: "open" | "actioned" | "acknowledged" | "resolved";
  risk_level: string;
  component: string;
  risk_score: number;
}

const severityStyle: Record<string, string> = {
  critical: alertStyles.badgeCritical,
  high: alertStyles.badgeHigh,
  medium: alertStyles.badgeMedium,
  low: alertStyles.badgeLow,
};

const statusStyle: Record<string, string> = {
  active: alertStyles.statusOpen,
  open: alertStyles.statusOpen,
  actioned: alertStyles.statusActioned,
  acknowledged: alertStyles.statusActioned,
  resolved: alertStyles.statusResolved,
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"warnings" | "intelligence">("warnings");

  useEffect(() => {
    void loadAlerts();
    const interval = setInterval(loadAlerts, 30000); // Refresh every 30 seconds
    const subscription = subscribeToRiskAlerts(() => {
      void loadAlerts();
    });

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, []);

  const loadAlerts = async () => {
    try {
      const [dbAlerts, dengueData] = await Promise.all([
        getRiskAlerts(),
        fetchNEADengueClusters().catch(() => null)
      ]);
      
      const mappedDbAlerts = dbAlerts.map((alert: any) => {
        const riskLevel = alert.risk_level || "Medium";
        return {
          id: alert.id,
          alert_id: alert.alert_id,
          severity: riskLevel.toLowerCase() as any,
          title: `${alert.component} Risk Alert — ${alert.location}`,
          time: new Date(alert.created_at).toLocaleDateString() + " · " + new Date(alert.created_at).toLocaleTimeString(),
          description: alert.description || "No description",
          area: alert.location,
          category: alert.component,
          status: ((alert.status || "open") === "active" ? "open" : (alert.status || "open")) as any,
          risk_level: riskLevel,
          component: alert.component,
          risk_score: alert.risk_score,
        };
      });

      const dengueAlerts = (dengueData?.records || []).map((cluster: any, index: number) => {
        const locality = cluster.properties?.LOCALITY || cluster.properties?.locality || cluster.locality || "Unknown Cluster";
        const cases = parseInt(cluster.properties?.CASE_SIZE || cluster.properties?.case_size || cluster.case_size) || 0;
        const severity = cases > 25 ? "critical" : "high";
        
        return {
          id: `dengue-${index}`,
          alert_id: `DNG-${index}`,
          severity: severity as any,
          title: `Dengue Disease Outbreak — ${locality}`,
          time: "LIVE SIGNAL",
          description: `Live dengue cluster with ${cases} active cases.`,
          area: locality,
          category: "Health Monitor",
          status: "open" as any,
          risk_level: severity === "critical" ? "Critical" : "High",
          component: "Disease Monitor (C7)",
          risk_score: severity === "critical" ? 85 : 70,
        };
      });

      setAlerts([...dengueAlerts, ...mappedDbAlerts]);
    } catch (error) {
      console.error("Error loading alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (alertId: string, newStatus: string) => {
    try {
      await updateAlertStatus(alertId, newStatus);
      const identity = await getCurrentUserIdentity();
      if (identity.id) {
        await createNotification(
          identity.id,
          `Alert ${newStatus}`,
          `Alert ${alertId} is now ${newStatus}.`,
          "alert_status_changed",
          alertId,
        );
      }
      toast.success(`Alert ${newStatus}`);
      void loadAlerts();
    } catch (error) {
      console.error("Error updating alert:", error);
      toast.error("Failed to update alert");
    }
  };

  const filtered = filter === "all" ? alerts : alerts.filter((a) => a.status === filter);

  const counts = {
    critical: alerts.filter((a) => a.severity === "critical").length,
    high: alerts.filter((a) => a.severity === "high").length,
    open: alerts.filter((a) => a.status === "open").length,
  };

  return (
    <div className={styles.stack}>
      {/* Page Tabs */}
      <div className={alertStyles.tabsBar}>
        <button 
          className={`${alertStyles.tabItem} ${activeTab === "warnings" ? alertStyles.tabActive : ""}`}
          onClick={() => setActiveTab("warnings")}
        >
          Outbreak Warnings
        </button>
        <button 
          className={`${alertStyles.tabItem} ${activeTab === "intelligence" ? alertStyles.tabActive : ""}`}
          onClick={() => setActiveTab("intelligence")}
        >
          Prediction Intelligence
        </button>
      </div>

      {activeTab === "warnings" ? (
        <>
          <div className={alertStyles.tabRibbon}>
            <div className={alertStyles.ribbonCard}>
              <p>Critical Alerts</p>
              <strong style={{ color: "#dc2626", fontSize: "24px" }}>{counts.critical}</strong>
              <span className={alertStyles.ribbonSubtext}>Requiring immediate response</span>
            </div>
            <div className={alertStyles.ribbonCard}>
              <p>High Priority</p>
              <strong style={{ color: "#f59e0b", fontSize: "24px" }}>{counts.high}</strong>
              <span className={alertStyles.ribbonSubtext}>Actionable within 2 hours</span>
            </div>
            <div className={alertStyles.ribbonCard}>
              <p>Open Alerts</p>
              <strong style={{ fontSize: "24px" }}>{counts.open}</strong>
              <span className={alertStyles.ribbonSubtext}>Pending officer response</span>
            </div>
          </div>

          <MockMap title="Live Dengue Clusters & Disease Outbreak Hotspots Map (Module C7)" mapContext="disease" />

          <DashboardSection
            eyebrow="Live alert feed"
            title="All system and field alerts — ranked by severity"
          >
            <div className={alertStyles.filterRow}>
              {["all", "open", "acknowledged", "resolved"].map((f) => (
                <button
                  key={f}
                  className={`${alertStyles.filterBtn} ${filter === f ? alertStyles.filterActive : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {loading ? (
              <p style={{ textAlign: "center", padding: "20px" }}>Loading alerts...</p>
            ) : alerts.length === 0 ? (
              <p style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>No alerts found</p>
            ) : (
              <div className={alertStyles.alertsGrid}>
                {filtered.map((alert) => (
                  <div className={alertStyles.alertCard} key={alert.id}>
                    <div className={alertStyles.cardHeader}>
                      <h3 className={alertStyles.cardTitle}>{alert.title}</h3>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                        <span className={severityStyle[alert.severity]}>
                          {alert.risk_level.toUpperCase()}
                        </span>
                        <span className={`${statusStyle[alert.status]} ${alertStyles.statusBadge}`}>
                          {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className={alertStyles.metaInfo}>
                      <strong>{alert.time}</strong>
                      <span>{alert.area} · {alert.category}</span>
                    </div>

                    <p className={alertStyles.description}>{alert.description}</p>

                    <div className={alertStyles.cardFooter}>
                      <div className={alertStyles.actions}>
                        <button
                          onClick={() => toast.success("Quick note window opening...")}
                          className={`${alertStyles.actionBtn} ${alertStyles.noteBtn}`}
                        >
                          Add Quick Note
                        </button>

                        <div className={alertStyles.statusSelectCard}>
                          <select 
                            value={alert.status}
                            onChange={(e) => handleStatusChange(alert.alert_id, e.target.value)}
                            className={alertStyles.statusDropdown}
                          >
                            <option value="open">Set to Open</option>
                            <option value="acknowledged">Acknowledge</option>
                            <option value="resolved">Mark Resolved</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>
        </>
      ) : (
        <div className={alertStyles.intelligenceContainer}>
          <DashboardSection 
            eyebrow="Advanced forecasting"
            title="Strategic Prediction Intelligence"
          >
            <div className={alertStyles.intelligenceGrid}>
              <div className={alertStyles.intelligenceCard}>
                <div className={alertStyles.cardIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><polyline points="16 5 21 5 21 10"/><line x1="9" y1="15" x2="21" y2="3"/></svg>
                </div>
                <h3>Outbreak Trend Analysis</h3>
                <p>Analyzing historical data and environmental factors to project disease transmission velocity over the next 14 days.</p>
                <div className={alertStyles.statSmall}>
                  <span>Projected Confidence:</span>
                  <strong>94.2%</strong>
                </div>
              </div>

              <div className={alertStyles.intelligenceCard}>
                <div className={alertStyles.cardIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                </div>
                <h3>Environmental Risk Correlates</h3>
                <p>Identifying correlations between rainfall patterns, temperatures, and cluster emergence in high-density areas.</p>
                <div className={alertStyles.statSmall}>
                  <span>Risk Variance:</span>
                  <strong>Low</strong>
                </div>
              </div>

              <div className={alertStyles.intelligenceCard}>
                <div className={alertStyles.cardIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <h3>Predictive Containment</h3>
                <p>Strategic deployment recommendations for preventing outbreak expansion before new clusters are officially reported.</p>
                <div className={alertStyles.statSmall}>
                  <span>Resource Efficiency:</span>
                  <strong>+22%</strong>
                </div>
              </div>
            </div>

            <div className={alertStyles.mapPlaceholder}>
              <div className={alertStyles.mapPlaceholderContent}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="12" r="3"/></svg>
                <h4>Advanced Prediction Map Loading...</h4>
                <p>Visualizing predictive vectors and containment zones.</p>
              </div>
            </div>
          </DashboardSection>
        </div>
      )}
    </div>
  );
}
