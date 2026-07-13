/**
 * SOLAR FREEDOM — City/State SEO Landing Page
 * Design: Dark Industrial Brutalism — same system as Home.tsx
 * Each city route stays out of public discovery until its evidence record passes review.
 * Content depth: local hook, market stats, complaint data, company problems,
 *   why-it-happens, expanded state law, local FAQ — targeting 800–1200 words per page
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { SchemaInjector } from "@/components/SchemaInjector";
import { motion, useInView } from "framer-motion";
import { useParams, Link } from "wouter";
import { getCityBySlug, cities as CITIES } from "@/data/cities";
import { hasPublishableEditorialReview } from "@/data/publication-governance";
import { hasPublishableStateLawEvidence, stateLaws } from "@/data/state-laws";
import DoIQualifyQuiz from "@/components/DoIQualifyQuiz";
import { ContactConsentFields } from "@/components/ContactConsentFields";
import { trpc } from "@/lib/trpc";
import { recordLeadSubmission } from "@/lib/analytics";
import { buildSchedulerUrl } from "@/lib/scheduler";
import { CONTACT_CONSENT_VERSION } from "@shared/leadConsent";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663287718525/46qo2AwgwNWJ4wJwr8EnH8/hero-bg-FmKRyibRwC4JGhU5naV2R2.webp";

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Compact multi-step form for city pages
function CityForm({ city, state }: { city: string; state: string }) {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    company: "",
    issue: "",
    payment: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    contactConsent: false,
    smsConsent: false,
    website: "",
  });
  const submitLead = trpc.leads.submit.useMutation();

  const COMPANIES = ["Sunrun", "SunPower", "Tesla Solar", "Vivint Solar", "ADT Solar", "Freedom Forever", "Sunnova", "GoodLeap", "Mosaic", "Loanpal", "Other"];
  const ISSUES = ["Monthly payment too high", "System underperforms", "Was misled during sale", "Can't sell my home", "Company went bankrupt", "Hidden fees", "Other"];
  const PAYMENTS = ["Under $100", "$100–$150", "$150–$200", "$200–$250", "Over $250"];

  const steps = [
    { question: `Who is your solar finance company?`, field: "company", options: COMPANIES },
    { question: "What's your main issue?", field: "issue", options: ISSUES },
    { question: "What's your monthly solar payment?", field: "payment", options: PAYMENTS },
  ];

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim() || !form.email.trim()) return;
    if (!form.contactConsent) {
      setError("Please authorize contact about this request before submitting.");
      return;
    }
    setError("");
    try {
      const result = await submitLead.mutateAsync({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        solarCompany: form.company,
        problemType: form.issue,
        monthlyPayment: form.payment,
        intent: `City landing page case review for ${city}, ${state}`,
        formName: "city_landing_case_review",
        contactConsent: form.contactConsent,
        smsConsent: form.smsConsent,
        consentVersion: CONTACT_CONSENT_VERSION,
        website: form.website,
        sourcePage: typeof window !== "undefined" ? window.location.pathname : undefined,
        sourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
      });
      const page = typeof window !== "undefined" ? window.location.pathname : "unknown";
      if (!recordLeadSubmission(result, "city_landing_case_review", page)) {
        setError("We couldn't save your review. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      recordLeadSubmission(null, "city_landing_case_review", typeof window !== "undefined" ? window.location.pathname : "unknown");
      setError("Something went wrong submitting your review. Please try again or call us directly.");
    }
  };

  // Keep all submitted contact data out of the third-party scheduler URL.
  const calendarUrl = useMemo(
    () => buildSchedulerUrl(undefined, {
      source: "city_page",
      campaign: "city_case_review",
      location: `${city}, ${state}`,
    }),
    [city, state],
  );

  if (submitted) {
    return (
      <div className="space-y-5">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
          <div className="text-green-400 text-xl mt-0.5">✅</div>
          <div>
            <h3 className="font-display text-xl text-white mb-1">CASE SUBMITTED</h3>
            <p className="text-gray-400 text-sm">Request an individual review of your {city} situation and available next steps.</p>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden border border-amber-500/20">
          <iframe
            src={calendarUrl}
            width="100%"
            height="520"
            frameBorder="0"
            title="Book a case review call"
            className="block"
          />
        </div>
        <p className="text-gray-600 text-xs text-center font-mono">Pick a time that works. Availability and scope require confirmation.</p>
        <p className="text-gray-500 text-xs text-center leading-relaxed">
          Scheduling is provided by a third-party booking service. Your submitted
          name, email, and phone number are not included in this booking URL. See our{" "}
          <a className="text-amber-400 underline" href="/privacy-policy">Privacy Policy</a>.
        </p>
      </div>
    );
  }

  if (step < steps.length) {
    const current = steps[step];
    return (
      <div className="space-y-5">
        <div className="flex gap-1 mb-6">
          {steps.map((_, i) => (
            <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i <= step ? "#f97316" : "oklch(0.3 0.01 265)" }} />
          ))}
        </div>
        <p className="text-gray-400 text-sm font-mono">STEP {step + 1} OF {steps.length + 1}</p>
        <h3 className="font-display text-xl text-white">{current.question}</h3>
        <div className="grid grid-cols-2 gap-2">
          {current.options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                setForm((f) => ({ ...f, [current.field]: opt }));
                setStep((s) => s + 1);
              }}
              className="text-left px-4 py-3 rounded border text-sm transition-all"
              style={{
                background: form[current.field as keyof typeof form] === opt ? "oklch(0.72 0.19 50 / 15%)" : "oklch(0.18 0.01 265)",
                borderColor: form[current.field as keyof typeof form] === opt ? "#f97316" : "oklch(0.3 0.01 265)",
                color: form[current.field as keyof typeof form] === opt ? "#f97316" : "#d1d5db",
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 mb-6">
        {steps.map((_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full" style={{ background: "#f97316" }} />
        ))}
      </div>
      <h3 className="font-display text-xl text-white">LAST STEP — WHERE DO WE REACH YOU?</h3>
      <p className="text-gray-500 text-sm">Request a review of your {city}, {state} solar contract. Response time and availability vary.</p>
      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder="First Name"
          value={form.firstName}
          onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
          className="px-4 py-3 rounded text-white text-sm outline-none"
          style={{ background: "oklch(0.18 0.01 265)", border: "1px solid oklch(0.3 0.01 265)" }}
        />
        <input
          placeholder="Last Name"
          value={form.lastName}
          onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
          className="px-4 py-3 rounded text-white text-sm outline-none"
          style={{ background: "oklch(0.18 0.01 265)", border: "1px solid oklch(0.3 0.01 265)" }}
        />
      </div>
      <input
        placeholder="Phone Number"
        value={form.phone}
        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        className="w-full px-4 py-3 rounded text-white text-sm outline-none"
        style={{ background: "oklch(0.18 0.01 265)", border: "1px solid oklch(0.3 0.01 265)" }}
      />
      <input
        placeholder="Email Address"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        className="w-full px-4 py-3 rounded text-white text-sm outline-none"
        style={{ background: "oklch(0.18 0.01 265)", border: "1px solid oklch(0.3 0.01 265)" }}
      />
      <ContactConsentFields
        idPrefix={`city-${city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
        contactConsent={form.contactConsent}
        smsConsent={form.smsConsent}
        website={form.website}
        onContactConsentChange={(checked) => setForm((current) => ({ ...current, contactConsent: checked }))}
        onSmsConsentChange={(checked) => setForm((current) => ({ ...current, smsConsent: checked }))}
        onWebsiteChange={(value) => setForm((current) => ({ ...current, website: value }))}
      />
      {error && <p role="alert" className="text-red-400 text-xs text-center">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={!form.firstName || !form.lastName || !form.phone || !form.email || !form.contactConsent || submitLead.isPending}
        className="w-full py-4 rounded font-bold text-black text-lg transition-all disabled:opacity-40"
        style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
      >
        REQUEST MY {city.toUpperCase()} CASE REVIEW →
      </button>
      <p className="text-gray-600 text-xs text-center font-mono">No result, timeline, or representation is guaranteed.</p>
    </div>
  );
}

export default function CityPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  const city = getCityBySlug(slug);
  const cityEvidenceAvailable = hasPublishableEditorialReview(city);

  useSeoMeta({
    title: city && cityEvidenceAvailable
      ? `Cancel Solar Contract in ${city.name}, ${city.stateCode} | Solar Freedom`
      : city
        ? `${city.name}, ${city.stateCode} Solar Contract Research Status | Solar Freedom`
        : 'Solar Contract Research Status | Solar Freedom',
    description: city && cityEvidenceAvailable
      ? `Review solar contract terms and consumer resources for ${city.name}, ${city.stateCode}. Options and timing depend on your agreement, facts, and jurisdiction.`
      : city
        ? `This ${city.name}, ${city.stateCode} research page is withheld from search until primary sources, as-of dates, an editorial reviewer, and unique local value are recorded.`
        : 'This research page is not eligible for search publication.',
    canonical: `https://breakyoursolarcontract.com/cancel-solar-contract/${slug}`,
    noindex: !cityEvidenceAvailable,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!city) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.09 0.01 265)" }}>
        <div className="text-center">
          <h1 className="font-display text-4xl text-white mb-4">CITY NOT FOUND</h1>
          <Link href="/" className="text-amber-400 hover:underline">← Back to Solar Freedom</Link>
        </div>
      </div>
    );
  }

  const faqItems = [
    { q: `What records should I gather for a solar contract review in ${city.name}?`, a: 'Gather the signed agreement, loan or lease documents, disclosures, sales proposals, utility bills, installation records, and communications with the seller, installer, servicer, or lender.' },
    { q: `How long does a solar contract dispute take in ${city.stateCode}?`, a: 'Timing varies with the agreement, facts, parties involved, selected process, and applicable law. No result or timeline can be determined before an individual review.' },
    { q: `Where can I verify solar-company complaint information for ${city.name}?`, a: 'Check current records from the relevant state attorney general, the Consumer Financial Protection Bureau, the Federal Trade Commission, and other official regulators. Third-party ratings and complaint totals can change.' },
  ];

  // Unreviewed backlog pages emit navigation only; FAQ search markup waits for evidence.
  const citySchemas: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://breakyoursolarcontract.com' },
        { '@type': 'ListItem', position: 2, name: `Cancel Solar Contract in ${city.name}, ${city.stateCode}`, item: `https://breakyoursolarcontract.com/cancel-solar-contract/${slug}` },
      ],
    },
  ];
  if (cityEvidenceAvailable) citySchemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    });

  // Never create a public crawl path into the evidence-withheld city backlog.
  const relatedCities = CITIES
    .filter((candidate) => hasPublishableEditorialReview(candidate))
    .filter((c) => c.slug !== slug && (c.stateCode === city.stateCode || city.relatedCities.includes(c.slug)))
    .slice(0, 6);

  // State law page link
  const stateLawEntry = stateLaws.find(
    (stateLaw) => stateLaw.state === city.state && hasPublishableStateLawEvidence(stateLaw),
  );
  const stateLawSlug = stateLawEntry?.slug ?? null;

  const marketStats = cityEvidenceAvailable
    ? [
        { label: "City Population", value: city.population },
        { label: "Solar Market", value: city.solarActivity },
        { label: "Case Review", value: "Request Review" },
      ]
    : [
        { label: "Record 1", value: "Agreement" },
        { label: "Record 2", value: "Disclosures" },
        { label: "Record 3", value: "Bills + Performance" },
        { label: "Record 4", value: "Communications" },
      ];

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.09 0.01 265)", fontFamily: "'DM Sans', sans-serif" }}>
      <SchemaInjector schemas={citySchemas} />

      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-white/8" style={{ background: "oklch(0.09 0.01 265 / 95%)", backdropFilter: "blur(12px)" }}>
        <div className="container flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "#f97316" }}>
                <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-display text-lg text-white" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>SOLAR FREEDOM</span>
            </div>
          </Link>
          <a
            href="#city-form"
            className="px-5 py-2 rounded font-bold text-sm text-black"
            style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
          >
            CASE REVIEW
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_BG}
            alt={`Rooftop solar panels near ${city.name}, ${city.stateCode}`}
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.25)" }}
            loading="eager" fetchPriority="high" decoding="async"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, oklch(0.09 0.01 265 / 80%) 0%, transparent 60%)" }} />
        </div>
        <div className="container relative z-10 py-20">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/40 text-red-400 text-xs font-mono mb-6" style={{ background: "oklch(0.15 0.05 20 / 40%)" }}>
              AGREEMENT RESEARCH — {city.name.toUpperCase()}, {city.stateCode}
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h1
              className="text-white leading-none mb-4"
              style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2.5rem, 6vw, 5rem)", letterSpacing: "0.02em" }}
            >
              REVIEW YOUR SOLAR CONTRACT
              <br />
              <span style={{ background: "linear-gradient(90deg, #f97316, #fb923c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                IN {city.name.toUpperCase()}, {city.stateCode}
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-gray-300 text-lg max-w-2xl mb-8 leading-relaxed">
              Review your agreement, disclosures, financing documents, installation records, and communications before deciding which next step fits your situation.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="flex flex-wrap gap-4">
              <a href="#city-form" className="px-8 py-4 rounded font-bold text-black text-lg" style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
                REQUEST CASE REVIEW →
              </a>
              <Link href="/">
                <span className="px-8 py-4 rounded font-bold text-white text-lg border border-white/20 hover:border-amber-500/50 transition-colors cursor-pointer">
                  ← BACK TO HOME
                </span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* LOCAL STATS STRIP */}
      <div className="border-y border-white/8 py-6" style={{ background: "oklch(0.12 0.012 265)" }}>
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {marketStats.map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-2xl text-amber-400" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{stat.value}</div>
                <div className="text-gray-500 text-xs font-mono mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT + FORM */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-start">

            {/* Left: source-conscious local research */}
            <div className="space-y-10">
              <Reveal>
                <div>
                  <h2 className="font-display text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}>
                    REVIEW A {city.name.toUpperCase()} SOLAR AGREEMENT
                  </h2>
                  <p className="text-gray-400 leading-relaxed">
                    The available options cannot be determined from a city or company name alone. Start with the signed agreement, financing documents, disclosures, sales materials, bills, installation records, and communications.
                  </p>
                </div>
              </Reveal>

              <Reveal delay={0.05}>
                <div className="p-6 rounded-lg border border-amber-500/20" style={{ background: "oklch(0.14 0.015 50 / 20%)" }}>
                  <h3 className="font-display text-amber-400 text-lg mb-3" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    VERIFY CURRENT {city.stateCode} CONSUMER INFORMATION
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">
                    State rules change and may include transaction-specific exceptions. Check current official sources before relying on any cancellation period, remedy, or legal conclusion.
                  </p>
                  <a href="https://www.usa.gov/state-attorney-general" target="_blank" rel="noopener noreferrer" className="text-amber-400 text-sm font-semibold hover:underline">
                    Find the official state attorney general site →
                  </a>
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <div>
                  <h3 className="font-display text-white text-xl mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    COMPANIES LISTED FOR {city.name.toUpperCase()}
                  </h3>
                  <p className="text-gray-500 text-xs mb-3">A listing does not establish wrongdoing, liability, or an available remedy.</p>
                  <div className="flex flex-wrap gap-2">
                    {city.companies.map((companyName) => (
                      <span key={companyName} className="px-3 py-1.5 rounded border text-sm text-gray-300" style={{ background: "oklch(0.16 0.01 265)", borderColor: "oklch(0.28 0.01 265)" }}>
                        {companyName}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.15}>
                <div>
                  <h3 className="font-display text-white text-xl mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    QUESTIONS FOR A DOCUMENT REVIEW
                  </h3>
                  <div className="space-y-3">
                    {[
                      'Which cancellation, dispute, and transfer provisions are in the signed agreement?',
                      'Do the financing disclosures match the payment schedule and total cost?',
                      'What written representations were made before signing?',
                      'What do the installation and production records show?',
                      'Which parties currently own, service, or finance the agreement?',
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3 text-gray-400 text-sm">
                        <span className="text-amber-400 font-bold mt-0.5 shrink-0">✓</span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Right: Form */}
            <div id="city-form" className="lg:sticky lg:top-24">
              <Reveal delay={0.1}>
                <div className="p-8 rounded-xl form-glow-box" style={{ background: "oklch(0.13 0.012 265)" }}>
                  <div className="mb-6">
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-mono text-amber-400 border border-amber-500/30 mb-3" style={{ background: "oklch(0.72 0.19 50 / 10%)" }}>
                      INDIVIDUAL CASE REVIEW
                    </div>
                    <h2 className="font-display text-white text-2xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                      REQUEST AN INDIVIDUAL DOCUMENT REVIEW
                    </h2>
                    <p className="text-gray-400 text-sm mt-2">Options and outcomes depend on your agreement, facts, and jurisdiction.</p>
                  </div>
                  <CityForm city={city.name} state={city.stateCode} />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* LOCAL FAQ — shown if depth data available, otherwise generic */}
      <section className="py-16 border-t border-white/8" style={{ background: "oklch(0.11 0.01 265)" }}>
        <div className="container max-w-3xl mx-auto">
          <Reveal>
            <h2 className="font-display text-white text-2xl mb-8" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              FREQUENTLY ASKED QUESTIONS — {city.name.toUpperCase()}, {city.stateCode}
            </h2>
          </Reveal>
          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <details className="group rounded-lg border border-white/8 overflow-hidden" style={{ background: "oklch(0.13 0.01 265)" }}>
                  <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none">
                    <span className="text-white font-medium text-sm pr-4">{item.q}</span>
                    <span className="text-amber-400 shrink-0 text-lg group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <div className="px-6 pb-5 text-gray-400 text-sm leading-relaxed border-t border-white/8 pt-4">
                    {item.a}
                  </div>
                </details>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.3}>
            <div className="mt-10 p-6 rounded-xl border border-amber-500/30 text-center" style={{ background: "oklch(0.72 0.19 50 / 8%)" }}>
              <p className="text-gray-300 text-sm mb-4">Have a question not answered here? Request an individual review of your documents and circumstances.</p>
              <a href="#city-form" className="inline-block px-8 py-3 rounded font-bold text-black text-sm" style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
                REQUEST YOUR CASE REVIEW →
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* STATE LAW INTERNAL LINK */}
      {stateLawSlug && (
        <section className="py-10 border-t border-white/8" style={{ background: "oklch(0.10 0.01 265)" }}>
          <div className="container max-w-3xl mx-auto">
            <Reveal>
              <div className="rounded-xl border border-amber-500/20 p-6" style={{ background: "oklch(0.72 0.19 50 / 6%)" }}>
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.72 0.19 50 / 15%)" }}>
                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-400 text-xs font-mono uppercase tracking-wider mb-1">{city.state} research status</p>
                    <h3 className="text-white font-semibold text-base mb-2">
                      Verify Current {city.state} Sources
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">
                      The state summary remains out of search until its primary sources, reviewer, and review date are recorded. Use it as a research-status page, not a legal conclusion.
                    </p>
                    <Link href={`/solar-contract-laws/${stateLawSlug}`} className="inline-flex items-center gap-2 text-amber-400 text-sm font-semibold hover:text-amber-300 transition-colors">
                      Open {city.state} Research Status →
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* TOPIC CLUSTER INTERNAL LINKS */}
      <section className="py-12 border-t border-white/8" style={{ background: "oklch(0.11 0.01 265)" }}>
        <div className="container">
          <DoIQualifyQuiz />
        </div>
      </section>

      {/* OTHER SOURCE-REVIEWED CITIES */}
      {relatedCities.length > 0 && <section className="py-16 border-t border-white/8" style={{ background: "oklch(0.11 0.01 265)" }}>
        <div className="container">
          <Reveal>
            <h2 className="font-display text-white text-2xl mb-8" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              WE ALSO SERVE HOMEOWNERS IN
            </h2>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {relatedCities.map((c, i) => (
              <Reveal key={c.slug} delay={i * 0.04}>
                <Link href={`/cancel-solar-contract/${c.slug}`}>
                  <div className="p-3 rounded border text-center cursor-pointer transition-all hover:border-amber-500/40 group" style={{ background: "oklch(0.14 0.01 265)", borderColor: "oklch(0.25 0.01 265)" }}>
                    <div className="text-gray-300 text-sm font-medium group-hover:text-amber-400 transition-colors">{c.name}</div>
                    <div className="text-gray-600 text-xs">{c.stateCode}</div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>}

      {/* FOOTER */}
      <footer className="border-t border-white/8 py-10" style={{ background: "oklch(0.09 0.01 265)" }}>
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "#f97316" }}>
                <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-display text-white text-base" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>SOLAR FREEDOM</span>
            </div>
          </Link>
          <p className="text-gray-600 text-xs font-mono text-center max-w-xl">
            Consumer information and intake resources for {city.name}, {city.state}. Not legal advice. Options and outcomes depend on the agreement, facts, and jurisdiction. © {new Date().getFullYear()} Solar Freedom.
          </p>
        </div>
      </footer>
    </div>
  );
}
