'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { DashboardSection } from "@/components/dashboard/DashboardSection";
import styles from "../dashboard.module.css";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  getInterventions,
  subscribeToInterventions,
  updateInterventionOutcome,
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

interface OutcomeModalState {
  isOpen: boolean;
  interventionId: string;
  outcome: string;
  findings: string;
}

export default function OperationsPage() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [actions, setActions] = useState<Array<{ title: string; time: string; detail: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [outcomeModal, setOutcomeModal] = useState<OutcomeModalState>({
    isOpen: false,
    interventionId: "",
    outcome: "Completed",
    findings: "",
  });
  const [reductionNotes, setReductionNotes] = useState<string[]>([]);
  const [readinessNotes, setReadinessNotes] = useState<string[]>([]);

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
      setActions(
        data.slice(0, 3).map((int: any) => ({
          title: `${int.intervention_type.replace(/_/g, " ")} — ${int.location}`,
          time: new Date(int.start_time).toLocaleString(),
          detail:
            typeof int.objectives === "string"
              ? int.objectives
              : JSON.stringify(int.objectives || {}),
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
      const active = data.filter((item: any) => item.outcome !== "Completed");
      const completed = data.filter((item: any) => item.outcome === "Completed");
      setReductionNotes([
        `${active.length} operations are currently open across machinery-linked workflows.`,
        `${completed.length} outcomes have already been verified and fed back into the system.`,
        `${data.filter((item: any) => item.intervention_type === "Contractor_Audit").length} contractor audit actions are supporting machinery risk reduction.`,
      ]);
      setReadinessNotes([
        `${active.length > 0 ? "Teams are staged in live intervention zones." : "No live staging units are open right now."}`,
        `${data.filter((item: any) => item.team_members?.length).length} records include explicit team assignment data.`,
        `${Math.max(data.slice(0, 3).length, 1)} recent operations are available for immediate command review.`,
      ]);
    } catch (error) {
      console.error("Error loading interventions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOutcome = async () => {
    try {
      await updateInterventionOutcome(
        outcomeModal.interventionId,
        outcomeModal.outcome,
        { summary: outcomeModal.findings },
      );

      toast.success("Intervention outcome updated!");
      setOutcomeModal({ isOpen: false, interventionId: "", outcome: "Completed", findings: "" });
      void loadInterventions();
    } catch (error) {
      console.error("Error updating outcome:", error);
      toast.error("Failed to update outcome");
    }
  };

  return (
    <div className={styles.stack}>
      <DashboardSection
        eyebrow="Machinery & Vehicle Incidents"
        title="WSH Inspector Deployment Recommendations - Module C3"
      >
        <div className={styles.timeline}>
          {actions.map((action) => (
            <div className={styles.timelineItem} key={action.title}>
              <div className={styles.timelineHeader}>
                <strong>{action.title}</strong>
                <span className={styles.riskBadge}>Medium-High Risk</span>
              </div>
              <span className={styles.timeLabel}>{action.time}</span>
              <p className={styles.actionDetail}>{action.detail}</p>
              <div className={styles.logicNode}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                <span>Trigger: Machinery phase + historical incident pattern match</span>
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>

      <DashboardSection
        eyebrow="Real-Time Interventions"
        title="Active Intervention Tracking"
      >
        {loading ? (
          <p>Loading interventions...</p>
        ) : interventions.length === 0 ? (
          <p style={{ color: "#64748b" }}>No active interventions</p>
        ) : (
          <div className={styles.timeline}>
            {interventions.map((int) => (
              <div className={styles.timelineItem} key={int.intervention_id}>
                <div className={styles.timelineHeader}>
                  <strong>{int.type.replace(/_/g, " ")} — {int.location}</strong>
                  <span style={{
                    padding: "4px 8px",
                    background: int.status === "Completed" ? "#d1fae5" : int.status === "In Progress" ? "#dbeafe" : "#fef3c7",
                    borderRadius: "4px",
                    fontSize: "12px",
                  }}>
                    {int.status}
                  </span>
                </div>
                <span className={styles.timeLabel}>{int.start_time} · Officer: {int.assigned_to}</span>
                <p className={styles.actionDetail}>{int.objectives}</p>
                <div className={styles.logicNode}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6"/><path d="M12 9v6"/><circle cx="12" cy="12" r="10"/></svg>
                  <span>ID: {int.intervention_id}</span>
                </div>
                {int.status === "In Progress" && (
                  <button
                    onClick={() => setOutcomeModal({
                      isOpen: true,
                      interventionId: int.intervention_id,
                      outcome: "Completed",
                      findings: "",
                    })}
                    style={{
                      marginTop: "12px",
                      padding: "6px 12px",
                      background: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Update Outcome
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </DashboardSection>

      <div className={styles.gridTwo}>
        <DashboardSection eyebrow="Risk Reduction" title="Proactive Machinery Incident Prevention">
          <div className={styles.listCard}>
            <ul className={styles.list}>
              {reductionNotes.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </DashboardSection>

        <DashboardSection eyebrow="Agency posture" title="Deployment Readiness">
          <div className={styles.listCard}>
            <ul className={styles.list}>
              {readinessNotes.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </DashboardSection>
      </div>

      <DashboardSection
        eyebrow="Active Feedback Loop"
        title="Field verification of recent AI predictions"
      >
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Operation ID</th>
                <th>Type</th>
                <th>Location</th>
                <th>Status</th>
                <th>Validation</th>
              </tr>
            </thead>
            <tbody>
              {interventions.slice(0, 5).map((int) => (
                <tr key={int.intervention_id}>
                  <td>{int.intervention_id}</td>
                  <td>{int.type.replace(/_/g, " ")}</td>
                  <td>{int.location}</td>
                  <td>{int.status}</td>
                  <td>
                    <span className={int.status === "Completed" ? styles.statusSynced : styles.statusRealtime}>
                      {int.status === "Completed" ? "Outcome Recorded" : "In Progress"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardSection>

      {/* Outcome Update Modal */}
      {outcomeModal.isOpen && (
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
            <h2 style={{ marginTop: 0, marginBottom: "16px" }}>Update Intervention Outcome</h2>
            
            <label style={{ display: "block", marginBottom: "16px" }}>
              <span style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Outcome</span>
              <select
                value={outcomeModal.outcome}
                onChange={(e) => setOutcomeModal({ ...outcomeModal, outcome: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                }}
              >
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Deferred">Deferred</option>
              </select>
            </label>

            <label style={{ display: "block", marginBottom: "16px" }}>
              <span style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Findings & Notes</span>
              <textarea
                value={outcomeModal.findings}
                onChange={(e) => setOutcomeModal({ ...outcomeModal, findings: e.target.value })}
                placeholder="Document findings, actions taken, recommendations..."
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                  minHeight: "100px",
                }}
              />
            </label>

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setOutcomeModal({ isOpen: false, interventionId: "", outcome: "Completed", findings: "" })}
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
                onClick={handleUpdateOutcome}
                style={{
                  padding: "8px 16px",
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Save Outcome
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
