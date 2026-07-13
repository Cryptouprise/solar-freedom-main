/*
 * SOLAR FREEDOM — "Solar Lien Removal" Landing Page
 * Design: Dark Industrial Brutalism — same system as rest of site
 * Primary keyword: solar lien removal, remove solar lien from property
 * Secondary: PACE loan lien removal, solar lien on house, solar panel lien
 * Target: Homeowners with PACE loans or secured solar loans with liens on title
 */

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "wouter";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { SchemaInjector } from "@/components/SchemaInjector";
import DoIQualifyQuiz from "@/components/DoIQualifyQuiz";
import BookingModal from "@/components/BookingModal";
import { ContactConsentFields } from "@/components/ContactConsentFields";
import { useContactInfo } from "@/hooks/useContactInfo";
import {
  AlertTriangle, CheckCircle, FileText, ArrowRight,
  Phone, Scale, XCircle, Clock, Home, Gavel
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { recordLeadSubmission } from "@/lib/analytics";
import { CONTACT_CONSENT_VERSION } from "@shared/leadConsent";

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

// // ─── Lead Form ──────────────────────────────────────────────────────
function LienForm() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [contactConsent, setContactConsent] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const { contactInfo, updateContactInfo } = useContactInfo();
  const [form, setForm] = useState({
    lienType: "", goal: "",
    name: contactInfo.fullName || "",
    phone: contactInfo.phone || "",
    email: contactInfo.email || ""
  });

  useEffect(() => {
    if (contactInfo.fullName && !form.name) setForm(f => ({ ...f, name: contactInfo.fullName }));
    if (contactInfo.phone && !form.phone) setForm(f => ({ ...f, phone: contactInfo.phone }));
    if (contactInfo.email && !form.email) setForm(f => ({ ...f, email: contactInfo.email }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const submitLead = trpc.leads.submit.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactConsent) {
      setSubmissionError("Please authorize contact about this request before submitting.");
      return;
    }
    const firstName = form.name.split(" ")[0] || form.name;
    const lastName = form.name.split(" ").slice(1).join(" ") || "";
    setSubmissionError("");
    try {
      // Persist to DB via tRPC
      const result = await submitLead.mutateAsync({
        firstName,
        lastName,
        phone: form.phone,
        email: form.email,
        problemType: form.lienType,
        intent: form.goal,
        formName: "Solar Lien Removal Form",
        contactConsent,
        smsConsent,
        consentVersion: CONTACT_CONSENT_VERSION,
        website,
        sourcePage: "/solar-lien-removal",
        sourceUrl: window.location.href,
      });
      if (!recordLeadSubmission(result, "solar_lien_removal_form", window.location.pathname)) {
        setSubmissionError("We couldn't save your request. Please try again.");
        return;
      }
    } catch {
      recordLeadSubmission(null, "solar_lien_removal_form", window.location.pathname);
      setSubmissionError("We couldn't save your request. Please try again.");
      return;
    }
    const fn = form.name.split(" ")[0] || form.name;
    const ln = form.name.split(" ").slice(1).join(" ") || "";
    updateContactInfo({ firstName: fn, lastName: ln, phone: form.phone, email: form.email });
    setSubmitted(true);
    setTimeout(() => setBookingOpen(true), 1200);
  };

  if (submitted) {
    return (
      <>
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "oklch(0.72 0.19 50 / 20%)", border: "2px solid #f97316" }}>
            <CheckCircle className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="font-display text-2xl text-white mb-2">REQUEST RECEIVED</h3>
          <p className="text-slate-400 mb-4">Your information was submitted for review. Response timing and availability vary.</p>
          <a href="tel:9049214971" className="inline-flex items-center gap-2 text-amber-400 font-semibold hover:text-amber-300 transition-colors">
            <Phone className="w-4 h-4" /> Call Now: (904) 921-4971
          </a>
        </div>
        <BookingModal
          isOpen={bookingOpen}
          onClose={() => setBookingOpen(false)}
          firstName={form.name.split(" ")[0] || form.name}
        />
      </>
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
      <h3 className="font-display text-xl text-white mb-5">Where should we send information about your review?</h3>
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
        <ContactConsentFields
          idPrefix="solar-lien-removal"
          contactConsent={contactConsent}
          smsConsent={smsConsent}
          website={website}
          onContactConsentChange={setContactConsent}
          onSmsConsentChange={setSmsConsent}
          onWebsiteChange={setWebsite}
        />
        <button type="submit" disabled={submitLead.isPending || !contactConsent} className="w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-50"
          style={{ background: "#f97316", color: "#0D0F14" }}>
          Request My Document Review →
        </button>
        {submissionError && <p role="alert" className="text-red-400 text-sm text-center">{submissionError}</p>}
        <p className="text-center text-xs text-slate-500">No representation, result, or response time is promised.</p>
      </div>
    </form>
  );
}

// ─── Schema ────────────────────────────────────────────────────────────────────
// FAQ schema remains disabled until each legal answer has a primary source and
// an editorial review record.
const PAGE_SCHEMAS: object[] = [];

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SolarLienRemoval() {
  useSeoMeta({
    title: "Solar Lien Record Review | PACE Assessments & UCC Filings",
    description: "Review PACE assessments, deeds of trust, UCC filings, payoff statements, title records, and release requirements before choosing a next step.",
    canonical: "https://breakyoursolarcontract.com/solar-lien-removal",
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
                <span style={{ color: "#f97316" }}>RECORD</span><br />
                REVIEW
              </h1>

              <p className="text-lg text-slate-300 mb-4 leading-relaxed max-w-lg">
                If a title report, property-tax bill, lender, or closing party identifies a solar-related assessment, lien, security instrument, or UCC filing, obtain the exact record before assuming its effect or how it can be resolved.
              </p>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-lg">
                <strong className="text-white">Review the recorded filing and release requirements</strong> before considering payoff, negotiation, a dispute, or another title-related step.
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
                  Document Review <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </div>

          {/* Form Card */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            id="get-help" className="rounded-2xl p-8" style={{ background: "oklch(0.12 0.01 260)", border: "1px solid oklch(1 0 0 / 12%)" }}>
            <h2 className="font-display text-2xl text-white mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>
              DOCUMENT REVIEW
            </h2>
            <p className="text-slate-400 text-sm mb-6">Share the recorded instrument and agreement details for an individual document review.</p>
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
                TYPES OF RECORDS TO IDENTIFY
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">Labels are not interchangeable. Read the recorded instrument, agreement, title report, and written holder requirements before choosing a next step.</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                type: "PACE / HERO Loans",
                priority: "VERIFY ASSESSMENT",
                priorityColor: "#f87171",
                description: "The CFPB explains that residential PACE financing is repaid through a property-tax assessment. Delinquent PACE amounts can affect tax-sale priority, and an outstanding PACE assessment may affect sale or refinance options.",
                howRemoved: ["Obtain the current property-tax assessment", "Request the written payoff and expiration date", "Ask the closing or mortgage professional for its requirements", "Verify any paid assessment or release in the public record"],
                programs: ["Property-tax bill", "PACE agreement", "Title report", "Written payoff"],
              },
              {
                type: "Solar Deed of Trust / Mortgage",
                priority: "VERIFY RECORD",
                priorityColor: "#fb923c",
                description: "If the title report shows a deed of trust, mortgage, or other real-property security instrument connected to the transaction, use the recorded document to identify the beneficiary, property, priority language, and release process.",
                howRemoved: ["Obtain the complete recorded instrument", "Confirm the current holder or servicer", "Request written payoff and release requirements", "Have the title professional verify the recorded release"],
                programs: ["Recorded instrument", "Financing agreement", "Assignment history", "Release requirements"],
              },
              {
                type: "UCC Fixture Filing",
                priority: "VERIFY FILING",
                priorityColor: "#f97316",
                description: "The CFPB reports that lenders commonly file UCC liens on the solar panels themselves and that treatment can vary by jurisdiction. Obtain the filing and ask the closing or title professional how it affects the transaction.",
                howRemoved: ["Obtain the exact UCC record and filing office", "Identify the secured party and collateral description", "Request written termination or subordination requirements", "Verify any termination in the correct filing system"],
                programs: ["UCC financing statement", "Collateral description", "Secured-party record", "Termination requirements"],
              },
              {
                type: "Mechanics / Contractor Lien",
                priority: "STATE-SPECIFIC",
                priorityColor: "#a78bfa",
                description: "A mechanic's or contractor lien is governed by state law and the recorded claim. Obtain the filing, work records, notices, dates, claimant identity, and any release demand before evaluating it.",
                howRemoved: ["Obtain the complete recorded claim", "Collect invoices, notices, and work records", "Request the claimant's written basis and release terms", "Ask qualified local counsel or a title professional about the applicable process"],
                programs: ["Recorded claim", "Project invoices", "Required notices", "Release demand"],
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
                    <div className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> RECORD CHECKLIST</div>
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
                    <div className="text-xs font-semibold text-slate-500 mb-2">SOURCE RECORDS</div>
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
              LIEN-REVIEW WORKFLOW
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Use the recorded documents, financing agreement, and title report to identify the lien type and the questions that require individual review.</p>
          </div>
        </Reveal>

        <div className="relative">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{ background: "oklch(1 0 0 / 10%)" }} />
          <div className="space-y-8">
            {[
              { step: "01", side: "left", title: "Collect the Records", body: "Obtain the current title report, recorded instrument, signed financing agreement, payment history, and any payoff or release correspondence.", icon: <FileText className="w-5 h-5" /> },
              { step: "02", side: "right", title: "Identify the Filing", body: "Determine whether the record is a PACE assessment, deed of trust, UCC fixture filing, mechanic's lien, or another instrument. Different documents require different questions.", icon: <Scale className="w-5 h-5" /> },
              { step: "03", side: "left", title: "Request Written Terms", body: "Ask the listed holder or servicer for a written payoff, release requirements, dispute address, and the specific document it will record if the obligation is resolved.", icon: <Gavel className="w-5 h-5" /> },
              { step: "04", side: "right", title: "Verify the Public Record", body: "If a release or termination is issued, confirm with the title company or county recorder that it was accepted and appears correctly in the public record.", icon: <CheckCircle className="w-5 h-5" /> },
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
              <p className="text-slate-400 max-w-xl mx-auto">These observations are reasons to obtain the underlying record; none establishes the type, validity, priority, or remedy by itself.</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { sign: "Your property tax bill increased after solar installation", type: "PACE Lien" },
              { sign: "A title search shows an unknown lien or encumbrance", type: "Any Type" },
              { sign: "Your mortgage lender is refusing to fund a refinance", type: "PACE / Deed" },
              { sign: "A buyer's lender flagged your title during escrow", type: "Any Type" },
              { sign: "You received a notice from a solar company about a UCC filing", type: "UCC Filing" },
              { sign: "You received a recorded contractor- or mechanic-lien notice", type: "State-specific record" },
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
              a: "The process depends on the recorded instrument and the underlying agreement. Start with a current title report, a copy of the filing, and written payoff or release requirements from the listed holder. A qualified title or legal professional can assess the individual record."
            },
            {
              q: "What is a PACE loan and why does it create a lien?",
              a: "The CFPB explains that PACE financing funds home improvements and is repaid through an assessment collected with property taxes. Delinquent PACE amounts may be paid through a tax sale before a mortgage lender receives proceeds, and an outstanding assessment may affect sale or refinance options. Confirm the exact assessment and current lender requirements."
            },
            {
              q: "Can I dispute a solar lien I didn't agree to?",
              a: "A filing you do not recognize should be investigated, not ignored. Request the recorded document and origination records, preserve communications, and ask a qualified professional which dispute or correction process applies. No defect or remedy can be determined from general information alone."
            },
            {
              q: "How long does solar lien removal take?",
              a: "There is no universal timeline. Timing depends on the instrument, holder, payoff or dispute process, recorder, title company, facts, and whether a sale or refinance is pending. Get every deadline and requirement in writing."
            },
            {
              q: "Does removing a solar lien mean I lose my solar panels?",
              a: "A lien release, debt obligation, and equipment ownership are separate questions. Review the financing agreement, equipment-ownership terms, collateral description, recorded release, and any transfer document before drawing a conclusion."
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
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
          <a href="https://www.consumerfinance.gov/ask-cfpb/i-am-considering-a-pace-loan-for-home-improvements-what-should-i-keep-in-mind-before-signing-up-en-2128/" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">Official source: CFPB PACE guidance</a>
          <a href="https://www.consumerfinance.gov/data-research/research-reports/issue-spotlight-solar-financing/" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">Official source: CFPB solar-financing spotlight</a>
        </div>
      </section>

      {/* ── Quiz ── */}
      <section className="py-20" style={{ background: "oklch(0.10 0.01 260)", borderTop: "1px solid oklch(1 0 0 / 8%)" }}>
        <div className="max-w-4xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-10">
              <h2 className="font-display text-4xl md:text-5xl text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.03em" }}>
                ORGANIZE YOUR FILING RECORDS
              </h2>
              <p className="text-slate-400">Answer five questions to organize the filing type, agreement, and records for review.</p>
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
            { href: "/selling-house-with-solar", title: "Selling House With Solar Loan", desc: "Review payoff, transfer, title, and closing requirements." },
            { href: "/solar-exit-options", title: "Solar Exit Options", desc: "Compare agreement types and the records to review." },
            { href: "/solar-contract-help", title: "Solar Contract Help", desc: "Organize contract, disclosure, and transaction questions." },
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
              START WITH THE<br />RECORDED DOCUMENT
            </h2>
            <p className="text-slate-400 mb-8 text-lg">Obtain the recorded filing, current payoff statement, secured-party details, and written release requirements before choosing a title-related next step.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:9049214971" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-bold text-base transition-all hover:opacity-90"
                style={{ background: "#f97316", color: "#0D0F14" }}>
                <Phone className="w-5 h-5" /> Call (904) 921-4971
              </a>
              <a href="#get-help" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-semibold text-base transition-all hover:border-amber-500 hover:text-amber-400"
                style={{ border: "1px solid oklch(1 0 0 / 25%)", color: "#F8FAFC" }}>
                Request Document Review <ArrowRight className="w-5 h-5" />
              </a>
            </div>
            <div className="flex items-center justify-center gap-2 mt-6 text-sm text-slate-500">
              <Clock className="w-4 h-4" />
              <span>Availability and response time require individual confirmation</span>
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
