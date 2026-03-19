import InfoPage from "@/components/marketing/InfoPage";

export default function ApiDocsPage() {
  return (
    <InfoPage
      eyebrow="API"
      title="API Documentation"
      description="Integration guidance for teams evaluating how EcoNoise SG could fit into existing municipal systems."
      sections={[
        {
          heading: "Integration model",
          body: "The platform is designed around REST-style ingestion and outbound webhook notifications so forecast events and risk flags can be consumed by other systems."
        },
        {
          heading: "Common use cases",
          body: "Typical integrations include case management sync, alert routing, officer workflow enrichment, and analytics exports for retrospective review."
        },
        {
          heading: "Pilot scope",
          body: "This route currently provides high-level documentation. Detailed schemas, payload examples, and environment credentials should be shared only with approved pilot participants."
        }
      ]}
    />
  );
}
