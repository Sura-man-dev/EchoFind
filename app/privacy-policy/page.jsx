import InfoPage from "../Components/InfoPage";

export const metadata = {
  title: "Privacy Policy | EchoFind",
  description: "Learn what information EchoFind uses and how it is handled.",
};

export default function PrivacyPolicyPage() {
  return (
    <InfoPage
      eyebrow="Your information"
      title="Privacy Policy"
      intro="This policy explains how EchoFind handles information when you use the service."
    >
      <section>
        <h2>Information you provide</h2>
        <p>
          EchoFind may process account details such as your name and email,
          profile information, authentication data, and the report details,
          photos, and contact information you submit. The service also creates
          notifications related to reports and account activity.
        </p>
      </section>
      <section>
        <h2>How information is used</h2>
        <p>
          Information is used to operate accounts, publish and manage lost and
          found reports, support communication about items, provide
          notifications, protect the service, and maintain its functionality.
        </p>
      </section>
      <section>
        <h2>Who can see report information</h2>
        <p>
          Reports are available to signed-in EchoFind users. Details and contact
          information you choose to include may therefore be visible to those
          users. Please share only information you are comfortable disclosing.
        </p>
      </section>
      <section>
        <h2>Service providers and storage</h2>
        <p>
          EchoFind relies on hosting, database, authentication, and image
          storage providers to operate. Information may be processed by those
          providers as needed to deliver the service and protect it.
        </p>
      </section>
      <section>
        <h2>Retention and security</h2>
        <p>
          Information is retained for as long as needed to provide the service,
          maintain account and report records, resolve issues, and meet
          applicable obligations. Reasonable technical and organizational
          safeguards are used, but no online service can guarantee absolute
          security.
        </p>
      </section>
      <section>
        <h2>Your choices</h2>
        <p>
          You can manage certain profile details through your account. For
          questions or requests about information associated with your account,
          contact the site operator through the support channel provided for
          this deployment.
        </p>
      </section>
      <section>
        <h2>Changes to this policy</h2>
        <p>
          This policy may be updated as EchoFind changes. The current version
          will be published on this page.
        </p>
      </section>
    </InfoPage>
  );
}
