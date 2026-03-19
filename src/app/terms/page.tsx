import InfoPage from "@/components/marketing/InfoPage";

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Terms"
      title="Terms of Use"
      description="This prototype is intended for evaluation, pilot demonstrations, and internal operational review."
      sections={[
        {
          heading: "Pilot usage",
          body: "Access is limited to approved users, evaluators, and stakeholders. Demo content should not be treated as a live public-service commitment unless explicitly stated."
        },
        {
          heading: "Security and conduct",
          body: "Users must protect credentials, avoid unauthorized data export, and use the workspace only for lawful policy, analytics, and pilot-evaluation activities."
        },
        {
          heading: "Prototype limitations",
          body: "Forecasts, alerts, and charts are operational aids for evaluation. They may change as models, integrations, and governance requirements evolve during the pilot."
        }
      ]}
    />
  );
}
