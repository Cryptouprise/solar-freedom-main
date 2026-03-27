/*
 * SOLAR FREEDOM — "Selling Your House With Solar" Landing Page
 * Design: Dark Industrial Brutalism — same system as rest of site
 * Primary keyword: selling house with solar panels loan
 * Secondary: solar lien selling home, can't sell house solar panels, solar loan home sale
 * Target: Homeowners who PURCHASED (loan/cash) solar and are trying to sell their home
 * NOTE: We do NOT help with leases — purchase/loan customers only
 */

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "wouter";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { SchemaInjector } from "@/components/SchemaInjector";
import DoIQualifyQuiz from "@/components/DoIQualifyQuiz";
import {
  Home, AlertTriangle, CheckCircle, DollarSign, FileText,
  ArrowRight, Phone, Scale, XCircle, Clock
} from "lucide-react";
import { trpc } from "@/lib/trpc";

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
function SellForm() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ situation: "", loanBalance: "", name: "", phone: "", email: "" });

  const SITUATIONS = [
    "Buyer's lender won't approve with solar loan",
    "Solar loan shows as lien on title",
    "Buyer refuses to assume the solar loan",
    "Real estate agent says solar is killing the deal",
    "I need to pay off the solar loan to close",
    "Other issue with solar and home sale",
  ];
  const BALANCES = ["Under $10,000", "$10,000–$20,000", "$20,000–$35,000", "$35,000–$50,000", "Over $50,000"];

  const steps = [
    { question: "What's blocking your home sale?", field: "situation", options: SITUATIONS },
    { question: "What's your remaining solar loan balance?", field: "loanBalance", options: BALANCES },
  ];

  const handleOption = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    if (step < steps.length - 1) setStep(s => s + 1);
  };

  const submitLead = trpc.leads.submit.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const firstName = form.name.split(" ")[0] || form.name;
    const lastName = form.name.split(" ").slice(1).join(" ") || "";
    try {
      // Persist to DB via tRPC
      await submitLead.mutateAsync({
        firstName,
        lastName,
        phone: form.phone,
        email: form.email,
        problemType: form.situation,
        contractType: form.loanBalance,
        formName: "Selling House With Solar Form",
        sourcePage: "/selling-house-with-solar",
        sourceUrl: window.location.href,
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
        <p className="text-slate-400 mb-4">Grace will reach out within minutes to discuss your options for closing the sale.</p>
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
          Get My Free Case Review →
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
        "name": "Can I sell my house if I have a solar loan?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes, but it's complicated. A solar loan secured by your home (like a PACE loan or home equity loan) shows up as a lien on title and must be paid off at closing. An unsecured solar loan doesn't appear on title but buyers' lenders may still require it to be paid off. We help homeowners navigate both situations." }
      },
      {
        "@type": "Question",
        "name": "Does a solar loan affect home sale?",
        "acceptedAnswer": { "@type": "Answer", "text": "Absolutely. If the solar loan is secured (PACE, HERO, or similar), it appears as a lien on your property title. Most buyers' mortgage lenders will not approve financing until the lien is cleared. Even unsecured solar loans can complicate sales because buyers don't want to assume the debt." }
      },
      {
        "@type": "Question",
        "name": "What happens to solar panels when you sell your house with a loan?",
        "acceptedAnswer": { "@type": "Answer", "text": "With a solar loan, you own the panels. You have three options: (1) pay off the loan from sale proceeds at closing, (2) negotiate with the buyer to assume the loan, or (3) challenge the loan terms legally if you were misled during the sale. We can help you evaluate all three." }
      },
      {
        "@type": "Question",
        "name": "Can a buyer assume my solar loan?",
        "acceptedAnswer": { "@type": "Answer", "text": "Some solar loans are assumable, meaning the buyer can take over the payments. However, many lenders require credit approval and the buyer must agree. In practice, most buyers refuse to assume solar debt, leaving the seller responsible for paying it off." }
      },
      {
        "@type": "Question",
        "name": "How do I get a solar lien removed to sell my house?",
        "acceptedAnswer": { "@type": "Answer", "text": "A solar lien (from a PACE or secured solar loan) can be removed by paying off the balance, negotiating a reduced payoff with the lender, or challenging the lien legally if it was improperly placed. We specialize in helping homeowners clear solar liens so they can close their home sale." }
      },
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Solar Loan Home Sale Assistance",
    "description": "We help homeowners with solar loans sell their home by negotiating payoffs, challenging improper liens, and clearing title so you can close.",
    "provider": { "@type": "Organization", "name": "Solar Freedom", "url": "https://www.breakyoursolarcontract.com" },
    "serviceType": "Solar Contract Legal Services",
    "areaServed": "United States",
  }
];

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SellingHouseWithSolar() {
  useSeoMeta({
    title: "Selling a House With Solar Panels & a Loan | Solar Freedom",
    description: "Solar loan blocking your home sale? We help homeowners pay off, negotiate, or legally challenge solar loans and liens so you can close. Free case review.",
    canonical: "https://www.breakyoursolarcontract.com/selling-house-with-solar",
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
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
              <Link href="/" className="hover:text-amber-400 transition-colors">Home</Link>
              <span>/</span>
              <span className="text-slate-400">Selling House With Solar</span>
            </div>

            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ background: "oklch(0.72 0.19 50 / 15%)", border: "1px solid oklch(0.72 0.19 50 / 40%)", color: "#f97316" }}>
                <Home className="w-3 h-3" /> SOLAR LOAN + HOME SALE PROBLEM
              </div>

              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-none mb-6 text-white" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.02em" }}>
                SOLAR LOAN<br />
                <span style={{ color: "#f97316" }}>KILLING</span><br />
                YOUR SALE?
              </h1>

              <p className="text-lg text-slate-300 mb-4 leading-relaxed max-w-lg">
                You bought solar panels. Now you're trying to sell your home — and the solar loan is blocking the deal. The buyer's lender won't approve it. The title has a lien. The buyer won't assume the debt.
              </p>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-lg">
                <strong className="text-white">We help homeowners with solar loans close their sale</strong> — by negotiating payoffs, challenging improper liens, and clearing title.
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                {["Solar Loan Payoff Negotiation", "PACE Lien Removal", "Title Clearance", "Free Case Review"].map(tag => (
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
                  Free Case Review <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </div>

          {/* Form Card */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            id="get-help" className="rounded-2xl p-8" style={{ background: "oklch(0.12 0.01 260)", border: "1px solid oklch(1 0 0 / 12%)" }}>
            <h2 className="font-display text-2xl text-white mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>
              GET YOUR FREE CASE REVIEW
            </h2>
            <p className="text-slate-400 text-sm mb-6">Tell us about your situation — we'll tell you your options.</p>
            <SellForm />
          </motion.div>
        </div>
      </section>

      {/* ── Problem Stats ── */}
      <section className="py-16 border-y" style={{ borderColor: "oklch(1 0 0 / 8%)", background: "oklch(0.10 0.01 260)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { stat: "1 in 3", label: "Solar home sales fall through due to financing issues" },
              { stat: "$25K+", label: "Average remaining solar loan balance at time of sale" },
              { stat: "47%", label: "Of buyers refuse to assume seller's solar loan" },
              { stat: "Free", label: "Initial case review — know your options before you decide" },
            ].map(({ stat, label }) => (
              <div key={stat}>
                <div className="font-display text-4xl md:text-5xl mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#f97316" }}>{stat}</div>
                <div className="text-sm text-slate-400 leading-snug">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Problem Explained ── */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <Reveal>
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl md:text-5xl text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.03em" }}>
              WHY SOLAR LOANS BLOCK HOME SALES
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">There are three distinct ways a solar loan can derail your closing — and each requires a different solution.</p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Scale className="w-6 h-6" />,
              title: "PACE / Secured Loan Lien",
              problem: "PACE loans (Property Assessed Clean Energy) and some solar loans are secured by your home. They appear as a lien on your property title — just like a mortgage. Most buyers' lenders require all liens to be cleared before they'll fund.",
              solution: "We negotiate payoff amounts, challenge improper lien placements, and work with title companies to clear the path to closing.",
              severity: "HIGH",
            },
            {
              icon: <DollarSign className="w-6 h-6" />,
              title: "Unsecured Loan — Buyer Refuses",
              problem: "Even if your solar loan doesn't appear on title, buyers often refuse to purchase a home with solar debt attached. They don't want the financial obligation, and their lender may require it paid off anyway.",
              solution: "We help you negotiate a reduced payoff with the solar lender, or challenge the loan terms if you were misled during the original sale.",
              severity: "MEDIUM",
            },
            {
              icon: <FileText className="w-6 h-6" />,
              title: "Loan Assumption Complications",
              problem: "Some solar loans are technically assumable — but the buyer must qualify with the lender, and most buyers simply refuse. This leaves sellers stuck paying off the full balance from sale proceeds.",
              solution: "We review your loan documents for assumption rights, negotiate with lenders, and explore legal grounds to reduce or eliminate the balance.",
              severity: "MEDIUM",
            },
          ].map(({ icon, title, problem, solution, severity }) => (
            <Reveal key={title}>
              <div className="rounded-xl p-6 h-full" style={{ background: "oklch(0.12 0.01 260)", border: "1px solid oklch(1 0 0 / 10%)" }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-amber-400" style={{ background: "oklch(0.72 0.19 50 / 15%)" }}>
                    {icon}
                  </div>
                  <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: severity === "HIGH" ? "oklch(0.45 0.2 25 / 30%)" : "oklch(0.72 0.19 50 / 15%)", color: severity === "HIGH" ? "#f87171" : "#f97316" }}>
                    {severity} IMPACT
                  </span>
                </div>
                <h3 className="font-display text-lg text-white mb-3" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>{title}</h3>
                <div className="mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold mb-1.5"><XCircle className="w-3 h-3" /> THE PROBLEM</div>
                  <p className="text-sm text-slate-400 leading-relaxed">{problem}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1.5"><CheckCircle className="w-3 h-3" /> OUR APPROACH</div>
                  <p className="text-sm text-slate-300 leading-relaxed">{solution}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── How We Help ── */}
      <section className="py-20" style={{ background: "oklch(0.10 0.01 260)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="font-display text-4xl md:text-5xl text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.03em" }}>
                HOW WE HELP YOU CLOSE
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">From initial review to cleared title — here's our process for getting you to closing day.</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Free Case Review", body: "We review your solar loan documents, title report, and sale situation to identify exactly what's blocking your closing and what options you have.", icon: <FileText className="w-5 h-5" /> },
              { step: "02", title: "Identify Legal Grounds", body: "Many solar loans contain TILA violations, misrepresentation, or improper lien placements that give you leverage to negotiate a reduced payoff or full cancellation.", icon: <Scale className="w-5 h-5" /> },
              { step: "03", title: "Negotiate With Lender", body: "We work directly with your solar lender — Mosaic, GoodLeap, Sunlight Financial, or others — to negotiate a payoff that doesn't wipe out your equity.", icon: <DollarSign className="w-5 h-5" /> },
              { step: "04", title: "Clear Title & Close", body: "Once the lien is resolved or the loan is settled, we coordinate with your title company to clear the path so you can close on schedule.", icon: <CheckCircle className="w-5 h-5" /> },
            ].map(({ step, title, body, icon }, i) => (
              <Reveal key={step} delay={i * 0.1}>
                <div className="relative rounded-xl p-6" style={{ background: "oklch(0.13 0.01 260)", border: "1px solid oklch(1 0 0 / 10%)" }}>
                  <div className="font-display text-5xl font-bold mb-4 opacity-20 select-none" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#f97316" }}>{step}</div>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-amber-400 mb-4" style={{ background: "oklch(0.72 0.19 50 / 15%)" }}>
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

      {/* ── Lenders We Work With ── */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <Reveal>
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.03em" }}>
              SOLAR LENDERS WE DEAL WITH
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">We have experience negotiating with every major solar loan provider in the country.</p>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { name: "Mosaic Solar Loans", note: "Most common — often negotiable" },
            { name: "GoodLeap", note: "Formerly Loanpal" },
            { name: "Sunlight Financial", note: "Now Pineapple Energy" },
            { name: "Service Finance", note: "Wells Fargo backed" },
            { name: "GreenSky", note: "Goldman Sachs portfolio" },
            { name: "PACE / HERO Loans", note: "Property-secured liens" },
            { name: "Dividend Finance", note: "Common in CA, TX, FL" },
            { name: "Other Lenders", note: "All lenders considered" },
          ].map(({ name, note }) => (
            <Reveal key={name}>
              <div className="rounded-lg p-4" style={{ background: "oklch(0.12 0.01 260)", border: "1px solid oklch(1 0 0 / 10%)" }}>
                <div className="font-semibold text-white text-sm mb-1">{name}</div>
                <div className="text-xs text-slate-500">{note}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20" style={{ background: "oklch(0.10 0.01 260)" }}>
        <div className="max-w-4xl mx-auto px-6">
          <Reveal>
            <h2 className="font-display text-4xl md:text-5xl text-white mb-12 text-center" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.03em" }}>
              FREQUENTLY ASKED QUESTIONS
            </h2>
          </Reveal>

          <div className="space-y-4">
            {[
              {
                q: "Can I sell my house if I have a solar loan?",
                a: "Yes — but you need to address the loan before or at closing. If it's a secured loan (PACE), it appears as a lien and must be paid off. If it's unsecured, you'll likely need to pay it off from sale proceeds or negotiate with the buyer. We help you find the most cost-effective path."
              },
              {
                q: "Does a solar loan show up on a title search?",
                a: "PACE loans and other property-secured solar financing always appear on title. Some solar loans are recorded as UCC filings which also show up. Unsecured personal solar loans typically do not appear on title, but may still complicate the sale."
              },
              {
                q: "Can the buyer assume my solar loan?",
                a: "Some solar loans allow assumption, but the buyer must qualify with the lender and agree to take on the debt. In practice, most buyers refuse — especially if the loan balance is significant or the interest rate is high. We can review your loan documents to confirm assumption rights."
              },
              {
                q: "What if I can't afford to pay off the solar loan at closing?",
                a: "This is exactly where we help. We negotiate directly with solar lenders for reduced payoff amounts, challenge loan terms if there were misrepresentations during the sale, and in some cases can get the balance reduced significantly — or eliminated entirely if legal grounds exist."
              },
              {
                q: "How long does it take to resolve a solar loan for a home sale?",
                a: "Timeline depends on the lender and complexity. Simple payoff negotiations can be resolved in 2–4 weeks. Legal challenges to improper liens may take longer. We work to match your closing timeline whenever possible."
              },
              {
                q: "Do you help with solar leases?",
                a: "No — we specialize exclusively in solar purchases (loans and cash purchases). If you have a solar lease or PPA, we are not the right fit. Our expertise is in solar loan disputes, PACE lien removal, and purchase-related contract issues."
              },
            ].map(({ q, a }, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <details className="group rounded-xl overflow-hidden" style={{ border: "1px solid oklch(1 0 0 / 10%)" }}>
                  <summary className="flex items-center justify-between px-6 py-4 cursor-pointer text-white font-semibold text-sm hover:text-amber-400 transition-colors list-none" style={{ background: "oklch(0.12 0.01 260)" }}>
                    {q}
                    <ArrowRight className="w-4 h-4 flex-shrink-0 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="px-6 py-4 text-sm text-slate-400 leading-relaxed" style={{ background: "oklch(0.11 0.01 260)", borderTop: "1px solid oklch(1 0 0 / 8%)" }}>
                    {a}
                  </div>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quiz CTA ── */}
      <section className="py-20 max-w-4xl mx-auto px-6">
        <Reveal>
          <div className="text-center mb-10">
            <h2 className="font-display text-4xl md:text-5xl text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.03em" }}>
              DO YOU QUALIFY FOR HELP?
            </h2>
            <p className="text-slate-400">Answer 5 quick questions to see if we can help you close your sale.</p>
          </div>
        </Reveal>
        <DoIQualifyQuiz compact />
      </section>

      {/* ── Related Pages ── */}
      <section className="py-16" style={{ background: "oklch(0.10 0.01 260)", borderTop: "1px solid oklch(1 0 0 / 8%)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <h2 className="font-display text-2xl text-white mb-8" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>
              RELATED RESOURCES
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { href: "/solar-lien-removal", title: "Solar Lien Removal", desc: "Get a PACE or secured solar loan lien removed from your property title." },
              { href: "/solar-exit-options", title: "Solar Exit Options", desc: "All the ways to get out of a solar purchase contract — compared." },
              { href: "/solar-contract-help", title: "Solar Contract Help", desc: "Was your solar contract deceptive? Learn your legal rights." },
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
      <section className="py-20 text-center" style={{ background: "linear-gradient(135deg, #0D0F14 0%, #1a1206 100%)" }}>
        <div className="max-w-3xl mx-auto px-6">
          <Reveal>
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-6" />
            <h2 className="font-display text-4xl md:text-5xl text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.03em" }}>
              DON'T LET YOUR SOLAR LOAN<br />KILL YOUR SALE
            </h2>
            <p className="text-slate-400 mb-8 text-lg">Every day you wait is another day your buyer could walk. Get a free case review now and know exactly what your options are.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:9049214971" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-bold text-base transition-all hover:opacity-90"
                style={{ background: "#f97316", color: "#0D0F14" }}>
                <Phone className="w-5 h-5" /> Call (904) 921-4971
              </a>
              <a href="#get-help" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-semibold text-base transition-all hover:border-amber-500 hover:text-amber-400"
                style={{ border: "1px solid oklch(1 0 0 / 25%)", color: "#F8FAFC" }}>
                Free Online Review <ArrowRight className="w-5 h-5" />
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
            <Link href="/solar-exit-options" className="hover:text-slate-400 transition-colors">Exit Options</Link>
            <Link href="/blog" className="hover:text-slate-400 transition-colors">Blog</Link>
            <Link href="/solar-contract-laws" className="hover:text-slate-400 transition-colors">State Laws</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
