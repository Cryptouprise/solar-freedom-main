/**
 * SUNRUN DEDICATED LANDING PAGE — /sunrun
 * Conversion-focused page targeting "sunrun solar contract cancel" intent.
 * Distinct from /cancel-sunrun-solar-contract (complaint/data page).
 * Design: Dark Industrial Brutalism — matches site-wide design system.
 */

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import BookingModal from "@/components/BookingModal";
import { ContactConsentFields } from "@/components/ContactConsentFields";
import { useContactInfo } from "@/hooks/useContactInfo";
import { trpc } from "@/lib/trpc";
import { recordLeadSubmission, trackPhoneClick } from "@/lib/analytics";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { CONTACT_CONSENT_VERSION } from "@shared/leadConsent";

// ─── Scroll Reveal ─────────────────────────────────────────────────────────────
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

// ─── Sunrun Contract Clause Data ───────────────────────────────────────────────
const SUNRUN_CLAUSES = [
  {
    clause: "Payment Schedule",
    what: "Locate every payment amount, annual adjustment, fee, and end-of-term provision in the agreement you signed.",
    impact: "Calculate the payment schedule from your own documents rather than relying on a general percentage or example.",
    legal: "Whether a disclosure rule applies requires review of the transaction, financing documents, and current law.",
  },
  {
    clause: "Term and Renewal",
    what: "Identify the initial term, renewal language, early-termination provisions, and any purchase option.",
    impact: "Compare those terms with your expected ownership, roof, refinancing, and sale timeline.",
    legal: "A contract term does not establish a remedy by itself; review performance and dispute provisions as written.",
  },
  {
    clause: "Transfer and Buyout",
    what: "Review transfer eligibility, buyer approval, payoff or purchase terms, fees, and required notices.",
    impact: "Ask the buyer's lender, title professional, and contract counterparty for current written requirements.",
    legal: "Do not characterize a filing or transfer term as unlawful without a document-specific legal review.",
  },
  {
    clause: "Performance Terms",
    what: "Find the production methodology, exclusions, notice requirements, cure process, and remedy stated in the agreement.",
    impact: "Compare that language with utility bills, monitoring data, maintenance records, and written representations.",
    legal: "A performance difference does not establish breach or fraud without the contract, facts, and applicable law.",
  },
];

