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
  getRiskAlerts,
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
  const [anomalySeries, setAnomalySeries] = useState<any[]>([]);
  const [hazardRadar, setHazardRadar] = useState<any[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>(["WSH_Inspection"]);
  const [suggestedLocations, setSuggestedLocations] = useState<string[]>([]);
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
      const [data, alerts] = await Promise.all([getInterventions(), getRiskAlerts()]);
      const grouped = data.reduce((acc: Record<string, number>, item: any) => {
        acc[item.intervention_type] = (acc[item.intervention_type] || 0) + 1;
        return acc;
      }, {});
      const liveTypes = Array.from(
        new Set([
          ...data.map((item: any) => item.intervention_type),
          ...alerts.map((alert: any) => {
            if (["C1", "C2", "C3"].includes(alert.component)) return "WSH_Inspection";
            if (["C5", "C6", "C7"].includes(alert.component)) return "Health_Screening";
            if (["C8", "C9", "C10"].includes(alert.component)) return "Counseling";
            if (alert.component === "C4") return "Contractor_Audit";
            return null;
          }).filter(Boolean),
        ]),
      ) as string[];
      const liveLocations = Array.from(
        new Set([...data.map((item: any) => item.location), ...alerts.map((alert: any) => alert.location)].filter(Boolean)),
      ).slice(0, 10);
      setAvailableTypes(liveTypes.length > 0 ? liveTypes : ["WSH_Inspection"]);
      setSuggestedLocations(liveLocations);

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
          driver: `${count} live interventions recorded for this workflow across ${Math.max(liveLocations.length, 1)} active areas.`,
          target: count > 0 ? `${Math.round((Number(count) / Math.max(data.length, 1)) * 100)}% of current workflow volume` : "Awaiting escalation",
        })),
      );

      const trendBuckets = data.reduce((acc: Record<string, { fallRisk: number; machineryRisk: number; heatRisk: number }>, item: any) => {
        const label = new Date(item.created_at || item.start_time).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        acc[label] = acc[label] || { fallRisk: 0, machineryRisk: 0, heatRisk: 0 };
        if (item.intervention_type === "WSH_Inspection") acc[label].fallRisk += 1;
        if (["Contractor_Audit", "Ventilation_Audit"].includes(item.intervention_type)) acc[label].machineryRisk += 1;
        if (["Health_Screening", "Cooling_Measures"].includes(item.intervention_type)) acc[label].heatRisk += 1;
        return acc;
      }, {});

      setComplaintTrend(
        Object.entries(trendBuckets)
          .slice(-5)
          .map(([week, value]) => ({ week, ...value })),
      );
      setAnomalySeries(
        alerts.slice(0, 8).map((alert: any, index: number) => ({
          time: new Date(alert.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || `T${index + 1}`,
          value: Number(alert.risk_score || 0),
          isAnomaly: ["High", "Critical"].includes(alert.risk_level),
        })),
      );
      const liveHazardGroups = [
        {
          subject: "Falls",
          noise: alerts.filter((alert: any) => ["C1", "C2"].includes(alert.component) && alert.status !== "resolved").length * 16,
          dumping: data.filter((item: any) => item.intervention_type === "WSH_Inspection").length * 20,
          pest: alerts.filter((alert: any) => ["C1", "C2"].includes(alert.component) && ["High", "Critical"].includes(alert.risk_level)).length * 18,
        },
        {
          subject: "Machinery",
          noise: alerts.filter((alert: any) => ["C3", "C4"].includes(alert.component) && alert.status !== "resolved").length * 16,
          dumping: data.filter((item: any) => ["Contractor_Audit", "Ventilation_Audit"].includes(item.intervention_type)).length * 20,
          pest: alerts.filter((alert: any) => ["C3", "C4"].includes(alert.component) && ["High", "Critical"].includes(alert.risk_level)).length * 18,
        },
        {
          subject: "Heat & Health",
          noise: alerts.filter((alert: any) => ["C5", "C6", "C7"].includes(alert.component) && alert.status !== "resolved").length * 16,
          dumping: data.filter((item: any) => ["Health_Screening", "Cooling_Measures"].includes(item.intervention_type)).length * 20,
          pest: alerts.filter((alert: any) => ["C5", "C6", "C7"].includes(alert.component) && ["High", "Critical"].includes(alert.risk_level)).length * 18,
        },
      ].map((item) => ({
        ...item,
        noise: Math.min(100, item.noise),
        dumping: Math.min(100, item.dumping),
        pest: Math.min(100, item.pest),
      }));
      setHazardRadar(liveHazardGroups);

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
      setModal({ isOpen: false, type: availableTypes[0] || "WSH_Inspection", location: "", officer: "Officer_001", objectives: "" });
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
        <div className={styles.pageActionBar}>
          <button
            onClick={() => setModal({ ...modal, isOpen: true })}
            className={styles.primaryActionBtn}
          >
            Create Intervention
          </button>
        </div>

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
            <MultiOutputRadarChart
              height={280}
              data={hazardRadar}
            />
            <div className={styles.metaText}>
              This radar now reflects live alert pressure, open workflow volume, and high-severity hazard concentration by domain.
            </div>
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Anomaly detection"
          title="Intraday surge flags — Today"
        >
          <div className={styles.chartCard}>
            <AnomalyDetectionChart height={240} data={anomalySeries} />
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
        title="Latest live intervention volumes"
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
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <h2 className={styles.modalTitle}>Create Intervention</h2>

            <label className={styles.modalField}>
              <span className={styles.modalLabel}>Type</span>
              <select
                value={modal.type}
                onChange={(e) => setModal({ ...modal, type: e.target.value })}
                className={styles.modalInput}
              >
                {availableTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </select>
            </label>

            <label className={styles.modalField}>
              <span className={styles.modalLabel}>Location</span>
              <input
                type="text"
                value={modal.location}
                onChange={(e) => setModal({ ...modal, location: e.target.value })}
                placeholder="e.g., Bukit Merah"
                className={styles.modalInput}
                list="complaint-live-locations"
              />
            </label>
            <datalist id="complaint-live-locations">
              {suggestedLocations.map((location) => <option key={location} value={location} />)}
            </datalist>

            <label className={styles.modalField}>
              <span className={styles.modalLabel}>Officer ID</span>
              <input
                type="text"
                value={modal.officer}
                onChange={(e) => setModal({ ...modal, officer: e.target.value })}
                className={styles.modalInput}
              />
            </label>

            <label className={styles.modalField}>
              <span className={styles.modalLabel}>Objectives</span>
              <textarea
                value={modal.objectives}
                onChange={(e) => setModal({ ...modal, objectives: e.target.value })}
                placeholder="Intervention objectives..."
                className={styles.modalTextarea}
              />
            </label>

            <div className={styles.modalActions}>
              <button
                onClick={() => setModal({ ...modal, isOpen: false })}
                className={styles.modalSecondaryBtn}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateIntervention}
                className={styles.compactActionBtn}
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
