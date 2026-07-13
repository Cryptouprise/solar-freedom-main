import { useSeoMeta } from "@/hooks/useSeoMeta";
import { SchemaInjector } from "@/components/SchemaInjector";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  ClipboardCheck,
  FileSearch,
  Phone,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { Link } from "wouter";

const processSteps = [
  {
    step: "01",
    icon: <ClipboardCheck className="h-6 w-6" />,
    title: "Tell Us What Happened",
    body: "Start with the basics: company name, payment amount, signing date, installation status, and what the salesperson represented. This creates a factual inventory for review.",
  },
  {
    step: "02",
    icon: <FileSearch className="h-6 w-6" />,
    title: "Review the Contract Trail",
    body: "Compare the signed agreement, disclosures, sales materials, bills, installation records, and communications. Legal conclusions require a fact-specific review of current law.",
  },
  {
    step: "03",
    icon: <Scale className="h-6 w-6" />,
    title: "Map Questions and Possible Paths",
    body: "Identify contract provisions and questions to discuss, which may include cancellation, a lender dispute, negotiation, transfer, or title-related issues. Availability depends on the documents and facts.",
  },
  {
    step: "04",
    icon: <CalendarCheck className="h-6 w-6" />,
    title: "Choose the Next Step",
    body: "Decide whether to contact a company or lender, file a regulator complaint, seek independent legal advice, or take another documented step. No result or timeline is promised.",
  },
];

const qualifyingSignals = [
  "You were promised a tax credit, rebate, or government program you never received.",
  "Your solar payment plus electric bill is higher than your old electric bill.",
  "The salesperson rushed you, signed electronically for you, or skipped the cancellation notice.",
  "The system underproduces, was never activated, or the installer stopped responding.",
  "A solar loan, PPA, lease, UCC filing, or PACE lien is blocking a home sale or refinance.",
  "The solar company went bankrupt, disappeared, or transferred your account to another servicer.",
];

const outcomes = [
  {
    title: "Contract Cancellation",
    body: "The goal is to unwind a contract based on misrepresentation, missing disclosures, fraud, or state consumer protection law.",
  },
  {
    title: "Loan or Buyout Reduction",
    body: "When full cancellation is not the best fit, a negotiated reduction can lower the payoff or monthly damage.",
  },
  {
    title: "Lien and Sale Support",
    body: "If solar is blocking your home sale, the strategy focuses on title issues, transfer problems, and lien release pressure.",
  },
];

const faq = [
  {
    q: "How long does solar contract cancellation take?",
    a: "Timing depends on the agreement, facts, parties, selected process, and applicable law. No general page can predict a response time, settlement, or result.",
  },
  {
    q: "Do I need my full solar contract before asking for help?",
    a: "No. You can start with what you have. Helpful documents include the contract, proposal, financing disclosures, utility bills, texts, emails, and screenshots of savings promises.",
  },
  {
    q: "What if the panels are already installed?",
    a: "Installation status is one fact to review alongside the agreement, financing, disclosures, performance records, communications, and current law. It does not determine an outcome by itself.",
  },
];

