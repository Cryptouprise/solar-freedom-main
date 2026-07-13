import { PolicyLayout, PolicySection } from "@/components/PolicyLayout";

const EFFECTIVE_DATE = "July 12, 2026";

export default function TermsOfUse() {
  return (
    <PolicyLayout
      title="Terms of Use"
      description="Rules and important limitations for using the Solar Freedom website, educational content, intake forms, and scheduling tools."
      canonicalPath="/terms"
      effectiveDate={EFFECTIVE_DATE}
    >
      <PolicySection title="Agreement and permitted use">
        <p>
          By using this website, you agree to these terms. If you do not agree, do not use the site or submit
          information. You may use the public site for lawful personal or informational purposes. Private and
          administrative areas require authorization.
        </p>
      </PolicySection>

      <PolicySection title="Educational information; no legal advice">
        <p>
          Website content is general consumer information, not legal, tax, financial, credit, engineering, or real
          estate advice. Laws, contracts, company status, regulator records, and available remedies change and depend
          on specific facts and jurisdiction. Verify important information with current primary sources and an
          appropriately qualified professional before acting.
        </p>
      </PolicySection>

      <PolicySection title="No professional relationship or guaranteed outcome">
        <p>
          Viewing content, completing a quiz, submitting an intake, sending a message, or scheduling a meeting does
          not create an attorney-client or other professional relationship and does not guarantee representation,
          eligibility, cancellation, settlement, lien treatment, equipment ownership, credit treatment, savings,
          response time, or any other result. Any professional role, scope, fees, and timing must be confirmed in a
          separate written agreement.
        </p>
      </PolicySection>

      <PolicySection title="Your submissions and communications choices">
        <p>
          You are responsible for providing information you are authorized to share and for keeping copies of your
          original records. Do not upload malicious material or unnecessary sensitive credentials. When a form
          requires contact consent, that consent covers follow-up about the request described in the disclosure.
          Optional SMS consent is separate, is not a condition of purchase, and can be withdrawn by replying STOP.
        </p>
      </PolicySection>

      <PolicySection title="Third-party services and links">
        <p>
          The site may link to regulators, companies, lenders, social platforms, analytics, customer-management,
          messaging, or scheduling providers. Those services operate under their own terms and privacy policies.
          Links are provided for context and do not constitute endorsement, verification, or control of third-party
          content. Use care before sending information to another service.
        </p>
      </PolicySection>

      <PolicySection title="Prohibited conduct">
        <ul>
          <li>attempting unauthorized access, credential testing, scraping that disrupts service, or bypassing rate limits;</li>
          <li>submitting false, infringing, malicious, or unlawful material;</li>
          <li>impersonating another person or misrepresenting authority to share information;</li>
          <li>using the site to harass, defraud, spam, or violate another person’s rights; or</li>
          <li>copying or republishing protected site material except as permitted by law or written authorization.</li>
        </ul>
      </PolicySection>

      <PolicySection title="Availability and changes">
        <p>
          The site may be changed, corrected, suspended, or discontinued. Content may be withheld from search or
          placed under editorial review when its sources or claims cannot be verified. A sitemap, schema block,
          recommendation, or submission does not guarantee crawling, indexing, ranking, traffic, or service
          availability.
        </p>
      </PolicySection>

      <PolicySection title="Disclaimers and limitation of liability">
        <p>
          To the extent permitted by law, the site and its content are provided “as is” and “as available,” without
          warranties of accuracy, completeness, fitness, availability, or a particular result. To the extent permitted
          by law, Solar Freedom and its service providers are not liable for indirect, incidental, special,
          consequential, or punitive losses arising from use of, inability to use, or reliance on the website. Rights
          that cannot lawfully be waived remain unaffected.
        </p>
      </PolicySection>

      <PolicySection title="Enforcement and updates">
        <p>
          Access may be restricted for misuse or security risk. If one provision is unenforceable, the remaining
          provisions continue to the extent allowed. Material changes will be posted here with a new effective date.
          Contact the address below before relying on any unclear term.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
