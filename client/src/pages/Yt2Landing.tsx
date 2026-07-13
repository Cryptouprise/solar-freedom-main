/**
 * SOLAR FREEDOM — YouTube Landing Page
 * Tight, no-nav, no-footer conversion page for YouTube traffic.
 * Sections: Quiz Hero → Stats Bar → Counter Playbook → 4 Steps → We Break Them →
 *           Educational Videos → FAQ → State Resources
 */

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useContactInfo } from "@/hooks/useContactInfo";
import BookingModal from "@/components/BookingModal";
import { trackPhoneClick, trackCTAClick, recordLeadSubmission } from "@/lib/analytics";
import { trpc } from "@/lib/trpc";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import OutcomesSection from "@/components/OutcomesSection";
import { ContactConsentFields } from "@/components/ContactConsentFields";
import { CONTACT_CONSENT_VERSION } from "@shared/leadConsent";
import PrivacyVideoEmbed from "@/components/PrivacyVideoEmbed";

// ─── CDN Assets ───────────────────────────────────────────────────────────────
const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663287718525/46qo2AwgwNWJ4wJwr8EnH8/hero-bg-FmKRyibRwC4JGhU5naV2R2.webp";
const FRUSTRATED_HOMEOWNER = "https://d2xsxph8kpxj0f.cloudfront.net/310519663287718525/46qo2AwgwNWJ4wJwr8EnH8/frustrated-homeowner-PQnVnTRrmQXJQnmBJ8whqw.webp";
const FREEDOM_VISUAL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663287718525/46qo2AwgwNWJ4wJwr8EnH8/freedom-visual-FjotebYoCq2THFJ9FesUTU.webp";

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 60, damping: 20 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) motionVal.set(target);
  }, [inView, target, motionVal]);

  useEffect(() => {
    return spring.on("change", (v) => setDisplay(Math.round(v)));
  }, [spring]);

  return <span ref={ref}>{prefix}{display.toLocaleString()}{suffix}</span>;
}

// ─── Scroll Reveal ────────────────────────────────────────────────────────────
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

// ─── Multi-Step Form ──────────────────────────────────────────────────────────
const SOLAR_COMPANIES = [
  "Sunrun", "SunPower", "Tesla Solar", "Vivint Solar", "ADT Solar",
  "Freedom Forever", "Sunnova", "GoodLeap", "Mosaic", "Loanpal",
  "Green Sky", "Service Finance", "Other"
];
const ISSUES = [
  "Monthly payment too high",
  "System doesn't work / underperforms",
  "Was misled during the sale",
  "Can't sell my home",
  "Company went out of business",
  "Hidden fees I wasn't told about",
  "Other"
];
const PAYMENT_RANGES = ["Under $100", "$100–$150", "$150–$200", "$200–$250", "Over $250"];

