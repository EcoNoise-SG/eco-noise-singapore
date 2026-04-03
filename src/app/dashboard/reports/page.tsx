'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import styles from "../dashboard.module.css";
import {
  createReport,
  getCurrentUserIdentity,
  getReports,
  getRiskAlerts,
  publishReport,
  subscribeToReports,
} from "@/lib/supabase";
import toast from "react-hot-toast";

const typeColors: Record<string, { bg: string; color: string }> = {
  Weekly: { bg: "#eff6ff", color: "#1d4ed8" },
  Monthly: { bg: "#f0fdf4", color: "#166534" },
  Quarterly: { bg: "#faf5ff", color: "#7c3aed" },
};

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function loadReports() {
      const data = await getReports();
      setReports(data);
    }

    void loadReports();
    const subscription = subscribeToReports(() => {
      void loadReports();
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleGenerateReport = async () => {
    setCreating(true);
    try {
      const [identity, alerts] = await Promise.all([
        getCurrentUserIdentity(),
        getRiskAlerts(),
      ]);
      const reportId = `RPT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      const openAlerts = alerts.filter((alert: any) => ['open', 'active', 'acknowledged'].includes(alert.status));

      await createReport({
        report_id: reportId,
        title: `Operational Risk Brief — ${new Date().toLocaleDateString()}`,
        report_type: "Weekly",
        summary: `${openAlerts.length} active alerts across ${new Set(openAlerts.map((alert: any) => alert.location)).size} locations.`,
        data: {
          generated_at: new Date().toISOString(),
          active_alerts: openAlerts.length,
          top_locations: openAlerts.slice(0, 5).map((alert: any) => alert.location),
        },
        generated_by: identity.id,
      });

      toast.success("Report generated");
      const nextReports = await getReports();
      setReports(nextReports);
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={styles.stack}>
      <div className={styles.gridThree}>
        <div className={styles.metricCard}>
          <p>Reports Published</p>
          <strong>{reports.filter((report) => report.status === "published").length}</strong>
          <span className={styles.metaLabel}>Live report archive</span>
        </div>
        <div className={styles.metricCard}>
          <p>Draft Reports</p>
          <strong className={styles.positive}>{reports.filter((report) => report.status !== "published").length}</strong>
          <span className={styles.metaLabel}>Ready for publication</span>
        </div>
        <div className={styles.metricCard}>
          <p>Next Report Action</p>
          <strong>{creating ? "Generating..." : "Generate Now"}</strong>
          <span className={styles.metaLabel}>Realtime based on alert data</span>
        </div>
      </div>

      <DashboardSection
        eyebrow="Report archive"
        title="Intelligence briefs and operational reviews"
      >
        <button
          onClick={handleGenerateReport}
          disabled={creating}
          style={{
            marginBottom: "16px",
            padding: "10px 20px",
            background: creating ? "#cbd5e1" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: creating ? "not-allowed" : "pointer",
          }}
        >
          {creating ? "Generating..." : "Generate Report"}
        </button>

        <div className={styles.timeline}>
          {reports.map((report) => (
            <div className={styles.timelineItem} key={report.report_id}>
              <div className={styles.timelineHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <strong>{report.title}</strong>
                  <span
                    style={{
                      background: typeColors[report.report_type]?.bg ?? "#f1f5f9",
                      color: typeColors[report.report_type]?.color ?? "#475569",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                    }}
                  >
                    {report.report_type}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: report.status === "draft" ? "#d97706" : "#22c55e",
                  }}
                >
                  {report.status}
                </span>
              </div>
              <span className={styles.timeLabel}>{report.report_id} · {new Date(report.created_at).toLocaleString()}</span>
              <p className={styles.actionDetail}>{report.summary}</p>
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                {report.status !== "published" && (
                  <button
                    onClick={async () => {
                      await publishReport(report.report_id);
                      toast.success("Report published");
                      setReports(await getReports());
                    }}
                    style={{
                      padding: "8px 14px",
                      background: "#16a34a",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Publish Report
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>
    </div>
  );
}
