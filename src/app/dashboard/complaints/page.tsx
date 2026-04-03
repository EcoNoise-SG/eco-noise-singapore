'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { MultiOutputRadarChart, AnomalyDetectionChart } from "@/components/dashboard/AnalyticsCharts";
import styles from "../dashboard.module.css";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  createIntervention,
  getCurrentUserIdentity,
  getInterventions,
  subscribeToInterventions,
} from "@/lib/supabase";

interface Intervention {
  id: string;
  intervention_id: string;
  type: string;
  location: string;
  assigned_to: string;
  status: string;
  start_time: string;
  objectives: string;
  findings?: string;
  created_at: string;
}

interface InterventionModal {
  isOpen: boolean;
  type: string;
  location: string;
  officer: string;
  objectives: string;
}

const INTERVENTION_TYPES = [
  "WSH_Inspection",
  "Health_Screening",
  "Counseling",
  "Cooling_Measures",
  "Ventilation_Audit",
  "Contractor_Audit",
];

const directionIcon = (d: string) => {
  if (d === "up") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
  );
  if (d === "down") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m19 12-7 7-7-7"/><path d="M12 5v14"/></svg>
  );
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
  );
};

export default function ComplaintsPage() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryMetrics, setCategoryMetrics] = useState<any[]>([]);
  const [forecastDrivers, setForecastDrivers] = useState<any[]>([]);
  const [complaintTrend, setComplaintTrend] = useState<any[]>([]);
  const [modal, setModal] = useState<InterventionModal>({
    isOpen: false,
    type: "WSH_Inspection",
    location: "",
    officer: "Officer_001",
    objectives: "",
  });

  useEffect(() => {
    void loadInterventions();
    const interval = setInterval(loadInterventions, 30000);
    const subscription = subscribeToInterventions(() => {
      void loadInterventions();
    });
    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, []);

  const loadInterventions = async () => {
    try {
      const data = await getInterventions();
      const grouped = data.reduce((acc: Record<string, number>, item: any) => {
        acc[item.intervention_type] = (acc[item.intervention_type] || 0) + 1;
        return acc;
      }, {});

      setCategoryMetrics([
        {
          label: "WSH Inspections",
          value: String(grouped.WSH_Inspection || 0),
          direction: grouped.WSH_Inspection > 2 ? "up" : "flat",
          driver: "Live intervention volume for inspection workflows",
        },
        {
          label: "Machinery Safety Actions",
          value: String(grouped.Contractor_Audit || 0),
          direction: grouped.Contractor_Audit > 0 ? "up" : "flat",
          driver: "Derived from contractor audit interventions",
        },
        {
          label: "Heat Stress Responses",
          value: String((grouped.Health_Screening || 0) + (grouped.Cooling_Measures || 0)),
          direction: (grouped.Health_Screening || 0) > 0 ? "up" : "flat",
          driver: "Health screening and cooling interventions",
        },
      ]);

      setForecastDrivers(
        Object.entries(grouped).map(([category, count]) => ({
          category: category.replace(/_/g, " "),
          driver: `${count} live interventions recorded for this workflow.`,
          target: count > 0 ? "Operational response active" : "Awaiting escalation",
        })),
      );

      setComplaintTrend(
        data.slice(0, 5).map((item: any, index: number) => ({
          week: `W${String(index + 8).padStart(2, "0")}`,
          fallRisk: item.intervention_type === "WSH_Inspection" ? 1 : 0,
          machineryRisk: item.intervention_type === "Contractor_Audit" ? 1 : 0,
          heatRisk: ["Health_Screening", "Cooling_Measures"].includes(item.intervention_type) ? 1 : 0,
        })),
      );

      setInterventions(data.map((int: any) => ({
        id: int.id,
        intervention_id: int.intervention_id,
        type: int.intervention_type,
        location: int.location,
        assigned_to: int.assigned_to,
        status: int.outcome || "In Progress",
        start_time: new Date(int.start_time).toLocaleString(),
        objectives: typeof int.objectives === 'string' ? int.objectives : JSON.stringify(int.objectives || {}),
        findings: typeof int.findings === 'string' ? int.findings : JSON.stringify(int.findings || {}),
        created_at: new Date(int.created_at).toLocaleString(),
      })));
    } catch (error) {
      console.error("Error loading interventions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIntervention = async () => {
    if (!modal.location || !modal.objectives) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const identity = await getCurrentUserIdentity();
      const intervention_id = `INT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;
      
      await createIntervention({
        intervention_id,
        intervention_type: modal.type,
        location: modal.location,
        assigned_to: identity.id,
        team_members: [modal.officer],
        start_time: new Date().toISOString(),
        objectives: {
          primary: modal.objectives,
          requested_officer: modal.officer,
        },
      });

      toast.success(`Intervention ${intervention_id} created!`);
      setModal({ isOpen: false, type: "WSH_Inspection", location: "", officer: "Officer_001", objectives: "" });
      void loadInterventions();
    } catch (error) {
      console.error("Error creating intervention:", error);
      toast.error("Failed to create intervention");
    }
  };

  return (
    <div className={styles.stack}>

      <div className={styles.gridThree}>
        {categoryMetrics.map((m) => (
          <div className={styles.metricCard} key={m.label}>
            <p>{m.label}</p>
            <div className={styles.metricValue}>
              <strong>{m.value} active</strong>
              {directionIcon(m.direction)}
            </div>
            <span className={styles.metaLabel}>{m.driver}</span>
          </div>
        ))}
      </div>

      <DashboardSection
        eyebrow="Active Interventions"
        title="Intervention Tracking & Status"
      >
        <button
          onClick={() => setModal({ ...modal, isOpen: true })}
          style={{
            marginBottom: "20px",
            padding: "10px 20px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          + Create Intervention
        </button>

        {loading ? (
          <p>Loading interventions...</p>
        ) : interventions.length === 0 ? (
          <p style={{ color: "#64748b" }}>No interventions yet</p>
        ) : (
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Intervention ID</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Officer</th>
                  <th>Status</th>
                  <th>Started</th>
                </tr>
              </thead>
              <tbody>
                {interventions.map((int) => (
                  <tr key={int.intervention_id}>
                    <td><strong>{int.intervention_id}</strong></td>
                    <td>{int.type.replace(/_/g, " ")}</td>
                    <td>{int.location}</td>
                    <td>{int.assigned_to}</td>
                    <td>
                      <span style={{
                        padding: "4px 8px",
                        background: int.status === "Completed" ? "#d1fae5" : int.status === "In Progress" ? "#dbeafe" : "#fef3c7",
                        borderRadius: "4px",
                        fontSize: "12px",
                      }}>
                        {int.status}
                      </span>
                    </td>
                    <td style={{ fontSize: "12px", color: "#64748b" }}>{int.start_time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardSection>

      <div className={styles.gridTwo}>
        <DashboardSection
          eyebrow="Safety hazards"
          title="Construction Safety Risk Assessment — Falls vs Machinery vs Heat"
        >
          <div className={styles.chartCard}>
            <MultiOutputRadarChart height={280} />
            <div className={styles.metaText}>
              This view now reflects live intervention categories instead of a static hazard scorecard.
            </div>
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Anomaly detection"
          title="Intraday surge flags — Today"
        >
          <div className={styles.chartCard}>
            <AnomalyDetectionChart height={240} />
            <div className={styles.anomalyBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              <span>{interventions[0] ? `Most recent intervention: ${interventions[0].type.replace(/_/g, " ")} at ${interventions[0].location}` : "No live anomaly-linked intervention yet."}</span>
            </div>
          </div>
        </DashboardSection>
      </div>

      <DashboardSection
        eyebrow="Multi-output forecasting"
        title="Category-specific predictive drivers"
      >
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Primary ML Driver</th>
                <th>Target Reduction</th>
              </tr>
            </thead>
            <tbody>
              {forecastDrivers.map((r) => (
                <tr key={r.category}>
                  <td><strong>{r.category}</strong></td>
                  <td>{r.driver}</td>
                  <td>{r.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardSection>

      <DashboardSection
        eyebrow="Historical trend"
        title="Weekly risk volumes — W08 to W12"
      >
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Week</th>
                <th>Fall Risk</th>
                <th>Machinery Risk</th>
                <th>Heat Risk</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {complaintTrend.map((row) => (
                <tr key={row.week}>
                  <td><strong>{row.week}</strong></td>
                  <td>{row.fallRisk}</td>
                  <td>{row.machineryRisk}</td>
                  <td>{row.heatRisk}</td>
                  <td><strong>{row.fallRisk + row.machineryRisk + row.heatRisk}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardSection>

      <DashboardSection
        eyebrow="Mission Impact"
        title="Projected worker safety improvement via proactive interventions"
      >
        <div className={styles.listCard}>
            <ul className={styles.list}>
              <li><strong>Prevention First:</strong> Active interventions now come from the live intervention table instead of a preset pilot narrative.</li>
              <li><strong>Response Optimisation:</strong> Team assignments and objectives are recorded directly into operational workflows.</li>
              <li><strong>Worker Satisfaction:</strong> Outcome evidence depends on field findings being logged after completion.</li>
            </ul>
          </div>
        </DashboardSection>

      {/* Intervention Creation Modal */}
      {modal.isOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "white",
            padding: "24px",
            borderRadius: "8px",
            maxWidth: "500px",
            width: "90%",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          }}>
            <h2 style={{ marginTop: 0, marginBottom: "16px" }}>Create Intervention</h2>
            
            <label style={{ display: "block", marginBottom: "16px" }}>
              <span style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Type</span>
              <select
                value={modal.type}
                onChange={(e) => setModal({ ...modal, type: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                }}
              >
                {INTERVENTION_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </select>
            </label>

            <label style={{ display: "block", marginBottom: "16px" }}>
              <span style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Location</span>
              <input
                type="text"
                value={modal.location}
                onChange={(e) => setModal({ ...modal, location: e.target.value })}
                placeholder="e.g., Bukit Merah"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                }}
              />
            </label>

            <label style={{ display: "block", marginBottom: "16px" }}>
              <span style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Officer ID</span>
              <input
                type="text"
                value={modal.officer}
                onChange={(e) => setModal({ ...modal, officer: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                }}
              />
            </label>

            <label style={{ display: "block", marginBottom: "16px" }}>
              <span style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Objectives</span>
              <textarea
                value={modal.objectives}
                onChange={(e) => setModal({ ...modal, objectives: e.target.value })}
                placeholder="Intervention objectives..."
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                  minHeight: "80px",
                }}
              />
            </label>

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setModal({ ...modal, isOpen: false })}
                style={{
                  padding: "8px 16px",
                  background: "#e2e8f0",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateIntervention}
                style={{
                  padding: "8px 16px",
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
