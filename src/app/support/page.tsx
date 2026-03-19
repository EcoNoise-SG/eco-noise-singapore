import InfoPage from "@/components/marketing/InfoPage";

export default function SupportPage() {
  return (
    <InfoPage
      eyebrow="Support"
      title="Support Desk"
      description="Support guidance for access issues, pilot walkthroughs, and product questions."
      sections={[
        {
          heading: "Access help",
          body: "If you are unable to sign in or need pilot access, use the Request Access flow from the landing page so the team can triage your request."
        },
        {
          heading: "Demo assistance",
          body: "Stakeholders can use the dashboard workspace and blog walkthroughs for product evaluation. For briefing support, coordinate through your pilot lead."
        },
        {
          heading: "Issue reporting",
          body: "When reporting issues, include the page, expected outcome, actual behavior, and any visible error message so the team can reproduce the problem quickly."
        }
      ]}
    />
  );
}
