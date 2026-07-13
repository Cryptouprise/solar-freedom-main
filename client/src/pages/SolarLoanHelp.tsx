/*
 * SOLAR FREEDOM — "Solar Loan Help" Landing Page
 * Design: Dark Industrial Brutalism — same system as rest of site
 * Primary keyword: solar loan problems, cancel solar loan, solar loan dispute
 * Secondary: Mosaic solar loan, GoodLeap solar loan, solar loan payoff, solar loan too high
 * Target: Homeowners with solar PURCHASE loans (not leases) who want out or have disputes
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
  Phone, Scale, DollarSign, Clock, XCircle, Zap
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

// ─── // ─── Lead Form ──────────────────────────────────────────────────────
function LoanHelpForm() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [contactConsent, setContactConsent] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const { contactInfo, updateContactInfo } = useContactInfo();
  const [form, setForm] = useState({
    lender: "", problem: "",
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
        solarCompany: form.lender,
        problemType: form.problem,
        formName: "Solar Loan Help Form",
        contactConsent,
        smsConsent,
        consentVersion: CONTACT_CONSENT_VERSION,
        website,
        sourcePage: "/solar-loan-help",
        sourceUrl: window.location.href,
      });
      if (!recordLeadSubmission(result, "solar_loan_help_form", window.location.pathname)) {
        setSubmissionError("We couldn't save your request. Please try again.");
        return;
      }
    } catch {
      recordLeadSubmission(null, "solar_loan_help_form", window.location.pathname);
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
          idPrefix="solar-loan-help"
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

// ─── Lender Data ───────────────────────────────────────────────────────────────
// Company-wide allegations are intentionally excluded. Each review must use
// the consumer's own records and current primary sources.
const COUNTERPARTY_RECORDS = [
  {
    name: "Sales and Installation Records",
    scope: "Seller / installer",
    documents: ["Signed proposal and installation agreement", "Advertisements and written sales statements", "Change orders, permits, and completion records", "Production estimate and monitoring records"],
    notes: "Use the exact legal name and contact information printed on the signed documents.",
  },
  {
    name: "Financing Disclosures",
    scope: "Originator / lender",
    documents: ["Promissory note and payment schedule", "Amount financed, APR, and itemization", "Cash-price comparison and fee explanation", "Any notice of a right to cancel"],
    notes: "Which federal or state disclosure rule applies depends on the transaction and security documents.",
  },
  {
    name: "Servicing and Payoff Records",
    scope: "Current servicer",
    documents: ["Payment history and current statement", "Written payoff quote and expiration date", "Dispute and error-resolution address", "Transfer-of-servicing notices"],
    notes: "Confirm the current servicer from a recent statement rather than assuming the original party still services the account.",
  },
  {
    name: "Title, UCC, or PACE Records",
    scope: "Public record / assessment",
    documents: ["Current title report", "Recorded instrument or UCC filing", "PACE assessment and property-tax bill", "Written release, termination, or transfer requirements"],
    notes: "The effect and priority of a filing are record- and jurisdiction-specific.",
  },
];

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SolarLoanHelp() {
  useSeoMeta({
    title: "Solar Loan Document Review | Payment, Disclosure & Payoff Records",
    description: "Review solar loan terms, disclosures, payment schedules, payoff provisions, servicing records, and consumer resources before choosing a next step.",
    canonical: "https://breakyoursolarcontract.com/solar-loan-help",
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
                REVIEW YOUR<br />
                <span style={{ color: "#f97316" }}>SOLAR LOAN</span><br />
                RECORDS
              </h1>

              <p className="text-lg text-slate-300 mb-4 leading-relaxed max-w-lg">
                If a payment, payoff, disclosure, production, servicing, or title issue is unclear, start with the signed loan documents and current written account records.
              </p>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-lg">
                <strong className="text-white">Review solar loan records and possible dispute channels</strong> using the signed documents, current consumer resources, and written lender procedures.
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                {["Mosaic Loan Records", "GoodLeap Records", "PACE Filing Review", "Disclosure Questions", "Document Review"].map(tag => (
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
              SOLAR LOAN DOCUMENT REVIEW
            </h2>
            <p className="text-slate-400 text-sm mb-6">Share the agreement type and record categories that need individual review.</p>
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
                SOLAR-LOAN RECORDS TO CHECK
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">The CFPB has reported risks in some solar-specific loans. Its market findings do not establish a violation or remedy in an individual transaction.</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <FileText className="w-6 h-6" />,
                title: "Credit Disclosures",
                body: "Compare the note, amount financed, APR, finance charge, payment schedule, and itemization. Which Truth in Lending or Regulation Z requirements apply depends on the credit transaction.",
              },
              {
                icon: <DollarSign className="w-6 h-6" />,
                title: "Cash Price and Amount Financed",
                body: "The CFPB reported that some solar-specific lenders include markups or fees above the cash price. Compare the written cash price, amount financed, itemization, and fee explanation in your own records.",
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Savings and Production Inputs",
                body: "Compare written savings or production representations with the assumptions used, actual monitoring data, utility bills, and the agreement. A variance alone does not decide liability.",
              },
              {
                icon: <Scale className="w-6 h-6" />,
                title: "Payment Changes and Prepayments",
                body: "Check whether the payment schedule assumes a large prepayment or later re-amortization. The CFPB reports that some solar loans use this structure; confirm the dates and amounts in the signed note.",
              },
              {
                icon: <AlertTriangle className="w-6 h-6" />,
                title: "Rescission Notice",
                body: "Regulation Z provides rescission rights for some credit transactions secured by a principal dwelling, with exceptions and time limits. Confirm coverage from the security documents and official rule.",
              },
              {
                icon: <XCircle className="w-6 h-6" />,
                title: "Written Dispute Channels",
                body: "Request the current dispute address and preserve the complaint, delivery proof, response, account history, and any supporting sales or performance record. Do not stop payments based on this general information.",
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
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
            <a href="https://www.consumerfinance.gov/data-research/research-reports/issue-spotlight-solar-financing/" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">Official source: CFPB solar-financing spotlight</a>
            <a href="https://www.consumerfinance.gov/rules-policy/regulations/1026/23/" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">Official source: Regulation Z § 1026.23</a>
          </div>
        </div>
      </section>

      {/* ── Lender-Specific Info ── */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <Reveal>
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl md:text-5xl text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.03em" }}>
              RECORDS BY COUNTERPARTY
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Use the names shown in your documents. This page does not infer company-wide conduct from an individual account or complaint.</p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6">
          {COUNTERPARTY_RECORDS.map(({ name, documents, scope, notes }) => (
            <Reveal key={name}>
              <div className="rounded-xl p-6 h-full" style={{ background: "oklch(0.12 0.01 260)", border: "1px solid oklch(1 0 0 / 10%)" }}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-display text-lg text-white" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>{name}</h3>
                  <span className="text-xs text-slate-500 font-mono ml-3 flex-shrink-0">{scope}</span>
                </div>
                <p className="text-xs text-slate-500 mb-3 italic">{notes}</p>
                <div className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1"><FileText className="w-3 h-3" /> RECORDS TO REQUEST</div>
                <ul className="space-y-1">
                  {documents.map(document => (
                    <li key={document} className="text-xs text-slate-400 flex items-start gap-2">
                      <ArrowRight className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                      {document}
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
                DOCUMENTS AND QUESTIONS
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">Use these categories to organize the records and questions that require individual review; none promises a remedy or result.</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Origination Records", desc: "Compare the signed note, disclosures, itemization, sales materials, and communications. Whether a violation or remedy exists requires qualified review.", icon: <XCircle className="w-5 h-5" />, best: "Disclosure and sales questions" },
              { title: "Written Payoff Terms", desc: "Request a current payoff, itemized balance, hardship or dispute procedures, and any sale-related requirements directly from the listed lender or servicer.", icon: <DollarSign className="w-5 h-5" />, best: "Home sale or payment questions" },
              { title: "Rate and Fee Terms", desc: "Review the stated APR, dealer or finance charges, payment schedule, and any written rate representation before assuming a modification is available.", icon: <Scale className="w-5 h-5" />, best: "APR and fee questions" },
              { title: "Recorded Filings", desc: "Obtain a current title report and copies of any assessment, deed of trust, or UCC filing, then verify the holder's written release requirements.", icon: <CheckCircle className="w-5 h-5" />, best: "Title and refinance questions" },
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
              ORGANIZE YOUR LOAN RECORDS
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
              { href: "/selling-house-with-solar", title: "Selling House With Solar Loan", desc: "Review payoff, transfer, title, and closing requirements." },
              { href: "/solar-lien-removal", title: "Solar Lien Record Review", desc: "Review PACE assessments, title records, and UCC filings." },
              { href: "/solar-exit-options", title: "Solar Exit Options", desc: "Compare agreement types and written terms to request." },
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
              START WITH THE<br />SIGNED LOAN RECORDS
            </h2>
            <p className="text-slate-400 mb-8 text-lg">Gather the signed loan documents, disclosures, payment history, payoff statement, servicing correspondence, and related sales materials for an individual review.</p>
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
            <Link href="/solar-lien-removal" className="hover:text-slate-400 transition-colors">Lien Removal</Link>
            <Link href="/blog" className="hover:text-slate-400 transition-colors">Blog</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
