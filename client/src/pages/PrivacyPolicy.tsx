import { PolicyLayout, PolicySection } from "@/components/PolicyLayout";

const EFFECTIVE_DATE = "July 12, 2026";

export default function PrivacyPolicy() {
  return (
    <PolicyLayout
      title="Privacy Policy"
      description="How Solar Freedom collects, uses, shares, and protects information submitted through this website."
      canonicalPath="/privacy-policy"
      effectiveDate={EFFECTIVE_DATE}
    >
      <PolicySection title="Scope">
        <p>
          This policy applies to breakyoursolarcontract.com, its intake forms, optional scheduler and video player,
          and private administrative tools. It does not control the independent privacy practices of websites or
          services linked from this site.
        </p>
      </PolicySection>

      <PolicySection title="Information collected">
        <p>Depending on what you choose to use, the site may collect:</p>
        <ul>
          <li>contact details such as name, email address, and telephone number;</li>
          <li>details you provide about a solar agreement, company, financing, problem, location, or preferred contact time;</li>
          <li>the page and form used, consent version, consent choices, and submission time;</li>
          <li>technical security information needed for fraud prevention, rate limiting, session protection, and diagnostics; and</li>
          <li>optional analytics events only after you affirmatively accept analytics cookies.</li>
        </ul>
        <p>
          Do not submit passwords, full financial-account credentials, Social Security numbers, or documents that
          are not needed for the requested review.
        </p>
      </PolicySection>

      <PolicySection title="How information is used">
        <ul>
          <li>to receive, organize, and respond to an intake or guide request you authorized;</li>
          <li>to communicate by the channels you separately selected;</li>
          <li>to operate, secure, debug, and improve the website and its workflows;</li>
          <li>to maintain consent, delivery, audit, and release records; and</li>
          <li>to comply with lawful obligations and protect users, the service, and other people.</li>
        </ul>
        <p>
          A submission does not create an attorney-client relationship, guarantee representation, or authorize
          unrelated marketing. SMS consent is optional and is not a condition of purchase.
        </p>
      </PolicySection>

      <PolicySection title="Cookies and analytics choices">
        <p>
          Optional analytics is off by default. Google Analytics loads only after you select “Accept analytics” on a
          public page. Selecting “Decline,” resetting the privacy choice, using a private/admin route, or clearing the
          preference prevents this site from intentionally loading optional analytics for that state. Necessary
          security and authenticated-session mechanisms may still operate where required.
        </p>
      </PolicySection>

      <PolicySection title="Service providers and disclosures">
        <p>
          Information may be processed by vendors that provide hosting, database or storage, security, customer
          relationship management, requested email or SMS delivery, analytics you accepted, and appointment
          scheduling. The embedded scheduler is a third-party service; information entered there is sent directly to
          that provider under its terms.
        </p>
        <p>
          Embedded YouTube players are replaced with local placeholders. The site contacts YouTube and loads its
          privacy-enhanced player only after you choose Play; that request is then handled under YouTube's terms and
          privacy practices.
        </p>
        <p>
          Information may also be disclosed when reasonably necessary to comply with law, respond to valid legal
          process, investigate abuse, protect rights or safety, or support a business transition subject to
          appropriate safeguards. The website is not designed to sell personal information or share it for
          cross-context behavioral advertising.
        </p>
      </PolicySection>

      <PolicySection title="Retention and security">
        <p>
          The current application does not automatically expire lead, guide-request, or consent records. Those
          records may remain in the primary database and provider backups until an authorized deletion is completed,
          subject to backup cycles, security and audit needs, dispute handling, and legal obligations. Other providers
          may apply their own retention schedules. Administrative access, scoped credentials, encryption in transit,
          rate limits, logging controls, and release checks reduce risk, but no system can guarantee absolute security.
        </p>
      </PolicySection>

      <PolicySection title="Your choices and requests">
        <ul>
          <li>Decline or reset optional analytics through the website’s privacy control.</li>
          <li>Reply STOP to opt out of SMS and HELP for help; message and data rates may apply.</li>
          <li>Use the unsubscribe control in informational email where provided.</li>
          <li>Ask about access, correction, deletion, or restriction by emailing the address below.</li>
        </ul>
        <p>
          A request may require reasonable identity verification and is evaluated under applicable law. Some records
          may remain when needed for security, legal compliance, documented consent, dispute handling, or provider
          backup cycles. Rights and available responses vary by jurisdiction.
        </p>
      </PolicySection>

      <PolicySection title="Children and policy changes">
        <p>
          This service is intended for adults handling residential solar matters and is not directed to children
          under 13. Material policy changes will be posted here with a new effective date. New uses that require
          consent will not be inferred from an older consent record.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