function MultiStepForm({ onScrollToTop }: { onScrollToTop: () => void }) {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [fallbackName, setFallbackName] = useState("");
  const [fallbackPhone, setFallbackPhone] = useState("");
  const [fallbackContactConsent, setFallbackContactConsent] = useState(false);
  const [fallbackSmsConsent, setFallbackSmsConsent] = useState(false);
  const [fallbackWebsite, setFallbackWebsite] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const { contactInfo, updateContactInfo } = useContactInfo();
  const [form, setForm] = useState(() => ({
    paying: "",
    issue: "",
    company: "",
    payment: "",
    intent: "",
    firstName: contactInfo.firstName,
    lastName: contactInfo.lastName,
    phone: contactInfo.phone,
    email: contactInfo.email,
    contactConsent: false,
    smsConsent: false,
    website: "",
  }));

  const totalSteps = 5;
  const submitLead = trpc.leads.submit.useMutation();
  const quickCallback = trpc.leads.quickCallback.useMutation();

  const update = (key: string, val: string | boolean) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (["firstName", "lastName", "phone", "email"].includes(key)) {
      updateContactInfo({ [key]: val as string });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contactConsent) return;
    setSubmissionError("");
    try {
      const result = await submitLead.mutateAsync({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        solarCompany: form.company,
        problemType: form.issue,
        contractType: form.payment,
        monthlyPayment: form.paying,
        intent: form.intent,
        formName: "YouTube Landing Page B Form",
        sourcePage: "/yt2",
        sourceUrl: window.location.href,
        contactConsent: form.contactConsent,
        smsConsent: form.smsConsent,
        consentVersion: CONTACT_CONSENT_VERSION,
        website: form.website,
      });
      if (!recordLeadSubmission(result, "yt2_landing_form", "/yt2")) {
        setSubmissionError("We couldn't save your request. Please try again.");
        return;
      }
    } catch {
      recordLeadSubmission(null, "yt2_landing_form", "/yt2");
      setSubmissionError("We couldn't save your request. Please try again.");
      return;
    }
    setSubmitted(true);
    setTimeout(() => setShowBooking(true), 1200);
  };

  const handleQuickCallback = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!fallbackPhone.trim() || !fallbackContactConsent) return;
    setSubmissionError("");
    try {
      const result = await quickCallback.mutateAsync({
        name: fallbackName.trim() || undefined,
        phone: fallbackPhone.trim(),
        formName: "yt2_landing_callback",
        sourcePage: "/yt2",
        sourceUrl: window.location.href,
        contactConsent: fallbackContactConsent,
        smsConsent: fallbackSmsConsent,
        consentVersion: CONTACT_CONSENT_VERSION,
        website: fallbackWebsite,
      });
      if (!recordLeadSubmission(result, "yt2_landing_callback", "/yt2")) {
        setSubmissionError("We couldn't save your callback request. Please try again.");
        return;
      }
    } catch {
      recordLeadSubmission(null, "yt2_landing_callback", "/yt2");
      setSubmissionError("We couldn't save your callback request. Please try again.");
      return;
    }
    setSubmitted(true);
    setTimeout(() => setShowBooking(true), 1200);
  };

  if (submitted) {
    return (
      <>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 px-6">
          <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="font-display text-4xl text-white mb-3">YOU'RE IN THE QUEUE</h3>
          <p className="text-gray-300 text-lg mb-2">Your information was submitted for review. Response time and availability vary.</p>
          <p className="text-gray-500 text-sm font-mono mb-6">Case #{Math.floor(Math.random() * 90000) + 10000} — {new Date().toLocaleDateString()}</p>
          <button
            onClick={() => setShowBooking(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-black text-black text-sm uppercase tracking-widest transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.65 0.21 40))" }}
          >
            📅 Request a Case Review
          </button>
        </motion.div>
        <BookingModal isOpen={showBooking} onClose={() => setShowBooking(false)} firstName={form.firstName} />
      </>
    );
  }

  const stepContent = [
    <div key="s0" className="space-y-4">
      <h3 className="font-display text-3xl text-white">ARE YOU CURRENTLY PAYING ON A SOLAR CONTRACT?</h3>
      <div className="grid grid-cols-2 gap-3">
        {["Yes", "No — but I signed one", "Not sure"].map((opt) => (
          <button key={opt} type="button" onClick={() => { update("paying", opt); setStep(1); }}
            className={`p-4 rounded border text-left transition-all duration-200 font-medium ${form.paying === opt ? "border-amber-500 bg-amber-500/15 text-amber-300" : "border-white/10 bg-white/5 text-gray-300 hover:border-amber-500/50 hover:bg-white/10"}`}>
            {opt}
          </button>
        ))}
      </div>
    </div>,

    <div key="s1" className="space-y-4">
      <h3 className="font-display text-3xl text-white">WHAT'S THE MAIN ISSUE YOU'RE DEALING WITH?</h3>
      <div className="space-y-2">
        {ISSUES.map((opt) => (
          <button key={opt} type="button" onClick={() => { update("issue", opt); setStep(2); }}
            className={`w-full p-3.5 rounded border text-left transition-all duration-200 font-medium text-sm ${form.issue === opt ? "border-amber-500 bg-amber-500/15 text-amber-300" : "border-white/10 bg-white/5 text-gray-300 hover:border-amber-500/50 hover:bg-white/10"}`}>
            {opt}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <div className="text-amber-400 text-xs font-mono uppercase tracking-wider mb-1">Not ready for full form?</div>
        <div className="text-white font-semibold text-sm mb-3">Just want a call back?</div>
        <form onSubmit={handleQuickCallback} className="space-y-2.5">
          <input type="text" value={fallbackName} onChange={(e) => setFallbackName(e.target.value)} placeholder="Your name (optional)"
            className="w-full p-3 rounded border border-white/10 bg-white/5 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none transition-colors text-sm" />
          <input type="tel" value={fallbackPhone} onChange={(e) => setFallbackPhone(e.target.value)} placeholder="Phone number" required
            className="w-full p-3 rounded border border-white/10 bg-white/5 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none transition-colors text-sm" />
          <ContactConsentFields
            idPrefix="yt2-quick-callback"
            contactConsent={fallbackContactConsent}
            smsConsent={fallbackSmsConsent}
            website={fallbackWebsite}
            onContactConsentChange={setFallbackContactConsent}
            onSmsConsentChange={setFallbackSmsConsent}
            onWebsiteChange={setFallbackWebsite}
          />
          <button type="submit" disabled={quickCallback.isPending || !fallbackPhone.trim() || !fallbackContactConsent} className="w-full btn-amber py-3 rounded text-sm font-bold disabled:opacity-40">
            {quickCallback.isPending ? "REQUESTING..." : "REQUEST A CALLBACK →"}
          </button>
          {submissionError && <p role="alert" className="text-red-400 text-sm text-center">{submissionError}</p>}
        </form>
      </div>
    </div>,

    <div key="s2" className="space-y-5">
      <h3 className="font-display text-3xl text-white">WHO IS YOUR SOLAR FINANCE COMPANY?</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {SOLAR_COMPANIES.map((c) => (
          <button key={c} type="button" onClick={() => update("company", c)}
            className={`p-3 rounded border text-sm font-medium transition-all duration-200 text-left ${form.company === c ? "border-amber-500 bg-amber-500/15 text-amber-300" : "border-white/10 bg-white/5 text-gray-300 hover:border-amber-500/50 hover:bg-white/10"}`}>
            {c}
          </button>
        ))}
      </div>
      <h3 className="font-display text-2xl text-white">MONTHLY SOLAR PAYMENT?</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PAYMENT_RANGES.map((r) => (
          <button key={r} type="button" onClick={() => update("payment", r)}
            className={`p-3 rounded border text-sm font-medium transition-all duration-200 ${form.payment === r ? "border-amber-500 bg-amber-500/15 text-amber-300" : "border-white/10 bg-white/5 text-gray-300 hover:border-amber-500/50"}`}>
            {r}
          </button>
        ))}
      </div>
      <button type="button" disabled={!form.company || !form.payment} onClick={() => setStep(3)}
        className="w-full btn-amber py-4 rounded text-base font-bold disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none">
        CONTINUE →
      </button>
    </div>,

    <div key="s3" className="space-y-4">
      <h3 className="font-display text-3xl text-white">ARE YOU LOOKING TO GET OUT OF YOUR SOLAR CONTRACT?</h3>
      <div className="space-y-3">
        {[
          { val: "Yes — I want out ASAP", label: "Yes — I want out ASAP", desc: "I'm ready to start the process immediately" },
          { val: "Possibly", label: "Possibly", desc: "I want to understand my options first" },
          { val: "Just exploring", label: "Just exploring", desc: "I want to know if I even have a case" },
        ].map((opt) => (
          <button key={opt.val} type="button" onClick={() => { update("intent", opt.val); setStep(4); }}
            className={`w-full p-4 rounded border text-left transition-all duration-200 ${form.intent === opt.val ? "border-amber-500 bg-amber-500/15" : "border-white/10 bg-white/5 hover:border-amber-500/50 hover:bg-white/10"}`}>
            <div className={`font-semibold ${form.intent === opt.val ? "text-amber-300" : "text-white"}`}>{opt.label}</div>
            <div className="text-gray-400 text-sm mt-0.5">{opt.desc}</div>
          </button>
        ))}
      </div>
    </div>,

    <div key="s4" className="space-y-4">
      <h3 className="font-display text-3xl text-white">WHERE SHOULD WE SEND INFORMATION ABOUT YOUR REVIEW?</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1.5">First Name *</label>
          <input type="text" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} placeholder="John"
            className="w-full p-3.5 rounded border border-white/10 bg-white/5 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none transition-colors" />
        </div>
        <div>
          <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1.5">Last Name *</label>
          <input type="text" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} placeholder="Smith"
            className="w-full p-3.5 rounded border border-white/10 bg-white/5 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none transition-colors" />
        </div>
      </div>
      <div>
        <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1.5">Best Phone Number *</label>
        <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(904) 000-0000"
          className="w-full p-3.5 rounded border border-white/10 bg-white/5 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none transition-colors" />
      </div>
      <div>
        <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1.5">Email Address *</label>
        <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="john@example.com"
          className="w-full p-3.5 rounded border border-white/10 bg-white/5 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none transition-colors" />
      </div>
      <ContactConsentFields
        idPrefix="yt2-full"
        contactConsent={form.contactConsent}
        smsConsent={form.smsConsent}
        website={form.website}
        onContactConsentChange={(checked) => update("contactConsent", checked)}
        onSmsConsentChange={(checked) => update("smsConsent", checked)}
        onWebsiteChange={(value) => update("website", value)}
      />
      <button type="submit" disabled={submitLead.isPending || !form.firstName || !form.lastName || !form.phone || !form.email || !form.contactConsent}
        className="w-full btn-amber btn-amber-pulse py-5 rounded text-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none">
        REQUEST MY CASE REVIEW →
      </button>
      {submissionError && <p role="alert" className="text-red-400 text-sm text-center">{submissionError}</p>}
    </div>,
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step indicator */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-1">
          {["Situation", "Issue", "Company", "Intent", "Contact"].map((label, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                i < step ? "bg-amber-500 text-black" :
                i === step ? "border-2 border-amber-500 text-amber-400 bg-amber-500/15" :
                "border border-white/20 text-gray-600 bg-white/5"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-xs font-mono hidden sm:block transition-colors duration-300 ${i === step ? "text-amber-400" : i < step ? "text-amber-600" : "text-gray-600"}`}>{label}</span>
            </div>
          ))}
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, oklch(0.72 0.19 50), oklch(0.65 0.21 40))" }}
            initial={{ width: "0%" }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-xs font-mono uppercase tracking-wider">Step {step + 1} of {totalSteps}</span>
          <span className="text-amber-400 text-xs font-mono font-semibold">{Math.round(((step + 1) / totalSteps) * 100)}% complete</span>
        </div>
      </div>
      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
        {stepContent[step]}
      </motion.div>
      {step > 0 && (
        <button type="button" onClick={() => setStep(s => s - 1)} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
          ← Back
        </button>
      )}
    </form>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FAQItem({ q, a, delay }: { q: string; a: string; delay: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Reveal delay={delay}>
      <div className="border border-white/8 rounded-lg overflow-hidden">
        <button onClick={() => setOpen(o => !o)}
          className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/4 transition-colors">
          <span className="font-semibold text-white pr-4">{q}</span>
          <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }} className="text-amber-400 text-2xl flex-shrink-0 font-light">+</motion.span>
        </button>
        <motion.div initial={false} animate={{ height: open ? "auto" : 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
          <div className="px-6 pb-5 text-gray-400 leading-relaxed border-t border-white/8 pt-4">{a}</div>
        </motion.div>
      </div>
    </Reveal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Yt2Landing() {
  const formRef = useRef<HTMLDivElement>(null);
  const [pageBookingOpen, setPageBookingOpen] = useState(false);
  const { phoneDisplay, phoneHref, phoneDigits } = useSiteConfig();

  const scrollToForm = (label = "yt_cta") => {
    trackCTAClick(label, "/yt2");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const scrollToTop = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.11 0.012 265)", color: "oklch(0.97 0 0)" }}>

      {/* ── MINIMAL TOP BAR ── */}
      <div className="sticky top-0 z-50 border-b border-white/8" style={{ background: "oklch(0.11 0.012 265 / 95%)", backdropFilter: "blur(12px)" }}>
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.60 0.21 40))" }}>
              <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-display text-white text-lg tracking-wide">SOLAR FREEDOM</span>
          </div>
          <div className="flex items-center gap-3">
            <a href={phoneHref} onClick={() => trackPhoneClick("yt2_topbar_phone", phoneDigits)}
              className="hidden sm:flex items-center gap-1.5 text-gray-300 hover:text-white text-sm transition-colors">
              📞 {phoneDisplay}
            </a>
            <button onClick={() => scrollToForm("yt_topbar_cta")} className="btn-amber px-4 py-2 rounded text-sm font-bold">
              CASE REVIEW
            </button>
          </div>
        </div>
      </div>

      {/* ── HERO: QUIZ + HEADLINE SIDE BY SIDE ── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="Residential rooftop solar panels" className="w-full h-full object-cover" loading="eager" fetchPriority="high" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, oklch(0.08 0.015 265 / 75%) 0%, oklch(0.1 0.015 265 / 60%) 50%, oklch(0.08 0.015 265 / 70%) 100%)" }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 60% at 15% 55%, oklch(0.72 0.19 50 / 12%) 0%, transparent 65%)", animation: "ambientGlow 6s ease-in-out infinite" }} />
        </div>

        <div className="container relative z-10 py-16 lg:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 mb-6 justify-center">
              <span className="badge-danger">⚠ AS SEEN ON YOUTUBE — VARIANT B</span>
              <span className="text-gray-400 text-xs font-mono">Individual document review</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
              className="font-display leading-none mb-6" style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)" }}>
              <span className="text-white">QUESTIONS ABOUT A</span>
              <br />
              <span className="text-amber-gradient">SOLAR CONTRACT?</span>
              <br />
              <span className="text-white">START WITH THE</span>
              <br />
              <span className="text-amber-gradient">SIGNED RECORDS.</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
              className="text-gray-300 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
              Submit the agreement and supporting records for an individual review. Options depend on your documents, facts, and jurisdiction.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45 }}
              className="flex flex-wrap gap-4 text-sm text-gray-400 mb-8 justify-center">
              {["✓ Document-focused intake", "✓ Fact-specific review", "✓ No promised outcome", "✓ No promised timeline"].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <span className="text-amber-400 font-bold">{item.slice(0, 1)}</span>
                  {item.slice(2)}
                </span>
              ))}
            </motion.div>

            <motion.a href={phoneHref} onClick={() => trackPhoneClick("yt2_hero_phone", phoneDigits)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-semibold text-lg transition-colors mb-10">
              📞 Call {phoneDisplay}
            </motion.a>
          </div>

          {/* Form — centered below headline */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="max-w-2xl mx-auto mt-2">
            <div ref={formRef} className="rounded-2xl p-8 relative form-glow-box" style={{ background: "oklch(0.13 0.012 265)" }}>
              <div className="absolute top-0 left-0 w-24 h-24 rounded-tl-2xl" style={{ background: "radial-gradient(circle at top left, oklch(0.72 0.19 50 / 20%), transparent 70%)" }} />
              <div className="absolute bottom-0 right-0 w-24 h-24 rounded-br-2xl" style={{ background: "radial-gradient(circle at bottom right, oklch(0.72 0.19 50 / 15%), transparent 70%)" }} />
              <div className="mb-6 text-center relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest mb-3"
                  style={{ background: "oklch(0.72 0.19 50 / 15%)", color: "oklch(0.85 0.19 50)", border: "1px solid oklch(0.72 0.19 50 / 40%)" }}>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    INDIVIDUAL CASE REVIEW
                </div>
                <h3 className="font-display text-white text-2xl sm:text-3xl leading-tight mb-1">
                  FILL OUT THE QUIZ AND REQUEST A SOLAR AGREEMENT REVIEW CALL
                </h3>
                <p className="text-gray-300 text-sm font-semibold">No result, timeline, or representation is guaranteed by submitting information.</p>
              </div>
              <MultiStepForm onScrollToTop={scrollToTop} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="border-y border-white/8 py-10" style={{ background: "oklch(0.14 0.012 265)" }}>
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { target: 1, suffix: "", label: "Signed Agreement" },
              { target: 2, suffix: "", label: "Supporting Disclosures" },
              { target: 3, suffix: "", label: "Performance + Billing" },
              { target: 4, suffix: "", label: "Communications" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-amber-gradient mb-1" style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}>
                  <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                </div>
                <div className="text-gray-400 text-sm font-mono uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <OutcomesSection onBookCall={() => setPageBookingOpen(true)} />
      <BookingModal isOpen={pageBookingOpen} onClose={() => setPageBookingOpen(false)} firstName="" />

      {/* ── COUNTER PLAYBOOK ── */}
      <section className="py-24 lg:py-32">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <div className="relative">
                <img src={FRUSTRATED_HOMEOWNER} alt="Frustrated homeowner with solar contract paperwork"
                  className="rounded-xl w-full object-cover shadow-2xl" style={{ maxHeight: "560px" }} loading="lazy" />
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-lg border border-red-500/30" style={{ background: "oklch(0.12 0.015 265 / 90%)", backdropFilter: "blur(8px)" }}>
                  <div className="badge-danger mb-2">THE REALITY</div>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    The average trapped solar homeowner pays <span className="text-red-400 font-semibold">$180/month</span> for a system that underperforms — that's <span className="text-red-400 font-semibold">$43,200 over 20 years</span> for something they were deceived into buying.
                  </p>
                </div>
              </div>
            </Reveal>

            <div className="space-y-8">
              <Reveal>
                <div className="badge-danger mb-4">YOU'RE NOT ALONE</div>
                <h2 className="font-display text-white leading-none" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>
                  THEY USED EVERY TRICK IN THE BOOK.
                  <br />
                  <span className="text-amber-gradient">WE WROTE THE COUNTER-PLAYBOOK.</span>
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Some homeowner complaints describe high-pressure sales, unclear contract terms, disputed savings projections, or systems that did not perform as expected. Verify the signed documents and current regulator records before drawing a conclusion.
                </p>
              </Reveal>
              <div className="space-y-4">
                {[
                  "Misrepresented savings projections",
                  "Undisclosed contract escalator clauses",
                  "Right of rescission never properly disclosed",
                  "System performance guarantees not honored",
                  "TILA and consumer protection violations",
                ].map((item, i) => (
                  <Reveal key={item} delay={0.1 + i * 0.08}>
                    <div className="flex items-center gap-3 p-4 rounded-lg border border-white/6 bg-white/3">
                      <span className="text-lg">🔴</span>
                      <span className="text-gray-200 font-medium">{item}</span>
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={0.5}>
                <button onClick={() => scrollToForm("counter_playbook_cta")} className="btn-amber px-8 py-4 rounded text-base font-bold">
                  SEE IF I HAVE A CASE →
                </button>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4 STEPS ── */}
      <section className="py-24 lg:py-32 relative" style={{ background: "oklch(0.13 0.012 265)" }}>
        <div className="container">
          <Reveal>
            <div className="text-center mb-16">
              <div className="badge-success inline-block mb-4">THE PROCESS</div>
              <h2 className="font-display text-white" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>
                FROM RECORDS TO NEXT STEPS IN <span className="text-amber-gradient">4 STAGES</span>
              </h2>
              <p className="text-gray-400 mt-4 max-w-xl mx-auto">Each stage depends on the documents, facts, parties, jurisdiction, and any written professional engagement.</p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: "01", title: "DOCUMENT INTAKE", desc: "Share the agreement and supporting records needed to understand your situation.", icon: "📋" },
              { num: "02", title: "DOCUMENT QUESTIONS", desc: "Identify contract terms, disclosures, sales statements, performance records, and current primary sources that require closer review.", icon: "⚖️" },
              { num: "03", title: "OPTIONS REVIEW", desc: "Review available paths, limits, costs, and risks with an appropriately qualified professional before proceeding.", icon: "🥊" },
              { num: "04", title: "NEXT STEPS", desc: "Review the available paths, limits, costs, and risks before deciding how to proceed.", icon: "🔓" },
            ].map((s, i) => (
              <Reveal key={s.num} delay={i * 0.12}>
                <div className="relative p-6 rounded-xl border border-white/8 bg-white/3 h-full group hover:border-amber-500/30 transition-colors duration-300">
                  <div className="font-display text-6xl text-amber-gradient mb-4 leading-none">{s.num}</div>
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <h3 className="font-display text-2xl text-white mb-3">{s.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                  {i < 3 && <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-amber-500/40 text-2xl z-10">→</div>}
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.5}>
            <div className="text-center mt-12">
              <button onClick={() => scrollToForm("steps_start_review")} className="btn-amber btn-amber-pulse px-10 py-5 rounded text-lg font-bold">
                START MY REVIEW →
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── WE BREAK THEM ── */}
      <section className="py-24 lg:py-32">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 order-2 lg:order-1">
              <Reveal>
                <div className="badge-success mb-4">WHY SOLAR FREEDOM</div>
                <h2 className="font-display text-white leading-none" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>
                  REVIEW THE RECORDS.
                  <br />
                  <span className="text-amber-gradient">UNDERSTAND THE VARIABLES.</span>
                </h2>
              </Reveal>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { title: "CONTRACT-FOCUSED REVIEW", desc: "Review the agreement, disclosures, financing terms, sales representations, and performance records together." },
                  { title: "TERMS CONFIRMED IN WRITING", desc: "Any professional role, service scope, fee, and engagement term must be confirmed in a written agreement." },
                  { title: "NO PROMISED TIMELINE", desc: "Timing varies with the agreement, facts, parties, process, and jurisdiction." },
                  { title: "CREDIT EFFECTS VARY", desc: "Payment changes and disputes can affect credit. Review the account and obtain qualified advice before changing an obligation." },
                ].map((item, i) => (
                  <Reveal key={item.title} delay={i * 0.1}>
                    <div className="card-amber-border rounded-r-lg p-5">
                      <div className="font-display text-amber-400 text-lg mb-1.5">{item.title}</div>
                      <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
            <Reveal className="order-1 lg:order-2">
              <div className="relative">
                <img src={FREEDOM_VISUAL} alt="Solar agreement records illustration" className="rounded-xl w-full object-cover shadow-2xl" loading="lazy" />
                <div className="absolute inset-0 rounded-xl" style={{ background: "linear-gradient(to top, oklch(0.11 0.012 265 / 60%) 0%, transparent 50%)" }} />
                <div className="absolute bottom-6 left-6">
                  <div className="font-display text-5xl text-amber-gradient">DOCUMENTS</div>
                  <div className="text-gray-300 text-sm font-mono">before decisions</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FEATURED VIDEOS: EXPLAINER + PODCAST ── */}
      <section className="py-24 lg:py-32" style={{ background: "oklch(0.12 0.012 265)" }}>
        <div className="container max-w-5xl">
          <Reveal>
            <div className="text-center mb-14">
              <div className="badge-success inline-block mb-4">WATCH & LISTEN</div>
              <h2 className="font-display text-white mb-4" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                SOLAR CONTRACT <span className="text-amber-gradient">EDUCATIONAL MEDIA</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">Watch the explainer video and podcast for educational scenarios, documents to review, and questions to investigate.</p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-8">
            <Reveal delay={0}>
              <div className="rounded-2xl overflow-hidden border border-amber-500/30 bg-white/5 hover:border-amber-500/60 transition-all duration-300 group">
                <div className="relative aspect-video bg-black">
                  <PrivacyVideoEmbed
                    videoId="s6V76pijGKI"
                    title="Solar contract records and review questions"
                  />
                </div>
                <div className="p-5">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider mb-2" style={{ background: "oklch(0.72 0.19 50 / 15%)", color: "oklch(0.85 0.19 50)" }}>▶ Explainer Video</div>
                  <h3 className="text-white font-bold text-lg mb-1 group-hover:text-amber-400 transition-colors">Solar Contract Records and Review Questions</h3>
                  <p className="text-gray-400 text-sm">An educational discussion of documents, contract terms, and questions to investigate without promising an outcome.</p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="rounded-2xl overflow-hidden border border-white/20 bg-white/5 hover:border-amber-500/40 transition-all duration-300 group">
                <div className="relative aspect-video bg-black">
                  <PrivacyVideoEmbed
                    videoId="l0A3I_CvI0c"
                    title="Solar contract review podcast"
                    accent="blue"
                  />
                </div>
                <div className="p-5">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider mb-2" style={{ background: "oklch(0.55 0.15 265 / 20%)", color: "oklch(0.75 0.12 265)" }}>🎙 Podcast Episode</div>
                  <h3 className="text-white font-bold text-lg mb-1 group-hover:text-amber-400 transition-colors">Elite Solar Recovery Podcast</h3>
                  <p className="text-gray-400 text-sm">How to organize your records, understand contract terms, and prepare questions for an individual review.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── VIDEO SECTION ── */}
      <section className="py-24 lg:py-32" style={{ background: "oklch(0.11 0.012 265)" }}>
        <div className="container">
          <Reveal>
            <div className="text-center mb-16">
              <div className="badge-danger mb-4">REAL STORIES</div>
              <h2 className="text-3xl lg:text-5xl font-black text-white mb-4">See What Homeowners Are Saying</h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">Review common contract questions, records to gather, and official sources to check before deciding what to do next.</p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663287718525/46qo2AwgwNWJ4wJwr8EnH8/gemini_generated_video_70bf9dcd_958ad7f4.mp4", title: "Hidden Contract Clauses", desc: "What solar companies don't want you to read in your contract" },
              { src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663287718525/46qo2AwgwNWJ4wJwr8EnH8/gemini_generated_video_9ac2e803_2f64531a.mp4", title: "When Your Solar Company Goes Bankrupt", desc: "Don't let a bankrupt company hold your home hostage" },
              { src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663287718525/46qo2AwgwNWJ4wJwr8EnH8/gemini_generated_video_6827b99f_3faf870c.mp4", title: "Solar Payment Shock", desc: "You went solar to save money. So why is your bill higher?" },
            ].map((vid, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:border-amber-500/40 transition-all duration-300 group">
                  <div className="relative aspect-video bg-black">
                    <video src={vid.src} className="w-full h-full object-cover" controls preload="metadata" playsInline />
                  </div>
                  <div className="p-5">
                    <h3 className="text-white font-bold text-lg mb-1 group-hover:text-amber-400 transition-colors">{vid.title}</h3>
                    <p className="text-gray-400 text-sm">{vid.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 lg:py-32">
        <div className="container max-w-3xl">
          <Reveal>
            <div className="text-center mb-16">
              <div className="badge-success inline-block mb-4">COMMON QUESTIONS</div>
              <h2 className="font-display text-white" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>
                STRAIGHT ANSWERS. <span className="text-amber-gradient">NO RUNAROUND.</span>
              </h2>
            </div>
          </Reveal>
          <div className="space-y-3">
            <FAQItem q="Can I cancel my solar contract?" a="Cancellation or another remedy may be possible, but it depends on the agreement, disclosures, sales representations, performance records, applicable law, and parties involved. An individual review is required." delay={0} />
            <FAQItem q="What does this cost me?" a="Any fees, scope, and engagement terms must be disclosed and agreed before paid services begin. Submitting an intake form does not create an attorney-client relationship or guarantee representation." delay={0.05} />
            <FAQItem q="How long does the process take?" a="Timing varies with the agreement, facts, parties, process, and jurisdiction. No result or timeline can be determined from general information alone." delay={0.1} />
            <FAQItem q="What if my solar company went bankrupt?" a="A company's bankruptcy does not automatically cancel every related agreement. The installer, seller, lender, servicer, completion status, and contract terms must be reviewed individually." delay={0.15} />
            <FAQItem q="Will this hurt my credit score?" a="Credit effects depend on the account, payment history, reporting, dispute process, and agreement. Do not stop paying or assume a credit result based on general information; review the records and obtain qualified advice." delay={0.2} />
            <FAQItem q="What if I have a solar loan, not a lease?" a="Loans, leases, and power purchase agreements create different rights and obligations. The signed documents and applicable law determine which questions and options are relevant." delay={0.25} />
            <FAQItem q="I already tried to cancel and was told I couldn't. What should I review next?" a="Keep the written response, signed agreement, addenda, payment records, sales materials, and communications. A prior refusal does not answer every fact-specific question, but it also does not guarantee another outcome." delay={0.3} />
          </div>
        </div>
      </section>

      {/* ── STATES WE FIGHT ── */}
      <section className="py-20 lg:py-28" style={{ background: "oklch(0.12 0.012 265)" }}>
        <div className="container max-w-4xl">
          <Reveal>
            <div className="text-center mb-10">
              <div className="inline-block px-3 py-1 rounded-full text-xs font-mono text-amber-400 border border-amber-500/30 mb-4" style={{ background: "oklch(0.72 0.19 50 / 10%)" }}>
                LOCATION-SPECIFIC REVIEW
              </div>
              <h2 className="font-display text-white mb-2" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
                CHECK AVAILABILITY FOR YOUR LOCATION
              </h2>
              <p className="text-gray-500 text-sm">Availability and next steps depend on your location, documents, facts, and the professionals who agree to handle the matter.</p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "California","Texas","Florida","Arizona","Nevada","New Jersey","New York",
                "Colorado","Hawaii","Massachusetts","Maryland","Connecticut","North Carolina",
                "Georgia","Illinois","Pennsylvania","Virginia","Washington","Oregon","Utah",
                "Ohio","Michigan","Minnesota","Missouri","Tennessee","South Carolina",
                "Alabama","Louisiana","Oklahoma","Kansas","All Other States"
              ].map((state) => (
                <span key={state} className="text-xs px-2.5 py-1 rounded border border-white/8 text-gray-400 hover:text-amber-400 hover:border-amber-500/30 transition-colors cursor-default">
                  {state}
                </span>
              ))}
            </div>
          </Reveal>

          {/* Final CTA */}
          <Reveal delay={0.2}>
            <div className="mt-16 text-center">
              <div className="inline-block p-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 max-w-2xl w-full">
                <h3 className="font-display text-white text-3xl lg:text-4xl mb-4">
                  EVERY MONTH YOU WAIT<br />
                  <span className="text-amber-gradient">COSTS YOU MONEY.</span>
                </h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  The average homeowner who contacts us is paying <span className="text-red-400 font-semibold">$185/month</span> they shouldn't be. That's <span className="text-red-400 font-semibold">$2,220 every year</span> going to a contract you may be able to cancel.
                </p>
                <button onClick={() => scrollToForm("final_cta")} className="btn-amber btn-amber-pulse px-10 py-5 rounded text-lg font-bold w-full sm:w-auto">
                  REQUEST MY CASE REVIEW →
                </button>
                <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-gray-500">
                  <span>✓ No promised result</span>
                  <span>✓ No obligation</span>
                  <span>✓ 100% confidential</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── MINIMAL FOOTER ── */}
      <div className="border-t border-white/8 py-6" style={{ background: "oklch(0.10 0.01 265)" }}>
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-600 text-xs">
          <span>© {new Date().getFullYear()} Solar Freedom. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="/privacy-policy" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-gray-400 transition-colors">Terms</a>
            <a href="/" className="hover:text-gray-400 transition-colors">Main Site</a>
          </div>
        </div>
      </div>
    </div>
  );
}
