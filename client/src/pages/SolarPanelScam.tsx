/**
 * SOLAR FREEDOM — Solar Panel Scam Landing Page
 * Target keyword: "solar panel scam" (8,100–12,000/mo)
 * Secondary: "solar scam", "solar door to door scam", "solar company scam"
 * Design: Dark Industrial Brutalism — matches site-wide system
 */
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, XCircle, Phone, ArrowRight, Shield, FileText, DollarSign, Home, Zap } from "lucide-react";
import DoIQualifyQuiz from "@/components/DoIQualifyQuiz";

const SCAM_TACTICS = [
  {
    icon: "🚪",
    title: "Sales-Process Records",
    description: "Preserve texts, emails, advertisements, presentations, and notes showing what was said, when documents were delivered, and how the transaction was signed.",
  },
  {
    icon: "💰",
    title: "Tax-Credit Assumptions",
    description: "Compare every written tax-credit representation with the payment schedule and current IRS guidance. Eligibility and use of a credit depend on individual tax facts.",
  },
  {
    icon: "📈",
    title: "Savings and Production Claims",
    description: "Keep the proposal, production estimate, utility assumptions, monitoring data, and bills. Compare a written projection with actual inputs before deciding whether it was inaccurate.",
  },
  {
    icon: "📋",
    title: "Agreement Terms",
    description: "Identify the stated term, payment or rate formula, transfer or purchase provisions, security language, cancellation notice, and dispute address in the signed agreement.",
  },
  {
    icon: "🏚️",
    title: "Counterparty Status",
    description: "Confirm the current legal name and status of the installer, seller, owner, lender, and servicer using the agreement, written notices, and official business or court records.",
  },
  {
    icon: "🏠",
    title: "Title or Filing Questions",
    description: "Use a current title report and a copy of any recorded instrument or UCC filing. Ask the listed holder and closing professional for written payoff, release, or transfer requirements.",
  },
];

