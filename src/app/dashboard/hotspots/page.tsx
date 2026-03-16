import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { MockMap } from "@/components/dashboard/MockMap";
import { SpatialPersistenceChart } from "@/components/dashboard/AnalyticsCharts";
import styles from "../dashboard.module.css";

interface Hotspot {
  area: string;
  score: string;
  driver: string;
}

const hotspots: Hotspot[] = [
  {
    area: "Jurong West",
    score: "88 / 100",
    driver: "BCA renovation permit peak + weekend overlap",
  },
  {
    area: "Woodlands",
    score: "81 / 100",
    driver: "NEA wet-weather forecast + drainage pressure",
  },
  {
    area: "Tampines",
    score: "72 / 100",
    driver: "LTA road works schedule + transport node density",
  },
  {
    area: "Bukit Merah",
    score: "64 / 100",
    driver: "Social/Nightlife calendar event clustering",
  },
];



export default function HotspotsPage() {
  return (
    <div className={styles.stack}>
      <MockMap title="Priority areas for proactive nuisance deterrence" />

      <DashboardSection
        eyebrow="Cluster details"
        title="Active monitoring zones"
      >

        <div className={styles.gridTwo}>
          {hotspots.map((spot) => (
            <div className={styles.metricCard} key={spot.area}>
              <p>{spot.area}</p>
              <strong>{spot.score}</strong>
              <span className={styles.metaLabel}>{spot.driver}</span>
            </div>
          ))}
        </div>
      </DashboardSection>

      <DashboardSection
        eyebrow="Local model transparency"
        title="Predictive driver attribution per cluster"
      >
        <div className={styles.gridTwo}>
          <div className={styles.listCard}>
            <strong>Jurong West (Primary Cluster)</strong>
            <ul className={styles.list}>
              <li>45% Weight: Resupply/Renovation activity (BCA)</li>
              <li>25% Weight: Interaction between Roadworks & High-density HDB</li>
              <li>15% Weight: Historical weekend social noise surge</li>
            </ul>
          </div>
          <div className={styles.listCard}>
            <strong>Explainability Note</strong>
            <p className={styles.metaText}>
              Weights are calculated using SHAP (SHapley Additive exPlanations) values to show how much each individual 
              public data signal contributed to the final probability output.
            </p>

          </div>
        </div>
      </DashboardSection>

      <DashboardSection
        eyebrow="Impact Simulation"
        title="Predictive suppression of OneService reports"
      >
        <div className={styles.metricCard}>
          <p>Next Week Est. Baseline (Reactive)</p>
          <strong>1,450 Reports</strong>
          <p className={styles.metaText}>

            Suppression through proactive staging: <strong className={styles.positive}>-315 reports</strong>
          </p>
        </div>
      </DashboardSection>

      <DashboardSection
        eyebrow="Cluster logic"
        title="Spatial Clustering: Identifying Persistent Patterns vs Seasonal Spikes"
      >
        <div className={styles.chartCard} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <SpatialPersistenceChart />
          <div className={styles.listCard}>
            <ul className={styles.list}>
              <li><strong>Persistent Clusters:</strong> Identified in the top-right quadrant (High Persistence).</li>
              <li><strong>Seasonal Spikes:</strong> Identified in the top-left quadrant (High Seasonality, Low Persistence).</li>
              <li><strong>Anomaly Flags:</strong> Sourced when real-time volume deviates significantly from both patterns.</li>
            </ul>
          </div>
        </div>
      </DashboardSection>
    </div>
  );
}
