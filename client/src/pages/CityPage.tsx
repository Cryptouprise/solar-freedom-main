/**
 * SOLAR FREEDOM — City/State SEO Landing Page (v2 — Conversion-Focused Redesign)
 * Design: Dark Industrial Brutalism — same system as Home.tsx
 * Each city gets a unique, indexed page at /cancel-solar-contract-[slug]
 * Content depth: local hook, market stats, complaint data, company problems,
 *   why-it-happens, expanded state law, local FAQ — targeting 800–1200 words per page
 * 
 * V2 CHANGES:
 * - Full state names everywhere (Texas, not TX) except URL slugs
 * - Data-driven infographic images (hidden fee lie, top companies, problem vs solution)
 * - Active Legal Actions section with real lawsuit/settlement data
 * - Company complaint cards with dollar amounts and urgency styling
 * - Urgency/social proof strip
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { SchemaInjector } from "@/components/SchemaInjector";
import { motion, useInView } from "framer-motion";
import { useParams, Link } from "wouter";
import { getCityBySlug, cities as CITIES } from "@/data/cities";
import { isCityIndexed } from "@/data/indexed-cities";
import { getCityContentDepthAll as getCityContentDepth } from "@/data/city-content-depth-all";
import { stateLaws } from "@/data/state-laws";
import TopicClusterWidget from "@/components/TopicClusterWidget";
import DoIQualifyQuiz from "@/components/DoIQualifyQuiz";
import { trpc } from "@/lib/trpc";
import { recordLeadSubmission } from "@/lib/analytics";
import StickyMobileBar from "@/components/StickyMobileBar";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663287718525/46qo2AwgwNWJ4wJwr8EnH8/hero-bg-FmKRyibRwC4JGhU5naV2R2.webp";

type PublishedCityRecovery = {
  id: number;
  publishedAt: Date | string | null;
  payload: {
    title: string;
    metaTitle: string;
    metaDescription: string;
    heroHeading: string;
    heroCopy: string;
    sections: Array<{ heading: string; body: string }>;
    faq: Array<{ question: string; answer: string }>;
    sources: Array<{ label: string; url: string }>;
    internalLinks: Array<{ label: string; url: string }>;
    ctaHeading: string;
    ctaCopy: string;
    targetKeyword: string;
  };
};

// Infographic CDN URLs
const IMG_HIDDEN_FEE = "/manus-storage/infographic-hidden-fee-lie_973f1439.png";
const IMG_TOP_COMPANIES = "/manus-storage/infographic-top-complaints-tx_62037137.png";
const IMG_PROBLEM_SOLUTION = "/manus-storage/infographic-problem-solution_70d1b723.png";
const IMG_WHY_EXIT = "/manus-storage/infographic-why-people-exit_685132c7.png";
const IMG_SETTLEMENTS = "/manus-storage/infographic-tx-settlements_6e159274.png";

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
  const [form, setForm] = useState({ company: "", issue: "", payment: "", firstName: "", lastName: "", phone: "", email: "" });
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

  // Build prefilled GHL calendar URL from submitted form data
  const calendarUrl = useMemo(() => {
    const CALENDAR_ID = "Glvb9OZtDFHDMiwvHpli";
    const base = `https://link.myinfinite.ai/widget/booking/${CALENDAR_ID}`;
    const params = new URLSearchParams();
    if (form.firstName) params.set("first_name", form.firstName.trim());
    if (form.lastName) params.set("last_name", form.lastName.trim());
    if (form.phone) {
      const digits = form.phone.replace(/\D/g, "");
      const e164 = digits.length === 10 ? `+1${digits}` : digits.length === 11 && digits.startsWith("1") ? `+${digits}` : form.phone;
      params.set("phone", e164);
    }
    if (form.email) params.set("email", form.email.trim());
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }, [form.firstName, form.lastName, form.phone, form.email]);

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
        <p className="text-gray-600 text-xs text-center font-mono">Pick a time that works. Free 15-min case review call.</p>
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
      {error && <p className="text-red-400 text-xs text-center">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={!form.firstName || !form.lastName || !form.phone || !form.email || submitLead.isPending}
        className="w-full py-4 rounded font-bold text-black text-lg transition-all disabled:opacity-40"
        style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
      >
        REQUEST MY {city.toUpperCase()} CASE REVIEW →
      </button>
      <p className="text-gray-600 text-xs text-center font-mono">No result, timeline, or representation is guaranteed.</p>
    </div>
  );
}

function RecoveredCityPage({
  city,
  recovery,
}: {
  city: NonNullable<ReturnType<typeof getCityBySlug>>;
  recovery: PublishedCityRecovery;
}) {
  const path = `/cancel-solar-contract/${city.slug}`;
  const publishedDate = recovery.publishedAt
    ? new Date(recovery.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: recovery.payload.title,
      description: recovery.payload.metaDescription,
      url: `https://breakyoursolarcontract.com${path}`,
      dateModified: recovery.publishedAt ? new Date(recovery.publishedAt).toISOString() : undefined,
      inLanguage: "en-US",
      about: { "@type": "Place", name: `${city.name}, ${city.state}` },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: recovery.payload.faq.map(item => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://breakyoursolarcontract.com" },
        { "@type": "ListItem", position: 2, name: recovery.payload.title, item: `https://breakyoursolarcontract.com${path}` },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0D0F14] text-white">
      <StickyMobileBar />
      <SchemaInjector schemas={schemas} />
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0D0F14]/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="font-display text-lg tracking-wider text-white">SOLAR FREEDOM</Link>
          <a href="#city-review" className="rounded bg-amber-500 px-5 py-2 text-sm font-bold text-black">REQUEST A CASE REVIEW</a>
        </div>
      </nav>

      <main>
        <header className="border-b border-white/10 bg-gradient-to-br from-zinc-950 to-zinc-900">
          <div className="container max-w-5xl py-16 md:py-24">
            <p className="mb-4 text-xs font-mono uppercase tracking-[0.2em] text-amber-400">
              Source-backed local guide · {city.name}, {city.state}
            </p>
            <h1 className="max-w-4xl font-display text-4xl leading-tight md:text-6xl">{recovery.payload.heroHeading}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-300">{recovery.payload.heroCopy}</p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs text-zinc-500">
              {publishedDate && <span>Verified update: {publishedDate}</span>}
              <span>Educational information—not legal advice</span>
            </div>
          </div>
        </header>

        <div className="container grid max-w-6xl gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_360px]">
          <article className="min-w-0">
            <div className="space-y-12">
              {recovery.payload.sections.map((section, index) => (
                <section key={`${section.heading}-${index}`}>
                  <h2 className="font-display text-3xl text-white">{section.heading}</h2>
                  {section.body.split(/\n{2,}/).map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex} className="mt-4 whitespace-pre-line text-[1.05rem] leading-8 text-zinc-300">
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))}
            </div>

            <section className="mt-14 border-t border-white/10 pt-10">
              <h2 className="font-display text-3xl">Official sources and verification</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Rules, procedures, and company information can change. Check these sources and the written agreement before acting.
              </p>
              <ul className="mt-6 space-y-3">
                {recovery.payload.sources.map(source => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-amber-400 underline underline-offset-4 hover:text-amber-300">
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-14 border-t border-white/10 pt-10">
              <h2 className="font-display text-3xl">Frequently asked questions</h2>
              <div className="mt-6 space-y-4">
                {recovery.payload.faq.map((item, index) => (
                  <details key={`${item.question}-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-5" open={index === 0}>
                    <summary className="cursor-pointer font-semibold text-white">{item.question}</summary>
                    <p className="mt-3 leading-relaxed text-zinc-300">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>

            <nav className="mt-14 border-t border-white/10 pt-10" aria-label="Related resources">
              <h2 className="font-display text-3xl">Related solar contract resources</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {recovery.payload.internalLinks.map(link => (
                  <li key={link.url}>
                    <Link href={link.url} className="block rounded-lg border border-white/10 p-4 text-amber-400 hover:border-amber-500/40">
                      {link.label} →
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </article>

          <aside id="city-review" className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-amber-500/30 bg-zinc-900 p-6">
              <h2 className="font-display text-2xl">{recovery.payload.ctaHeading}</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">{recovery.payload.ctaCopy}</p>
              <div className="mt-6">
                <CityForm city={city.name} state={city.state} />
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function CityPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  const city = getCityBySlug(slug);
  const depth = getCityContentDepth(slug);
  const { data: publishedRecovery } = trpc.cityRecovery.published.useQuery(
    { slug },
    { enabled: Boolean(slug && city), staleTime: 5 * 60 * 1000 },
  );
  const recovery = publishedRecovery as PublishedCityRecovery | null | undefined;

  useSeoMeta({
    title: recovery?.payload.metaTitle ?? (city
      ? `Cancel Solar Contract in ${city.name}, ${city.state} | Solar Freedom`
      : 'Cancel Solar Contract | Solar Freedom'),
    description: recovery?.payload.metaDescription ?? (city
      ? `Exposed: How solar companies are trapping ${city.name}, ${city.state} homeowners with hidden fees and broken promises. Find out if you qualify to cancel your contract.`
      : 'Review solar contract terms and consumer resources. Options depend on your agreement, facts, and jurisdiction.'),
    canonical: `https://breakyoursolarcontract.com/cancel-solar-contract/${slug}`,
    noindex: !isCityIndexed(slug),
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

  if (recovery) {
    return <RecoveredCityPage city={city} recovery={recovery} />;
  }

  const faqItems = [
    { q: `What records should I gather for a solar contract review in ${city.name}, ${city.state}?`, a: 'Gather the signed agreement, loan or lease documents, disclosures, sales proposals, utility bills, installation records, and communications with the seller, installer, servicer, or lender.' },
    { q: `How long does a solar contract dispute take in ${city.state}?`, a: 'Timing varies with the agreement, facts, parties involved, selected process, and applicable law. No result or timeline can be determined before an individual review.' },
    { q: `Where can I verify solar-company complaint information for ${city.name}?`, a: `Check current records from the ${city.state} attorney general, the Consumer Financial Protection Bureau, the Federal Trade Commission, and other official regulators. Third-party ratings and complaint totals can change.` },
    { q: `What is the TDU delivery fee and why am I still paying it with solar?`, a: `In deregulated ${city.state} markets, the Transmission and Distribution Utility (TDU) charges a delivery fee of $40-55/month that solar panels cannot eliminate. Many solar sales reps fail to disclose this charge, leading homeowners to believe their electric bill will be $0.` },
    { q: `Can I sue my solar lender (GoodLeap, Mosaic) directly?`, a: `Under the FTC Holder Rule (16 CFR 433), you can assert claims against your lender for any violations committed by the solar dealer/installer. This includes TILA violations, misrepresentation, and fraud. The lender is liable up to the amount you have paid.` },
  ];

  // Emit only page-verifiable navigation and FAQ data as structured data.
  const citySchemas: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://breakyoursolarcontract.com' },
        { '@type': 'ListItem', position: 2, name: `Cancel Solar Contract in ${city.name}, ${city.state}`, item: `https://breakyoursolarcontract.com/cancel-solar-contract/${slug}` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ];

  // Related cities (same state or nearby)
  const relatedCities = CITIES.filter((c) => c.slug !== slug && (c.stateCode === city.stateCode || city.relatedCities.includes(c.slug))).slice(0, 6);

  // State law page link
  const stateLawEntry = stateLaws.find((s) => s.state === city.state);
  const stateLawSlug = stateLawEntry?.slug ?? null;

  const marketStats = [
    { label: "City Population", value: city.population },
    { label: "Solar Market", value: city.solarActivity },
    { label: "Avg Hidden Fee", value: "$45–55/mo" },
    { label: "Case Review", value: "Free" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.09 0.01 265)", fontFamily: "'DM Sans', sans-serif" }}>
      <StickyMobileBar />
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
            FREE CASE REVIEW
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_BG}
            alt={`Solar contract cancellation resources for ${city.name}, ${city.state}`}
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.25)" }}
            loading="eager" fetchPriority="high" decoding="async"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, oklch(0.09 0.01 265 / 80%) 0%, transparent 60%)" }} />
        </div>
        <div className="container relative z-10 py-20">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/40 text-red-400 text-xs font-mono mb-6" style={{ background: "oklch(0.15 0.05 20 / 40%)" }}>
              ⚠ SOLAR CONTRACT TRAP — {city.name.toUpperCase()}, {city.state.toUpperCase()}
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h1
              className="text-white leading-none mb-4"
              style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2.5rem, 6vw, 5rem)", letterSpacing: "0.02em" }}
            >
              CANCEL YOUR SOLAR CONTRACT
              <br />
              <span style={{ background: "linear-gradient(90deg, #f97316, #fb923c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                IN {city.name.toUpperCase()}, {city.state.toUpperCase()}
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-gray-300 text-lg max-w-2xl mb-8 leading-relaxed">
              {city.name} homeowners are discovering they were lied to about solar savings. Hidden delivery fees, inflated promises, and predatory financing are costing families hundreds more per month than they were told. <strong className="text-white">You have legal options.</strong>
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="flex flex-wrap gap-4">
              <a href="#city-form" className="px-8 py-4 rounded font-bold text-black text-lg" style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
                DO I QUALIFY? →
              </a>
              <a href="#the-problem" className="px-8 py-4 rounded font-bold text-white text-lg border border-white/20 hover:border-amber-500/50 transition-colors">
                SEE THE EVIDENCE ↓
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* URGENCY STRIP */}
      <div className="border-y border-red-500/30 py-4" style={{ background: "oklch(0.12 0.04 20 / 30%)" }}>
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-6 text-center">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-sm font-semibold">Active {city.state} AG Investigation</span>
            </div>
            <div className="text-gray-500 hidden md:block">|</div>
            <div className="text-gray-300 text-sm">
              <strong className="text-amber-400">{city.population}</strong> residents in {city.name} solar market
            </div>
            <div className="text-gray-500 hidden md:block">|</div>
            <div className="text-gray-300 text-sm">
              Top complaints: <strong className="text-white">GoodLeap, Mosaic, Sunrun</strong>
            </div>
          </div>
        </div>
      </div>

      {/* LOCAL STATS STRIP */}
      <div className="border-b border-white/8 py-6" style={{ background: "oklch(0.12 0.012 265)" }}>
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

      {/* THE PROBLEM — Infographic Section */}
      <section id="the-problem" className="py-16 border-b border-white/8" style={{ background: "oklch(0.10 0.01 265)" }}>
        <div className="container">
          <Reveal>
            <h2 className="font-display text-white text-center mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              THE HIDDEN FEE THEY NEVER TOLD {city.name.toUpperCase()} HOMEOWNERS ABOUT
            </h2>
            <p className="text-gray-400 text-center max-w-2xl mx-auto mb-10 text-lg">
              Solar reps in {city.name} told you your electric bill would be $0. They didn't mention the TDU delivery fee — a mandatory charge that <strong className="text-white">never goes away</strong>, even with solar panels.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="max-w-lg mx-auto rounded-xl overflow-hidden border border-red-500/20 shadow-2xl">
              <img
                src={IMG_HIDDEN_FEE}
                alt={`Hidden TDU delivery fee that solar companies in ${city.name}, ${city.state} never disclosed — showing the real cost breakdown`}
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="text-gray-400 text-center text-sm mt-6 max-w-xl mx-auto">
              In {city.state}'s deregulated energy market, the TDU (Transmission and Distribution Utility) charges $40–55/month that solar cannot eliminate. Most {city.name} homeowners were never told this before signing.
            </p>
          </Reveal>
        </div>
      </section>

      {/* PROBLEM vs SOLUTION — Wide Infographic */}
      <section className="py-16 border-b border-white/8" style={{ background: "oklch(0.09 0.01 265)" }}>
        <div className="container">
          <Reveal>
            <h2 className="font-display text-white text-center mb-10" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)" }}>
              WHAT WENT WRONG — AND WHAT YOU CAN DO ABOUT IT
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-xl overflow-hidden border border-amber-500/20 shadow-2xl">
              <img
                src={IMG_PROBLEM_SOLUTION}
                alt={`Solar contract problems vs legal options available to ${city.name}, ${city.state} homeowners — TILA violations, DTPA claims, FTC Holder Rule, AG complaints`}
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* TOP COMPANIES UNDER FIRE */}
      <section className="py-16 border-b border-white/8" style={{ background: "oklch(0.11 0.01 265)" }}>
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <div>
                <h2 className="font-display text-white mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}>
                  TOP SOLAR COMPANIES UNDER FIRE IN {city.state.toUpperCase()}
                </h2>
                <p className="text-gray-400 leading-relaxed mb-6">
                  These are the companies generating the most complaints from {city.name} homeowners. If you have a contract with any of them, you may have grounds to cancel.
                </p>
                {/* Company-specific problems from depth data */}
                {depth?.companyProblems ? (
                  <div className="space-y-3">
                    {depth.companyProblems.map((cp, i) => (
                      <div key={i} className="p-4 rounded-lg border border-red-500/20 flex items-start gap-3" style={{ background: "oklch(0.13 0.02 20 / 20%)" }}>
                        <span className="text-red-400 font-bold text-lg mt-0.5 shrink-0">⚠</span>
                        <div>
                          <div className="font-bold text-white text-sm">{cp.company}</div>
                          <div className="text-gray-400 text-sm leading-relaxed mt-1">{cp.issue}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {city.companies.map((co) => (
                      <div key={co} className="p-4 rounded-lg border border-red-500/20 flex items-start gap-3" style={{ background: "oklch(0.13 0.02 20 / 20%)" }}>
                        <span className="text-red-400 font-bold text-lg mt-0.5 shrink-0">⚠</span>
                        <div>
                          <div className="font-bold text-white text-sm">{co}</div>
                          <div className="text-gray-400 text-sm leading-relaxed mt-1">Active complaints from {city.name} homeowners</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="rounded-xl overflow-hidden border border-amber-500/10 shadow-xl">
                <img
                  src={IMG_TOP_COMPANIES}
                  alt={`Top solar companies with complaints in ${city.state} — GoodLeap, Mosaic, Sunrun, Freedom Forever, ADT Solar`}
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* WHY PEOPLE ARE GETTING OUT */}
      <section className="py-16 border-b border-white/8" style={{ background: "oklch(0.10 0.01 265)" }}>
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <div className="rounded-xl overflow-hidden border border-amber-500/10 shadow-xl">
                <img
                  src={IMG_WHY_EXIT}
                  alt={`Top 5 reasons ${city.name}, ${city.state} homeowners are canceling solar contracts — hidden fees, tax credit fraud, underperformance, escalator clauses, bankruptcy`}
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div>
                <h2 className="font-display text-white mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}>
                  WHY {city.name.toUpperCase()} HOMEOWNERS ARE GETTING OUT
                </h2>
                {depth?.topComplaints ? (
                  <div className="space-y-4">
                    {depth.topComplaints.map((complaint, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-red-400 font-bold text-lg mt-0.5 shrink-0">{i + 1}.</span>
                        <p className="text-gray-300 leading-relaxed">{complaint}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[
                      "Hidden TDU delivery fees adding $45-55/month that solar never eliminates",
                      "Federal tax credit ($8,000-$12,000) never applied to reduce loan balance",
                      "System producing 25-40% less energy than the sales proposal promised",
                      "2.9% annual escalator clause turning $180/mo into $310/mo by year 10",
                      "Solar company went bankrupt — no warranty, no support, no recourse",
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-red-400 font-bold text-lg mt-0.5 shrink-0">{i + 1}.</span>
                        <p className="text-gray-300 leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                )}
                {depth?.whyItHappens && (
                  <p className="text-gray-400 text-sm mt-6 leading-relaxed border-t border-white/8 pt-4">
                    {depth.whyItHappens}
                  </p>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* SETTLEMENTS & LEGAL ACTIONS */}
      <section className="py-16 border-b border-white/8" style={{ background: "oklch(0.09 0.01 265)" }}>
        <div className="container">
          <Reveal>
            <h2 className="font-display text-white text-center mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)" }}>
              THE GOVERNMENT IS CRACKING DOWN ON SOLAR FRAUD
            </h2>
            <p className="text-gray-400 text-center max-w-2xl mx-auto mb-10">
              Attorneys general, the FTC, and consumer protection agencies are actively pursuing solar companies for fraud. {city.name} homeowners are getting their money back.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-xl overflow-hidden border border-amber-500/20 shadow-2xl">
              <img
                src={IMG_SETTLEMENTS}
                alt={`Solar company settlements and fines 2024-2026 — $4.3M Vivint, $29.5M SolarCity/Tesla, $13.8M Solar Xchange, $35M+ Bennett Legal vs GoodLeap`}
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-10 text-center">
              <a href="#city-form" className="inline-block px-10 py-5 rounded font-bold text-black text-lg" style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
                FIND OUT IF YOU QUALIFY →
              </a>
              <p className="text-gray-500 text-xs mt-3 font-mono">Free case review. No obligation. No upfront cost.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* STATE LAW SECTION */}
      <section className="py-16 border-b border-white/8" style={{ background: "oklch(0.11 0.01 265)" }}>
        <div className="container max-w-4xl mx-auto">
          <Reveal>
            <div className="p-8 rounded-xl border border-amber-500/20" style={{ background: "oklch(0.14 0.015 50 / 20%)" }}>
              <h3 className="font-display text-amber-400 text-2xl mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                {city.state.toUpperCase()} LAW IS ON YOUR SIDE
              </h3>
              <p className="text-gray-300 leading-relaxed mb-6">
                {depth?.stateLawExpanded ?? city.stateLaw}
              </p>
              <div className="space-y-3 mb-6">
                {[
                  "Truth in Lending Act (TILA) violations in your financing documents",
                  "FTC 3-day right of rescission not honored at signing",
                  "Misrepresentation of projected energy savings",
                  "Undisclosed escalator clauses in your contract",
                  "System performance below contractual guarantees",
                  `Deceptive sales practices under ${city.state} consumer protection law`,
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                    <span className="text-amber-400 font-bold mt-0.5 shrink-0">✓</span>
                    {item}
                  </div>
                ))}
              </div>
              {stateLawSlug && (
                <Link href={`/solar-contract-laws/${stateLawSlug}`} className="inline-flex items-center gap-2 text-amber-400 font-semibold hover:text-amber-300 transition-colors">
                  View Full {city.state} Solar Contract Laws →
                </Link>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* FORM SECTION */}
      <section className="py-20" style={{ background: "oklch(0.09 0.01 265)" }}>
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left: Social proof and urgency */}
            <div className="space-y-8">
              <Reveal>
                <h2 className="font-display text-white" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                  {city.name.toUpperCase()} HOMEOWNERS ARE FIGHTING BACK
                </h2>
                <p className="text-gray-400 leading-relaxed mt-4">
                  You're not alone. Homeowners across {city.name}, {city.state} are discovering they were misled and are taking action to cancel their solar contracts. The law provides multiple paths to get out — but you need to act before statutes of limitations expire.
                </p>
              </Reveal>

              <Reveal delay={0.05}>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-green-500/20" style={{ background: "oklch(0.14 0.03 145 / 15%)" }}>
                    <div className="text-green-400 font-bold text-sm mb-1">Federal Law (TILA)</div>
                    <div className="text-gray-300 text-sm">If your lender failed to disclose the true cost of your solar loan, you may have up to 3 years to rescind the entire contract.</div>
                  </div>
                  <div className="p-4 rounded-lg border border-green-500/20" style={{ background: "oklch(0.14 0.03 145 / 15%)" }}>
                    <div className="text-green-400 font-bold text-sm mb-1">FTC Holder Rule</div>
                    <div className="text-gray-300 text-sm">You can sue your lender (GoodLeap, Mosaic, etc.) directly for fraud committed by the solar installer. The lender is liable.</div>
                  </div>
                  <div className="p-4 rounded-lg border border-green-500/20" style={{ background: "oklch(0.14 0.03 145 / 15%)" }}>
                    <div className="text-green-400 font-bold text-sm mb-1">{city.state} Consumer Protection</div>
                    <div className="text-gray-300 text-sm">State deceptive trade practices laws may entitle you to up to 3x damages plus attorney fees.</div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <div className="p-5 rounded-lg border border-amber-500/30" style={{ background: "oklch(0.72 0.19 50 / 8%)" }}>
                  <div className="text-amber-400 font-bold text-sm mb-2">⏰ TIME-SENSITIVE</div>
                  <div className="text-gray-300 text-sm leading-relaxed">
                    Statutes of limitations apply. In {city.state}, you typically have 2-4 years from the date of the violation to file a claim. The sooner you get your contract reviewed, the more options you have.
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
                      FREE — NO OBLIGATION
                    </div>
                    <h2 className="font-display text-white text-2xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                      60 SECONDS TO FIND OUT IF YOU CAN CANCEL YOUR SOLAR CONTRACT
                    </h2>
                    <p className="text-gray-400 text-sm mt-2">Answer 3 quick questions about your {city.name} solar contract.</p>
                  </div>
                  <CityForm city={city.name} state={city.state} />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* LOCAL FAQ */}
      <section className="py-16 border-t border-white/8" style={{ background: "oklch(0.11 0.01 265)" }}>
        <div className="container max-w-3xl mx-auto">
          <Reveal>
            <h2 className="font-display text-white text-2xl mb-8" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              FREQUENTLY ASKED QUESTIONS — {city.name.toUpperCase()}, {city.state.toUpperCase()}
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
        </div>
      </section>

      {/* TOPIC CLUSTER INTERNAL LINKS */}
      <section className="py-12 border-t border-white/8" style={{ background: "oklch(0.11 0.01 265)" }}>
        <div className="container">
          <DoIQualifyQuiz />
          <TopicClusterWidget currentUrl={`/cancel-solar-contract/${params.slug}`} />
        </div>
      </section>

      {/* OTHER CITIES */}
      <section className="py-16 border-t border-white/8" style={{ background: "oklch(0.11 0.01 265)" }}>
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
                    <div className="text-gray-600 text-xs">{c.state}</div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

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
