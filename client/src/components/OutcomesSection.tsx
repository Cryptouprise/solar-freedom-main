/**
 * OutcomesSection — "What You Could Walk Away With"
 * Translates the two infographics into the site's dark amber design system.
 * Sections:
 *   1. Why Book the Call? — two outcome cards (cancellation + loan reduction)
 *   2. Your Legal Shields — FTC Cooling-Off, DTPA, TILA
 *   3. Is Your Company on This List? — predatory lenders + bankrupt installers
 *   4. Full infographic images (expandable)
 */

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const INFOGRAPHIC_JUSTICE = "/manus-storage/SolarContractJusticeInfographic_39c435fa.png";
const INFOGRAPHIC_SCAMS = "/manus-storage/SolarScamandFraudExposure_0fd61006.png";

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function OutcomesSection({ onBookCall }: { onBookCall?: () => void }) {
  const [showJusticeInfographic, setShowJusticeInfographic] = useState(false);
  const [showScamsInfographic, setShowScamsInfographic] = useState(false);

  return (
    <>
      {/* ── SECTION 1: WHAT YOU COULD WALK AWAY WITH ── */}
      <section className="py-24 lg:py-32" style={{ background: "oklch(0.10 0.012 265)" }}>
        <div className="container max-w-5xl">
          <Reveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest mb-5"
                style={{ background: "oklch(0.72 0.19 50 / 15%)", color: "oklch(0.85 0.19 50)", border: "1px solid oklch(0.72 0.19 50 / 40%)" }}>
                WHY BOOK THE 15-MINUTE CALL?
              </div>
              <h2 className="font-display text-white leading-none mb-4" style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}>
                WHAT YOU COULD<br />
                <span style={{ background: "linear-gradient(90deg, oklch(0.85 0.19 50), oklch(0.72 0.19 50))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  WALK AWAY WITH
                </span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Our attorneys fight for two outcomes. In 15 minutes, we'll tell you which one applies to your contract — and what we can realistically get you.
              </p>
            </div>
          </Reveal>

          {/* Two outcome cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Outcome 1: Total Cancellation */}
            <Reveal delay={0}>
              <div className="rounded-2xl p-8 border-2 relative overflow-hidden h-full"
                style={{ background: "oklch(0.13 0.015 265)", borderColor: "oklch(0.72 0.19 50 / 60%)" }}>
                {/* Glow */}
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
                  style={{ background: "radial-gradient(circle, oklch(0.72 0.19 50 / 15%) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />

                <div className="relative">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-3xl"
                    style={{ background: "oklch(0.72 0.19 50 / 20%)", border: "1px solid oklch(0.72 0.19 50 / 40%)" }}>
                    🏠
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest mb-4"
                    style={{ background: "oklch(0.72 0.19 50 / 20%)", color: "oklch(0.85 0.19 50)", border: "1px solid oklch(0.72 0.19 50 / 50%)" }}>
                    OUTCOME #1
                  </div>

                  <h3 className="font-display text-white text-3xl lg:text-4xl leading-tight mb-4">
                    TOTAL CONTRACT<br />
                    <span style={{ color: "oklch(0.85 0.19 50)" }}>CANCELLATION</span>
                  </h3>

                  <p className="text-gray-300 text-base leading-relaxed mb-6">
                    In many cases, we get the contract voided entirely and the UCC-1 property lien removed. You keep the solar equipment — for free. No more monthly payments. Ever.
                  </p>

                  <div className="space-y-3">
                    {[
                      "Contract voided — zero remaining balance",
                      "UCC-1 lien removed from your property",
                      "Keep the solar equipment at no cost",
                      "Credit protection included",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: "oklch(0.72 0.19 50 / 25%)", border: "1px solid oklch(0.72 0.19 50 / 60%)" }}>
                          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="oklch(0.85 0.19 50)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <span className="text-gray-300 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Outcome 2: Massive Loan Reduction */}
            <Reveal delay={0.1}>
              <div className="rounded-2xl p-8 border relative overflow-hidden h-full"
                style={{ background: "oklch(0.13 0.015 265)", borderColor: "oklch(0.55 0.15 265 / 50%)" }}>
                {/* Glow */}
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
                  style={{ background: "radial-gradient(circle, oklch(0.55 0.15 265 / 15%) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />

                <div className="relative">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-3xl"
                    style={{ background: "oklch(0.55 0.15 265 / 20%)", border: "1px solid oklch(0.55 0.15 265 / 40%)" }}>
                    📉
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest mb-4"
                    style={{ background: "oklch(0.55 0.15 265 / 20%)", color: "oklch(0.75 0.12 265)", border: "1px solid oklch(0.55 0.15 265 / 50%)" }}>
                    OUTCOME #2
                  </div>

                  <h3 className="font-display text-white text-3xl lg:text-4xl leading-tight mb-2">
                    MASSIVE LOAN<br />
                    <span style={{ color: "oklch(0.75 0.12 265)" }}>REDUCTION</span>
                  </h3>

                  {/* Big percentage */}
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="font-display leading-none" style={{ fontSize: "clamp(3rem, 8vw, 5rem)", color: "oklch(0.75 0.12 265)" }}>30%</span>
                    <span className="text-gray-400 text-2xl font-bold">–</span>
                    <span className="font-display leading-none" style={{ fontSize: "clamp(3rem, 8vw, 5rem)", color: "oklch(0.75 0.12 265)" }}>60%</span>
                    <span className="text-gray-300 text-lg font-semibold ml-1">OFF</span>
                  </div>

                  <p className="text-gray-300 text-base leading-relaxed mb-6">
                    For homeowners who want to keep their system, we negotiate directly with lenders to strip out hidden "dealer fees" and inflated interest — resulting in significant principal balance reductions.
                  </p>

                  <div className="space-y-3">
                    {[
                      "Hidden dealer fees stripped from balance",
                      "Inflated interest negotiated down",
                      "Monthly payment dramatically reduced",
                      "Keep your solar system working",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: "oklch(0.55 0.15 265 / 25%)", border: "1px solid oklch(0.55 0.15 265 / 60%)" }}>
                          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="oklch(0.75 0.12 265)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <span className="text-gray-300 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* CTA */}
          <Reveal delay={0.2}>
            <div className="text-center">
              <p className="text-gray-400 text-lg mb-6">
                In your free 15-minute call, we'll tell you exactly which outcome is realistic for <em>your</em> contract.
              </p>
              {onBookCall && (
                <button
                  onClick={onBookCall}
                  className="inline-flex items-center gap-3 px-10 py-5 rounded-xl font-black text-black text-lg uppercase tracking-widest transition-all duration-300 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.60 0.21 40))", boxShadow: "0 0 40px oklch(0.72 0.19 50 / 35%)" }}
                >
                  📞 BOOK MY FREE 15-MINUTE CALL
                </button>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── SECTION 2: YOUR LEGAL SHIELDS ── */}
      <section className="py-20 lg:py-28" style={{ background: "oklch(0.12 0.012 265)" }}>
        <div className="container max-w-5xl">
          <Reveal>
            <div className="text-center mb-14">
              <div className="badge-success inline-block mb-4">FEDERAL & STATE PROTECTIONS</div>
              <h2 className="font-display text-white mb-3" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                YOUR LEGAL SHIELDS
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Federal and state law gives you powerful rights that solar companies hope you never find out about.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              {
                icon: "⏱",
                title: "FTC Cooling-Off Rule",
                subtitle: "72-Hour Right",
                body: "Federal law grants you a 3-business-day window to cancel any contract signed at your home without penalty. Many solar companies fail to properly disclose this right — making the contract voidable.",
                color: "oklch(0.72 0.19 50)",
              },
              {
                icon: "⚖️",
                title: "State Consumer Protection Laws",
                subtitle: "DTPA",
                body: "Deceptive Trade Practices Acts are powerful tools used by Attorneys General to fight misrepresentations regarding energy savings, tax credit eligibility, and 'free' equipment claims.",
                color: "oklch(0.65 0.18 145)",
              },
              {
                icon: "🛡",
                title: "Truth in Lending Act",
                subtitle: "TILA Rescission",
                body: "For financed solar deals, if a lender fails to provide accurate disclosures regarding hidden fees or terms, you may have up to a 3-year window to void the loan entirely.",
                color: "oklch(0.55 0.15 265)",
              },
            ].map((shield, i) => (
              <Reveal key={shield.title} delay={i * 0.1}>
                <div className="rounded-2xl p-6 border border-white/10 bg-white/4 hover:border-white/20 transition-all duration-300 h-full">
                  <div className="text-4xl mb-4">{shield.icon}</div>
                  <div className="text-xs font-mono font-bold uppercase tracking-widest mb-1" style={{ color: shield.color }}>
                    {shield.subtitle}
                  </div>
                  <h3 className="text-white font-bold text-lg mb-3">{shield.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{shield.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Expandable full infographic */}
          <Reveal delay={0.3}>
            <div className="text-center">
              <button
                onClick={() => setShowJusticeInfographic(!showJusticeInfographic)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/20 text-gray-300 hover:border-amber-500/50 hover:text-white text-sm font-semibold transition-all duration-300"
              >
                {showJusticeInfographic ? "▲ Hide" : "▼ View"} Full Infographic — Solar Contract Justice
              </button>
              {showJusticeInfographic && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-8 max-w-lg mx-auto"
                >
                  <img
                    src={INFOGRAPHIC_JUSTICE}
                    alt="Solar Contract Justice: Reclaiming Your Financial Freedom"
                    className="w-full rounded-2xl border border-white/10"
                    loading="lazy"
                  />
                </motion.div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── SECTION 3: IS YOUR COMPANY ON THIS LIST? ── */}
      <section className="py-20 lg:py-28" style={{ background: "oklch(0.10 0.012 265)" }}>
        <div className="container max-w-5xl">
          <Reveal>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest mb-5"
                style={{ background: "oklch(0.65 0.22 25 / 20%)", color: "oklch(0.80 0.18 25)", border: "1px solid oklch(0.65 0.22 25 / 50%)" }}>
                ⚠ SOLAR SCAMS EXPOSED
              </div>
              <h2 className="font-display text-white mb-3" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                IS YOUR COMPANY<br />
                <span style={{ color: "oklch(0.80 0.18 25)" }}>ON THIS LIST?</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                These companies have been named in lawsuits, state AG investigations, or have gone bankrupt — leaving homeowners stranded with non-functional systems and no warranty.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-8 mb-10">
            {/* Predatory Lenders */}
            <Reveal delay={0}>
              <div className="rounded-2xl p-7 border border-white/10 bg-white/4 h-full">
                <div className="text-xs font-mono font-bold uppercase tracking-widest mb-4" style={{ color: "oklch(0.80 0.18 25)" }}>
                  ⚖️ Predatory Lenders Facing Lawsuits
                </div>
                <p className="text-gray-400 text-sm mb-5">The "Big 5" control 80% of the market — and are hiding 20–30% "dealer fees" in contracts. Lenders are being sued.</p>
                <div className="space-y-2">
                  {["GoodLeap", "Solar Mosaic", "Sunrun", "Sunnova", "Sunlight Financial"].map((company) => (
                    <div key={company} className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-white/8 bg-white/3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "oklch(0.80 0.18 25)" }} />
                      <span className="text-white font-semibold text-sm">{company}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Bankrupt Installers */}
            <Reveal delay={0.1}>
              <div className="rounded-2xl p-7 border border-white/10 bg-white/4 h-full">
                <div className="text-xs font-mono font-bold uppercase tracking-widest mb-4" style={{ color: "oklch(0.65 0.22 25)" }}>
                  🏚 Bankrupt Installers — Homeowners Stranded
                </div>
                <p className="text-gray-400 text-sm mb-5">These companies collapsed — leaving behind non-functional systems, no warranties, and homeowners still on the hook for 25-year contracts.</p>
                <div className="space-y-2">
                  {["Pink Energy", "Titan Solar Power", "Lumio"].map((company) => (
                    <div key={company} className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-white/8 bg-white/3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "oklch(0.65 0.22 25)" }} />
                      <span className="text-white font-semibold text-sm">{company}</span>
                    </div>
                  ))}
                </div>

                {/* Shocking Fraud callout */}
                <div className="mt-5 p-4 rounded-xl border" style={{ background: "oklch(0.65 0.22 25 / 10%)", borderColor: "oklch(0.65 0.22 25 / 40%)" }}>
                  <div className="text-xs font-mono font-bold uppercase tracking-widest mb-1" style={{ color: "oklch(0.80 0.18 25)" }}>
                    🚨 Shocking Fraud: Forgeries & Impersonations
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    State Attorneys General have exposed salespeople forging signatures and impersonating customers to lock them into 25-year contracts.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          {/* FTC Holder Rule */}
          <Reveal delay={0.2}>
            <div className="rounded-2xl p-7 border mb-10" style={{ background: "oklch(0.13 0.015 265)", borderColor: "oklch(0.72 0.19 50 / 40%)" }}>
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl font-black"
                  style={{ background: "oklch(0.72 0.19 50 / 20%)", border: "1px solid oklch(0.72 0.19 50 / 50%)", color: "oklch(0.85 0.19 50)" }}>
                  FTC
                </div>
                <div>
                  <div className="text-xs font-mono font-bold uppercase tracking-widest mb-1" style={{ color: "oklch(0.85 0.19 50)" }}>
                    THE FTC HOLDER RULE PROTECTS YOU
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">Hold Lenders Responsible for Installer Fraud</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    The FTC Holder Rule allows you to hold lenders legally responsible for the fraud or failures of the solar installer — even if the installer has gone bankrupt. This is one of our most powerful legal tools.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Expandable full scams infographic */}
          <Reveal delay={0.3}>
            <div className="text-center">
              <button
                onClick={() => setShowScamsInfographic(!showScamsInfographic)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/20 text-gray-300 hover:border-amber-500/50 hover:text-white text-sm font-semibold transition-all duration-300"
              >
                {showScamsInfographic ? "▲ Hide" : "▼ View"} Full Infographic — Solar Scams Exposed
              </button>
              {showScamsInfographic && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-8 max-w-lg mx-auto"
                >
                  <img
                    src={INFOGRAPHIC_SCAMS}
                    alt="Solar Scams Exposed: Is Your Provider on the List?"
                    className="w-full rounded-2xl border border-white/10"
                    loading="lazy"
                  />
                </motion.div>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
