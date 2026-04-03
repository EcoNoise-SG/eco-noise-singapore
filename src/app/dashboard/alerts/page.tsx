'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
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
      const dbAlerts = await getRiskAlerts();
      
      // Map database alerts to UI format
      const mappedAlerts = dbAlerts.map((alert: any) => {
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

      setAlerts(mappedAlerts);
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
      <div className={styles.gridThree}>
        <div className={styles.metricCard}>
          <p>Critical Alerts</p>
          <strong style={{ color: "#dc2626" }}>{counts.critical}</strong>
          <span className={styles.metaLabel}>Requiring immediate response</span>
        </div>
        <div className={styles.metricCard}>
          <p>High Priority</p>
          <strong style={{ color: "#f59e0b" }}>{counts.high}</strong>
          <span className={styles.metaLabel}>Actionable within 2 hours</span>
        </div>
        <div className={styles.metricCard}>
          <p>Open Alerts</p>
          <strong>{counts.open}</strong>
          <span className={styles.metaLabel}>Pending officer response</span>
        </div>
      </div>

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
          <div className={styles.timeline}>
            {filtered.map((alert) => (
              <div className={styles.timelineItem} key={alert.alert_id}>
                <div className={styles.timelineHeader}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <strong>{alert.title}</strong>
                    <span className={severityStyle[alert.severity]}>
                      {alert.risk_level.toUpperCase()}
                    </span>
                  </div>
                  <span className={statusStyle[alert.status]}>
                    {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                  </span>
                </div>
                <span className={styles.timeLabel}>{alert.time} · {alert.area} · {alert.category}</span>
                <p className={styles.actionDetail}>{alert.description}</p>
                <p style={{ marginTop: "8px", fontSize: "12px", color: "#64748b" }}>
                  Risk Score: {alert.risk_score}/100
                </p>
                <div className={styles.logicNode}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6"/><path d="M12 9v6"/><circle cx="12" cy="12" r="10"/></svg>
                  <span>Alert ID: {alert.alert_id}</span>
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  {alert.status === "open" && (
                    <>
                      <button
                        onClick={() => handleStatusChange(alert.alert_id, "acknowledged")}
                        style={{
                          padding: "6px 12px",
                          background: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => handleStatusChange(alert.alert_id, "resolved")}
                        style={{
                          padding: "6px 12px",
                          background: "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        Resolve
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  );
}
