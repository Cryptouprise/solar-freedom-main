// Solar Exit Options — Pillar Page
// Design: Dark Industrial — same system as rest of site
// Primary keyword: solar exit options
// Pillar page for homeowners exploring how to exit solar agreements

import { Link } from "wouter";
import { ArrowRight, CheckCircle, Shield, Scale, FileText, DollarSign, Home, AlertTriangle } from "lucide-react";
import { useEffect } from "react";

const steps = [
  {
    step: "01",
    title: "Identify Your Contract Type",
    body: "Solar loan, solar lease, or PPA — each has different exit strategies. The type of contract you have determines which paths are available to you.",
    link: "/blog/solar-loan-vs-lease-problems",
    linkText: "Loan vs Lease: Key Differences",
  },
  {
    step: "02",
    title: "Review for Legal Grounds",
    body: "Most homeowners who want out have at least one viable legal ground: misrepresentation, TILA violations, failure to provide cancellation notice, or state consumer protection violations.",
    link: "/blog/solar-fraud-warning-signs",
    linkText: "Solar Contract Red Flags",
  },
  {
    step: "03",
    title: "Choose Your Exit Path",
    body: "Legal cancellation, negotiated buyout, transfer to buyer, or refinancing. The right path depends on your situation, timeline, and financial goals.",
    link: "/blog/how-to-negotiate-solar-contract-cancellation",
    linkText: "Negotiation Guide",
  },
  {
    step: "04",
    title: "Get Legal Representation",
    body: "Solar contract disputes are specialized. An attorney who knows solar financing law can identify options you would never find on your own — and often works on contingency.",
    link: "/blog/solar-contract-attorney-guide",
    linkText: "Attorney Guide",
  },
];

const contractTypes = [
  {
    type: "Solar Loan",
    icon: <DollarSign className="w-5 h-5" />,
    description: "You own the panels. You owe a lender. The loan may be secured by your home.",
    exitOptions: ["Pay off the balance", "Refinance at better terms", "Challenge via TILA violations", "Negotiate a reduced payoff"],
    difficulty: "Moderate",
    href: "/blog/cancel-solar-loan-or-lease-early",
  },
  {
    type: "Solar Lease",
    icon: <FileText className="w-5 h-5" />,
    description: "The company owns the panels. You pay a monthly fee. Often 20–25 years with escalators.",
    exitOptions: ["Transfer to home buyer", "Buy out the lease", "Challenge via misrepresentation", "Negotiate early termination"],
    difficulty: "Moderate to Hard",
    href: "/blog/cancel-solar-lease-san-antonio",
  },
  {
    type: "PPA",
    icon: <Scale className="w-5 h-5" />,
    description: "You pay per kilowatt-hour. Company owns panels. Property lien complicates everything.",
    exitOptions: ["Transfer to buyer (difficult)", "Buy out the PPA (expensive)", "Challenge via undisclosed terms", "Negotiate with lender"],
    difficulty: "Hard",
    href: "/blog/solar-ppa-cancellation-guide",
  },
];

const stateLinks = [
  { state: "Texas", href: "/cancel-solar-contract/dallas-tx" },
  { state: "California", href: "/cancel-solar-contract/los-angeles-ca" },
  { state: "Arizona", href: "/cancel-solar-contract/phoenix-az" },
  { state: "Florida", href: "/cancel-solar-contract/orlando-fl" },
  { state: "Nevada", href: "/cancel-solar-contract/las-vegas-nv" },
  { state: "Colorado", href: "/cancel-solar-contract/denver-co" },
];