// ─── Mini Contact Form ─────────────────────────────────────────────────────────
function SunrunContactForm() {
  const { updateContactInfo } = useContactInfo();
  const [showBooking, setShowBooking] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    issue: "",
    contactConsent: false,
    smsConsent: false,
    website: "",
  });

  const submitLead = trpc.leads.submit.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contactConsent) {
      setSubmissionError("Please authorize contact about this request before submitting.");
      return;
    }
    setSubmissionError("");
    try {
      const result = await submitLead.mutateAsync({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email,
        solarCompany: "Sunrun",
        problemType: form.issue,
        sourcePage: window.location.pathname,
        sourceUrl: window.location.href,
        formName: "Sunrun Dedicated Page Form",
        contactConsent: form.contactConsent,
        smsConsent: form.smsConsent,
        consentVersion: CONTACT_CONSENT_VERSION,
        website: form.website,
      });
      if (!recordLeadSubmission(result, "sunrun_dedicated_form", window.location.pathname)) {
        setSubmissionError("We couldn't save your request. Please try again.");
        return;
      }
      updateContactInfo({ firstName: form.firstName, lastName: form.lastName, phone: form.phone, email: form.email });
      setSubmitted(true);
      setTimeout(() => setShowBooking(true), 1200);
    } catch {
      recordLeadSubmission(null, "sunrun_dedicated_form", window.location.pathname);
      setSubmissionError("We couldn't save your request. Please try again.");
    }
  };

  const update = (key: string, val: string | boolean) => setForm(f => ({ ...f, [key]: val }));

  if (submitted) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-display text-3xl text-white mb-2">CASE REVIEW REQUESTED</h3>
        <p className="text-gray-300 mb-1">Your information was submitted for review. Availability and response time require individual confirmation.</p>
        <p className="text-gray-500 text-sm font-mono">Your calendar is opening now...</p>
        <BookingModal isOpen={showBooking} onClose={() => setShowBooking(false)} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1.5">First Name *</label>
          <input
            type="text" value={form.firstName} onChange={e => update("firstName", e.target.value)}
            placeholder="John" required
            className="w-full p-3.5 rounded border border-white/10 bg-white/5 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1.5">Last Name *</label>
          <input
            type="text" value={form.lastName} onChange={e => update("lastName", e.target.value)}
            placeholder="Smith" required
            className="w-full p-3.5 rounded border border-white/10 bg-white/5 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none transition-colors"
          />
        </div>
      </div>
      <div>
        <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1.5">Phone *</label>
        <input
          type="tel" value={form.phone} onChange={e => update("phone", e.target.value)}
          placeholder="(904) 000-0000" required
          className="w-full p-3.5 rounded border border-white/10 bg-white/5 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none transition-colors"
        />
      </div>
      <div>
        <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1.5">Email *</label>
        <input
          type="email" value={form.email} onChange={e => update("email", e.target.value)}
          placeholder="john@example.com" required
          className="w-full p-3.5 rounded border border-white/10 bg-white/5 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none transition-colors"
        />
      </div>
      <div>
        <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1.5">Main Issue with Sunrun</label>
        <select
          value={form.issue} onChange={e => update("issue", e.target.value)}
          className="w-full p-3.5 rounded border border-white/10 bg-zinc-900 text-gray-200 focus:border-amber-500 focus:outline-none transition-colors"
        >
          <option value="">Select your situation...</option>
          <option value="High escalating payments">High / escalating monthly payments</option>
          <option value="System underperforms">System doesn't produce what was promised</option>
          <option value="Can't sell home">Can't sell my home — buyer won't assume lease</option>
          <option value="Misleading sales rep">Was misled by the sales rep</option>
          <option value="Roof damage">Roof damage / leaks from installation</option>
          <option value="Company unresponsive">Can't get Sunrun to respond / fix issues</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <ContactConsentFields
        idPrefix="sunrun-document-review"
        contactConsent={form.contactConsent}
        smsConsent={form.smsConsent}
        website={form.website}
        onContactConsentChange={(checked) => update("contactConsent", checked)}
        onSmsConsentChange={(checked) => update("smsConsent", checked)}
        onWebsiteChange={(value) => update("website", value)}
      />
      <button
        type="submit"
        disabled={!form.firstName || !form.lastName || !form.phone || !form.email || !form.contactConsent || submitLead.isPending}
        className="w-full py-5 rounded text-lg font-black uppercase tracking-widest transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.60 0.21 40))", color: "#000" }}
      >
        {submitLead.isPending ? "SUBMITTING..." : "REQUEST MY SUNRUN DOCUMENT REVIEW →"}
      </button>
      {submissionError && <p role="alert" className="text-red-400 text-sm text-center">{submissionError}</p>}
    </form>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SunrunPage() {
  const { phoneDisplay, phoneHref, phoneDigits } = useSiteConfig();
  useSeoMeta({
    title: "Sunrun Solar Agreement Review Guide | Solar Freedom",
    description: "Review Sunrun agreement terms, escalator provisions, complaint resources, and records to gather before requesting an individual case review.",
    canonical: "https://breakyoursolarcontract.com/sunrun",
    noindex: true,
  });

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.08 0.01 265)", color: "#F8FAFC" }}>

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/8" style={{ background: "oklch(0.09 0.01 265 / 0.95)", backdropFilter: "blur(12px)" }}>
        <div className="container flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.60 0.21 40))" }}>
              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <span className="font-black text-white text-lg tracking-tight" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>SOLAR FREEDOM</span>
          </a>
          <div className="flex items-center gap-4">
            <a href={phoneHref} onClick={() => trackPhoneClick("sunrun_nav_phone", phoneDigits)} className="hidden md:flex items-center gap-2 text-amber-400 font-bold text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              {phoneDisplay}
            </a>
            <a href="#case-review" className="px-4 py-2 rounded font-black text-sm uppercase tracking-wider transition-all" style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.60 0.21 40))", color: "#000" }}>
              Document Review
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.72 0.19 50 / 0.3), transparent)" }} />
        <div className="container relative">
          <div className="max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Sunrun Agreement Research
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
              className="font-black uppercase leading-none mb-6"
              style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(3rem, 8vw, 6rem)" }}
            >
              TRAPPED IN A<br />
              <span style={{ color: "oklch(0.72 0.19 50)" }}>SUNRUN</span><br />
              CONTRACT?
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
              className="text-xl text-gray-300 leading-relaxed mb-8 max-w-2xl"
            >
              Review the term, escalator, transfer, performance, financing, and dispute provisions in the Sunrun documents you actually signed. Options depend on the agreement, facts, parties, and jurisdiction.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <a
                href="#case-review"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded font-black text-lg uppercase tracking-wider transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.60 0.21 40))", color: "#000" }}
              >
                Request Document Review →
              </a>
              <a
                href="/solar-contract-help"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded font-bold text-base uppercase tracking-wider border border-white/20 text-gray-300 hover:border-amber-500/50 hover:text-amber-400 transition-all"
              >
                Review the Document Checklist
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="py-8 border-y border-white/8" style={{ background: "oklch(0.11 0.01 265)" }}>
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { stat: "1", label: "Signed Agreement" },
              { stat: "2", label: "Financing + Disclosures" },
              { stat: "3", label: "Bills + Performance" },
              { stat: "4", label: "Communications" },
            ].map(({ stat, label }) => (
              <div key={label}>
                <div className="font-black text-3xl mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "oklch(0.72 0.19 50)" }}>{stat}</div>
                <div className="text-gray-400 text-xs font-mono uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTRACT CLAUSE BREAKDOWN ── */}
      <section className="py-20">
        <div className="container">
          <Reveal>
            <div className="text-center mb-14">
              <div className="text-amber-500 font-mono text-xs uppercase tracking-widest mb-3">— What They Didn't Tell You</div>
              <h2 className="font-black text-white uppercase leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                THE SUNRUN CONTRACT CLAUSES<br />THAT TRAP HOMEOWNERS
              </h2>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-6">
            {SUNRUN_CLAUSES.map((item, i) => (
              <Reveal key={item.clause} delay={i * 0.1}>
                <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6 h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "oklch(0.72 0.19 50 / 0.15)", border: "1px solid oklch(0.72 0.19 50 / 0.3)" }}>
                      <svg className="w-5 h-5" style={{ color: "oklch(0.72 0.19 50)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="font-black text-xl text-white" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{item.clause}</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-400 font-mono text-xs uppercase tracking-wider">What it means: </span>
                      <span className="text-gray-300">{item.what}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-mono text-xs uppercase tracking-wider">Real impact: </span>
                      <span className="text-gray-300">{item.impact}</span>
                    </div>
                    <div className="pt-2 border-t border-white/8">
                      <span className="text-amber-400 font-mono text-xs uppercase tracking-wider">Legal angle: </span>
                      <span className="text-gray-300">{item.legal}</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CANCELLATION GROUNDS ── */}
      <section className="py-20" style={{ background: "oklch(0.10 0.01 265)" }}>
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <div>
                <div className="text-amber-500 font-mono text-xs uppercase tracking-widest mb-3">— Legal Grounds</div>
                <h2 className="font-black text-white uppercase leading-none mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                  QUESTIONS TO REVIEW IN<br />SUNRUN DOCUMENTS
                </h2>
                <p className="text-gray-400 leading-relaxed mb-8">
                  No general page can determine whether a Sunrun agreement is enforceable or whether a remedy is available. These are questions to investigate using your documents and current law:
                </p>
                <div className="space-y-4">
                  {[
                    { title: "Financing Disclosures", desc: "Compare the signed financing disclosures, payment schedule, total cost, fees, and any written sales materials." },
                    { title: "Cooling-Off Rule", desc: "Check the transaction location, dates, notices, scope, and exemptions against the current federal rule." },
                    { title: "Written Representations", desc: "Preserve proposals, messages, recordings, and other evidence of what was represented before signing." },
                    { title: "Performance Records", desc: "Compare contractual performance terms with bills, monitoring data, maintenance history, and written notices." },
                    { title: "Transfer Requirements", desc: "Obtain current written transfer, buyout, buyer-approval, title, and lender requirements before a home sale." },
                  ].map((item, i) => (
                    <div key={item.title} className="flex gap-4">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "oklch(0.72 0.19 50 / 0.2)", border: "1px solid oklch(0.72 0.19 50 / 0.4)" }}>
                        <span className="text-amber-400 text-xs font-black">{i + 1}</span>
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm mb-0.5">{item.title}</div>
                        <div className="text-gray-400 text-sm leading-relaxed">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="rounded-2xl border border-amber-500/30 p-8" style={{ background: "oklch(0.12 0.015 265)" }}>
                <div className="text-amber-500 font-mono text-xs uppercase tracking-widest mb-2">— Document workflow</div>
                <h3 className="font-black text-white text-2xl mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>WHAT HAPPENS AFTER YOU SUBMIT</h3>
                <div className="space-y-5">
                  {[
                    { step: "01", title: "Document Submission", desc: "Submit the signed agreement and supporting records for an individual review. No response time is promised." },
                    { step: "02", title: "Contract Analysis", desc: "Review the agreement, financing disclosures, escalator provisions, performance terms, and related records." },
                    { step: "03", title: "Questions and Possible Paths", desc: "Identify provisions and questions that may warrant company, lender, regulator, or independent legal follow-up." },
                    { step: "04", title: "Next Step", desc: "Choose a documented next step based on the agreement, facts, parties, current law, and any written engagement terms." },
                  ].map(item => (
                    <div key={item.step} className="flex gap-4">
                      <div className="font-black text-2xl flex-shrink-0 w-10" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "oklch(0.72 0.19 50)" }}>{item.step}</div>
                      <div>
                        <div className="text-white font-bold text-sm mb-0.5">{item.title}</div>
                        <div className="text-gray-400 text-sm leading-relaxed">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CASE REVIEW FORM ── */}
      <section id="case-review" className="py-24" style={{ background: "oklch(0.10 0.01 265)" }}>
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <Reveal>
              <div className="text-center mb-10">
                <div className="text-amber-500 font-mono text-xs uppercase tracking-widest mb-3">— Individual Document Review</div>
                <h2 className="font-black text-white uppercase leading-none mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                  REQUEST A SUNRUN<br />DOCUMENT REVIEW
                </h2>
                <p className="text-gray-400">Submit the agreement and supporting records. No representation, legal conclusion, result, or response time is promised.</p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="rounded-2xl border border-amber-500/30 p-8" style={{ background: "oklch(0.12 0.015 265)", boxShadow: "0 0 40px oklch(0.72 0.19 50 / 0.08)" }}>
                <SunrunContactForm />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── RELATED LINKS ── */}
      <section className="py-16 border-t border-white/8">
        <div className="container">
          <Reveal>
            <div className="text-center mb-10">
              <h3 className="font-black text-white text-2xl uppercase" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>MORE SUNRUN RESOURCES</h3>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { href: "/solar-contract-help", label: "Solar Contract Help", desc: "Records and questions to review" },
              { href: "/solar-loan-help", label: "Solar Loan Help", desc: "Financing documents and dispute records" },
              { href: "/solar-companies", label: "Company Research Hub", desc: "Source-review status for company pages" },
            ].map(link => (
              <a key={link.href} href={link.href} className="block rounded-xl border border-white/10 hover:border-amber-500/40 bg-zinc-900/50 p-5 transition-all group">
                <div className="text-white font-bold text-sm group-hover:text-amber-400 transition-colors mb-1">{link.label}</div>
                <div className="text-gray-500 text-xs">{link.desc}</div>
                <div className="text-amber-500 text-xs font-bold mt-3">Read →</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/8 py-10" style={{ background: "oklch(0.09 0.01 265)" }}>
        <div className="container text-center">
          <a href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.60 0.21 40))" }}>
              <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <span className="font-black text-white text-sm" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>SOLAR FREEDOM</span>
          </a>
          <p className="text-gray-600 text-xs max-w-lg mx-auto">
            Solar Freedom provides educational information and an intake pathway for individual document review. No attorney relationship, representation, result, or response time is created by this page.
          </p>
          <div className="flex justify-center gap-6 mt-4 text-xs text-gray-600">
            <a href="/" className="hover:text-amber-400 transition-colors">Home</a>
            <a href="/blog" className="hover:text-amber-400 transition-colors">Blog</a>
            <a href="/solar-contract-laws" className="hover:text-amber-400 transition-colors">State Laws</a>
            <a href="/solar-companies" className="hover:text-amber-400 transition-colors">Company Research</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
