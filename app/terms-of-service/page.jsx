import InfoPage from "../Components/InfoPage";

export const metadata = {
  title: "Terms of Service | EchoFind",
  description: "Read the terms for using EchoFind.",
};

export default function TermsOfServicePage() {
  return (
    <InfoPage
      eyebrow="Using EchoFind"
      title="Terms of Service"
      intro="By accessing EchoFind, you agree to use the service responsibly and follow these terms."
    >
      <section>
        <h2>Using the service</h2>
        <p>
          EchoFind helps people publish and browse lost and found item reports.
          You must use the service lawfully, provide information you believe to
          be accurate, and keep your sign-in credentials secure.
        </p>
      </section>
      <section>
        <h2>Reports and content</h2>
        <p>
          You are responsible for the reports, photos, and other content you
          submit. Do not post content that is unlawful, misleading, abusive, or
          that exposes sensitive information about yourself or another person.
          You must have permission to submit any content you upload.
        </p>
      </section>
      <section>
        <h2>Safe communication and handoffs</h2>
        <p>
          Use care when contacting other users or arranging the return of an
          item. Verify identifying details, meet in a safe public place, and
          never share passwords, verification codes, or payment details to
          claim an item.
        </p>
      </section>
      <section>
        <h2>No guarantee of recovery</h2>
        <p>
          EchoFind is a communication and reporting tool. We do not guarantee
          that an item will be found, that reports are accurate, or that a
          person claiming an item is its owner. Users are responsible for
          verifying information and deciding how to proceed.
        </p>
      </section>
      <section>
        <h2>Service availability and enforcement</h2>
        <p>
          The service may be changed, interrupted, or unavailable from time to
          time. EchoFind may remove content or restrict access when necessary
          to protect users, the service, or comply with applicable requirements.
        </p>
      </section>
      <section>
        <h2>Changes to these terms</h2>
        <p>
          These terms may be updated as the service changes. Continued use of
          EchoFind after an updated version is published means you accept the
          revised terms.
        </p>
      </section>
    </InfoPage>
  );
}
