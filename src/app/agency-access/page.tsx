import InfoPage from "@/components/marketing/InfoPage";

export default function AgencyAccessPage() {
  return (
    <InfoPage
      eyebrow="Access"
      title="Agency Access"
      description="Agency onboarding is designed for pilot review, sandbox access, and stakeholder validation."
      sections={[
        {
          heading: "Who should request access",
          body: "Team leads, pilot owners, and operational stakeholders who need to evaluate forecasting workflows or share structured feedback with the product team."
        },
        {
          heading: "What to prepare",
          body: "Provide your agency or department name, official email, and the use case you want to evaluate so the team can provision the right workspace context."
        },
        {
          heading: "Next steps",
          body: "Use the landing-page Request Access button to submit your details. Sandbox review and follow-up coordination are handled through that intake flow."
        }
      ]}
    />
  );
}
