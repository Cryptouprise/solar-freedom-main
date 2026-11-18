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
import StickyMobileBar from "@/components/StickyMobileBar";
import { SchemaInjector } from "@/components/SchemaInjector";

const SCAM_TACTICS = [
  {
    icon: "🚪",
    title: "Door-to-Door High Pressure",
    description: "Salespeople show up unannounced, claim your neighbors already signed up, and pressure you to sign on the spot. They often misrepresent savings, tax credits, and contract terms.",
  },
  {
    icon: "💰",
    title: "Fake Tax Credit Promises",
    description: "Told you'd get a $10,000–$15,000 federal tax credit? Many homeowners were never eligible — but the loan was structured assuming you'd use that credit to pay it down. Now you owe the full amount.",
  },
  {
    icon: "📈",
    title: "Inflated Savings Projections",
    description: "Promised your electric bill would drop to near zero? Salespeople routinely used inflated utility rate projections to make the numbers look good. The real savings never materialized.",
  },
  {
    icon: "📋",
    title: "Hidden Contract Terms",
    description: "20–25 year contracts with escalator clauses, UCC liens on your home, and automatic renewal terms buried in fine print. Many homeowners had no idea what they actually signed.",
  },
  {
    icon: "🏚️",
    title: "Bankrupt Company, Still Paying",
    description: "Your solar company went out of business — but your loan payments keep going to GoodLeap, Mosaic, or Sunlight Financial. You're paying for a system with no warranty and no support.",
  },
  {
    icon: "🏠",
    title: "Home Sale Blocked by Solar Lien",
    description: "A UCC lien filed by your solar company or lender is blocking your home sale. Buyers can't get financing, and you can't close until the lien is resolved — sometimes costing tens of thousands.",
  },
];

const BANKRUPT_COMPANIES = [
  "SunPower", "Sunnova", "Pink Energy", "ADT Solar", "Lumio Solar",
  "Titan Solar Power", "Vision Solar", "Infinity Energy", "Kayo Energy",
  "Solcius", "Erus Energy", "Shine Solar", "Suntuity", "Moxie Solar",
  "Encor Solar", "Alternative Solar", "Solar Titan USA", "iSun",
  "Sunworks", "EcoMark Solar", "Expert Solar", "Pure Light Power",
];

