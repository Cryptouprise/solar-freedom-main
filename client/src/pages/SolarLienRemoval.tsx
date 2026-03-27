/*
 * SOLAR FREEDOM — "Solar Lien Removal" Landing Page
 * Design: Dark Industrial Brutalism — same system as rest of site
 * Primary keyword: solar lien removal, remove solar lien from property
 * Secondary: PACE loan lien removal, solar lien on house, solar panel lien
 * Target: Homeowners with PACE loans or secured solar loans with liens on title
 */

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "wouter";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { SchemaInjector } from "@/components/SchemaInjector";
import DoIQualifyQuiz from "@/components/DoIQualifyQuiz";
import {
  AlertTriangle, CheckCircle, FileText, ArrowRight,
  Phone, Scale, XCircle, Clock, Home, Gavel
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
function LienForm() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ lienType: "", goal: "", name: "", phone: "", email: "" });

  const LIEN_TYPES = [
    "PACE loan (Property Assessed Clean Energy)",
    "HERO program loan",
    "Solar loan recorded as deed of trust",
    "UCC filing / fixture filing",
    "Not sure — it showed up on my title report",
  ];
  const GOALS = [
    "Sell my home — need lien cleared for closing",
    "Refinance — lender requires lien removal",
    "Just want it off my property",
    "Disputing the lien — it was placed improperly",
  ];

  const steps = [
    { question: "What type of solar lien do you have?", field: "lienType", options: LIEN_TYPES },
    { question: "What's your goal?", field: "goal", options: GOALS },
  ];

  const handleOption = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    if (step < steps.length - 1) setStep(s => s + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("https://services.leadconnectorhq.com/hooks/gcV5XIBy7dCh1Vb0wQww/webhook-trigger/solar-lien-removal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "solar_lien_removal", page: "/solar-lien-removal" }),
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
        <p className="text-slate-400 mb-4">Grace will reach out within minutes to discuss your lien removal options.</p>
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
          Get My Free Lien Review →
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
        "name": "How do I remove a solar lien from my property?",
        "acceptedAnswer": { "@type": "Answer", "text": "A solar lien can be removed by paying off the balance in full, negotiating a reduced settlement with the lender, or legally challenging the lien if it was improperly placed. PACE loans require a formal lien release recorded with your county. We help homeowners navigate all three paths." }
      },
      {
        "@type": "Question",
        "name": "What is a solar lien on a house?",
        "acceptedAnswer": { "@type": "Answer", "text": "A solar lien is a legal claim against your property recorded by a solar financing company. PACE (Property Assessed Clean Energy) loans are the most common — they're recorded as a tax assessment lien, meaning they have super-priority over your mortgage. Other solar loans may be recorded as deeds of trust or UCC fixture filings." }
      },
      {
        "@type": "Question",
        "name": "Can I sell my house with a solar lien?",
        "acceptedAnswer": { "@type": "Answer", "text": "Technically yes, but in practice most buyers' mortgage lenders require all liens to be cleared before funding. A solar lien on your title will almost always need to be paid off or resolved before you can close a sale." }
      },
      {
        "@type": "Question",
        "name": "What is a PACE loan and why is it a lien?",
        "acceptedAnswer": { "@type": "Answer", "text": "PACE (Property Assessed Clean Energy) loans are a type of solar financing where repayment is added to your property tax bill. Because they're tied to the property — not the borrower — they're recorded as a lien on your title. They have super-priority, meaning they're paid before your mortgage in a foreclosure." }
      },
    ]
  }
];

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SolarLienRemoval() {
  useSeoMeta({
    title: "Solar Lien Removal | Remove PACE Loan & Solar Liens From Your Property",
    description: "Solar lien on your title? We help homeowners remove PACE loans, solar deed liens, and UCC filings so you can sell, refinance, or clear your property. Free review.",
    canonical: "https://www.breakyoursolarcontract.com/solar-lien-removal",
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
              <span className="text-slate-400">Solar Lien Removal</span>
            </div>

            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ background: "oklch(0.45 0.2 25 / 20%)", border: "1px solid oklch(0.45 0.2 25 / 50%)", color: "#f87171" }}>
                <AlertTriangle className="w-3 h-3" /> SOLAR LIEN ON YOUR TITLE
              </div>

              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-none mb-6 text-white" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.02em" }}>
                SOLAR LIEN<br />
                <span style={{ color: "#f97316" }}>REMOVAL</span><br />
                EXPERTS
              </h1>

              <p className="text-lg text-slate-300 mb-4 leading-relaxed max-w-lg">
                A solar lien on your property title can block your home sale, prevent refinancing, and follow you for decades. PACE loans, solar deed liens, and UCC fixture filings are all removable — but you need to know how.
              </p>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-lg">
                <strong className="text-white">We specialize in removing solar liens</strong> from property titles across the country — through payoff negotiation, legal challenge, or lien dispute.
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                {["PACE Loan Liens", "Solar Deed of Trust", "UCC Fixture Filings", "HERO Program Loans"].map(tag => (
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
                  Free Lien Review <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </div>

          {/* Form Card */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            id="get-help" className="rounded-2xl p-8" style={{ background: "oklch(0.12 0.01 260)", border: "1px solid oklch(1 0 0 / 12%)" }}>
            <h2 className="font-display text-2xl text-white mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>
              FREE LIEN REVIEW
            </h2>
            <p className="text-slate-400 text-sm mb-6">Tell us about your lien — we'll tell you how to remove it.</p>
            <LienForm />
          </motion.div>
        </div>
      </section>

      {/* ── Lien Types Explained ── */}
      <section className="py-20" style={{ background: "oklch(0.10 0.01 260)", borderTop: "1px solid oklch(1 0 0 / 8%)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="font-display text-4xl md:text-5xl text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.03em" }}>
                TYPES OF SOLAR LIENS
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">Not all solar liens are the same. The type determines how it's removed — and how urgently you need to act.</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                type: "PACE / HERO Loans",
                priority: "SUPER-PRIORITY",
                priorityColor: "#f87171",
                description: "Property Assessed Clean Energy loans are recorded as a tax assessment lien on your property. They have super-priority — meaning they're paid BEFORE your mortgage in a foreclosure. Most mortgage lenders refuse to fund a purchase or refinance when a PACE lien exists.",
                howRemoved: ["Pay off the full balance at closing", "Negotiate a reduced settlement with the PACE servicer", "Challenge the lien if the loan was improperly originated", "File a legal dispute if you were misled during the sale"],
                programs: ["Ygrene", "Renew Financial", "Renovate America", "HERO Program", "CalFirst PACE"],
              },
              {
                type: "Solar Deed of Trust / Mortgage",
                priority: "HIGH PRIORITY",
                priorityColor: "#fb923c",
                description: "Some solar companies record a deed of trust or second mortgage against your property as collateral for the solar loan. This appears on title just like a home equity loan and must be released before you can sell or refinance.",
                howRemoved: ["Obtain a lien release from the solar lender upon payoff", "Negotiate a reduced payoff if financial hardship exists", "Challenge the lien if it was recorded without proper disclosure", "Sue for wrongful lien if the loan was fraudulent"],
                programs: ["Sunrun (some products)", "SunPower (some products)", "Various regional lenders"],
              },
              {
                type: "UCC Fixture Filing",
                priority: "MODERATE",
                priorityColor: "#f97316",
                description: "A UCC-1 fixture filing is recorded in your county to give the solar company a security interest in the panels as fixtures attached to your property. It doesn't have the same priority as a mortgage lien but can complicate title and deter buyers.",
                howRemoved: ["Request a UCC termination statement from the lender upon payoff", "File a UCC-3 termination if the lender fails to release", "Challenge the filing if it was improperly recorded", "Negotiate release as part of a broader loan settlement"],
                programs: ["Most solar loan companies use UCC filings", "Mosaic", "GoodLeap", "Sunlight Financial"],
              },
              {
                type: "Mechanics / Contractor Lien",
                priority: "VARIABLE",
                priorityColor: "#a78bfa",
                description: "If your solar installer wasn't paid by the financing company, they may have filed a mechanics lien against your property. This is separate from the solar loan itself and requires its own resolution process.",
                howRemoved: ["Pay the contractor directly to obtain a lien release", "Dispute the lien if the work was defective or incomplete", "Negotiate a settlement with the contractor", "Challenge the lien in court if it was improperly filed"],
                programs: ["Can occur with any installer", "Common when solar companies go bankrupt"],
              },
            ].map(({ type, priority, priorityColor, description, howRemoved, programs }) => (
              <Reveal key={type}>
                <div className="rounded-xl p-6 h-full" style={{ background: "oklch(0.12 0.01 260)", border: "1px solid oklch(1 0 0 / 10%)" }}>
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-display text-xl text-white" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>{type}</h3>
                    <span className="text-xs font-mono px-2 py-1 rounded flex-shrink-0 ml-3" style={{ background: `${priorityColor}22`, color: priorityColor, border: `1px solid ${priorityColor}44` }}>
                      {priority}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed mb-4">{description}</p>
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> HOW IT'S REMOVED</div>
                    <ul className="space-y-1">
                      {howRemoved.map(item => (
                        <li key={item} className="text-xs text-slate-400 flex items-start gap-2">
                          <ArrowRight className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500 mb-2">COMMON PROGRAMS/LENDERS</div>
                    <div className="flex flex-wrap gap-1">
                      {programs.map(p => (
                        <span key={p} className="text-xs px-2 py-0.5 rounded" style={{ background: "oklch(1 0 0 / 8%)", color: "#94a3b8" }}>{p}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Process ── */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <Reveal>
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl md:text-5xl text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.03em" }}>
              OUR LIEN REMOVAL PROCESS
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">We handle the entire process — from identifying the lien type to getting the release recorded with your county.</p>
          </div>
        </Reveal>

        <div className="relative">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{ background: "oklch(1 0 0 / 10%)" }} />
          <div className="space-y-8">
            {[
              { step: "01", side: "left", title: "Title Review", body: "We pull your title report and identify every lien, encumbrance, and cloud on title related to your solar installation. Many homeowners don't know exactly what type of lien they have until we review it.", icon: <FileText className="w-5 h-5" /> },
              { step: "02", side: "right", title: "Lien Analysis & Strategy", body: "We analyze the lien for legal vulnerabilities — improper origination, TILA violations, failure to disclose, or misrepresentation. This determines whether we negotiate a payoff or challenge the lien legally.", icon: <Scale className="w-5 h-5" /> },
              { step: "03", side: "left", title: "Lender Negotiation", body: "We contact the lien holder directly and negotiate — either a full payoff at closing, a reduced settlement, or a lien release in exchange for a payment plan. We know how these lenders operate.", icon: <Gavel className="w-5 h-5" /> },
              { step: "04", side: "right", title: "Lien Release & Recording", body: "Once resolved, we obtain the formal lien release document and coordinate with your title company or county recorder to get it properly recorded — clearing your title for sale or refinance.", icon: <CheckCircle className="w-5 h-5" /> },
            ].map(({ step, side, title, body, icon }, i) => (
              <Reveal key={step} delay={i * 0.1}>
                <div className={`flex ${side === "right" ? "md:flex-row-reverse" : "md:flex-row"} gap-6 items-start`}>
                  <div className={`flex-1 ${side === "right" ? "md:text-right" : ""}`}>
                    <div className="rounded-xl p-6" style={{ background: "oklch(0.12 0.01 260)", border: "1px solid oklch(1 0 0 / 10%)" }}>
                      <div className={`flex items-center gap-3 mb-3 ${side === "right" ? "md:flex-row-reverse" : ""}`}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-amber-400 flex-shrink-0" style={{ background: "oklch(0.72 0.19 50 / 15%)" }}>
                          {icon}
                        </div>
                        <div>
                          <div className="text-xs text-amber-500 font-mono font-semibold">STEP {step}</div>
                          <div className="font-semibold text-white">{title}</div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">{body}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex w-8 flex-col items-center pt-6">
                    <div className="w-3 h-3 rounded-full" style={{ background: "#f97316" }} />
                  </div>
                  <div className="flex-1 hidden md:block" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Warning Signs ── */}
      <section className="py-20" style={{ background: "oklch(0.10 0.01 260)", borderTop: "1px solid oklch(1 0 0 / 8%)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="font-display text-4xl md:text-5xl text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.03em" }}>
                SIGNS YOU MAY HAVE A SOLAR LIEN
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto">Many homeowners don't discover a solar lien until they try to sell or refinance. Here's what to watch for.</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { sign: "Your property tax bill increased after solar installation", type: "PACE Lien" },
              { sign: "A title search shows an unknown lien or encumbrance", type: "Any Type" },
              { sign: "Your mortgage lender is refusing to fund a refinance", type: "PACE / Deed" },
              { sign: "A buyer's lender flagged your title during escrow", type: "Any Type" },
              { sign: "You received a notice from a solar company about a UCC filing", type: "UCC Filing" },
              { sign: "Your solar installer went bankrupt and you got a contractor lien notice", type: "Mechanics Lien" },
            ].map(({ sign, type }) => (
              <Reveal key={sign}>
                <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "oklch(0.12 0.01 260)", border: "1px solid oklch(1 0 0 / 10%)" }}>
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-300 leading-snug mb-1">{sign}</p>
                    <span className="text-xs text-amber-500 font-mono">{type}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 max-w-4xl mx-auto px-6">
        <Reveal>
          <h2 className="font-display text-4xl md:text-5xl text-white mb-12 text-center" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.03em" }}>
            FREQUENTLY ASKED QUESTIONS
          </h2>
        </Reveal>

        <div className="space-y-4">
          {[
            {
              q: "How do I remove a solar lien from my property?",
              a: "The removal process depends on the lien type. PACE liens require a formal payoff and lien release recorded with your county. UCC fixture filings require a termination statement. Deeds of trust require a reconveyance. We handle all of these — and can often negotiate a reduced payoff if you were misled during the original sale."
            },
            {
              q: "What is a PACE loan and why does it create a lien?",
              a: "PACE (Property Assessed Clean Energy) loans are a type of solar financing where repayment is structured as a property tax assessment. Because they're tied to the property — not the borrower — they're recorded as a lien on your title. They have super-priority, meaning they're paid before your mortgage in a foreclosure. This makes most mortgage lenders refuse to fund a purchase or refi when a PACE lien exists."
            },
            {
              q: "Can I dispute a solar lien I didn't agree to?",
              a: "Yes. If a lien was recorded without your knowledge or consent, or if the loan was originated through misrepresentation, you have legal grounds to challenge it. We review the origination documents, disclosure forms, and recording to identify any defects that could void or reduce the lien."
            },
            {
              q: "How long does solar lien removal take?",
              a: "Simple payoff-and-release transactions can be completed in 2–4 weeks. Negotiated settlements typically take 4–8 weeks. Legal challenges to improper liens can take longer depending on the lender's response. We work to match your timeline — especially if you have a pending sale or refinance."
            },
            {
              q: "Does removing a solar lien mean I lose my solar panels?",
              a: "Not necessarily. Removing the lien means resolving the financing obligation — but the panels themselves are a separate matter. In most cases, if you pay off the loan, you keep the panels. If the loan is challenged and reduced or eliminated, the outcome depends on the specific legal resolution."
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
      </section>

      {/* ── Quiz ── */}
      <section className="py-20" style={{ background: "oklch(0.10 0.01 260)", borderTop: "1px solid oklch(1 0 0 / 8%)" }}>
        <div className="max-w-4xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-10">
              <h2 className="font-display text-4xl md:text-5xl text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.03em" }}>
                DO YOU QUALIFY FOR HELP?
              </h2>
              <p className="text-slate-400">Answer 5 quick questions to see if we can help remove your solar lien.</p>
            </div>
          </Reveal>
          <DoIQualifyQuiz compact />
        </div>
      </section>

      {/* ── Related ── */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <Reveal>
          <h2 className="font-display text-2xl text-white mb-8" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>RELATED RESOURCES</h2>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { href: "/selling-house-with-solar", title: "Selling House With Solar Loan", desc: "Solar loan blocking your home sale? We help you close." },
            { href: "/solar-exit-options", title: "Solar Exit Options", desc: "All the ways to get out of a solar purchase contract." },
            { href: "/solar-contract-help", title: "Solar Contract Help", desc: "Was your solar contract deceptive? Know your rights." },
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
      </section>

      {/* ── Footer CTA ── */}
      <section className="py-20 text-center" style={{ background: "linear-gradient(135deg, #0D0F14 0%, #1a1206 100%)", borderTop: "1px solid oklch(1 0 0 / 8%)" }}>
        <div className="max-w-3xl mx-auto px-6">
          <Reveal>
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-6" />
            <h2 className="font-display text-4xl md:text-5xl text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.03em" }}>
              THAT LIEN ISN'T GOING<br />AWAY ON ITS OWN
            </h2>
            <p className="text-slate-400 mb-8 text-lg">Solar liens don't expire. They follow your property until they're formally released. Get a free review and find out exactly what it will take to clear your title.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:9049214971" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-bold text-base transition-all hover:opacity-90"
                style={{ background: "#f97316", color: "#0D0F14" }}>
                <Phone className="w-5 h-5" /> Call (904) 921-4971
              </a>
              <a href="#get-help" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-semibold text-base transition-all hover:border-amber-500 hover:text-amber-400"
                style={{ border: "1px solid oklch(1 0 0 / 25%)", color: "#F8FAFC" }}>
                Free Lien Review <ArrowRight className="w-5 h-5" />
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
            <Link href="/solar-exit-options" className="hover:text-slate-400 transition-colors">Exit Options</Link>
            <Link href="/blog" className="hover:text-slate-400 transition-colors">Blog</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
