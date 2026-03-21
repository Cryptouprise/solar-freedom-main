/**
 * SOLAR FREEDOM — City/State SEO Landing Page
 * Design: Dark Industrial Brutalism — same system as Home.tsx
 * Each city gets a unique, indexed page at /cancel-solar-contract-[slug]
 * Unique content: city name, state law, local stat, local companies
 */

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useParams, Link } from "wouter";
import { getCityBySlug, CITIES } from "@/data/cities";

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
  const [form, setForm] = useState({ company: "", issue: "", payment: "", name: "", phone: "", email: "" });

  const COMPANIES = ["Sunrun", "SunPower", "Tesla Solar", "Vivint Solar", "ADT Solar", "Freedom Forever", "Sunnova", "GoodLeap", "Mosaic", "Loanpal", "Other"];
  const ISSUES = ["Monthly payment too high", "System underperforms", "Was misled during sale", "Can't sell my home", "Company went bankrupt", "Hidden fees", "Other"];
  const PAYMENTS = ["Under $100", "$100–$150", "$150–$200", "$200–$250", "Over $250"];

  const steps = [
    {
      question: `Who is your solar finance company?`,
      field: "company",
      options: COMPANIES,
    },
    {
      question: "What's your main issue?",
      field: "issue",
      options: ISSUES,
    },
    {
      question: "What's your monthly solar payment?",
      field: "payment",
      options: PAYMENTS,
    },
  ];

  if (submitted) {
    return (
      <div className="text-center py-10">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="font-display text-2xl text-white mb-2">CASE SUBMITTED</h3>
        <p className="text-gray-400">Our attorneys will review your {city} case within 24 hours.</p>
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
          value={form.name.split(" ")[0] || ""}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value + " " + (f.name.split(" ")[1] || "") }))}
          className="px-4 py-3 rounded text-white text-sm outline-none"
          style={{ background: "oklch(0.18 0.01 265)", border: "1px solid oklch(0.3 0.01 265)" }}
        />
        <input
          placeholder="Last Name"
          onChange={(e) => setForm((f) => ({ ...f, name: (f.name.split(" ")[0] || "") + " " + e.target.value }))}
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
      <button
        onClick={() => setSubmitted(true)}
        disabled={!form.name || !form.phone || !form.email}
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

  // Related cities (same state or nearby)
  const relatedCities = CITIES.filter((c) => c.slug !== slug && (c.stateAbbr === city.stateAbbr || c.state !== city.state)).slice(0, 6);

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.09 0.01 265)", fontFamily: "'DM Sans', sans-serif" }}>

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
            alt={`Solar contract cancellation attorneys serving ${city.city}, ${city.stateAbbr}`}
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.25)" }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, oklch(0.09 0.01 265 / 80%) 0%, transparent 60%)" }} />
        </div>
        <div className="container relative z-10 py-20">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/40 text-red-400 text-xs font-mono mb-6" style={{ background: "oklch(0.15 0.05 20 / 40%)" }}>
              ⚠ SOLAR CONTRACT TRAP — {city.city.toUpperCase()}, {city.stateAbbr}
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
                IN {city.city.toUpperCase()}, {city.stateAbbr}
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-gray-300 text-lg max-w-2xl mb-8 leading-relaxed">
              {city.city} is {city.solarRank}. Our consumer protection attorneys have helped hundreds of {city.state} homeowners escape predatory solar contracts — for free.
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
            {[
              { label: "City Population", value: city.population },
              { label: "Solar Market", value: "High Activity" },
              { label: "Avg. Resolution", value: "30–90 Days" },
              { label: "Case Review", value: "FREE" },
            ].map((stat) => (
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
                    THE {city.city.toUpperCase()} SOLAR PROBLEM
                  </h2>
                  <p className="text-gray-400 leading-relaxed">
                    {city.localStat} Homeowners across {city.city} signed solar contracts after being promised dramatic savings — only to find themselves locked into agreements with escalating payments, underperforming systems, and no clear exit. If you are one of them, you have legal options.
                  </p>
                </div>
              </Reveal>

              <Reveal delay={0.05}>
                <div className="p-6 rounded-lg border border-amber-500/20" style={{ background: "oklch(0.14 0.015 50 / 20%)" }}>
                  <h3 className="font-display text-amber-400 text-lg mb-3" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    {city.stateAbbr} STATE LAW IS ON YOUR SIDE
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{city.localLaw}</p>
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <div>
                  <h3 className="font-display text-white text-xl mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    COMPANIES WE FIGHT IN {city.city.toUpperCase()}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {city.topCompanies.map((co) => (
                      <span key={co} className="px-3 py-1.5 rounded border text-sm text-gray-300" style={{ background: "oklch(0.16 0.01 265)", borderColor: "oklch(0.28 0.01 265)" }}>
                        {co}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.15}>
                <div>
                  <h3 className="font-display text-white text-xl mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    GROUNDS TO CANCEL YOUR {city.city.toUpperCase()} SOLAR CONTRACT
                  </h3>
                  <div className="space-y-3">
                    {[
                      "Truth in Lending Act (TILA) violations in your financing documents",
                      "FTC 3-day right of rescission not honored at signing",
                      "Misrepresentation of projected energy savings",
                      "Undisclosed escalator clauses in your contract",
                      "System performance below contractual guarantees",
                      "Solar company bankruptcy or change of ownership",
                      "Deceptive sales practices under " + city.stateAbbr + " consumer protection law",
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
                <div className="p-8 rounded-xl border border-white/10" style={{ background: "oklch(0.13 0.012 265)" }}>
                  <div className="mb-6">
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-mono text-amber-400 border border-amber-500/30 mb-3" style={{ background: "oklch(0.72 0.19 50 / 10%)" }}>
                      FREE CASE REVIEW — {city.city.toUpperCase()}, {city.stateAbbr}
                    </div>
                    <h2 className="font-display text-white text-2xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                      FIND OUT IF YOU HAVE A CASE IN 60 SECONDS
                    </h2>
                  </div>
                  <CityForm city={city.city} state={city.stateAbbr} />
                </div>
              </Reveal>
            </div>
          </div>
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
                <Link href={`/cancel-solar-contract-${c.slug}`}>
                  <div className="p-3 rounded border text-center cursor-pointer transition-all hover:border-amber-500/40 group" style={{ background: "oklch(0.14 0.01 265)", borderColor: "oklch(0.25 0.01 265)" }}>
                    <div className="text-gray-300 text-sm font-medium group-hover:text-amber-400 transition-colors">{c.city}</div>
                    <div className="text-gray-600 text-xs">{c.stateAbbr}</div>
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
            Solar contract cancellation attorneys serving {city.city}, {city.state} and all 50 states. Results vary by case. Free consultation does not create attorney-client relationship. © {new Date().getFullYear()} Solar Freedom.
          </p>
        </div>
      </footer>
    </div>
  );
}
