'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import ProjectBoard from "@/components/feedback-loop/ProjectBoard";
import type { Task } from "@/components/feedback-loop/ProjectBoard";
import { TFTForecastChart } from "@/components/dashboard/AnalyticsCharts";
import styles from "../dashboard.module.css";
import { getInterventions, getOperationalActivity, getReports, subscribeToInterventions, subscribeToOperationalActivity, subscribeToReports } from "@/lib/supabase";

export default function FeedbackLoopPage() {
  const [loopMetrics, setLoopMetrics] = useState<any[]>([]);
  const [loopSteps, setLoopSteps] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [boardTasks, setBoardTasks] = useState<Task[]>([]);

  useEffect(() => {
    async function loadFeedbackLoop() {
      const [activity, interventions, reports] = await Promise.all([
        getOperationalActivity(200),
        getInterventions(),
        getReports(),
      ]);

      const completed = interventions.filter((item: any) => item.outcome === "Completed").length;
      const feedbackRecords = activity.filter((log: any) => /intervention|report|alert/i.test(log.action || "")).length;
      const validationCoverage = interventions.length ? Math.round((completed / interventions.length) * 100) : 0;
      const bucketedActivity = activity.reduce((acc: Record<string, { events: number; reports: number; completed: number }>, item: any) => {
        const label = new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        acc[label] = acc[label] || { events: 0, reports: 0, completed: 0 };
        acc[label].events += 1;
        if (item.resource_type === "report" || /report/i.test(item.action || "")) acc[label].reports += 1;
        if (/completed|outcome/i.test(item.action || "")) acc[label].completed += 1;
        return acc;
      }, {});
      const latestActivities = activity.slice(0, 4);

      setLoopMetrics([
        { label: "Feedback Records Captured", value: String(feedbackRecords), sub: "From operational activity and workflow updates" },
        { label: "Reports Feeding Loop", value: String(reports.length), sub: "Generated briefs in the current archive", positive: true },
        { label: "Completed Interventions", value: String(completed), sub: "Outcomes available for retraining inputs", positive: true },
        { label: "Field Validation Coverage", value: `${validationCoverage}%`, sub: "Interventions with completed outcomes" },
      ]);

      setLoopSteps([
        { step: "01", label: "Data Ingestion", detail: `${activity.filter((log: any) => /alert/i.test(log.action || "")).length} alert and signal events recorded in the live activity layer.`, color: "#FDDCB5" },
        { step: "02", label: "Model Inference", detail: `${reports.length} reports generated from current operational data.`, color: "#D4B8F0" },
        { step: "03", label: "Operational Dispatch", detail: `${interventions.length} interventions pushed into the field workflow.`, color: "#B8D0F5" },
        { step: "04", label: "Field Outcome Logging", detail: `${completed} interventions have completed outcomes recorded.`, color: "#B5F5EC" },
        { step: "05", label: "Model Retraining Readiness", detail: `${validationCoverage}% of interventions are ready for downstream learning workflows.`, color: "#FDB5B5" },
      ]);

      setChartData(
        Object.entries(bucketedActivity)
          .slice(-8)
          .map(([day, bucket]) => ({
            day,
            actual: bucket.events,
            predicted: bucket.events + bucket.reports,
            confidence: [
              Math.max(0, bucket.events - 1),
              bucket.events + Math.max(1, bucket.completed),
            ],
          })),
      );
      setBoardTasks([
        ...latestActivities.map((entry: any, index: number) => ({
          id: entry.id || `task-${index + 1}`,
          title: `${entry.action.replace(/_/g, " ")} · ${entry.resource_type}${entry.resource_id ? ` ${entry.resource_id}` : ""}`,
          color: ["#FDDCB5", "#D4B8F0", "#B8D0F5", "#B5F5EC"][index % 4],
          status: entry.source === "reports" ? "Reporting" : entry.source === "audit" ? "Audit" : "Live Flow",
          source: entry.source,
          relatedId: entry.resource_id,
          createdAt: entry.created_at,
        })),
      ]);
    }

    void loadFeedbackLoop();
    const activitySubscription = subscribeToOperationalActivity(() => {
      void loadFeedbackLoop();
    });
    const interventionSubscription = subscribeToInterventions(() => {
      void loadFeedbackLoop();
    });
    const reportSubscription = subscribeToReports(() => {
      void loadFeedbackLoop();
    });

    return () => {
      activitySubscription.unsubscribe();
      interventionSubscription.unsubscribe();
      reportSubscription.unsubscribe();
    };
  }, []);

  return (
    <div className={styles.stack}>
      <div className={styles.gridThree}>
        {loopMetrics.slice(0, 3).map((metric) => (
          <div className={styles.metricCard} key={metric.label}>
            <p>{metric.label}</p>
            <strong className={metric.positive ? styles.positive : ""}>{metric.value}</strong>
            <span className={styles.metaLabel}>{metric.sub}</span>
          </div>
        ))}
      </div>

      <DashboardSection eyebrow="Intelligence architecture" title="The predictive feedback loop">
        <div className={styles.chartCard}>
          <ProjectBoard tasks={boardTasks} />
        </div>
      </DashboardSection>

      <DashboardSection eyebrow="Loop stages" title="Five-stage iterative learning cycle">
        <div className={styles.timeline}>
          {loopSteps.map((step) => (
            <div className={styles.timelineItem} key={step.step}>
              <div className={styles.timelineHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: step.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#0f172a",
                    flexShrink: 0,
                  }}>
                    {step.step}
                  </span>
                  <strong>{step.label}</strong>
                </div>
              </div>
              <p className={styles.actionDetail} style={{ marginTop: "8px" }}>{step.detail}</p>
            </div>
          ))}
        </div>
      </DashboardSection>

      <div className={styles.gridTwo}>
        <DashboardSection eyebrow="Accuracy over time" title="Operational improvement trajectory">
          <div className={styles.chartCard}>
            <TFTForecastChart height={240} data={chartData} />
            <div className={styles.metaText}>
              The curve now reflects live report and intervention activity instead of a fixed mock retraining story.
            </div>
          </div>
        </DashboardSection>

        <DashboardSection eyebrow="Loop governance" title="Validation and quality controls">
          <div className={styles.listCard}>
            <ul className={styles.list}>
              <li><strong>Officer Validation:</strong> Completed intervention outcomes are the current proxy for validated field feedback.</li>
              <li><strong>Activity Trace:</strong> Alert, intervention, and report changes are captured in the live operational activity feed.</li>
              <li><strong>Retraining Readiness:</strong> Reports plus outcomes form the present bridge into future ML retraining.</li>
              <li><strong>Refresh model:</strong> Prediction refresh now runs on a runtime loop plus stale-on-demand checks.</li>
            </ul>
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}
