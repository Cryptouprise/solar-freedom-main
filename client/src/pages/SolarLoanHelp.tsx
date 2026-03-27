/*
 * SOLAR FREEDOM — "Solar Loan Help" Landing Page
 * Design: Dark Industrial Brutalism — same system as rest of site
 * Primary keyword: solar loan problems, cancel solar loan, solar loan dispute
 * Secondary: Mosaic solar loan, GoodLeap solar loan, solar loan payoff, solar loan too high
 * Target: Homeowners with solar PURCHASE loans (not leases) who want out or have disputes
 */

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "wouter";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { SchemaInjector } from "@/components/SchemaInjector";
import DoIQualifyQuiz from "@/components/DoIQualifyQuiz";
import {
  AlertTriangle, CheckCircle, FileText, ArrowRight,
  Phone, Scale, DollarSign, Clock, XCircle, Zap
} from "lucide-react";

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

// ─── Lead Form ─────────────────────────────────────────────────────────────────
function LoanHelpForm() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ lender: "", problem: "", name: "", phone: "", email: "" });

  const LENDERS = [
    "Mosaic Solar Loans",
    "GoodLeap (formerly Loanpal)",
    "Sunlight Financial / Pineapple Energy",
    "Service Finance Company",
    "GreenSky",
    "Dividend Finance",
    "PACE / HERO Loan",
    "Other / Not Sure",
  ];
  const PROBLEMS = [
    "Monthly payment is too high — I was misled on the rate",
    "System underperforms — not saving what they promised",
    "I want to sell my home but the loan is blocking it",
    "I want to cancel the loan entirely",
    "Hidden fees or billing errors",
    "Company went bankrupt — not sure what happens to my loan",
    "Other issue",
  ];

  const steps = [
    { question: "Who is your solar lender?", field: "lender", options: LENDERS },
    { question: "What's your main problem with the loan?", field: "problem", options: PROBLEMS },
  ];

  const handleOption = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    if (step < steps.length - 1) setStep(s => s + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("https://services.leadconnectorhq.com/hooks/gcV5XIBy7dCh1Vb0wQww/webhook-trigger/solar-loan-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "solar_loan_help", page: "/solar-loan-help" }),
      });
    } catch (_) {}
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "oklch(0.72 0.19 50 / 20%)", border: "2px solid #f97316" }}>
          <CheckCircle className="w-8 h-8 text-amber-400" />
        </div>
        <h3 className="font-display text-2xl text-white mb-2">We're On It</h3>
        <p className="text-slate-400 mb-4">Grace will reach out within minutes to review your solar loan situation.</p>
        <a href="tel:9049214971" className="inline-flex items-center gap-2 text-amber-400 font-semibold hover:text-amber-300 transition-colors">
          <Phone className="w-4 h-4" /> Call Now: (904) 921-4971
        </a>
      </div>
    );
  }

  if (step < steps.length) {
    const current = steps[step];
    return (
      <div>
        <div className="flex gap-1 mb-6">
          {steps.map((_, i) => (
            <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300" style={{ background: i <= step ? "#f97316" : "oklch(1 0 0 / 15%)" }} />
          ))}
        </div>
        <p className="text-slate-400 text-sm mb-2">Step {step + 1} of {steps.length + 1}</p>
        <h3 className="font-display text-xl text-white mb-5">{current.question}</h3>
        <div className="space-y-2">
          {current.options.map(opt => (
            <button
              key={opt}
              onClick={() => handleOption(current.field, opt)}
              className="w-full text-left px-4 py-3 rounded-lg text-sm text-slate-300 border transition-all duration-200 hover:border-amber-500 hover:text-white hover:bg-amber-500/10"
              style={{ border: "1px solid oklch(1 0 0 / 15%)", background: "oklch(1 0 0 / 5%)" }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex gap-1 mb-6">
        {[...steps, { question: "" }].map((_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full" style={{ background: "#f97316" }} />
        ))}
      </div>
      <p className="text-slate-400 text-sm mb-2">Step {steps.length + 1} of {steps.length + 1}</p>
      <h3 className="font-display text-xl text-white mb-5">Where should we send your options?</h3>
      <div className="space-y-3">
        <input required placeholder="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500 transition-colors"
          style={{ background: "oklch(1 0 0 / 8%)", border: "1px solid oklch(1 0 0 / 20%)" }} />
        <input required type="tel" placeholder="Phone Number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500 transition-colors"
          style={{ background: "oklch(1 0 0 / 8%)", border: "1px solid oklch(1 0 0 / 20%)" }} />
        <input required type="email" placeholder="Email Address" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500 transition-colors"
          style={{ background: "oklch(1 0 0 / 8%)", border: "1px solid oklch(1 0 0 / 20%)" }} />
        <button type="submit" className="w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90"
          style={{ background: "#f97316", color: "#0D0F14" }}>
          Get My Free Loan Review →
        </button>
        <p className="text-center text-xs text-slate-500">No obligation. We respond within minutes.</p>
      </div>
    </form>
  );
}

// ─── Schema ────────────────────────────────────────────────────────────────────
const PAGE_SCHEMAS = [
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Can I cancel a solar loan?",
        "acceptedAnswer": { "@type": "Answer", "text": "Solar loans are harder to cancel than leases, but it's not impossible. If the loan was originated through misrepresentation, TILA violations, or failure to provide required disclosures, you may have legal grounds to challenge or reduce the obligation. We review solar loans for these violations and help homeowners negotiate with lenders." }
      },
      {
        "@type": "Question",
        "name": "What are my options if I can't afford my solar loan payment?",
        "acceptedAnswer": { "@type": "Answer", "text": "If your solar loan payment is unaffordable, your options include: (1) refinancing at a lower rate, (2) negotiating a hardship modification with the lender, (3) challenging the loan terms if you were misled about the payment amount, or (4) selling the home and paying off the loan from proceeds. We help evaluate which path makes sense for your situation." }
      },
      {
        "@type": "Question",
        "name": "What happens to my solar loan if I sell my house?",
        "acceptedAnswer": { "@type": "Answer", "text": "If the loan is secured by your home (PACE), it must be paid off at closing. If it's unsecured, you can negotiate with the buyer to assume it, or pay it off from sale proceeds. We help homeowners navigate both scenarios and minimize the financial impact." }
      },
    ]
  }
];

// ─── Lender Data ───────────────────────────────────────────────────────────────
const LENDERS_DATA = [
  {
    name: "Mosaic Solar Loans",
    slug: "mosaic",
    issues: ["High interest rates (up to 29.99% APR)", "Dealer fees not disclosed to borrowers", "Misrepresented monthly savings", "TILA disclosure violations"],
    states: "Nationwide",
    notes: "One of the most common solar lenders. Known for dealer fee issues.",
  },
  {
    name: "GoodLeap (Loanpal)",
    slug: "goodleap",
    issues: ["Payment shock after promotional period", "Undisclosed dealer fees", "Misrepresented system performance", "Aggressive sales tactics by installers"],
    states: "Nationwide",
    notes: "Formerly Loanpal. Rebranded but same loan products.",
  },
  {
    name: "Sunlight Financial",
    slug: "sunlight",
    issues: ["Acquired by Pineapple Energy — service disruptions", "Misrepresented loan terms", "Hidden fees in loan documents", "Poor customer service post-acquisition"],
    states: "Nationwide",
    notes: "Now operating as Pineapple Energy. Transition caused many issues.",
  },
  {
    name: "Service Finance Company",
    slug: "service-finance",
    issues: ["High origination fees", "Misleading APR disclosures", "Undisclosed dealer compensation", "Difficult to reach for disputes"],
    states: "Nationwide",
    notes: "Wells Fargo backed. Primarily used by HVAC/solar installers.",
  },
  {
    name: "GreenSky",
    slug: "greensky",
    issues: ["FTC enforcement action (2021)", "Unauthorized loan origination complaints", "Misleading promotional terms", "Difficult cancellation process"],
    states: "Nationwide",
    notes: "Subject to FTC action for deceptive practices. Now Goldman Sachs portfolio.",
  },
  {
    name: "PACE / HERO Loans",
    slug: "pace",
    issues: ["Super-priority lien blocks home sale", "Added to property tax bill without clear disclosure", "Extremely high total cost of financing", "Difficult to remove from title"],
    states: "CA, FL, MO and others",
    notes: "Most problematic loan type. Creates a lien that supersedes your mortgage.",
  },
];

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SolarLoanHelp() {
  useSeoMeta({
    title: "Solar Loan Problems? Mosaic, GoodLeap, PACE Loan Help | Solar Freedom",
    description: "Stuck in a solar loan? We help homeowners dispute Mosaic, GoodLeap, PACE, and other solar loans — reduce payments, cancel contracts, or clear liens. Free review.",
    canonical: "https://www.breakyoursolarcontract.com/solar-loan-help",
  });

  return (
    <div style={{ background: "#0D0F14", color: "#F8FAFC", fontFamily: "'DM Sans', sans-serif" }}>
      <SchemaInjector schemas={PAGE_SCHEMAS} />

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4" style={{ background: "oklch(0.08 0.01 260 / 95%)", backdropFilter: "blur(12px)", borderBottom: "1px solid oklch(1 0 0 / 8%)" }}>
        <Link href="/" className="font-display text-xl tracking-wider text-white hover:text-amber-400 transition-colors" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.12em" }}>
          SOLAR FREEDOM
        </Link>
        <a href="tel:9049214971" className="hidden md:flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors">
          <Phone className="w-4 h-4" /> (904) 921-4971
        </a>
        <a href="tel:9049214971" className="md:hidden flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg text-white" style={{ background: "#f97316" }}>
          <Phone className="w-3 h-3" /> Call Now
        </a>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-[85vh] flex items-center pt-20" style={{ background: `linear-gradient(135deg, #0D0F14 0%, #1a1f2e 50%, #0D0F14 100%)` }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url(${HERO_BG})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #0D0F14 40%, transparent 100%)" }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center py-16">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
              <Link href="/" className="hover:text-amber-400 transition-colors">Home</Link>
              <span>/</span>
              <span className="text-slate-400">Solar Loan Help</span>
            </div>

            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ background: "oklch(0.72 0.19 50 / 15%)", border: "1px solid oklch(0.72 0.19 50 / 40%)", color: "#f97316" }}>
                <DollarSign className="w-3 h-3" /> SOLAR LOAN DISPUTES & RELIEF
              </div>

              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-none mb-6 text-white" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.02em" }}>
                TRAPPED IN A<br />
                <span style={{ color: "#f97316" }}>SOLAR LOAN</span><br />
                YOU REGRET?
              </h1>

              <p className="text-lg text-slate-300 mb-4 leading-relaxed max-w-lg">
                You bought solar panels with a loan — Mosaic, GoodLeap, PACE, or another lender. Now the payment is too high, the system doesn't perform, or you can't sell your home because of the debt.
              </p>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-lg">
                <strong className="text-white">We help homeowners challenge, reduce, and escape solar loans</strong> — using consumer protection law, TILA violations, and direct lender negotiation.
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                {["Mosaic Loan Disputes", "GoodLeap Problems", "PACE Lien Removal", "TILA Violations", "Free Review"].map(tag => (
                  <span key={tag} className="text-xs px-3 py-1.5 rounded-full text-slate-300" style={{ background: "oklch(1 0 0 / 8%)", border: "1px solid oklch(1 0 0 / 15%)" }}>{tag}</span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a href="tel:9049214971" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
                  style={{ background: "#f97316", color: "#0D0F14" }}>
                  <Phone className="w-4 h-4" /> Call (904) 921-4971
                </a>
                <a href="#get-help" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:border-amber-500 hover:text-amber-400"
                  style={{ border: "1px solid oklch(1 0 0 / 25%)", color: "#F8FAFC" }}>
                  Free Loan Review <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </div>

          {/* Form Card */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            id="get-help" className="rounded-2xl p-8" style={{ background: "oklch(0.12 0.01 260)", border: "1px solid oklch(1 0 0 / 12%)" }}>
            <h2 className="font-display text-2xl text-white mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>
              FREE SOLAR LOAN REVIEW
            </h2>
            <p className="text-slate-400 text-sm mb-6">Tell us about your loan — we'll tell you your options.</p>
            <LoanHelpForm />
          </motion.div>
        </div>
      </section>

      {/* ── Common Legal Violations ── */}
      <section className="py-20" style={{ background: "oklch(0.10 0.01 260)", borderTop: "1px solid oklch(1 0 0 / 8%)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="font-display text-4xl md:text-5xl text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.03em" }}>
                HOW SOLAR LOANS GO WRONG
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">Most solar loan disputes involve one or more of these violations — and each one gives you legal leverage.</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <FileText className="w-6 h-6" />,
                title: "TILA Violations",
                body: "The Truth in Lending Act requires lenders to clearly disclose APR, total cost, and all fees. Many solar lenders bury dealer fees and origination costs, violating TILA. This can give you grounds to rescind the loan.",
              },
              {
                icon: <DollarSign className="w-6 h-6" />,
                title: "Undisclosed Dealer Fees",
                body: "Solar installers often receive 'dealer fees' from lenders — sometimes 20–30% of the loan amount — without telling you. This inflates your loan balance and violates disclosure requirements.",
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Misrepresented Savings",
                body: "Salespeople routinely promise specific monthly savings that never materialize. If the savings projections were materially false and you relied on them, this constitutes fraud or misrepresentation.",
              },
              {
                icon: <Scale className="w-6 h-6" />,
                title: "State Consumer Protection",
                body: "Most states have consumer protection laws that go beyond federal law. Deceptive solar sales practices often violate state UDAP (Unfair and Deceptive Acts and Practices) statutes, which can provide additional remedies.",
              },
              {
                icon: <AlertTriangle className="w-6 h-6" />,
                title: "Failure to Provide Right of Rescission",
                body: "For loans secured by your home, federal law requires a 3-day right to cancel. Many solar lenders fail to properly provide this notice — which can extend your rescission rights significantly.",
              },
              {
                icon: <XCircle className="w-6 h-6" />,
                title: "System Performance Fraud",
                body: "If your solar system was sold based on projected production numbers that were knowingly inflated, this may constitute fraud — especially if the installer had access to accurate data and chose to misrepresent it.",
              },
            ].map(({ icon, title, body }) => (
              <Reveal key={title}>
                <div className="rounded-xl p-6 h-full" style={{ background: "oklch(0.12 0.01 260)", border: "1px solid oklch(1 0 0 / 10%)" }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-amber-400 mb-4" style={{ background: "oklch(0.72 0.19 50 / 15%)" }}>
                    {icon}
                  </div>
                  <h3 className="font-semibold text-white mb-2">{title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lender-Specific Info ── */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <Reveal>
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl md:text-5xl text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.03em" }}>
              YOUR LENDER — WHAT WE KNOW
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Each solar lender has known patterns of complaints and violations. Here's what we've seen.</p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6">
          {LENDERS_DATA.map(({ name, issues, states, notes }) => (
            <Reveal key={name}>
              <div className="rounded-xl p-6 h-full" style={{ background: "oklch(0.12 0.01 260)", border: "1px solid oklch(1 0 0 / 10%)" }}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-display text-lg text-white" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>{name}</h3>
                  <span className="text-xs text-slate-500 font-mono ml-3 flex-shrink-0">{states}</span>
                </div>
                <p className="text-xs text-slate-500 mb-3 italic">{notes}</p>
                <div className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1"><XCircle className="w-3 h-3" /> KNOWN ISSUES</div>
                <ul className="space-y-1">
                  {issues.map(issue => (
                    <li key={issue} className="text-xs text-slate-400 flex items-start gap-2">
                      <ArrowRight className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Options ── */}
      <section className="py-20" style={{ background: "oklch(0.10 0.01 260)", borderTop: "1px solid oklch(1 0 0 / 8%)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="font-display text-4xl md:text-5xl text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.03em" }}>
                YOUR OPTIONS
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">Depending on your situation, one or more of these paths may be available to you.</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Loan Cancellation", desc: "If legal violations exist in your loan origination, we may be able to challenge the loan entirely — reducing or eliminating the balance.", icon: <XCircle className="w-5 h-5" />, best: "TILA violations, misrepresentation" },
              { title: "Reduced Payoff", desc: "We negotiate directly with your lender for a settlement below the full balance — especially effective when you're selling your home.", icon: <DollarSign className="w-5 h-5" />, best: "Home sale, financial hardship" },
              { title: "Rate Modification", desc: "If your interest rate was misrepresented or is unconscionably high, we work to get it modified to a fair rate through negotiation or legal action.", icon: <Scale className="w-5 h-5" />, best: "High APR, dealer fee issues" },
              { title: "Lien Removal", desc: "For PACE and secured loans, we work to remove the lien from your title so you can sell or refinance without the solar debt blocking the deal.", icon: <CheckCircle className="w-5 h-5" />, best: "PACE loans, home sale" },
            ].map(({ title, desc, icon, best }, i) => (
              <Reveal key={title} delay={i * 0.1}>
                <div className="rounded-xl p-6 h-full" style={{ background: "oklch(0.12 0.01 260)", border: "1px solid oklch(1 0 0 / 10%)" }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-amber-400 mb-4" style={{ background: "oklch(0.72 0.19 50 / 15%)" }}>
                    {icon}
                  </div>
                  <h3 className="font-semibold text-white mb-2">{title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-3">{desc}</p>
                  <div className="text-xs text-amber-500 font-mono">BEST FOR: {best}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quiz ── */}
      <section className="py-20 max-w-4xl mx-auto px-6">
        <Reveal>
          <div className="text-center mb-10">
            <h2 className="font-display text-4xl md:text-5xl text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.03em" }}>
              DO YOU QUALIFY FOR HELP?
            </h2>
            <p className="text-slate-400">Answer 5 quick questions to see what options are available for your solar loan.</p>
          </div>
        </Reveal>
        <DoIQualifyQuiz compact />
      </section>

      {/* ── Related ── */}
      <section className="py-16" style={{ background: "oklch(0.10 0.01 260)", borderTop: "1px solid oklch(1 0 0 / 8%)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <h2 className="font-display text-2xl text-white mb-8" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>RELATED RESOURCES</h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { href: "/selling-house-with-solar", title: "Selling House With Solar Loan", desc: "Solar loan blocking your home sale? We help you close." },
              { href: "/solar-lien-removal", title: "Solar Lien Removal", desc: "Remove PACE and secured solar loan liens from your title." },
              { href: "/solar-exit-options", title: "Solar Exit Options", desc: "All the ways to get out of a solar purchase contract." },
            ].map(({ href, title, desc }) => (
              <Link key={href} href={href} className="group block rounded-xl p-5 transition-all hover:border-amber-500/50" style={{ background: "oklch(0.12 0.01 260)", border: "1px solid oklch(1 0 0 / 10%)" }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white text-sm group-hover:text-amber-400 transition-colors">{title}</h3>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </div>
                <p className="text-xs text-slate-500">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="py-20 text-center" style={{ background: "linear-gradient(135deg, #0D0F14 0%, #1a1206 100%)", borderTop: "1px solid oklch(1 0 0 / 8%)" }}>
        <div className="max-w-3xl mx-auto px-6">
          <Reveal>
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-6" />
            <h2 className="font-display text-4xl md:text-5xl text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.03em" }}>
              YOUR SOLAR LOAN MAY<br />HAVE VIOLATIONS
            </h2>
            <p className="text-slate-400 mb-8 text-lg">Most homeowners don't know what's in their loan documents. A free review takes 15 minutes and could save you thousands — or get you out entirely.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:9049214971" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-bold text-base transition-all hover:opacity-90"
                style={{ background: "#f97316", color: "#0D0F14" }}>
                <Phone className="w-5 h-5" /> Call (904) 921-4971
              </a>
              <a href="#get-help" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-semibold text-base transition-all hover:border-amber-500 hover:text-amber-400"
                style={{ border: "1px solid oklch(1 0 0 / 25%)", color: "#F8FAFC" }}>
                Free Loan Review <ArrowRight className="w-5 h-5" />
              </a>
            </div>
            <div className="flex items-center justify-center gap-2 mt-6 text-sm text-slate-500">
              <Clock className="w-4 h-4" />
              <span>We respond within minutes during business hours</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 text-center text-xs text-slate-600" style={{ borderTop: "1px solid oklch(1 0 0 / 8%)" }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span>© 2025 Solar Freedom. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-slate-400 transition-colors">Home</Link>
            <Link href="/selling-house-with-solar" className="hover:text-slate-400 transition-colors">Selling With Solar</Link>
            <Link href="/solar-lien-removal" className="hover:text-slate-400 transition-colors">Lien Removal</Link>
            <Link href="/blog" className="hover:text-slate-400 transition-colors">Blog</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
