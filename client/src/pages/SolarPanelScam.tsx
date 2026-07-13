/**
 * SOLAR FREEDOM — Solar Panel Scam Landing Page
 * Target keyword: "solar panel scam" (8,100–12,000/mo)
 * Secondary: "solar scam", "solar door to door scam", "solar company scam"
 * Design: Dark Industrial Brutalism — matches site-wide system
 */
import { useEffect } from "react";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, XCircle, Phone, ArrowRight, Shield, FileText, DollarSign, Home, Zap } from "lucide-react";
import DoIQualifyQuiz from "@/components/DoIQualifyQuiz";

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

export default function SolarPanelScam() {
  useSeoMeta({
    title: 'Solar Panel Scam — Were You Deceived? | Solar Freedom',
    description: 'Millions of homeowners were deceived by solar panel scams — fake tax credits, inflated savings, high-pressure door-to-door sales, and hidden contract terms. Find out if you qualify to cancel your contract and recover your money.',
    canonical: 'https://breakyoursolarcontract.com/solar-panel-scam',
  });
  useEffect(() => {
    document.title = "Solar Panel Scam — Were You Deceived? | Solar Freedom";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "Millions of homeowners were deceived by solar panel scams — fake tax credits, inflated savings, high-pressure door-to-door sales, and hidden contract terms. Find out if you qualify to cancel your contract and recover your money.");
    }
    // Schema markup
    const schema = document.createElement("script");
    schema.type = "application/ld+json";
    schema.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Is the solar panel industry full of scams?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Unfortunately, yes. The solar industry has been plagued by deceptive sales practices, including fake tax credit promises, inflated savings projections, high-pressure door-to-door tactics, and hidden contract terms. State attorneys general across the country have filed lawsuits against major solar companies for consumer fraud."
          }
        },
        {
          "@type": "Question",
          "name": "What can I do if I was scammed by a solar company?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "You may be able to cancel your solar contract and recover money you've paid. Consumer protection attorneys can review your contract for violations of state and federal law, including the FTC's cooling-off rule, state consumer protection acts, and Truth in Lending Act violations. Solar Freedom offers free case reviews."
          }
        },
        {
          "@type": "Question",
          "name": "Can I cancel my solar contract if I was misled?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes — in many cases. If you were misled about tax credits, savings projections, or contract terms, you may have grounds to cancel under consumer protection law. An attorney can review your specific contract and state laws to determine your options."
          }
        },
        {
          "@type": "Question",
          "name": "What if my solar company went bankrupt?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "If your solar company went bankrupt, you may still be making loan payments to a third-party lender like GoodLeap or Mosaic. In many cases, the bankruptcy of the installer gives you grounds to dispute the loan and potentially have it voided. Contact Solar Freedom for a free case review."
          }
        }
      ]
    });
    document.head.appendChild(schema);
    return () => { document.head.removeChild(schema); };
  }, []);

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
              SOLAR PANEL
              <br />
              <span style={{ color: "oklch(0.72 0.19 50)" }}>SCAMS ARE</span>
              <br />
              EVERYWHERE.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-zinc-300 text-xl leading-relaxed max-w-2xl mb-8">
              Millions of American homeowners were deceived by solar companies using fake tax credit promises, inflated savings projections, and high-pressure door-to-door tactics. If you were misled — <strong className="text-white">you may be able to cancel your contract and get your money back.</strong>
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
                  If even one of these applies to you, our attorneys want to review your contract. Many homeowners qualify for full cancellation and recovery of payments made.
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
                Multiple federal and state laws protect homeowners from deceptive solar sales practices. Our attorneys use these laws to cancel contracts and recover money.
              </p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Shield className="w-6 h-6" />, title: "FTC Cooling-Off Rule", desc: "Federal law gives you 3 business days to cancel any door-to-door sale. Many companies violated this rule." },
              { icon: <FileText className="w-6 h-6" />, title: "State Consumer Protection Acts", desc: "All 50 states have consumer protection laws against deceptive trade practices. Violations can result in triple damages." },
              { icon: <DollarSign className="w-6 h-6" />, title: "Truth in Lending Act", desc: "Lenders must fully disclose loan terms. Violations of TILA can void the loan entirely." },
              { icon: <Home className="w-6 h-6" />, title: "UCC Lien Removal", desc: "Improperly filed liens on your home can be challenged and removed, freeing your home for sale." },
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
                <div className="text-amber-500 text-xs font-mono uppercase tracking-widest mb-3">Free Case Review</div>
                <h2 className="font-black text-white" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 5vw, 3rem)" }}>
                  FIND OUT IF YOU QUALIFY
                  <br />
                  <span style={{ color: "oklch(0.72 0.19 50)" }}>IN 60 SECONDS</span>
                </h2>
                <p className="text-zinc-400 mt-3 text-sm">Answer 5 quick questions. Our attorneys review your case within 24 hours. No cost, no obligation.</p>
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
              { q: "Is the solar panel industry full of scams?", a: "Unfortunately, yes. The solar industry has been plagued by deceptive sales practices, including fake tax credit promises, inflated savings projections, and high-pressure door-to-door tactics. State attorneys general across the country have filed lawsuits against major solar companies for consumer fraud." },
              { q: "What can I do if I was scammed by a solar company?", a: "You may be able to cancel your solar contract and recover money you've paid. Consumer protection attorneys can review your contract for violations of state and federal law, including the FTC's cooling-off rule, state consumer protection acts, and Truth in Lending Act violations." },
              { q: "Can I cancel my solar contract if I was misled?", a: "Yes — in many cases. If you were misled about tax credits, savings projections, or contract terms, you may have grounds to cancel under consumer protection law. An attorney can review your specific contract and state laws to determine your options." },
              { q: "What if my solar company went bankrupt?", a: "If your solar company went bankrupt, you may still be making loan payments to a third-party lender like GoodLeap or Mosaic. In many cases, the bankruptcy of the installer gives you grounds to dispute the loan and potentially have it voided." },
              { q: "How much does it cost to get help?", a: "Solar Freedom offers free case reviews with no upfront cost. Our attorneys work on a contingency basis — meaning we only get paid if we recover money for you. There is zero financial risk to you." },
              { q: "How long does the process take?", a: "It varies by case. Some contracts are canceled within 30–60 days. Cases involving litigation or lender disputes can take 6–12 months. Our attorneys will give you a realistic timeline after reviewing your specific situation." },
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
              DON'T LET THEM
              <br />
              <span style={{ color: "oklch(0.72 0.19 50)" }}>WIN.</span>
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto mb-8">
              You were deceived. You have rights. Our attorneys are ready to fight for you — at zero cost to you unless we win.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="#qualify"
                className="flex items-center gap-2 px-10 py-4 rounded-lg font-black text-black uppercase tracking-wider transition-all hover:brightness-110 hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.65 0.21 40))", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem" }}
              >
                Get My Free Case Review <ArrowRight className="w-5 h-5" />
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
            DISCLAIMER: Results vary by case. Past results do not guarantee future outcomes. This website is attorney advertising. Consultation does not create an attorney-client relationship until a formal engagement agreement is signed. © {new Date().getFullYear()} Solar Freedom. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
