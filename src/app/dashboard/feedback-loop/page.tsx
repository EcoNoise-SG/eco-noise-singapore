import { DashboardSection } from "@/components/dashboard/DashboardSection";
import ProjectBoard from "@/components/feedback-loop/ProjectBoard";
import { TFTForecastChart } from "@/components/dashboard/AnalyticsCharts";
import styles from "../dashboard.module.css";

const loopSteps = [
  {
    step: "01",
    label: "Data Ingestion",
    detail: "OneService complaints, BCA permits, LTA road works, NEA weather, and IoT sensor readings flow into the unified data lake in real-time.",
    color: "#FDDCB5",
  },
  {
    step: "02",
    label: "Model Inference",
    detail: "The TFT model runs daily at 09:00, producing a 14-day multi-step forecast with per-area probability scores and SHAP-derived feature attributions.",
    color: "#D4B8F0",
  },
  {
    step: "03",
    label: "Operational Dispatch",
    detail: "Officers receive AI-generated patrol recommendations. Staging positions are pre-calculated within 500m of the predicted risk cluster centroid.",
    color: "#B8D0F5",
  },
  {
    step: "04",
    label: "Field Outcome Logging",
    detail: "Officers record whether incidents were deterred, warnings issued, or no-action required. These outcomes are time-stamped with GPS coordinates.",
    color: "#B5F5EC",
  },
  {
    step: "05",
    label: "Model Retraining",
    detail: "Field outcomes feed directly back into training data. Monthly retraining cycles refine temporal weights and improve prediction accuracy iteratively.",
    color: "#FDB5B5",
  },
];

const loopMetrics = [
  { label: "Feedback Records Captured", value: "1,842", sub: "Since system go-live" },
  { label: "Model Accuracy Improvement", value: "+6.2%", sub: "Since first retraining cycle", positive: true },
  { label: "Avg. Retraining Improvement", value: "+1.1%", sub: "Per monthly cycle", positive: true },
  { label: "Field Validation Coverage", value: "94%", sub: "Patrols with logged outcomes" },
];

export default function FeedbackLoopPage() {
  return (
    <div className={styles.stack}>
      <div className={styles.gridThree}>
        {loopMetrics.slice(0, 3).map((m) => (
          <div className={styles.metricCard} key={m.label}>
            <p>{m.label}</p>
            <strong className={m.positive ? styles.positive : ""}>{m.value}</strong>
            <span className={styles.metaLabel}>{m.sub}</span>
          </div>
        ))}
      </div>

      <DashboardSection
        eyebrow="Intelligence architecture"
        title="The Predictive Feedback Loop — How the system learns from every patrol"
      >
        <div className={styles.chartCard}>
          <ProjectBoard />
        </div>
      </DashboardSection>

      <DashboardSection
        eyebrow="Loop stages"
        title="Five-stage iterative learning cycle"
      >
        <div className={styles.timeline}>
          {loopSteps.map((s) => (
            <div className={styles.timelineItem} key={s.step}>
              <div className={styles.timelineHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    background: s.color, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "0.75rem", fontWeight: 700,
                    color: "#0f172a", flexShrink: 0,
                  }}>
                    {s.step}
                  </span>
                  <strong>{s.label}</strong>
                </div>
              </div>
              <p className={styles.actionDetail} style={{ marginTop: "8px" }}>{s.detail}</p>
            </div>
          ))}
        </div>
      </DashboardSection>

      <div className={styles.gridTwo}>
        <DashboardSection eyebrow="Accuracy over time" title="Model improvement trajectory">
          <div className={styles.chartCard}>
            <TFTForecastChart height={240} />
            <div className={styles.metaText}>
              Each retraining cycle incorporates real field outcome data, bringing actual complaint trends closer to model predictions.
            </div>
          </div>
        </DashboardSection>

        <DashboardSection eyebrow="Loop governance" title="Validation & quality controls">
          <div className={styles.listCard}>
            <ul className={styles.list}>
              <li><strong>Officer Validation:</strong> Field outcomes are reviewed by the Ops Lead before entering training data to prevent label noise.</li>
              <li><strong>Drift Detection:</strong> Model performance is monitored for concept drift. If MAPE increases by &gt;2%, an ad-hoc retraining is triggered.</li>
              <li><strong>SHAP Stability:</strong> Feature attribution weights are compared across retraining cycles to ensure interpretability is preserved.</li>
              <li><strong>Holdout Evaluation:</strong> 20% of data is held out for evaluation after each monthly retrain.</li>
              <li><strong>Ethics Check:</strong> No personal data enters the model. All inputs are aggregated, spatial, and temporal signals only.</li>
            </ul>
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}
