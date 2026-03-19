import InfoPage from "@/components/marketing/InfoPage";

export default function PrivacyPolicyPage() {
  return (
    <InfoPage
      eyebrow="Privacy"
      title="Privacy Policy"
      description="EcoNoise SG uses only operationally necessary information to support pilot access requests, dashboard sign-in, and lawful agency collaboration."
      sections={[
        {
          heading: "Information we collect",
          body: "The pilot currently collects basic account metadata, access-request form details, and product usage telemetry needed to secure the workspace and respond to support enquiries."
        },
        {
          heading: "How information is used",
          body: "Collected information is used to provision access, investigate issues, improve forecasting workflows, and understand adoption across participating public-sector teams."
        },
        {
          heading: "Retention and disclosure",
          body: "Data is retained only as long as needed for pilot operations, security review, and audit requirements. Information is not shared outside approved platform operators except where required by policy or law."
        }
      ]}
    />
  );
}
