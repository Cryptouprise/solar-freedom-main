/**
 * SOLAR FREEDOM — City/State SEO Landing Page
 * Design: Dark Industrial Brutalism — same system as Home.tsx
 * Each city gets a unique, indexed page at /cancel-solar-contract-[slug]
 * Content depth: local hook, market stats, complaint data, company problems,
 *   why-it-happens, expanded state law, local FAQ — targeting 800–1200 words per page
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { SchemaInjector } from "@/components/SchemaInjector";
import { motion, useInView } from "framer-motion";
import { useParams, Link } from "wouter";
import { getCityBySlug, cities as CITIES } from "@/data/cities";
import { getCityContentDepthAll as getCityContentDepth } from "@/data/city-content-depth-all";
import { stateLaws } from "@/data/state-laws";
import TopicClusterWidget from "@/components/TopicClusterWidget";
import DoIQualifyQuiz from "@/components/DoIQualifyQuiz";
import { trpc } from "@/lib/trpc";
import { recordLeadSubmission } from "@/lib/analytics";
import { SITE_CONFIG_DEFAULTS } from "@shared/const";

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
            <p className="text-gray-400 text-sm">Our attorneys will review your {city} case. Want to lock in a time to talk?</p>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden border border-amber-500/20">
          <iframe
            src={calendarUrl}
            width="100%"
            height="520"
            frameBorder="0"
            title="Book your free case review call"
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
      <p className="text-gray-500 text-sm">Free review of your {city}, {state} solar contract within 24 hours.</p>
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
        GET MY FREE {city.toUpperCase()} CASE REVIEW →
      </button>
      <p className="text-gray-600 text-xs text-center font-mono">No cost. No obligation. 100% confidential.</p>
    </div>
  );
}

export default function CityPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  const city = getCityBySlug(slug);
  const depth = getCityContentDepth(slug);

  useSeoMeta({
    title: city
      ? `Cancel Solar Contract in ${city.name}, ${city.stateCode} | Solar Freedom`
      : 'Cancel Solar Contract | Solar Freedom',
    description: city
      ? `Trapped in a solar contract in ${city.name}, ${city.stateCode}? Our attorneys have helped 3,000+ homeowners cancel solar agreements. Free case review — results in 30–90 days.`
      : 'Expert legal help to cancel your solar contract. Free case review.',
    canonical: `https://breakyoursolarcontract.com/cancel-solar-contract/${slug}`,
    noindex: false,
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

  // Build FAQ schema — use depth FAQs if available, otherwise generic
  const faqItems = depth?.localFaq ?? [
    { q: `Can I cancel a solar contract in ${city.name}?`, a: `Yes. Many ${city.name} homeowners have grounds to cancel based on misrepresentation, TILA violations, or failure to provide required cancellation notices. A free case review identifies your specific options.` },
    { q: `How long does it take to cancel a solar contract in ${city.stateCode}?`, a: `Depending on the path taken, resolution typically takes 30–90 days. Legal cancellation based on misrepresentation can sometimes be resolved in 30–45 days with an attorney demand letter.` },
    { q: `What solar companies have the most complaints in ${city.name}?`, a: `Based on BBB and state AG complaint data, the most complained-about companies in ${city.name} include Sunrun, Freedom Forever, and ADT Solar. Common issues include undisclosed escalator clauses, dealer fees, and savings projections that did not materialize.` },
  ];

  // LegalService + LocalBusiness + BreadcrumbList + FAQ schema stacking for city pages
  const citySchemas: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'LegalService',
      name: `Solar Freedom — ${city.name}, ${city.stateCode}`,
      description: `Expert solar contract cancellation attorneys serving ${city.name}, ${city.stateCode}. Cancel your solar lease, loan, or PPA legally.`,
      url: `https://breakyoursolarcontract.com/cancel-solar-contract/${slug}`,
      areaServed: { '@type': 'City', name: city.name, containedInPlace: { '@type': 'State', name: city.state } },
      serviceType: 'Solar Contract Cancellation',
      telephone: SITE_CONFIG_DEFAULTS.phone_number_e164,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Solar Freedom',
      description: `Solar contract cancellation attorneys serving ${city.name}, ${city.stateCode}.`,
      url: `https://breakyoursolarcontract.com/cancel-solar-contract/${slug}`,
      telephone: SITE_CONFIG_DEFAULTS.phone_number_e164,
      areaServed: { '@type': 'City', name: city.name, containedInPlace: { '@type': 'State', name: city.state } },
      address: {
        '@type': 'PostalAddress',
        addressLocality: city.name,
        addressRegion: city.stateCode,
        addressCountry: 'US',
      },
      priceRange: 'Free Consultation',
      openingHours: 'Mo-Fr 09:00-17:00',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://breakyoursolarcontract.com' },
        { '@type': 'ListItem', position: 2, name: `Cancel Solar Contract in ${city.name}, ${city.stateCode}`, item: `https://breakyoursolarcontract.com/cancel-solar-contract/${slug}` },
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

  // Market stats — use depth stats if available, otherwise generic
  const marketStats = depth?.marketStats ?? [
    { label: "City Population", value: city.population },
    { label: "Solar Market", value: city.solarActivity },
    { label: "Avg. Resolution", value: "30–90 Days" },
    { label: "Case Review", value: "FREE" },
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
            FREE REVIEW
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_BG}
            alt={`Solar contract cancellation attorneys serving ${city.name}, ${city.stateCode}`}
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.25)" }}
            loading="eager" fetchPriority="high" decoding="async"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, oklch(0.09 0.01 265 / 80%) 0%, transparent 60%)" }} />
        </div>
        <div className="container relative z-10 py-20">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/40 text-red-400 text-xs font-mono mb-6" style={{ background: "oklch(0.15 0.05 20 / 40%)" }}>
              ⚠ SOLAR CONTRACT TRAP — {city.name.toUpperCase()}, {city.stateCode}
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
                IN {city.name.toUpperCase()}, {city.stateCode}
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-gray-300 text-lg max-w-2xl mb-8 leading-relaxed">
              {depth?.localHook ?? `${city.name} is one of the fastest-growing solar markets in ${city.state}. Our consumer protection attorneys have helped hundreds of ${city.state} homeowners escape predatory solar contracts — for free.`}
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="flex flex-wrap gap-4">
              <a href="#city-form" className="px-8 py-4 rounded font-bold text-black text-lg" style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
                GET FREE CASE REVIEW →
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

            {/* Left: Local content */}
            <div className="space-y-10">
              <Reveal>
                <div>
                  <h2 className="font-display text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}>
                    THE {city.name.toUpperCase()} SOLAR PROBLEM
                  </h2>
                  <p className="text-gray-400 leading-relaxed">
                    Thousands of homeowners across {city.name} signed solar contracts after being promised dramatic savings — only to find themselves locked into agreements with escalating payments, underperforming systems, and no clear exit. If you are one of them, you have legal options.
                  </p>
                </div>
              </Reveal>

              {/* Top Complaints — shown if depth data available */}
              {depth?.topComplaints && (
                <Reveal delay={0.04}>
                  <div className="p-6 rounded-lg border border-red-500/20" style={{ background: "oklch(0.14 0.03 20 / 15%)" }}>
                    <h3 className="font-display text-red-400 text-lg mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                      TOP COMPLAINTS WE SEE IN {city.name.toUpperCase()}
                    </h3>
                    <div className="space-y-2">
                      {depth.topComplaints.map((complaint, i) => (
                        <div key={i} className="flex items-start gap-3 text-gray-400 text-sm">
                          <span className="text-red-400 font-bold mt-0.5 shrink-0">!</span>
                          {complaint}
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              )}

              {/* Expanded State Law */}
              <Reveal delay={0.05}>
                <div className="p-6 rounded-lg border border-amber-500/20" style={{ background: "oklch(0.14 0.015 50 / 20%)" }}>
                  <h3 className="font-display text-amber-400 text-lg mb-3" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    {city.stateCode} STATE LAW IS ON YOUR SIDE
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {depth?.stateLawExpanded ?? city.stateLaw}
                  </p>
                </div>
              </Reveal>

              {/* Company-specific problems — shown if depth data available */}
              {depth?.companyProblems ? (
                <Reveal delay={0.1}>
                  <div>
                    <h3 className="font-display text-white text-xl mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                      SOLAR COMPANIES WE FIGHT IN {city.name.toUpperCase()}
                    </h3>
                    <div className="space-y-4">
                      {depth.companyProblems.map((cp, i) => (
                        <div key={i} className="p-4 rounded border border-white/8" style={{ background: "oklch(0.13 0.01 265)" }}>
                          <div className="font-bold text-white text-sm mb-1">{cp.company}</div>
                          <div className="text-gray-400 text-sm leading-relaxed">{cp.issue}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ) : (
                <Reveal delay={0.1}>
                  <div>
                    <h3 className="font-display text-white text-xl mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                      COMPANIES WE FIGHT IN {city.name.toUpperCase()}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {city.companies.map((co) => (
                        <span key={co} className="px-3 py-1.5 rounded border text-sm text-gray-300" style={{ background: "oklch(0.16 0.01 265)", borderColor: "oklch(0.28 0.01 265)" }}>
                          {co}
                        </span>
                      ))}
                    </div>
                  </div>
                </Reveal>
              )}

              {/* Why It Happens — shown if depth data available */}
              {depth?.whyItHappens && (
                <Reveal delay={0.12}>
                  <div>
                    <h3 className="font-display text-white text-xl mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                      WHY SO MANY {city.stateCode} SOLAR CONTRACTS GO WRONG
                    </h3>
                    <p className="text-gray-400 leading-relaxed text-sm">{depth.whyItHappens}</p>
                  </div>
                </Reveal>
              )}

              <Reveal delay={0.15}>
                <div>
                  <h3 className="font-display text-white text-xl mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    GROUNDS TO CANCEL YOUR {city.name.toUpperCase()} SOLAR CONTRACT
                  </h3>
                  <div className="space-y-3">
                    {[
                      "Truth in Lending Act (TILA) violations in your financing documents",
                      "FTC 3-day right of rescission not honored at signing",
                      "Misrepresentation of projected energy savings",
                      "Undisclosed escalator clauses in your contract",
                      "System performance below contractual guarantees",
                      "Solar company bankruptcy or change of ownership",
                      "Deceptive sales practices under " + city.stateCode + " consumer protection law",
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 text-gray-400 text-sm">
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
                      FREE CASE REVIEW — NO OBLIGATION
                    </div>
                    <h2 className="font-display text-white text-2xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                      60 SECONDS TO FIND OUT IF WE CAN HELP YOU CANCEL YOUR SOLAR CONTRACT
                    </h2>
                    <p className="text-gray-400 text-sm mt-2">Most people have their solar canceled and still get to keep their equipment.</p>
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
              <p className="text-gray-300 text-sm mb-4">Have a question not answered here? Our attorneys review every case for free.</p>
              <a href="#city-form" className="inline-block px-8 py-3 rounded font-bold text-black text-sm" style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
                GET YOUR FREE CASE REVIEW →
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
                    <p className="text-gray-400 text-xs font-mono uppercase tracking-wider mb-1">{city.state} Consumer Protection Law</p>
                    <h3 className="text-white font-semibold text-base mb-2">
                      Know Your {city.state} Solar Contract Rights
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">
                      {city.state} has specific statutes governing solar sales, cooling-off periods, and required contract disclosures. Understanding your state rights is the first step to cancellation.
                    </p>
                    <Link href={`/solar-contract-laws/${stateLawSlug}`} className="inline-flex items-center gap-2 text-amber-400 text-sm font-semibold hover:text-amber-300 transition-colors">
                      View {city.state} Solar Contract Laws →
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
                    <div className="text-gray-600 text-xs">{c.stateCode}</div>
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
            Solar contract cancellation attorneys serving {city.name}, {city.state} and all 50 states. Results vary by case. Free consultation does not create attorney-client relationship. © {new Date().getFullYear()} Solar Freedom.
          </p>
        </div>
      </footer>
    </div>
  );
}