const schema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to prepare a solar contract for individual review",
  description:
    "A four-step process for organizing solar contract records, identifying questions, and choosing a documented next step.",
  step: processSteps.map((step) => ({
    "@type": "HowToStep",
    name: step.title,
    text: step.body,
  })),
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export default function HowItWorks() {
  useSeoMeta({
    title: "How Solar Contract Cancellation Works | Solar Freedom",
    description:
      "Learn how to organize solar agreement records, identify questions for review, and compare possible next steps without assuming an outcome.",
    canonical: "https://breakyoursolarcontract.com/how-it-works",
  });

  return (
    <div
      className="min-h-screen"
      style={{
        background: "oklch(0.10 0.01 265)",
        color: "oklch(0.95 0.01 265)",
      }}
    >
      <SchemaInjector schemas={[schema, faqSchema]} />

      <nav
        className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 px-6 py-4"
        style={{
          background: "oklch(0.10 0.01 265 / 95%)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Link href="/">
          <span
            className="cursor-pointer text-xl font-black tracking-tight text-white"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              letterSpacing: "0.05em",
            }}
          >
            SOLAR<span className="text-amber-400">FREEDOM</span>
          </span>
        </Link>
        <a
          href="tel:+19049214971"
          className="hidden items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-amber-400/50 sm:flex"
        >
          <Phone className="h-4 w-4 text-amber-400" />
          (904) 921-4971
        </a>
      </nav>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 px-3 py-1 text-xs font-mono text-amber-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            SOLAR CONTRACT CANCELLATION PROCESS
          </div>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <h1
                className="mb-6 text-5xl font-black leading-none text-white md:text-7xl"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                HOW TO PREPARE
                <br />
                <span className="text-amber-400">FOR A REVIEW</span>
              </h1>
              <p className="mb-8 max-w-3xl text-xl leading-relaxed text-gray-300">
                Organize what you signed, compare it with the written sales
                materials, and identify questions that require a document-specific
                review. Possible next steps depend on the agreement, facts, parties,
                and current law.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/#contact">
                  <button className="flex items-center gap-2 rounded-lg bg-amber-400 px-6 py-3 font-bold text-black transition-transform hover:scale-[1.02]">
                    Request Document Review <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <Link href="/solar-contract-help">
                  <button className="rounded-lg border border-white/15 px-6 py-3 font-semibold text-white transition-colors hover:border-white/40">
                    Compare Legal Options
                  </button>
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-amber-400">
                <BadgeCheck className="h-4 w-4" />
                Start With These Record Clues
              </div>
              <div className="space-y-3">
                {qualifyingSignals.slice(0, 4).map((signal) => (
                  <div key={signal} className="flex gap-3 text-sm text-gray-300">
                    <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" />
                    <span>{signal}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-3xl">
              <h2
                className="mb-3 text-3xl font-black text-white md:text-5xl"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                THE 4-STEP REVIEW
              </h2>
              <p className="text-gray-400">
                The process is built to be simple for homeowners and specific
                enough to support a careful conversation with a company, lender,
                regulator, or attorney you choose.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {processSteps.map((item) => (
                <article
                  key={item.step}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div className="text-amber-400">{item.icon}</div>
                    <span className="font-mono text-sm text-gray-500">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-400">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 px-6 py-16">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h2
                className="mb-3 text-3xl font-black text-white md:text-5xl"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                WHAT WE LOOK FOR
              </h2>
              <p className="text-gray-400">
                You do not need to reach a legal conclusion before organizing the
                record. The purpose is to identify what the documents establish,
                what remains disputed, and what needs professional review.
              </p>
            </div>
            <div className="grid gap-3">
              {qualifyingSignals.map((signal) => (
                <div
                  key={signal}
                  className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-gray-300"
                >
                  <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                  <span>{signal}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <h2
              className="mb-10 text-3xl font-black text-white md:text-5xl"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              POSSIBLE OUTCOMES
            </h2>
            <div className="grid gap-5 md:grid-cols-3">
              {outcomes.map((outcome) => (
                <div
                  key={outcome.title}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <h3 className="mb-3 text-xl font-bold text-white">
                    {outcome.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-400">
                    {outcome.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <h2
              className="mb-8 text-3xl font-black text-white md:text-5xl"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              COMMON QUESTIONS
            </h2>
            <div className="space-y-4">
              {faq.map((item) => (
                <article
                  key={item.q}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <h3 className="mb-2 font-bold text-white">{item.q}</h3>
                  <p className="text-sm leading-relaxed text-gray-400">
                    {item.a}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-4xl rounded-2xl border border-amber-500/30 bg-amber-500/[0.08] p-8 text-center">
            <h2
              className="mb-4 text-3xl font-black text-white md:text-5xl"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              KNOW WHAT YOUR CONTRACT IS DOING TO YOU
            </h2>
            <p className="mx-auto mb-6 max-w-2xl text-gray-300">
              Submit the agreement and supporting records for an individual
              review. No representation, result, or response time is promised.
            </p>
            <Link href="/#contact">
              <button className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-6 py-3 font-bold text-black transition-transform hover:scale-[1.02]">
                Request My Document Review <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