const RED_FLAGS = [
  "A material sales statement is missing from the written agreement or proposal",
  "The cash price and amount financed differ and the difference was not explained",
  "A payment change or expected prepayment was not understood at signing",
  "A tax-credit statement was presented as certain without reviewing individual eligibility",
  "The production model, utility-rate assumption, or savings calculation is unavailable",
  "The signed agreement, cancellation notice, or financing disclosures are missing",
  "The current owner, lender, servicer, or warranty provider is unclear",
  "Actual bills or production differ from a preserved written representation",
  "A title report or closing party identified an unfamiliar filing or transfer condition",
  "The written complaint or dispute procedure has not been provided",
];

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function SolarPanelScam() {
  useSeoMeta({
    title: 'Solar Panel Scam — Were You Deceived? | Solar Freedom',
    description: 'Learn common warning signs in solar sales and financing, which records to preserve, and where to verify consumer-protection information.',
    canonical: 'https://breakyoursolarcontract.com/solar-panel-scam',
  });

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.10 0.01 265)", color: "oklch(0.92 0.01 265)" }}>
      {/* Nav */}
      <nav className="border-b border-white/8 sticky top-0 z-50 backdrop-blur-md" style={{ background: "oklch(0.10 0.01 265 / 0.95)" }}>
        <div className="container flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "oklch(0.72 0.19 50)" }}>
                <Zap className="w-3.5 h-3.5 text-black" />
              </div>
              <span className="font-black text-white" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", letterSpacing: "0.05em" }}>SOLAR FREEDOM</span>
            </div>
          </Link>
          <a
            href="tel:9049214971"
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-black text-sm transition-all hover:brightness-110"
            style={{ background: "oklch(0.72 0.19 50)" }}
          >
            <Phone className="w-3.5 h-3.5" />
            (904) 921-4971
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.55 0.18 25 / 0.12) 0%, transparent 70%)" }} />
        <div className="container relative">
          <Reveal>
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-full px-4 py-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-400 text-xs font-bold uppercase tracking-widest">Consumer Alert</span>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h1
              className="text-white font-black leading-none mb-6"
              style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(3rem, 8vw, 6rem)" }}
            >
              SOLAR SALES &amp;
              <br />
              <span style={{ color: "oklch(0.72 0.19 50)" }}>FINANCING</span>
              <br />
              RED FLAGS.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-zinc-300 text-xl leading-relaxed max-w-2xl mb-8">
              Some consumer complaints describe disputed tax-credit statements, savings projections, or high-pressure sales tactics. Compare the signed agreement, written sales materials, bills, and performance records with current official sources before drawing a conclusion or assuming a remedy.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="flex flex-wrap gap-4">
              <a
                href="#qualify"
                className="flex items-center gap-2 px-8 py-4 rounded-lg font-black text-black uppercase tracking-wider transition-all hover:brightness-110 hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.65 0.21 40))", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem" }}
              >
                Organize My Records <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="tel:9049214971"
                className="flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-white uppercase tracking-wider transition-all hover:bg-white/10"
                style={{ border: "1px solid oklch(0.72 0.19 50 / 0.5)", fontSize: "0.9rem" }}
              >
                <Phone className="w-4 h-4" /> Call (904) 921-4971
              </a>
            </div>
          </Reveal>
          {/* Stats bar */}
          <Reveal delay={0.2}>
            <div className="grid grid-cols-3 gap-6 mt-16 pt-10 border-t border-white/8 max-w-2xl">
              {[
                { num: "FTC", label: "Covered-sale rule" },
                { num: "CFPB", label: "Solar-loan guidance" },
                { num: "1", label: "Individual record set" },
              ].map(s => (
                <div key={s.label}>
                  <div className="font-black text-3xl" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "oklch(0.72 0.19 50)" }}>{s.num}</div>
                  <div className="text-zinc-500 text-xs uppercase tracking-wider mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 6 Scam Tactics */}
      <section className="py-20" style={{ background: "oklch(0.12 0.012 265)" }}>
        <div className="container">
          <Reveal>
            <div className="text-center mb-14">
              <div className="text-amber-500 text-xs font-mono uppercase tracking-widest mb-3">Records to Review</div>
              <h2 className="font-black text-white" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                6 RECORD CATEGORIES <span style={{ color: "oklch(0.72 0.19 50)" }}>TO CHECK</span>
              </h2>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SCAM_TACTICS.map((tactic, i) => (
              <Reveal key={tactic.title} delay={i * 0.07}>
                <div
                  className="p-6 rounded-xl h-full"
                  style={{ background: "oklch(0.15 0.012 265)", border: "1px solid oklch(0.25 0.01 265)" }}
                >
                  <div className="text-3xl mb-4">{tactic.icon}</div>
                  <h3 className="font-bold text-white text-base mb-2">{tactic.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{tactic.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Red Flags Checklist */}
      <section className="py-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <Reveal>
                <div className="text-amber-500 text-xs font-mono uppercase tracking-widest mb-3">Warning Signs</div>
                <h2 className="font-black text-white mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                  10 RECORD GAPS TO
                  <br />
                  <span style={{ color: "oklch(0.72 0.19 50)" }}>INVESTIGATE</span>
                </h2>
                <p className="text-zinc-400 leading-relaxed mb-8">
                  If one or more of these warning signs applies, preserve the agreement, disclosures, sales materials, bills, installation records, and communications for an individual review.
                </p>
              </Reveal>
              <div className="space-y-3">
                {RED_FLAGS.map((flag, i) => (
                  <Reveal key={flag} delay={i * 0.05}>
                    <div className="flex items-start gap-3">
                      <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
                      <span className="text-zinc-300 text-sm">{flag}</span>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
            {/* Official source review */}
            <Reveal delay={0.1}>
              <div
                className="rounded-2xl p-8"
                style={{ background: "oklch(0.13 0.012 265)", border: "1px solid oklch(0.25 0.01 265)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-500 text-xs font-mono uppercase tracking-widest">Official Consumer Sources</span>
                </div>
                <h3 className="font-black text-white text-xl mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  START WITH PRIMARY SOURCES
                </h3>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                  Company status, transaction coverage, and individual remedies cannot be inferred from a marketing list. Verify the records and use official sources for the proposition being reviewed.
                </p>
                <div className="space-y-3">
                  <a className="block text-sm text-amber-400 hover:text-amber-300 underline underline-offset-2" href="https://www.consumerfinance.gov/data-research/research-reports/issue-spotlight-solar-financing/" target="_blank" rel="noopener noreferrer">CFPB: Issue Spotlight on Solar Financing</a>
                  <a className="block text-sm text-amber-400 hover:text-amber-300 underline underline-offset-2" href="https://www.ftc.gov/legal-library/browse/rules/cooling-period-sales-made-home-or-other-locations" target="_blank" rel="noopener noreferrer">FTC: Cooling-Off Rule for covered sales</a>
                  <a className="block text-sm text-amber-400 hover:text-amber-300 underline underline-offset-2" href="https://www.consumerfinance.gov/complaint/" target="_blank" rel="noopener noreferrer">CFPB: Submit a financial-product complaint</a>
                </div>
                <div className="mt-6 pt-6 border-t border-white/8">
                  <p className="text-zinc-500 text-xs leading-relaxed">
                    These sources describe general rules and reported market risks. They do not decide whether an individual transaction involved misconduct or whether any remedy is available.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Your Rights section */}
      <section className="py-20" style={{ background: "oklch(0.12 0.012 265)" }}>
        <div className="container">
          <Reveal>
            <div className="text-center mb-14">
              <div className="text-amber-500 text-xs font-mono uppercase tracking-widest mb-3">Consumer Protection Law</div>
              <h2 className="font-black text-white" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                RULES TO <span style={{ color: "oklch(0.72 0.19 50)" }}>CHECK</span>
              </h2>
              <p className="text-zinc-400 mt-4 max-w-2xl mx-auto">
                Federal and state consumer-protection rules may be relevant, but the applicable law and available options depend on the transaction, documents, facts, and jurisdiction.
              </p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Shield className="w-6 h-6" />, title: "FTC Cooling-Off Rule", desc: "The rule covers certain door-to-door sales and has scope requirements and exceptions. Check the official rule and transaction date before relying on its three-business-day period." },
              { icon: <FileText className="w-6 h-6" />, title: "State Consumer Protection", desc: "State rules and available remedies vary. Verify current law with official sources and qualified counsel in the relevant jurisdiction." },
              { icon: <DollarSign className="w-6 h-6" />, title: "Truth in Lending Act", desc: "Financing disclosures may be relevant. Whether the Act applies and what remedy is available requires a fact-specific review." },
              { icon: <Home className="w-6 h-6" />, title: "UCC Filing Review", desc: "A filing's effect and any challenge depend on the record, contract, property transaction, and applicable law." },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 0.08}>
                <div
                  className="p-6 rounded-xl h-full"
                  style={{ background: "oklch(0.15 0.012 265)", border: "1px solid oklch(0.25 0.01 265)" }}
                >
                  <div className="mb-4" style={{ color: "oklch(0.72 0.19 50)" }}>{item.icon}</div>
                  <h3 className="font-bold text-white text-sm mb-2">{item.title}</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Quiz / Lead Capture */}
      <section id="qualify" className="py-20">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <Reveal>
              <div className="text-center mb-8">
                <div className="text-amber-500 text-xs font-mono uppercase tracking-widest mb-3">Case Review</div>
                <h2 className="font-black text-white" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 5vw, 3rem)" }}>
                  ORGANIZE YOUR RECORDS
                  <br />
                  <span style={{ color: "oklch(0.72 0.19 50)" }}>FOR INDIVIDUAL REVIEW</span>
                </h2>
                <p className="text-zinc-400 mt-3 text-sm">Answer five intake questions. Response time, availability, fees, and next steps depend on the individual review.</p>
              </div>
            </Reveal>
            <DoIQualifyQuiz />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20" style={{ background: "oklch(0.12 0.012 265)" }}>
        <div className="container max-w-3xl">
          <Reveal>
            <h2 className="font-black text-white mb-10 text-center" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              FREQUENTLY ASKED <span style={{ color: "oklch(0.72 0.19 50)" }}>QUESTIONS</span>
            </h2>
          </Reveal>
          <div className="space-y-4">
            {[
              { q: "Where can I verify solar-sales complaints?", a: "Check current records from the relevant state attorney general, the Federal Trade Commission, the Consumer Financial Protection Bureau, licensing agencies, courts, and other official sources. A complaint does not by itself establish wrongdoing." },
              { q: "What can I do if I believe a solar company misled me?", a: "Preserve the agreement, disclosures, proposals, bills, installation records, and communications. Report suspected misconduct through current official consumer-protection channels and request advice specific to your documents and jurisdiction." },
              { q: "Can I cancel my solar contract if I was misled?", a: "Cancellation or another remedy may be possible, but it cannot be determined from general information. The agreement, representations, performance, financing, applicable law, and parties involved must be reviewed." },
              { q: "What if my solar company went bankrupt?", a: "Bankruptcy does not automatically cancel every related agreement. The installer, seller, lender, servicer, completion status, and contract terms must be reviewed individually." },
              { q: "How much does it cost to get help?", a: "Any fees, scope, and engagement terms must be disclosed and agreed before paid services begin. Submitting intake information does not guarantee representation." },
              { q: "How long does the process take?", a: "Timing varies with the agreement, facts, parties, process, and jurisdiction. No result or timeline can be determined from general information alone." },
            ].map((faq, i) => (
              <Reveal key={faq.q} delay={i * 0.05}>
                <div
                  className="p-6 rounded-xl"
                  style={{ background: "oklch(0.15 0.012 265)", border: "1px solid oklch(0.25 0.01 265)" }}
                >
                  <h3 className="font-bold text-white text-sm mb-2 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                    {faq.q}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed pl-6">{faq.a}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container text-center">
          <Reveal>
            <h2 className="font-black text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}>
              DON'T RELY ON
              <br />
              <span style={{ color: "oklch(0.72 0.19 50)" }}>ASSUMPTIONS.</span>
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto mb-8">
              Preserve your documents, verify current official resources, and request a fact-specific review before choosing a next step.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="#qualify"
                className="flex items-center gap-2 px-10 py-4 rounded-lg font-black text-black uppercase tracking-wider transition-all hover:brightness-110 hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.65 0.21 40))", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem" }}
              >
                Request My Case Review <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="tel:9049214971"
                className="flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-white uppercase tracking-wider transition-all hover:bg-white/10"
                style={{ border: "1px solid oklch(0.72 0.19 50 / 0.5)", fontSize: "0.9rem" }}
              >
                <Phone className="w-4 h-4" /> Call Grace Silver: (904) 921-4971
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 py-10" style={{ background: "oklch(0.09 0.01 265)" }}>
        <div className="container text-center">
          <Link href="/">
            <span className="font-black text-white cursor-pointer hover:text-amber-500 transition-colors" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>← Back to Solar Freedom</span>
          </Link>
          <p className="text-zinc-600 text-xs mt-4 max-w-2xl mx-auto">
            Consumer information only; not legal advice. Submitting information does not create an attorney-client relationship or guarantee representation, a result, or a timeline. © {new Date().getFullYear()} Solar Freedom. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
