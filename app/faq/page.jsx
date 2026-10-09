import InfoPage from "../Components/InfoPage";

export const metadata = {
  title: "FAQ | EchoFind",
  description: "Answers to common questions about using EchoFind.",
};

export default function FAQPage() {
  return (
    <InfoPage
      eyebrow="Help center"
      title="Frequently asked questions"
      intro="Find practical answers about reporting lost and found belongings with EchoFind."
    >
      <details>
        <summary>How do I report a lost or found item?</summary>
        <p>
          Create an account or sign in, then choose the matching report option in
          your dashboard. Include a clear description, when and where the item
          was lost or found, and a photo if you have one.
        </p>
      </details>
      <details>
        <summary>Who can see my report?</summary>
        <p>
          Signed-in EchoFind users can browse reports to help reunite items with
          their owners. Do not include passwords, financial details, identity
          document numbers, or other information you would not want shared with
          the community.
        </p>
      </details>
      <details>
        <summary>Should I include my contact details?</summary>
        <p>
          Only provide contact information you are comfortable sharing with
          signed-in users who can view your report. You can use the report
          details to coordinate a safe return.
        </p>
      </details>
      <details>
        <summary>Does EchoFind guarantee that my item will be found?</summary>
        <p>
          No. EchoFind helps people share and discover reports, but cannot
          guarantee a match, recovery, or the accuracy of information submitted
          by other users.
        </p>
      </details>
      <details>
        <summary>What should I do if I think a report matches my item?</summary>
        <p>
          Compare the identifying details carefully and contact the person using
          information they chose to share. Arrange any handoff in a safe public
          place and do not share account credentials or payment information.
        </p>
      </details>
      <details>
        <summary>What if I cannot sign in or load a page?</summary>
        <p>
          Check your connection and try again shortly. If the problem continues,
          the service or its database may be temporarily unavailable; contact
          the site operator through the support channel provided for this
          deployment.
        </p>
      </details>
    </InfoPage>
  );
}
