import InfoPage from "@/components/marketing/InfoPage";

export default function DataGovernancePage() {
  return (
    <InfoPage
      eyebrow="Governance"
      title="Data Governance"
      description="EcoNoise SG is structured around public-data sourcing, access control, and responsible model operations."
      sections={[
        {
          heading: "Source stewardship",
          body: "The platform emphasizes aggregated complaint patterns, public works schedules, weather signals, and operational feedback that can be justified for public-interest forecasting."
        },
        {
          heading: "Access controls",
          body: "Role-based access, environment separation, and audit-aware workflows are used to keep pilot data visible only to the teams who need it."
        },
        {
          heading: "Model oversight",
          body: "Predictions are reviewed against officer feedback, anomaly flags, and historical error trends so the pilot can be tuned without over-relying on automation."
        }
      ]}
    />
  );
}
