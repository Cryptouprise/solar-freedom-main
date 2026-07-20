import { Link, useLocation } from "wouter";
import { useSeoMeta } from "@/hooks/useSeoMeta";

const pages = {
  about: {
    title: "About Solar Freedom",
    summary: "Solar Freedom publishes general consumer information and accepts requests for an individual review of solar-contract documents.",
    sections: [
      ["What we publish", "Our public resources explain common contract terms, records to gather, and official consumer-protection channels."],
      ["What we do not claim", "This website does not promise an outcome and does not represent that general information is legal advice."],
    ],
  },
  contact: {
    title: "Contact Solar Freedom",
    summary: "Questions about this website or a correction may be sent to info@breakyoursolarcontract.com.",
    sections: [["Response scope", "Contacting us or submitting information does not create an attorney-client relationship. Do not send time-sensitive instructions through this website."]],
  },
  "editorial-policy": {
    title: "Editorial Policy",
    summary: "Content must be useful to homeowners, original, attributable, and supported by current primary or authoritative sources.",
    sections: [
      ["Publication standard", "Editors must identify the intended user need, check material claims, record sources, assign an update owner, and reject keyword-substitution or mass-produced pages."],
      ["Review standard", "Jurisdiction-specific legal information requires source verification and, where appropriate, review by a qualified professional before indexing."],
      ["Commercial independence", "Advertising, referral relationships, or compensation must not determine factual conclusions or search recommendations."],
    ],
  },
  corrections: {
    title: "Corrections Policy",
    summary: "We welcome reports of inaccurate, outdated, or unclear information.",
    sections: [["How corrections work", "Send the page URL, disputed text, and supporting source to info@breakyoursolarcontract.com. Material corrections should be reviewed promptly and the page update date changed."]],
  },
  privacy: {
    title: "Privacy Notice",
    summary: "This notice describes the website's current high-level data practices.",
    sections: [
      ["Information submitted", "Forms may collect contact details and information you choose to provide for a requested review."],
      ["Analytics and service providers", "The site may use analytics, advertising, hosting, communications, and intake providers. Avoid submitting unnecessary sensitive information."],
      ["Requests", "Send privacy questions or requests to info@breakyoursolarcontract.com."],
    ],
  },
  terms: {
    title: "Website Terms",
    summary: "Use of this website is subject to these basic information-service terms.",
    sections: [
      ["Informational use", "Content is provided for general information and may not reflect the latest law or the facts of a particular agreement."],
      ["No guaranteed outcome", "Past examples, if documented and published, do not guarantee a similar result."],
      ["External sources", "Links to third parties are provided for reference; verify current information with the responsible source."],
    ],
  },
  disclaimer: {
    title: "Legal Information Disclaimer",
    summary: "The website provides general information, not legal advice.",
    sections: [
      ["No professional relationship", "Viewing the site, calling, or submitting a form does not create an attorney-client relationship."],
      ["Individual facts matter", "Rights, deadlines, and options depend on the agreement, facts, jurisdiction, and current law. Consult an appropriately licensed professional for advice."],
      ["No guarantees", "No cancellation, reduction, credit, timing, or other outcome is promised."],
    ],
  },
} as const;

type PageKey = keyof typeof pages;

export default function TrustPage() {
  const [location] = useLocation();
  const page = location.slice(1);
  const key = (page in pages ? page : "about") as PageKey;
  const content = pages[key];

  useSeoMeta({
    title: `${content.title} | Solar Freedom`,
    description: content.summary,
    canonical: `https://breakyoursolarcontract.com/${key}`,
  });

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-5 py-16 text-zinc-200">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-amber-400 hover:text-amber-300">← Home</Link>
        <h1 className="mt-8 text-4xl font-bold text-white">{content.title}</h1>
        <p className="mt-5 text-lg leading-8 text-zinc-300">{content.summary}</p>
        {content.sections.map(([heading, body]) => (
          <section key={heading} className="mt-10">
            <h2 className="text-2xl font-semibold text-white">{heading}</h2>
            <p className="mt-3 leading-7 text-zinc-400">{body}</p>
          </section>
        ))}
        <p className="mt-12 text-sm text-zinc-500">Last reviewed: July 20, 2026</p>
      </article>
    </main>
  );
}
