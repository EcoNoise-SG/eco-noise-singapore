'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useState } from "react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import styles from "../dashboard.module.css";
import { getRiskAlerts, subscribeToRiskAlerts } from "@/lib/supabase";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [signals, setSignals] = useState<any[]>([]);

  useEffect(() => {
    async function loadSignals() {
      const alerts = await getRiskAlerts();
      const wellbeingSignals = alerts.filter((alert: any) => ["C8", "C9", "C10"].includes(alert.component));
      setSignals(wellbeingSignals);
    }

    void loadSignals();
    const subscription = subscribeToRiskAlerts(() => {
      void loadSignals();
    });
    return () => subscription.unsubscribe();
  }, []);

  const filtered = useMemo(
    () =>
      signals.filter(
        (signal) =>
          signal.location?.toLowerCase().includes(search.toLowerCase()) ||
          signal.component?.toLowerCase().includes(search.toLowerCase()) ||
          signal.description?.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, signals],
  );

  const highRiskCount = signals.filter((signal) => signal.risk_level === "Critical").length;
  const mediumRiskCount = signals.filter((signal) => signal.risk_level === "High" || signal.risk_level === "Medium").length;
  const activeCount = signals.filter((signal) => signal.status !== "resolved").length;

  return (
    <div className={styles.stack}>
      <div className={styles.gridThree}>
        <div className={styles.metricCard}>
          <p>Total Workers Monitored</p>
          <strong>{signals.length}</strong>
          <span className={styles.metaLabel}>Live worker welfare signals across C8-C10</span>
        </div>
        <div className={styles.metricCard}>
          <p>High Risk (Critical)</p>
          <strong style={{ color: "#dc2626" }}>{highRiskCount}</strong>
          <span className={styles.metaLabel}>Immediate intervention needed</span>
        </div>
        <div className={styles.metricCard}>
          <p>Active Monitoring</p>
          <strong style={{ color: "#f59e0b" }}>{activeCount}</strong>
          <span className={styles.metaLabel}>{mediumRiskCount} medium/high live welfare alerts</span>
        </div>
      </div>

      <DashboardSection eyebrow="Worker wellbeing" title="Live mental health and welfare risk signals">
        <div style={{ marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="Search by component, area, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "12px 16px",
              borderRadius: "50px",
              border: "1px solid #e2e8f0",
              fontFamily: "inherit",
              fontSize: "0.875rem",
              width: "100%",
              outline: "none",
              background: "#f8fafc",
              maxWidth: "400px",
            }}
          />
        </div>

        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Alert ID</th>
                <th>Component</th>
                <th>Area</th>
                <th>Risk Score</th>
                <th>Risk Drivers</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((signal) => (
                <tr key={signal.alert_id}>
                  <td style={{ fontSize: "0.75rem", color: "#64748b" }}>{signal.alert_id}</td>
                  <td style={{ fontWeight: 700 }}>{signal.component}</td>
                  <td style={{ fontSize: "0.875rem", color: "#64748b" }}>{signal.location}</td>
                  <td>
                    <span style={{
                      background: Number(signal.risk_score || 0) >= 80 ? "#fef2f2" : Number(signal.risk_score || 0) >= 60 ? "#fef3c7" : "#f0fdf4",
                      color: Number(signal.risk_score || 0) >= 80 ? "#991b1b" : Number(signal.risk_score || 0) >= 60 ? "#92400e" : "#166534",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                    }}>
                      {signal.risk_score}/100
                    </span>
                  </td>
                  <td style={{ fontSize: "0.8rem", color: "#64748b" }}>{signal.description || "No live description"}</td>
                  <td>
                    <span style={{ color: signal.status === "resolved" ? "#22c55e" : "#dc2626", fontWeight: 700, fontSize: "0.75rem" }}>
                      ● {signal.status === "resolved" ? "Resolved" : "Active"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardSection>

      <div className={styles.gridTwo}>
        <DashboardSection eyebrow="Risk factors" title="Live welfare risk logic">
          <div className={styles.listCard}>
            <ul className={styles.list}>
              <li><strong>C8:</strong> Dormitory transition and accommodation stress signals.</li>
              <li><strong>C9:</strong> Salary non-payment or financial distress alerts.</li>
              <li><strong>C10:</strong> Mental health or wellbeing risk escalation.</li>
              <li><strong>Source of truth:</strong> Live risk alerts, not placeholder worker profiles.</li>
            </ul>
          </div>
        </DashboardSection>

        <DashboardSection eyebrow="Intervention programs" title="Operational response pathways">
          <div className={styles.listCard}>
            <ul className={styles.list}>
              <li><strong>Counseling:</strong> Triggered when C10 alerts remain unresolved.</li>
              <li><strong>Health screening:</strong> Used when welfare and dormitory risk signals overlap.</li>
              <li><strong>Escalation review:</strong> Open C9 alerts should feed directly into reports and interventions.</li>
              <li><strong>Outcome logging:</strong> Field teams should close the loop through intervention findings.</li>
            </ul>
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}
