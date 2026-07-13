/**
 * SOLAR FREEDOM — Company-Specific SEO Landing Page
 * Design: Dark Industrial Brutalism — same system as Home.tsx
 * Each company gets a unique indexed page at /cancel-[company-slug]-solar-contract
 * Targets high-intent searches: "cancel sunrun contract", "pink energy bankruptcy", etc.
 */
import { useEffect, useRef, useState } from "react";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { SchemaInjector } from "@/components/SchemaInjector";
import { motion, useInView } from "framer-motion";
import { Link, useLocation } from "wouter";
import { getCompanyBySlug, companies as COMPANIES, getRelatedCompanies } from "@/data/companies";
import TopicClusterWidget from "@/components/TopicClusterWidget";
import DoIQualifyQuiz from "@/components/DoIQualifyQuiz";
import { trpc } from "@/lib/trpc";
import { recordLeadSubmission } from "@/lib/analytics";

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

function CompanyForm({ companyName }: { companyName: string }) {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ issue: "", payment: "", firstName: "", lastName: "", phone: "", email: "" });
  const submitLead = trpc.leads.submit.useMutation();

  const ISSUES = [
    "Monthly payment too high",
    "System underperforms / doesn't work",
    "Was misled during sale",
    "Can't sell my home",
    "Company went bankrupt",
    "Hidden fees / billing errors",
    "Roof damage from installation",
    "Other",
  ];
  const PAYMENTS = ["Under $100", "$100–$150", "$150–$200", "$200–$250", "Over $250"];

  const steps = [
    { question: `What's your main issue with ${companyName}?`, field: "issue", options: ISSUES },
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
        solarCompany: companyName,
        problemType: form.issue,
        monthlyPayment: form.payment,
        intent: `Company landing page case review for ${companyName}`,
        formName: "company_landing_case_review",
        sourcePage: typeof window !== "undefined" ? window.location.pathname : undefined,
        sourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
      });
      const page = typeof window !== "undefined" ? window.location.pathname : "unknown";
      if (!recordLeadSubmission(result, "company_landing_case_review", page)) {
        setError("We couldn't save your review. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      recordLeadSubmission(null, "company_landing_case_review", typeof window !== "undefined" ? window.location.pathname : "unknown");
      setError("Something went wrong submitting your review. Please try again or call us directly.");
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "oklch(0.72 0.19 50 / 20%)", border: "2px solid #f97316" }}>
          <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-display text-white text-xl mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>CASE REVIEW SUBMITTED</h3>
        <p className="text-gray-400 text-sm">Your information was submitted for review. Response time and availability vary.</p>
      </div>
    );
  }

  if (step < steps.length) {
    const current = steps[step];
    return (
      <div>
        <div className="flex gap-1 mb-6">
          {[...steps, { question: "", field: "contact", options: [] }].map((_, i) => (
            <div key={i} className="h-1 flex-1 rounded-full transition-all duration-500" style={{ background: i <= step ? "#f97316" : "oklch(0.25 0.01 265)" }} />
          ))}
        </div>
        <p className="text-gray-400 text-xs font-mono mb-3">STEP {step + 1} OF {steps.length + 1}</p>
        <h3 className="text-white font-semibold text-lg mb-5 leading-tight">{current.question}</h3>
        <div className="space-y-2">
          {current.options.map((opt) => (
            <button
              key={opt}
              onClick={() => { setForm(f => ({ ...f, [current.field]: opt })); setStep(s => s + 1); }}
              className="w-full text-left px-4 py-3 rounded-lg border text-sm text-gray-300 transition-all hover:border-amber-500/60 hover:text-white"
              style={{ background: "oklch(0.16 0.01 265)", borderColor: "oklch(0.28 0.01 265)" }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-1 mb-6">
        {[...steps, {}].map((_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full" style={{ background: "#f97316" }} />
        ))}
      </div>
      <p className="text-gray-400 text-xs font-mono mb-3">FINAL STEP — YOUR CONTACT INFO</p>
      <h3 className="text-white font-semibold text-lg mb-5">Where should we send information about your case review?</h3>
      <div className="space-y-3">
        {[
          { key: "firstName", label: "First Name", type: "text", placeholder: "John" },
          { key: "lastName", label: "Last Name", type: "text", placeholder: "Smith" },
          { key: "phone", label: "Phone Number", type: "tel", placeholder: "(904) 000-0000" },
          { key: "email", label: "Email Address", type: "email", placeholder: "john@email.com" },
        ].map(({ key, label, type, placeholder }) => (
          <div key={key}>
            <label className="text-gray-500 text-xs font-mono block mb-1">{label}</label>
            <input
              type={type}
              placeholder={placeholder}
              value={form[key as keyof typeof form]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg text-white text-sm placeholder-gray-600 border outline-none focus:border-amber-500/60 transition-colors"
              style={{ background: "oklch(0.16 0.01 265)", borderColor: "oklch(0.28 0.01 265)" }}
            />
          </div>
        ))}
        {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={!form.firstName || !form.lastName || !form.phone || !form.email || submitLead.isPending}
          className="w-full py-4 rounded-lg font-bold text-black text-base mt-2 transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
        >
          GET MY FREE {companyName.toUpperCase()} CASE REVIEW →
        </button>
        <p className="text-gray-600 text-xs text-center">No obligation. 100% confidential. Results vary by case.</p>
      </div>
    </div>
  );
}

export default function CompanyPage() {
  const [location] = useLocation();
  // Extract company slug from URL: /cancel-{slug}-solar-contract
  // Must use regex to handle slugs containing 'solar' (e.g., vivint-solar, tesla-solar)
  const urlMatch = location.match(/^\/cancel-(.+)-solar-contract$/);
  const slug = urlMatch?.[1] || "";
  const company = getCompanyBySlug(slug);
  const relatedCompanies = getRelatedCompanies(slug, 4);

  useSeoMeta({
    title: company
      ? `Cancel ${company.name} Solar Contract | Get Out Now | Solar Freedom`
      : 'Cancel Solar Contract | Solar Freedom',
    description: company
      ? `Review ${company.name} solar contract terms, complaint resources, and records to gather before requesting an individual case review.`
      : 'Review solar contract terms and records to gather before requesting an individual case review.',
    canonical: `https://breakyoursolarcontract.com/cancel-${slug}-solar-contract`,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.09 0.01 265)" }}>
        <div className="text-center">
          <h1 className="font-display text-4xl text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>COMPANY NOT FOUND</h1>
          <Link href="/" className="text-amber-400 hover:underline">← Back to Solar Freedom</Link>
        </div>
      </div>
    );
  }

  // Company claims remain hidden until each record has source and as-of metadata.
  const companyEvidenceAvailable = false;
  const companySchemas: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://breakyoursolarcontract.com' },
        { '@type': 'ListItem', position: 2, name: `Cancel ${company.name} Contract`, item: `https://breakyoursolarcontract.com/cancel-${slug}-solar-contract` },
      ],
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.09 0.01 265)", fontFamily: "'DM Sans', sans-serif" }}>
      <SchemaInjector schemas={companySchemas} />

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
          <div className="flex items-center gap-4">
            <Link href="/blog"><span className="text-gray-400 text-sm hover:text-white transition-colors cursor-pointer hidden md:block">Blog</span></Link>
            <a href="#company-form" className="px-5 py-2 rounded font-bold text-sm text-black" style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
              CASE REVIEW
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-[65vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_BG}
            alt={`Cancel ${company.name} solar contract — legal help for ${company.name} customers`}
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.2)" }}
            loading="eager" fetchPriority="high" decoding="async"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, oklch(0.09 0.01 265 / 90%) 0%, transparent 60%)" }} />
        </div>
        <div className="container relative z-10 py-20">
          <Reveal>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/40 text-red-400 text-xs font-mono" style={{ background: "oklch(0.15 0.05 20 / 40%)" }}>
                ⚠ {company.name.toUpperCase()} CONTRACT ALERT
              </div>
              {companyEvidenceAvailable && (
                <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/10 text-gray-400 text-xs font-mono" style={{ background: "oklch(0.14 0.01 265)" }}>
                  Verified company evidence available
                </div>
              )}
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-white leading-none mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2.2rem, 5.5vw, 4.5rem)", letterSpacing: "0.02em" }}>
              {company.tagline.split("—")[0]}
              {company.tagline.includes("—") && (
                <>
                  <br />
                  <span style={{ background: "linear-gradient(90deg, #f97316, #fb923c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    — {company.tagline.split("—")[1]}
                  </span>
                </>
              )}
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-gray-300 text-lg max-w-2xl mb-8 leading-relaxed">
              Review your signed {company.name} agreement, financing records, disclosures, sales materials, bills, installation records, and communications before choosing a next step.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="flex flex-wrap gap-4">
              <a href="#company-form" className="px-8 py-4 rounded font-bold text-black text-lg" style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
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

      {/* STATS STRIP */}
      <div className="border-y border-white/8 py-6" style={{ background: "oklch(0.12 0.012 265)" }}>
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: "Record 1", value: "Agreement" },
              { label: "Record 2", value: "Disclosures" },
              { label: "Record 3", value: "Bills + Performance" },
              { label: "Record 4", value: "Communications" },
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

            {/* Left: Company-specific content */}
            <div className="space-y-10">
              {companyEvidenceAvailable ? (
                <>
              <Reveal>
                <div>
                  <h2 className="font-display text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}>
                    THE {company.name.toUpperCase()} PROBLEM
                  </h2>
                  <p className="text-gray-400 leading-relaxed">{company.summary}</p>
                </div>
              </Reveal>

              {/* Top Complaints */}
              <Reveal delay={0.05}>
                <div>
                  <h3 className="font-display text-white text-xl mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    WHAT {company.name.toUpperCase()} CUSTOMERS ARE SAYING
                  </h3>
                  <div className="space-y-3">
                    {company.topComplaints.map((complaint, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-red-500/10" style={{ background: "oklch(0.13 0.015 20 / 20%)" }}>
                        <span className="text-red-400 font-bold mt-0.5 shrink-0 text-sm">✗</span>
                        <span className="text-gray-300 text-sm">{complaint}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              {/* Known Issues */}
              <Reveal delay={0.1}>
                <div className="p-6 rounded-lg border border-amber-500/20" style={{ background: "oklch(0.14 0.015 50 / 20%)" }}>
                  <h3 className="font-display text-amber-400 text-lg mb-3" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    DOCUMENTED ISSUES WITH {company.name.toUpperCase()}
                  </h3>
                  <div className="space-y-2">
                    {company.knownIssues.map((issue, i) => (
                      <div key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                        <span className="text-amber-400 shrink-0 mt-0.5">▸</span>
                        {issue}
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              {/* Cancellation Grounds */}
              <Reveal delay={0.15}>
                <div>
                  <h3 className="font-display text-white text-xl mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    LEGAL GROUNDS TO CANCEL YOUR {company.name.toUpperCase()} CONTRACT
                  </h3>
                  <div className="space-y-3">
                    {company.cancellationGrounds.map((ground, i) => (
                      <div key={i} className="flex items-start gap-3 text-gray-400 text-sm">
                        <span className="text-amber-400 font-bold mt-0.5 shrink-0">✓</span>
                        {ground}
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              {/* Lawsuits */}
              {company.lawsuits.length > 0 && (
                <Reveal delay={0.2}>
                  <div className="p-6 rounded-lg border border-red-500/20" style={{ background: "oklch(0.13 0.015 20 / 15%)" }}>
                    <h3 className="font-display text-red-400 text-lg mb-3" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                      LAWSUITS & REGULATORY ACTIONS
                    </h3>
                    <div className="space-y-2">
                      {company.lawsuits.map((lawsuit, i) => (
                        <div key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                          <span className="text-red-400 shrink-0 mt-0.5">⚖</span>
                          {lawsuit}
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              )}

              {/* States Active */}
              <Reveal delay={0.25}>
                <div>
                  <h3 className="font-display text-white text-xl mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    STATE INFORMATION FOR {company.name.toUpperCase()} CONTRACTS
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {company.statesActive.map((state) => (
                      <span key={state} className="px-3 py-1.5 rounded border text-sm text-gray-300 font-mono" style={{ background: "oklch(0.16 0.01 265)", borderColor: "oklch(0.28 0.01 265)" }}>
                        {state}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
                </>
              ) : (
                <Reveal>
                  <div className="p-6 rounded-lg border border-amber-500/20" style={{ background: "oklch(0.14 0.015 50 / 20%)" }}>
                    <h2 className="font-display text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}>
                      VERIFY CURRENT {company.name.toUpperCase()} INFORMATION
                    </h2>
                    <p className="text-gray-400 leading-relaxed mb-4">
                      Ratings, complaint totals, company status, legal matters, and claimed remedies can change. They are not published here until a source URL and verification date are recorded.
                    </p>
                    <p className="text-gray-400 leading-relaxed">
                      Check current official regulator records and preserve the documents from your own transaction for an individual review.
                    </p>
                  </div>
                </Reveal>
              )}
            </div>

            {/* Right: Form */}
            <div id="company-form" className="lg:sticky lg:top-24">
              <Reveal delay={0.1}>
                <div className="p-8 rounded-xl form-glow-box" style={{ background: "oklch(0.13 0.012 265)" }}>
                  <div className="mb-6">
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-mono text-amber-400 border border-amber-500/30 mb-3" style={{ background: "oklch(0.72 0.19 50 / 10%)" }}>
                      INDIVIDUAL CASE REVIEW
                    </div>
                    <h2 className="font-display text-white text-2xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                      60 SECONDS TO FIND OUT IF WE CAN HELP YOU CANCEL YOUR SOLAR CONTRACT
                    </h2>
                    <p className="text-gray-400 text-sm mt-2">Options and outcomes depend on your agreement, facts, and jurisdiction.</p>
                  </div>
                  <CompanyForm companyName={company.name} />
                </div>
              </Reveal>

              {/* Company Quick Facts */}
              {companyEvidenceAvailable && <Reveal delay={0.2}>
                <div className="mt-6 p-5 rounded-xl border border-white/8" style={{ background: "oklch(0.12 0.01 265)" }}>
                  <h4 className="text-gray-500 text-xs font-mono mb-3">COMPANY QUICK FACTS</h4>
                  <div className="space-y-2">
                    {[
                      { label: "Legal Name", value: company.legalName },
                      { label: "Founded", value: company.founded },
                      { label: "Headquarters", value: company.headquarters },
                      { label: "Contract Types", value: company.contractTypes.join(", ") },
                      { label: "Status", value: company.status },
                      { label: "BBB Rating", value: company.bbRating },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between gap-4 text-xs">
                        <span className="text-gray-600 font-mono shrink-0">{label}</span>
                        <span className="text-gray-300 text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>}
              {!companyEvidenceAvailable && (
                <div className="mt-6 p-5 rounded-xl border border-white/8 text-gray-400 text-sm" style={{ background: "oklch(0.12 0.01 265)" }}>
                  Company facts and third-party ratings are withheld until source and as-of metadata are attached.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* TOPIC CLUSTER INTERNAL LINKS */}
      <section className="py-12 border-t border-white/8" style={{ background: "oklch(0.11 0.01 265)" }}>
        <div className="container">
          <DoIQualifyQuiz />
          <TopicClusterWidget currentUrl={`/cancel-${slug}-solar-contract`} />
        </div>
      </section>

      {/* OTHER COMPANIES */}
      <section className="py-16 border-t border-white/8" style={{ background: "oklch(0.11 0.01 265)" }}>
        <div className="container">
          <Reveal>
            <h2 className="font-display text-white text-2xl mb-8" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              WE ALSO FIGHT THESE SOLAR COMPANIES
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedCompanies.map((c, i) => (
              <Reveal key={c.slug} delay={i * 0.05}>
                <Link href={`/cancel-${c.slug}-solar-contract`}>
                  <div className="p-5 rounded-lg border cursor-pointer transition-all hover:border-amber-500/40 group" style={{ background: "oklch(0.14 0.01 265)", borderColor: "oklch(0.22 0.01 265)" }}>
                    <div className="text-gray-300 font-semibold group-hover:text-amber-400 transition-colors mb-1">{c.name}</div>
                    <div className="text-gray-600 text-xs font-mono mb-2">{c.status} · BBB {c.bbRating}</div>
                    <div className="text-amber-500 text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">VIEW PAGE →</div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ALL COMPANIES GRID */}
      <section className="py-12 border-t border-white/8" style={{ background: "oklch(0.10 0.01 265)" }}>
        <div className="container">
          <Reveal>
            <h3 className="font-display text-gray-500 text-lg mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              OTHER SOLAR COMPANY INFORMATION
            </h3>
          </Reveal>
          <div className="flex flex-wrap gap-2">
            {COMPANIES.map((c) => (
              <Link key={c.slug} href={`/cancel-${c.slug}-solar-contract`}>
                <span className="px-3 py-1.5 rounded border text-sm text-gray-400 hover:text-amber-400 hover:border-amber-500/40 transition-all cursor-pointer font-mono" style={{ background: "oklch(0.13 0.01 265)", borderColor: "oklch(0.22 0.01 265)" }}>
                  {c.name}
                </span>
              </Link>
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
            Consumer information and intake resources for {company.name} agreements. Not legal advice. Options and outcomes depend on the agreement, facts, and jurisdiction. © {new Date().getFullYear()} Solar Freedom.
          </p>
        </div>
      </footer>
    </div>
  );
}