const RED_FLAGS = [
  "Salesperson showed up at your door uninvited",
  "Promised your electric bill would be $0 or near zero",
  "Said you'd get a large federal tax credit to pay down the loan",
  "Rushed you to sign the same day — 'offer expires tonight'",
  "Couldn't clearly explain the full 20–25 year contract terms",
  "System was installed but never performed as promised",
  "Company went out of business after installation",
  "You're now paying more combined (solar + electric) than before",
  "Trying to sell your home but the solar contract is blocking it",
  "Your credit score dropped after signing the solar agreement",
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

const SCAM_FAQS = [
  { q: "What are the most common solar panel scams?", a: "The patterns homeowners report most are: a promise that the electric bill will disappear, a pitch that it is a free government or utility program, an overstated tax credit, pressure to sign the same day on a tablet, and a lender fee built into the loan amount without a clear explanation. A warning sign is not proof of fraud. It is a reason to compare the pitch with what you signed." },
  { q: "I think I was misled. What should I do first?", a: "Find the date you signed and check whether you are still inside a cancellation window. Then save the proposal, texts, emails and any notes of what the salesperson said, and get your full contract and loan documents. Those records decide which options exist." },
  { q: "Can I cancel a solar contract if I was misled?", a: "Sometimes. Inside the cooling-off window you can usually cancel by written notice. After that, options depend on the documents, the facts and your state's consumer protection law. A document review can tell you whether a claim is worth pursuing." },
  { q: "Where do I report a solar scam?", a: "You can report suspected fraud to the FTC at ReportFraud.ftc.gov, file a financial-product complaint with the CFPB, and contact your state attorney general's consumer protection office. A complaint creates a record but does not cancel a contract by itself." },
  { q: "What if the solar company that sold to me went out of business?", a: "Your loan or lease usually continues with a separate lender or system owner. Find out who services the account now, keep paying while you dispute in writing, and keep every repair request and reply." },
];

export default function SolarPanelScam() {
  useSeoMeta({
    title: 'Solar Panel Scams: Warning Signs and What to Do If You Signed',
    description: 'How solar panel scams work: the 5 most common sales tricks, how to check your contract, and what to do if you already signed. Save these records first.',
    canonical: 'https://breakyoursolarcontract.com/solar-panel-scam',
  });
  const scamSchemas = [{
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: SCAM_FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }];

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.10 0.01 265)", color: "oklch(0.92 0.01 265)" }}>
      <SchemaInjector schemas={scamSchemas} />
      <StickyMobileBar />
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
              SOLAR PANEL
              <br />
              <span style={{ color: "oklch(0.72 0.19 50)" }}>SCAMS:</span>
              <br />
              HOW TO SPOT ONE
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-zinc-300 text-xl leading-relaxed max-w-2xl mb-8">
              Short answer: the most common solar sales tricks are promising your bill will disappear, calling it a free government program, overstating the tax credit, rushing you to sign on a tablet, and hiding the lender's fee inside the loan amount. <strong className="text-white">If you already signed, check your cancel deadline today, save every text and email, and get your full contract and loan papers.</strong>
            </p>
            <p className="text-zinc-400 text-base leading-relaxed max-w-2xl mb-8">
              Signed in the last few days? See <Link href="/blog/solar-contract-rescission-rights"><span className="text-amber-400 underline underline-offset-4 cursor-pointer">your right to cancel a solar contract</span></Link>. Already installed? See <Link href="/blog/how-to-get-out-of-a-solar-contract"><span className="text-amber-400 underline underline-offset-4 cursor-pointer">how to get out of a solar contract</span></Link>.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="flex flex-wrap gap-4">
              <a
                href="#qualify"
                className="flex items-center gap-2 px-8 py-4 rounded-lg font-black text-black uppercase tracking-wider transition-all hover:brightness-110 hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.65 0.21 40))", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem" }}
              >
                Check If I Was Scammed <ArrowRight className="w-5 h-5" />
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
                { num: "4M+", label: "Homeowners affected" },
                { num: "30+", label: "Companies bankrupt" },
                { num: "$0", label: "Cost to get reviewed" },
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
              <div className="text-amber-500 text-xs font-mono uppercase tracking-widest mb-3">The Playbook They Used On You</div>
              <h2 className="font-black text-white" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                6 SOLAR SCAM TACTICS <span style={{ color: "oklch(0.72 0.19 50)" }}>EXPOSED</span>
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
                  10 RED FLAGS YOU
                  <br />
                  <span style={{ color: "oklch(0.72 0.19 50)" }}>WERE SCAMMED</span>
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
            {/* Bankrupt companies list */}
            <Reveal delay={0.1}>
              <div
                className="rounded-2xl p-8"
                style={{ background: "oklch(0.13 0.012 265)", border: "1px solid oklch(0.25 0.01 265)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-500 text-xs font-mono uppercase tracking-widest">Bankrupt Solar Companies</span>
                </div>
                <h3 className="font-black text-white text-xl mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  IS YOUR COMPANY ON THIS LIST?
                </h3>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                  These companies have filed for bankruptcy or shut down, leaving their customers stranded with active loans and no warranty support.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {BANKRUPT_COMPANIES.map(company => (
                    <div key={company} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "oklch(0.72 0.19 50)" }} />
                      <span className="text-zinc-300 text-sm">{company}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-white/8">
                  <p className="text-zinc-500 text-xs leading-relaxed">
                    Even if your company is still operating, you may still qualify for cancellation based on misrepresentation, consumer protection violations, or contract defects.
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
                YOU HAVE <span style={{ color: "oklch(0.72 0.19 50)" }}>LEGAL RIGHTS</span>
              </h2>
              <p className="text-zinc-400 mt-4 max-w-2xl mx-auto">
                Federal and state consumer-protection rules may be relevant, but the applicable law and available options depend on the transaction, documents, facts, and jurisdiction.
              </p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Shield className="w-6 h-6" />, title: "FTC Cooling-Off Rule", desc: "Federal law gives you 3 business days to cancel any door-to-door sale. Many companies violated this rule." },
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
                  FIND OUT IF YOU QUALIFY
                  <br />
                  <span style={{ color: "oklch(0.72 0.19 50)" }}>IN 60 SECONDS</span>
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
            {SCAM_FAQS.map((faq, i) => (
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
              DON'T LET THEM
              <br />
              <span style={{ color: "oklch(0.72 0.19 50)" }}>WIN.</span>
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
