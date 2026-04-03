'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import styles from "../dashboard.module.css";
import {
  getAuditLogs,
  getCurrentUserIdentity,
  subscribeToAuditLogs,
} from "@/lib/supabase";

const severityStyle: Record<string, { bg: string; color: string; label: string }> = {
  info: { bg: "#eff6ff", color: "#1d4ed8", label: "INFO" },
  warning: { bg: "#fffbeb", color: "#b45309", label: "WARN" },
  critical: { bg: "#fef2f2", color: "#dc2626", label: "ERROR" },
};

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    async function loadLogs() {
      const identity = await getCurrentUserIdentity();
      const data = await getAuditLogs(identity.isDemo ? undefined : identity.id, 100);
      setLogs(data);
    }

    void loadLogs();
    const subscription = subscribeToAuditLogs(() => {
      void loadLogs();
    });

    return () => subscription.unsubscribe();
  }, []);

  const warningCount = logs.filter((log) => /failed|error|critical/i.test(log.action || "")).length;

  return (
    <div className={styles.stack}>
      <div className={styles.gridThree}>
        <div className={styles.metricCard}>
          <p>Log Entries (24h)</p>
          <strong>{logs.length}</strong>
          <span className={styles.metaLabel}>Realtime audit trail</span>
        </div>
        <div className={styles.metricCard}>
          <p>Warnings / Errors</p>
          <strong style={{ color: "#f59e0b" }}>{warningCount}</strong>
          <span className={styles.metaLabel}>Derived from recent actions</span>
        </div>
        <div className={styles.metricCard}>
          <p>Scheduled System Jobs</p>
          <strong className={styles.positive}>Tracked</strong>
          <span className={styles.metaLabel}>Backed by live audit events</span>
        </div>
      </div>

      <DashboardSection
        eyebrow="Audit trail"
        title="System and user activity log — live feed"
      >
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Severity</th>
                <th>Log ID</th>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const severity = /failed|error|critical/i.test(log.action || "") ? "critical" : "info";
                return (
                  <tr key={log.id}>
                    <td>
                      <span style={{
                        background: severityStyle[severity].bg,
                        color: severityStyle[severity].color,
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                      }}>
                        {severityStyle[severity].label}
                      </span>
                    </td>
                    <td><code style={{ fontSize: "0.75rem", color: "#64748b" }}>LOG-{log.id}</code></td>
                    <td style={{ fontSize: "0.8125rem", fontWeight: 500 }}>{log.user_id}</td>
                    <td style={{ fontSize: "0.8125rem", color: "#334155", maxWidth: "320px" }}>{log.action}</td>
                    <td style={{ fontSize: "0.8125rem", color: "#0f766e" }}>{log.resource_type || "-"}</td>
                    <td style={{ fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DashboardSection>
    </div>
  );
}