export default function SolarExitOptions() {
  useEffect(() => {
    document.title = "Solar Exit Options: Every Way to Get Out of a Solar Contract | Solar Freedom";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "All solar exit options explained: legal cancellation, negotiated buyout, lease transfer, and refinancing. Find out which path fits your situation.");
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.10 0.01 265)", color: "oklch(0.95 0.01 265)" }}>
      {/* NAV */}
      <nav className="border-b border-white/8 px-6 py-4 flex items-center justify-between sticky top-0 z-50" style={{ background: "oklch(0.10 0.01 265 / 95%)", backdropFilter: "blur(12px)" }}>
        <Link href="/">
          <span className="text-xl font-black tracking-tight text-white cursor-pointer" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>
            SOLAR<span className="text-amber-400">FREEDOM</span>
          </span>
        </Link>
        <Link href="/#contact">
          <button className="text-sm font-semibold px-4 py-2 rounded-lg text-black" style={{ background: "oklch(0.78 0.18 85)" }}>
            Free Case Review
          </button>
        </Link>
      </nav>

      {/* HERO */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full mb-6" style={{ background: "oklch(0.14 0.03 50 / 20%)" }}>
          <Shield className="w-3 h-3" /> SOLAR EXIT OPTIONS
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          EVERY WAY TO<br /><span className="text-amber-400">EXIT SOLAR</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mb-8 leading-relaxed">
          There is no single exit from a solar contract. The right path depends on your contract type, how long ago you signed, and the specific facts of your situation. This page maps every option available to homeowners.
        </p>
        <Link href="/#contact">
          <button className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-black" style={{ background: "oklch(0.78 0.18 85)" }}>
            Find My Exit Path <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </section>

      {/* 4-STEP PROCESS */}
      <section className="px-6 py-16 border-t border-white/8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-white mb-10" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>THE 4-STEP PROCESS</h2>
          <div className="space-y-6">
            {steps.map((s) => (
              <div key={s.step} className="flex gap-6 p-6 rounded-xl border border-white/8" style={{ background: "oklch(0.13 0.01 265)" }}>
                <div className="text-4xl font-black text-amber-400/30 flex-shrink-0 w-12" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{s.step}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-gray-400 text-sm mb-3 leading-relaxed">{s.body}</p>
                  <Link href={s.link}>
                    <span className="text-amber-400 text-sm font-semibold hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer">
                      {s.linkText} <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BY CONTRACT TYPE */}
      <section className="px-6 py-16 border-t border-white/8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>EXIT OPTIONS BY CONTRACT TYPE</h2>
          <p className="text-gray-400 mb-10">Your contract type is the single most important factor in determining which exit paths are available.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contractTypes.map((ct) => (
              <Link key={ct.type} href={ct.href}>
                <div className="p-6 rounded-xl border border-white/8 hover:border-amber-500/30 transition-all cursor-pointer h-full flex flex-col" style={{ background: "oklch(0.13 0.01 265)" }}>
                  <div className="text-amber-400 mb-3">{ct.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{ct.type}</h3>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">{ct.description}</p>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-2 font-mono uppercase tracking-wider">Exit Options</div>
                    <ul className="space-y-1">
                      {ct.exitOptions.map((opt) => (
                        <li key={opt} className="flex items-start gap-2 text-sm text-gray-300">
                          <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                          {opt}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/8">
                    <span className="text-xs text-gray-500">Difficulty: </span>
                    <span className="text-xs font-mono text-amber-400">{ct.difficulty}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* WARNING */}
      <section className="px-6 py-12 border-t border-white/8">
        <div className="max-w-5xl mx-auto">
          <div className="p-6 rounded-xl border border-red-500/30 flex gap-4" style={{ background: "oklch(0.14 0.05 20 / 20%)" }}>
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white mb-2">Do Not Stop Payments Without Legal Guidance</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Stopping solar payments unilaterally — without a legal basis — can trigger default, damage your credit, and result in a lien on your home. Always pursue legal options through proper channels before stopping payments. A free case review takes 48 hours and costs nothing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BY STATE */}
      <section className="px-6 py-16 border-t border-white/8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>EXIT OPTIONS BY STATE</h2>
          <p className="text-gray-400 mb-8">State laws vary dramatically. Your state's consumer protection laws may provide stronger remedies than federal law.</p>
          <div className="flex flex-wrap gap-3">
            {stateLinks.map((s) => (
              <Link key={s.state} href={s.href}>
                <span className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 border border-white/8 hover:border-amber-500/30 hover:text-amber-400 transition-all cursor-pointer" style={{ background: "oklch(0.13 0.01 265)" }}>
                  {s.state}
                </span>
              </Link>
            ))}
            <Link href="/blog/solar-contract-state-laws-guide">
              <span className="px-4 py-2 rounded-lg text-sm font-medium text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-all cursor-pointer">
                View All States →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 border-t border-white/8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            READY TO FIND YOUR EXIT?
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Our attorneys review your specific agreement and identify which exit options are available to you. Free, no obligation, results in 48 hours.
          </p>
          <Link href="/#contact">
            <button className="flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-black text-lg mx-auto" style={{ background: "oklch(0.78 0.18 85)" }}>
              <CheckCircle className="w-5 h-5" /> Get Free Case Review
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
