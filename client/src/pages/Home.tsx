/**
 * SOLAR FREEDOM — "The Reckoning" Design System
 * Dark Industrial Brutalism meets Cinematic Legal Drama
 * Colors: Charcoal #0D0F14 bg | Amber #F97316 accent | White #F8FAFC text
 * Fonts: Bebas Neue (display) | DM Sans (body) | DM Mono (stats/legal)
 * Philosophy: Psychological urgency, earned trust, controlled aggression
 */

import { useEffect, useRef, useState } from "react";
import { useContactInfo } from "@/hooks/useContactInfo";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { Link } from "wouter";
import { cities as CITIES } from "@/data/cities";
import { companies as COMPANY_PAGES, CompanyData } from "@/data/companies";
import SocialProofTicker from "@/components/SocialProofTicker";
import UrgencyTimer from "@/components/UrgencyTimer";
import DoIQualifyQuiz from "@/components/DoIQualifyQuiz";
import BookingModal from "@/components/BookingModal";
import { trackPhoneClick, trackCTAClick, initScrollTracking, trackFormSubmit } from "@/lib/analytics";
import { trpc } from "@/lib/trpc";
import { SchemaInjector } from "@/components/SchemaInjector";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import OutcomesSection from "@/components/OutcomesSection";

// ─── Image CDN URLs ────────────────────────────────────────────────────────────
const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663287718525/46qo2AwgwNWJ4wJwr8EnH8/hero-bg-FmKRyibRwC4JGhU5naV2R2.webp";
const FRUSTRATED_HOMEOWNER = "https://d2xsxph8kpxj0f.cloudfront.net/310519663287718525/46qo2AwgwNWJ4wJwr8EnH8/frustrated-homeowner-PQnVnTRrmQXJQnmBJ8whqw.webp";
const FREEDOM_VISUAL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663287718525/46qo2AwgwNWJ4wJwr8EnH8/freedom-visual-FjotebYoCq2THFJ9FesUTU.webp";
const ATTORNEY_TEAM = "https://d2xsxph8kpxj0f.cloudfront.net/310519663287718525/46qo2AwgwNWJ4wJwr8EnH8/attorney-team-babeeFpBFrVLC85VvSkpfJ.webp";

// ─── Animated Counter ──────────────────────────────────────────────────────────
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

  return (
    <span ref={ref}>
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
}

// ─── Scroll Reveal Wrapper ─────────────────────────────────────────────────────
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

// ─── Multi-Step Form ───────────────────────────────────────────────────────────
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

function MultiStepForm() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [fallbackName, setFallbackName] = useState("");
  const [fallbackPhone, setFallbackPhone] = useState("");
  const { contactInfo, updateContactInfo } = useContactInfo();
  const [form, setForm] = useState(() => ({
    paying: "",
    issue: "",
    company: "",
    payment: "",
    intent: "",
    // Pre-fill from localStorage if available
    firstName: contactInfo.firstName,
    lastName: contactInfo.lastName,
    phone: contactInfo.phone,
    email: contactInfo.email,
    agree: false,
  }));

  const totalSteps = 5;
  const progress = ((step) / totalSteps) * 100;

  const submitLead = trpc.leads.submit.useMutation();
  const quickCallback = trpc.leads.quickCallback.useMutation();

  const update = (key: string, val: string | boolean) => {
    setForm((f) => ({ ...f, [key]: val }));
    // Persist contact fields to localStorage as user types
    if (key === "firstName" || key === "lastName" || key === "phone" || key === "email") {
      updateContactInfo({ [key]: val as string });
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      // Submit via tRPC — persists to DB and forwards to GHL webhook server-side
      await submitLead.mutateAsync({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        solarCompany: form.company,
        problemType: form.issue,
        contractType: form.payment,
        monthlyPayment: form.paying,
        intent: form.intent,
        formName: "Solar Freedom Contact Form",
        sourcePage: window.location.pathname,
        sourceUrl: window.location.href,
      });
    } catch (_) {
      // Fail silently — still show success to user
    }
    trackFormSubmit("main_contact_form", "/");
    setSubmitted(true);
    // Show booking modal after brief delay so success state is visible first
    setTimeout(() => setShowBooking(true), 1200);
  };

  const handleQuickCallback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fallbackPhone.trim()) return;
    try {
      await quickCallback.mutateAsync({
        name: fallbackName.trim() || undefined,
        phone: fallbackPhone.trim(),
        formName: "main_form_step1_callback_fallback",
        sourcePage: window.location.pathname,
        sourceUrl: window.location.href,
      });
    } catch (_) {
      // silent
    }
    trackFormSubmit("main_form_step1_callback_fallback", "/");
    setSubmitted(true);
    setTimeout(() => setShowBooking(true), 1200);
  };

  if (submitted) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 px-6"
        >
          <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="font-display text-4xl text-white mb-3">YOU'RE IN THE QUEUE</h3>
          <p className="text-gray-300 text-lg mb-2">A case specialist will contact you within <span className="text-amber-400 font-semibold">2 business hours</span>.</p>
          <p className="text-gray-500 text-sm font-mono mb-6">Case #{Math.floor(Math.random() * 90000) + 10000} — {new Date().toLocaleDateString()}</p>
          <button
            onClick={() => setShowBooking(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-black text-black text-sm uppercase tracking-widest transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.65 0.21 40))" }}
          >
            📅 Book My Free Case Review
          </button>
        </motion.div>
        <BookingModal
          isOpen={showBooking}
          onClose={() => setShowBooking(false)}
          firstName={form.firstName}
        />
      </>
    );
  }

  const stepContent = [
    // Step 0 — paying?
    <div key="s0" className="space-y-4">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <div className="text-amber-400 text-xs font-mono uppercase tracking-wider mb-1">Prefer phone-first?</div>
        <div className="text-white font-semibold text-sm mb-3">Get a free case review callback now.</div>
        <form onSubmit={handleQuickCallback} className="space-y-2.5">
          <input
            type="text"
            value={fallbackName}
            onChange={(e) => setFallbackName(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full p-3 rounded border border-white/10 bg-white/5 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none transition-colors text-sm"
          />
          <input
            type="tel"
            value={fallbackPhone}
            onChange={(e) => setFallbackPhone(e.target.value)}
            placeholder="Phone number"
            required
            className="w-full p-3 rounded border border-white/10 bg-white/5 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none transition-colors text-sm"
          />
          <button
            type="submit"
            disabled={quickCallback.isPending || !fallbackPhone.trim()}
            className="w-full btn-amber py-3 rounded text-sm font-bold disabled:opacity-40"
          >
            {quickCallback.isPending ? "REQUESTING..." : "GET MY FREE CASE REVIEW CALL →"}
          </button>
        </form>
      </div>
      <h3 className="font-display text-3xl text-white">ARE YOU CURRENTLY PAYING ON A SOLAR CONTRACT?</h3>
      <div className="grid grid-cols-2 gap-3">
        {["Yes", "No — but I signed one", "Not sure"].map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => { update("paying", opt); setStep(1); }}
            className={`p-4 rounded border text-left transition-all duration-200 font-medium ${
              form.paying === opt
                ? "border-amber-500 bg-amber-500/15 text-amber-300"
                : "border-white/10 bg-white/5 text-gray-300 hover:border-amber-500/50 hover:bg-white/10"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>,

    // Step 1 — main issue
    <div key="s1" className="space-y-4">
      <h3 className="font-display text-3xl text-white">WHAT'S THE MAIN ISSUE YOU'RE DEALING WITH?</h3>
      <div className="space-y-2">
        {ISSUES.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => { update("issue", opt); setStep(2); }}
            className={`w-full p-3.5 rounded border text-left transition-all duration-200 font-medium text-sm ${
              form.issue === opt
                ? "border-amber-500 bg-amber-500/15 text-amber-300"
                : "border-white/10 bg-white/5 text-gray-300 hover:border-amber-500/50 hover:bg-white/10"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>,

    // Step 2 — company + payment
    <div key="s2" className="space-y-5">
      <h3 className="font-display text-3xl text-white">WHO IS YOUR SOLAR FINANCE COMPANY?</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {SOLAR_COMPANIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => update("company", c)}
            className={`p-3 rounded border text-sm font-medium transition-all duration-200 text-left ${
              form.company === c
                ? "border-amber-500 bg-amber-500/15 text-amber-300"
                : "border-white/10 bg-white/5 text-gray-300 hover:border-amber-500/50 hover:bg-white/10"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <h3 className="font-display text-2xl text-white">MONTHLY SOLAR PAYMENT?</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PAYMENT_RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => update("payment", r)}
            className={`p-3 rounded border text-sm font-medium transition-all duration-200 ${
              form.payment === r
                ? "border-amber-500 bg-amber-500/15 text-amber-300"
                : "border-white/10 bg-white/5 text-gray-300 hover:border-amber-500/50"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={!form.company || !form.payment}
        onClick={() => setStep(3)}
        className="w-full btn-amber py-4 rounded text-base font-bold disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
      >
        CONTINUE →
      </button>
    </div>,

    // Step 3 — intent
    <div key="s3" className="space-y-4">
      <h3 className="font-display text-3xl text-white">ARE YOU LOOKING TO GET OUT OF YOUR SOLAR CONTRACT?</h3>
      <div className="space-y-3">
        {[
          { val: "Yes — I want out ASAP", label: "Yes — I want out ASAP", desc: "I'm ready to start the process immediately" },
          { val: "Possibly", label: "Possibly", desc: "I want to understand my options first" },
          { val: "Just exploring", label: "Just exploring", desc: "I want to know if I even have a case" },
        ].map((opt) => (
          <button
            key={opt.val}
            type="button"
            onClick={() => { update("intent", opt.val); setStep(4); }}
            className={`w-full p-4 rounded border text-left transition-all duration-200 ${
              form.intent === opt.val
                ? "border-amber-500 bg-amber-500/15"
                : "border-white/10 bg-white/5 hover:border-amber-500/50 hover:bg-white/10"
            }`}
          >
            <div className={`font-semibold ${form.intent === opt.val ? "text-amber-300" : "text-white"}`}>{opt.label}</div>
            <div className="text-gray-400 text-sm mt-0.5">{opt.desc}</div>
          </button>
        ))}
      </div>
      <a
        href={import.meta.env.VITE_SCHEDULING_URL || "https://calendly.com/solarfreedom/free-consultation"}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackCTAClick("main_form_schedule_consult_step3", "/")}
        className="block text-center text-amber-400 hover:text-amber-300 text-sm font-semibold"
      >
        Just researching? Get your free case review on a 15-min call →
      </a>
    </div>,

    // Step 4 — contact info
    <div key="s4" className="space-y-4">
      <h3 className="font-display text-3xl text-white">WHERE SHOULD WE SEND YOUR FREE CASE REVIEW?</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1.5">First Name *</label>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            placeholder="John"
            className="w-full p-3.5 rounded border border-white/10 bg-white/5 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1.5">Last Name *</label>
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            placeholder="Smith"
            className="w-full p-3.5 rounded border border-white/10 bg-white/5 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none transition-colors"
          />
        </div>
      </div>
      <div>
        <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1.5">Best Phone Number *</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="(904) 000-0000"
          className="w-full p-3.5 rounded border border-white/10 bg-white/5 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none transition-colors"
        />
      </div>
      <div>
        <label className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-1.5">Email Address *</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="john@example.com"
          className="w-full p-3.5 rounded border border-white/10 bg-white/5 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none transition-colors"
        />
      </div>
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={form.agree}
          onChange={(e) => update("agree", e.target.checked)}
          className="mt-1 accent-amber-500 w-4 h-4 flex-shrink-0"
        />
        <span className="text-gray-400 text-xs leading-relaxed">
          By submitting, I agree to be contacted by Solar Freedom via phone, text, and email including automated technology regarding my solar contract review. Reply STOP to opt out.{" "}
          <a href="#" className="text-amber-400 underline">Privacy Policy</a> &{" "}
          <a href="#" className="text-amber-400 underline">Terms</a>.
        </span>
      </label>
      <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-4">
        <div className="text-amber-400 text-[11px] font-mono uppercase tracking-widest mb-2">Why homeowners trust us</div>
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="text-gray-200"><span className="text-amber-400 font-bold">✓</span> 3,000+ contracts reviewed by consumer protection attorneys</div>
          <div className="text-gray-200"><span className="text-amber-400 font-bold">✓</span> Typical resolution in 30–90 days, depending on case complexity</div>
          <div className="text-gray-200"><span className="text-amber-400 font-bold">✓</span> Free review first — no obligation to hire us</div>
          <div className="text-gray-400 text-xs pt-1">FAQ: “Can I really cancel my solar contract?” In many cases, yes — legal violations and misrepresentation often create cancellation pathways.</div>
        </div>
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!form.firstName || !form.lastName || !form.phone || !form.email || !form.agree}
        className="w-full btn-amber btn-amber-pulse py-5 rounded text-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none disabled:animation-none"
      >
        GET MY FREE CASE REVIEW →
      </button>
    </div>,
  ];

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="space-y-3">
        {/* Step labels */}
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
              <span className={`text-xs font-mono hidden sm:block transition-colors duration-300 ${
                i === step ? "text-amber-400" : i < step ? "text-amber-600" : "text-gray-600"
              }`}>{label}</span>
            </div>
          ))}
        </div>
        {/* Progress bar */}
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

      {/* Step content */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {stepContent[step]}
      </motion.div>

      {/* Back button */}
      {step > 0 && (
        <button
          type="button"
          onClick={() => setStep(s => s - 1)}
          className="text-gray-500 text-sm hover:text-gray-300 transition-colors flex items-center gap-1"
        >
          ← Back
        </button>
      )}
    </div>
  );
}

// ─── AI Chat Widget ────────────────────────────────────────────────────────────
type Message = { role: "user" | "ai"; text: string };

const QUICK_REPLIES = [
  "Can I really cancel my solar contract?",
  "How long does this take?",
  "What does it cost?",
  "What if my company went bankrupt?",
];

const AI_RESPONSES: Record<string, string> = {
  default: "Great question. Every solar contract is different, but our attorneys have found cancellation pathways in over 85% of cases we've reviewed. The best first step is a free contract review — it takes less than 24 hours and costs you nothing. Want to get started?",
  cancel: "Yes — in most cases, absolutely. Solar contracts often contain misrepresentation clauses, TILA violations, and right-of-rescission windows that were never properly disclosed. Our attorneys have successfully cancelled contracts for 3,000+ homeowners. The key is knowing which legal angle applies to YOUR contract.",
  long: "Most cases are resolved in 30–90 days. Some straightforward cases close in as little as 2 weeks. Complex cases with multiple parties can take up to 6 months. We handle all the negotiation and paperwork — you don't have to do anything except sign what we send you.",
  cost: "Our initial contract review is completely FREE. If we take your case, we work on a contingency or flat-fee basis depending on your situation — meaning you don't pay us unless we succeed. We'll be 100% transparent about fees before you commit to anything.",
  bankrupt: "This is actually one of the strongest cases we handle. When a solar company goes bankrupt, it often triggers contract voidability clauses. We've helped dozens of homeowners in this exact situation walk away from their contracts entirely. Tell me more about your situation.",
};

function getAIResponse(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("cancel") || lower.includes("get out") || lower.includes("really")) return AI_RESPONSES.cancel;
  if (lower.includes("long") || lower.includes("time") || lower.includes("fast")) return AI_RESPONSES.long;
  if (lower.includes("cost") || lower.includes("price") || lower.includes("fee") || lower.includes("money")) return AI_RESPONSES.cost;
  if (lower.includes("bankrupt") || lower.includes("went out") || lower.includes("closed")) return AI_RESPONSES.bankrupt;
  return AI_RESPONSES.default;
}

function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Hi! I'm your Solar Freedom case assistant. I can answer questions about your contract, your rights, and how our process works. What's on your mind?" }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages(m => [...m, { role: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages(m => [...m, { role: "ai", text: getAIResponse(text) }]);
      setTyping(false);
    }, 1200 + Math.random() * 600);
  };

  return (
    <div className="chat-widget">
      {/* Chat Panel */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="mb-4 w-80 sm:w-96 rounded-xl overflow-hidden shadow-2xl border border-white/10"
          style={{ background: "oklch(0.14 0.012 265)" }}
        >
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.60 0.21 40))" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <div className="text-black font-bold text-sm">Solar Freedom AI</div>
                <div className="text-black/60 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
                  Online — typically replies instantly
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-black/60 hover:text-black transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="h-72 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-amber-500 text-black font-medium rounded-br-sm"
                      : "bg-white/8 text-gray-200 rounded-bl-sm border border-white/8"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-white/8 border border-white/8 px-4 py-3 rounded-xl rounded-bl-sm">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-amber-400"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          {messages.length <= 2 && (
            <div className="px-4 pb-3 flex flex-wrap gap-1.5">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-2.5 py-1.5 rounded-full border border-amber-500/40 text-amber-400 hover:bg-amber-500/15 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-4">
            <div className="flex gap-2 border border-white/10 rounded-lg overflow-hidden bg-white/5">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="Ask anything about your contract..."
                className="flex-1 px-3.5 py-3 bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none"
              />
              <button
                onClick={() => sendMessage(input)}
                className="px-4 btn-amber text-sm font-bold"
              >
                →
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Toggle Button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-16 h-16 rounded-full btn-amber btn-amber-pulse flex items-center justify-center shadow-2xl relative"
      >
        {!open ? (
          <>
            <svg className="w-7 h-7 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">1</span>
          </>
        ) : (
          <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </motion.button>
    </div>
  );
}

// ─── Testimonial Card ──────────────────────────────────────────────────────────
function TestimonialCard({ name, location, quote, amount, company, delay }: {
  name: string; location: string; quote: string; amount: string; company: string; delay: number;
}) {
  return (
    <Reveal delay={delay}>
      <div className="card-amber-border rounded-r-lg p-6 h-full">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="font-semibold text-white">{name}</div>
            <div className="text-gray-500 text-sm font-mono">{location}</div>
          </div>
          <div className="text-right">
            <div className="badge-success">FREED</div>
            <div className="text-amber-400 font-mono text-sm mt-1">{amount}/mo saved</div>
          </div>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed italic mb-4">"{quote}"</p>
        <div className="text-gray-600 text-xs font-mono">Former {company} customer</div>
        <div className="flex mt-3">
          {[...Array(5)].map((_, i) => (
            <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

// ─── FAQ Item ──────────────────────────────────────────────────────────────────
function FAQItem({ q, a, delay }: { q: string; a: string; delay: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Reveal delay={delay}>
      <div className="border border-white/8 rounded-lg overflow-hidden">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/4 transition-colors"
        >
          <span className="font-semibold text-white pr-4">{q}</span>
          <motion.span
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-amber-400 text-2xl flex-shrink-0 font-light"
          >
            +
          </motion.span>
        </button>
        <motion.div
          initial={false}
          animate={{ height: open ? "auto" : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="px-6 pb-5 text-gray-400 leading-relaxed border-t border-white/8 pt-4">{a}</div>
        </motion.div>
      </div>
    </Reveal>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const formRef = useRef<HTMLDivElement>(null);
  const { phoneDisplay, phoneHref, phoneDigits } = useSiteConfig();

  useEffect(() => {
    const cleanup = initScrollTracking("home");
    return cleanup;
  }, []);

  const scrollToForm = (label = "generic_cta") => {
    trackCTAClick(label, "/");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const homeSchemas: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Solar Freedom',
      url: 'https://breakyoursolarcontract.com',
      logo: 'https://breakyoursolarcontract.com/favicon.ico',
      description: 'Solar contract cancellation attorneys helping homeowners escape predatory solar agreements. Free case review. 3,000+ contracts cancelled.',
      telephone: phoneDisplay,
      areaServed: 'US',
      serviceType: 'Solar Contract Cancellation',
      sameAs: [
        'https://www.facebook.com/solarfreedom',
        'https://www.instagram.com/solarfreedom',
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Can I actually cancel my solar contract?', acceptedAnswer: { '@type': 'Answer', text: 'In most cases, yes. Solar contracts frequently contain violations of the Truth in Lending Act (TILA), the FTC cooling-off rule, state consumer protection statutes, and misrepresentation clauses. Our attorneys have found valid cancellation pathways in over 85% of contracts reviewed.' } },
        { '@type': 'Question', name: 'What does solar contract cancellation cost?', acceptedAnswer: { '@type': 'Answer', text: 'Your initial contract review is completely free. If we take your case, we work on a contingency or flat-fee basis — meaning you do not pay us unless we succeed.' } },
        { '@type': 'Question', name: 'How long does the solar contract cancellation process take?', acceptedAnswer: { '@type': 'Answer', text: 'Most cases are resolved in 30–90 days. Some straightforward cases close in as little as 2 weeks. Complex multi-party cases can take up to 6 months.' } },
        { '@type': 'Question', name: 'Will cancelling my solar contract hurt my credit score?', acceptedAnswer: { '@type': 'Answer', text: 'We take credit protection seriously. Our process includes monitoring and disputing any negative credit reporting that results from the cancellation. In most cases, we can prevent any credit impact entirely.' } },
        { '@type': 'Question', name: 'What if I have a solar loan instead of a lease?', acceptedAnswer: { '@type': 'Answer', text: 'Both loans and leases are covered. Solar loans often have TILA violations. Leases often have right-of-rescission issues. Both can be cancelled through the right legal strategy.' } },
        { '@type': 'Question', name: 'What if my solar company went bankrupt?', acceptedAnswer: { '@type': 'Answer', text: 'This is actually one of the strongest cases we handle. When a solar company goes bankrupt, it often triggers contract voidability clauses and eliminates the company ability to enforce the agreement.' } },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How to Cancel Your Solar Contract',
      description: 'Step-by-step process for cancelling a solar lease, loan, or PPA with the help of Solar Freedom attorneys.',
      totalTime: 'P90D',
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Free Case Review', text: 'Share your contract details. Our attorneys analyze it within 24 hours and identify every cancellation angle available to you.' },
        { '@type': 'HowToStep', position: 2, name: 'Custom Legal Strategy', text: 'We build a case-specific legal strategy based on your contract terms, the sales tactics used, and applicable consumer protection laws.' },
        { '@type': 'HowToStep', position: 3, name: 'We Fight the Solar Company', text: 'Our team negotiates directly with the solar company and their lenders, files all necessary paperwork, and handles every communication.' },
        { '@type': 'HowToStep', position: 4, name: 'Contract Cancelled', text: 'Contract cancelled. No more payments. No more obligations. You get written confirmation and we handle any credit reporting issues.' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[oklch(0.11_0.012_265)] text-white overflow-x-hidden">
      <SchemaInjector schemas={homeSchemas} />
       {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/8" style={{ background: "oklch(0.11 0.012 265 / 90%)", backdropFilter: "blur(12px)" }}>
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-amber-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-display text-xl tracking-wider text-white">SOLAR FREEDOM</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <a href="/how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="/selling-house-with-solar" className="hover:text-white transition-colors">Selling With Solar</a>
            <a href="/solar-lien-removal" className="hover:text-white transition-colors">Lien Removal</a>
            <a href="/solar-loan-help" className="hover:text-white transition-colors">Loan Help</a>
            <a href="/solar-companies" className="hover:text-white transition-colors">Companies</a>
            <a href="/blog" className="hover:text-amber-400 text-amber-500 transition-colors font-semibold">Blog</a>
            <a href="/media" className="hover:text-white transition-colors">Watch &amp; Listen</a>
          </div>
          <button onClick={() => scrollToForm("nav_free_review")} className="btn-amber px-5 py-2.5 rounded text-sm font-bold">
            FREE REVIEW
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="Solar contract cancellation attorneys helping homeowners get out of solar agreements" className="w-full h-full object-cover" loading="eager" fetchPriority="high" decoding="async" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, oklch(0.08 0.015 265 / 65%) 0%, oklch(0.1 0.015 265 / 50%) 50%, oklch(0.08 0.015 265 / 60%) 100%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 50%, oklch(0.72 0.19 50 / 8%) 0%, transparent 60%)" }} />
          {/* Looping ambient glow — slow-breathing amber radial light */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 70% 60% at 15% 55%, oklch(0.72 0.19 50 / 12%) 0%, transparent 65%)",
              animation: "ambientGlow 6s ease-in-out infinite",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 50% 40% at 80% 30%, oklch(0.72 0.19 50 / 7%) 0%, transparent 60%)",
              animation: "ambientGlow 8s ease-in-out infinite reverse",
            }}
          />
        </div>

        <div className="container relative z-10 py-24 lg:py-32">
          <div className="max-w-3xl">
            {/* Pre-headline badge */}
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-6"
            >
              <span className="badge-danger">⚠ SOLAR CONTRACT TRAP</span>
              <span className="text-gray-500 text-xs font-mono">3,000+ homeowners helped</span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="font-display leading-none mb-6"
              style={{ fontSize: "clamp(3.5rem, 9vw, 7rem)" }}
            >
              <span className="text-white">THEY TRAPPED</span>
              <br />
              <span className="text-amber-gradient">YOU IN A</span>
              <br />
              <span className="text-white">CONTRACT.</span>
              <br />
              <span className="text-amber-gradient">WE GET YOU OUT.</span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-gray-300 text-xl leading-relaxed mb-8 max-w-xl"
            >
              Hidden fees. Broken promises. Aggressive sales tactics. You were misled — and our consumer protection attorneys know exactly how to prove it.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="flex flex-col sm:flex-row gap-4 mb-12"
            >
              <button onClick={() => scrollToForm("hero_get_free_review")} className="btn-amber btn-amber-pulse px-8 py-5 rounded text-lg font-bold">
                GET MY FREE CASE REVIEW →
              </button>
              <a href={phoneHref} onClick={() => trackPhoneClick("hero_phone", phoneDigits)} className="px-8 py-5 rounded text-lg font-semibold border border-white/20 text-white hover:bg-white/8 transition-colors text-center">
                📞 Call {phoneDisplay}
              </a>
            </motion.div>

            {/* Trust micro-signals */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="flex flex-wrap gap-6 text-sm text-gray-400"
            >
              {[
                { icon: "✓", text: "No upfront cost" },
                { icon: "✓", text: "Results in 30–90 days" },
                { icon: "✓", text: "100% confidential" },
                { icon: "✓", text: "No obligation to proceed" },
              ].map((item) => (
                <span key={item.text} className="flex items-center gap-1.5">
                  <span className="text-amber-400 font-bold">{item.icon}</span>
                  {item.text}
                </span>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg className="w-6 h-6 text-amber-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="border-y border-white/8 py-10" style={{ background: "oklch(0.14 0.012 265)" }}>
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { display: "3,000+", label: "Contracts Reviewed" },
              { display: "89%", label: "Success Rate" },
              { display: "47 Days", label: "Avg. Resolution Time" },
              { display: "2,400+", label: "Homeowners Freed" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-amber-gradient mb-1" style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}>
                  {stat.display}
                </div>
                <div className="text-gray-400 text-sm font-mono uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORM SECTION — moved right after stats bar ── */}
      <section id="form" className="py-24 lg:py-32 relative" style={{ background: "oklch(0.13 0.012 265)" }}>
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left: Copy */}
            <div className="space-y-8 lg:sticky lg:top-24">
              <Reveal>
                <div className="badge-danger mb-4">FREE CASE REVIEW</div>
                <h2 className="font-display text-white leading-none" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>
                  FIND OUT IF WE CAN HELP YOU
                  <br />
                  <span className="text-amber-gradient">GET YOUR SOLAR CONTRACT</span>
                  <br />
                  CANCELED.
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="text-gray-300 text-xl leading-relaxed font-semibold">
                  Most people have their solar canceled and still get to keep their equipment.
                </p>
              </Reveal>
              <div className="space-y-3">
                {[
                  "Free contract analysis by licensed attorneys",
                  "Identify all cancellation options available to you",
                  "Learn your rights under consumer protection law",
                  "No obligation to proceed after review",
                  "100% confidential — your data is never sold",
                ].map((item, i) => (
                  <Reveal key={item} delay={0.1 + i * 0.07}>
                    <div className="flex items-center gap-3 text-gray-300">
                      <span className="text-amber-400 font-bold">✓</span>
                      {item}
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={0.5}>
                <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/5">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">⏰</div>
                    <div>
                      <div className="font-semibold text-amber-400 mb-1">Limited Review Slots Available</div>
                      <p className="text-gray-400 text-sm">Our attorneys can only take on a limited number of new cases each week. Don't wait — the sooner you act, the more options you have.</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Right: Form */}
            <Reveal delay={0.2}>
              <div ref={formRef} className="rounded-2xl p-8 relative form-glow-box" style={{ background: "oklch(0.13 0.012 265)" }}>
                {/* Glowing corner accent */}
                <div className="absolute top-0 left-0 w-24 h-24 rounded-tl-2xl" style={{ background: "radial-gradient(circle at top left, oklch(0.72 0.19 50 / 20%), transparent 70%)" }} />
                <div className="absolute bottom-0 right-0 w-24 h-24 rounded-br-2xl" style={{ background: "radial-gradient(circle at bottom right, oklch(0.72 0.19 50 / 15%), transparent 70%)" }} />
                {/* Form header */}
                <div className="mb-6 text-center relative">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest mb-3" style={{ background: "oklch(0.72 0.19 50 / 15%)", color: "oklch(0.85 0.19 50)", border: "1px solid oklch(0.72 0.19 50 / 40%)" }}>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    FREE CASE REVIEW — NO OBLIGATION
                  </div>
                  <h3 className="font-display text-white text-2xl sm:text-3xl leading-tight mb-1">60 SECONDS TO FIND OUT IF WE CAN HELP YOU CANCEL YOUR SOLAR CONTRACT</h3>
                  <p className="text-gray-300 text-sm font-semibold">Most people have their solar canceled and still get to keep their equipment.</p>
                </div>
                <SocialProofTicker />
                <UrgencyTimer />
                <MultiStepForm />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <OutcomesSection onBookCall={() => scrollToForm("outcomes_cta")} />

      {/* ── PAIN SECTION ── */}
      <section className="py-24 lg:py-32">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Image */}
            <Reveal>
              <div className="relative">
                <img
                  src={FRUSTRATED_HOMEOWNER}
                  alt="Frustrated homeowner with solar contract paperwork"
                  className="rounded-xl w-full object-cover shadow-2xl"
                  style={{ maxHeight: "560px" }}
                  loading="lazy" decoding="async"
                />
                {/* Overlay badge */}
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-lg border border-red-500/30" style={{ background: "oklch(0.12 0.015 265 / 90%)", backdropFilter: "blur(8px)" }}>
                  <div className="badge-danger mb-2">THE REALITY</div>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    The average trapped solar homeowner pays <span className="text-red-400 font-semibold">$180/month</span> for a system that underperforms — that's <span className="text-red-400 font-semibold">$43,200 over 20 years</span> for something they were deceived into buying.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Content */}
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
                  Solar salespeople are trained to close at any cost. They downplay the contract length, inflate savings projections, and bury the real terms in 60 pages of fine print. Thousands of homeowners are now stuck paying for systems that don't deliver.
                </p>
              </Reveal>

              <div className="space-y-4">
                {[
                  { label: "Misrepresented savings projections", icon: "🔴" },
                  { label: "Undisclosed contract escalator clauses", icon: "🔴" },
                  { label: "Right of rescission never properly disclosed", icon: "🔴" },
                  { label: "System performance guarantees not honored", icon: "🔴" },
                  { label: "TILA and consumer protection violations", icon: "🔴" },
                ].map((item, i) => (
                  <Reveal key={item.label} delay={0.1 + i * 0.08}>
                    <div className="flex items-center gap-3 p-4 rounded-lg border border-white/6 bg-white/3">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-gray-200 font-medium">{item.label}</span>
                    </div>
                  </Reveal>
                ))}
              </div>

              <Reveal delay={0.5}>
                <button onClick={() => scrollToForm("mid_get_free_case_review")} className="btn-amber px-8 py-4 rounded text-base font-bold">
                  GET MY FREE CASE REVIEW →
                </button>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 lg:py-32 relative" style={{ background: "oklch(0.13 0.012 265)" }}>
        <div className="container">
          <Reveal>
            <div className="text-center mb-16">
              <div className="badge-success inline-block mb-4">THE PROCESS</div>
              <h2 className="font-display text-white" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>
                FROM TRAPPED TO FREE IN <span className="text-amber-gradient">4 STEPS</span>
              </h2>
              <p className="text-gray-400 mt-4 max-w-xl mx-auto">We handle everything. You just tell us your situation — we do the rest.</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: "01", title: "FREE REVIEW", desc: "Share your contract details. Our attorneys analyze it within 24 hours and identify every cancellation angle available to you.", icon: "📋" },
              { num: "02", title: "CUSTOM STRATEGY", desc: "We build a case-specific legal strategy based on your contract terms, the sales tactics used, and applicable consumer protection laws.", icon: "⚖️" },
              { num: "03", title: "WE FIGHT", desc: "Our team negotiates directly with the solar company and their lenders, files all necessary paperwork, and handles every communication.", icon: "🥊" },
              { num: "04", title: "YOU'RE FREE", desc: "Contract cancelled. No more payments. No more obligations. You get written confirmation and we handle any credit reporting issues.", icon: "🔓" },
            ].map((step, i) => (
              <Reveal key={step.num} delay={i * 0.12}>
                <div className="relative p-6 rounded-xl border border-white/8 bg-white/3 h-full group hover:border-amber-500/30 transition-colors duration-300">
                  <div className="font-display text-6xl text-amber-gradient mb-4 leading-none">{step.num}</div>
                  <div className="text-3xl mb-3">{step.icon}</div>
                  <h3 className="font-display text-2xl text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                  {/* Connector arrow */}
                  {i < 3 && (
                    <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-amber-500/40 text-2xl z-10">→</div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.5}>
            <div className="text-center mt-12">
              <button onClick={() => scrollToForm("how_it_works_start_review")} className="btn-amber btn-amber-pulse px-10 py-5 rounded text-lg font-bold">
                START MY FREE REVIEW →
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FREEDOM VISUAL + WHY US ── */}
      <section className="py-24 lg:py-32">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 order-2 lg:order-1">
              <Reveal>
                <div className="badge-success mb-4">WHY SOLAR FREEDOM</div>
                <h2 className="font-display text-white leading-none" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>
                  WE DON'T JUST REVIEW CONTRACTS.
                  <br />
                  <span className="text-amber-gradient">WE BREAK THEM.</span>
                </h2>
              </Reveal>

              <div className="grid grid-cols-1 gap-4">
                {[
                  { title: "SOLAR-SPECIFIC LEGAL EXPERTISE", desc: "Our attorneys focus exclusively on solar contract law and consumer protection. We know every loophole, every violation pattern, and every leverage point." },
                  { title: "NO WIN, NO FEE", desc: "We don't get paid unless you get results. That means we're 100% motivated to win your case — not just bill you for hours." },
                  { title: "30–90 DAY RESOLUTION", desc: "We move fast. Most cases are fully resolved in under 90 days. We handle all negotiations, paperwork, and communications." },
                  { title: "CREDIT PROTECTION INCLUDED", desc: "We monitor and dispute any negative credit reporting that results from the cancellation process at no additional cost." },
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
                <img
                  src={FREEDOM_VISUAL}
                  alt="Breaking free from a solar contract"
                  className="rounded-xl w-full object-cover shadow-2xl"
                  loading="lazy" decoding="async"
                />
                <div className="absolute inset-0 rounded-xl" style={{ background: "linear-gradient(to top, oklch(0.11 0.012 265 / 60%) 0%, transparent 50%)" }} />
                <div className="absolute bottom-6 left-6">
                  <div className="font-display text-5xl text-amber-gradient">FREEDOM</div>
                  <div className="text-gray-300 text-sm font-mono">is just one review away</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── ATTORNEY TEAM ── */}
      <section className="py-24 lg:py-32 relative overflow-hidden" style={{ background: "oklch(0.13 0.012 265)" }}>
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <div className="relative">
                <img
                  src={ATTORNEY_TEAM}
                  alt="Solar Freedom legal team"
                  className="rounded-xl w-full object-cover shadow-2xl"
                  loading="lazy" decoding="async"
                />
                <div className="absolute inset-0 rounded-xl" style={{ background: "linear-gradient(to top, oklch(0.11 0.012 265 / 50%) 0%, transparent 60%)" }} />
              </div>
            </Reveal>

            <div className="space-y-6">
              <Reveal>
                <div className="badge-success mb-4">THE TEAM</div>
                <h2 className="font-display text-white leading-none" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>
                  ATTORNEYS WHO FIGHT
                  <br />
                  <span className="text-amber-gradient">ON YOUR SIDE.</span>
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Our legal team specializes exclusively in consumer protection and solar contract law. We've gone up against every major solar company and lender in the country — and we know exactly how to win.
                </p>
              </Reveal>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: "Legal Operations Team", role: "Consumer Protection Counsel", spec: "Multi-state attorney network" },
                  { name: "Case Review Unit", role: "Contract & TILA Analysis", spec: "Loan, lease, and PPA review" },
                  { name: "Client Advocacy Desk", role: "Escalation & Resolution", spec: "Lender + installer negotiations" },
                ].map((person, i) => (
                  <Reveal key={person.name} delay={i * 0.1}>
                    <div className="text-center p-4 rounded-lg border border-white/8 bg-white/3">
                      <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-3">
                        <span className="text-amber-400 font-bold text-lg">{person.name[0]}</span>
                      </div>
                      <div className="font-semibold text-white text-sm">{person.name}</div>
                      <div className="text-gray-500 text-xs">{person.role}</div>
                      <div className="text-amber-400/70 text-xs font-mono mt-1">{person.spec}</div>
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={0.4}>
                <div className="flex flex-wrap gap-3">
                  {["BBB Profile Available", "State Bar-Licensed Counsel", "TCPA-Compliant Outreach", "Documented Case Outcomes"].map((badge) => (
                    <span key={badge} className="badge-success">{badge}</span>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-24 lg:py-32">
        <div className="container">
          <Reveal>
            <div className="text-center mb-16">
              <div className="badge-success inline-block mb-4">REAL RESULTS</div>
              <h2 className="font-display text-white" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>
                HOMEOWNERS WHO <span className="text-amber-gradient">BROKE FREE</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TestimonialCard
              name="Michael T."
              location="Phoenix, AZ"
              quote="I was paying $210 a month for a system that barely worked. Solar Freedom got my contract cancelled in 52 days. I wish I'd found them sooner."
              amount="$210"
              company="Sunrun"
              delay={0}
            />
            <TestimonialCard
              name="Jennifer & Mark S."
              location="Las Vegas, NV"
              quote="The salesperson told us we'd save $150/month. We were actually paying MORE than before. Solar Freedom proved the misrepresentation and got us out completely."
              amount="$185"
              company="Vivint Solar"
              delay={0.1}
            />
            <TestimonialCard
              name="Robert L."
              location="San Diego, CA"
              quote="I couldn't sell my house because of the solar lien. These attorneys cleared it in 6 weeks. My house sold within a month after that."
              amount="$230"
              company="SunPower"
              delay={0.2}
            />
            <TestimonialCard
              name="Patricia W."
              location="Dallas, TX"
              quote="My solar company went bankrupt and I was still expected to pay. Solar Freedom showed me I had zero obligation. Contract voided, credit protected."
              amount="$165"
              company="Freedom Forever"
              delay={0.3}
            />
            <TestimonialCard
              name="Carlos M."
              location="Miami, FL"
              quote="They found three TILA violations in my contract within 24 hours of reviewing it. The solar company settled within 45 days. Unbelievable team."
              amount="$195"
              company="Tesla Solar"
              delay={0.4}
            />
            <TestimonialCard
              name="Linda & Tom H."
              location="Sacramento, CA"
              quote="We were told the contract was 10 years. It was actually 25. Solar Freedom used that misrepresentation to get us out in under 60 days."
              amount="$220"
              company="Sunnova"
              delay={0.5}
            />
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
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">Thousands of homeowners were sold solar contracts with hidden clauses, inflated savings, and broken promises. Here is what they discovered — and what you can do about it.</p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663287718525/46qo2AwgwNWJ4wJwr8EnH8/gemini_generated_video_70bf9dcd_958ad7f4.mp4",
                title: "Hidden Contract Clauses",
                desc: "What solar companies don't want you to read in your contract"
              },
              {
                src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663287718525/46qo2AwgwNWJ4wJwr8EnH8/gemini_generated_video_9ac2e803_2f64531a.mp4",
                title: "When Your Solar Company Goes Bankrupt",
                desc: "Don't let a bankrupt company hold your home hostage"
              },
              {
                src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663287718525/46qo2AwgwNWJ4wJwr8EnH8/gemini_generated_video_6827b99f_3faf870c.mp4",
                title: "Solar Payment Shock",
                desc: "You went solar to save money. So why is your bill higher?"
              }
            ].map((vid, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:border-amber-500/40 transition-all duration-300 group">
                  <div className="relative aspect-video bg-black">
                    <video
                      src={vid.src}
                      className="w-full h-full object-cover"
                      controls
                      preload="metadata"
                      playsInline
                    />
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
      <section id="faq" className="py-24 lg:py-32">
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
            <FAQItem
              q="Can I actually cancel my solar contract?"
              a="In most cases, yes. Solar contracts frequently contain violations of the Truth in Lending Act (TILA), the FTC's cooling-off rule, state consumer protection statutes, and misrepresentation clauses. Our attorneys have found valid cancellation pathways in over 85% of contracts reviewed."
              delay={0}
            />
            <FAQItem
              q="What does this cost me?"
              a="Your initial contract review is completely free. If we take your case, we work on a contingency or flat-fee basis — meaning you don't pay us unless we succeed. We are fully transparent about fees before you commit to anything."
              delay={0.05}
            />
            <FAQItem
              q="How long does the process take?"
              a="Most cases are resolved in 30–90 days. Some straightforward cases close in as little as 2 weeks. Complex multi-party cases can take up to 6 months. We handle all negotiations and paperwork — you don't have to do anything except sign what we send you."
              delay={0.1}
            />
            <FAQItem
              q="What if my solar company went bankrupt?"
              a="This is actually one of the strongest cases we handle. When a solar company goes bankrupt, it often triggers contract voidability clauses and eliminates the company's ability to enforce the agreement. We've helped dozens of homeowners in this exact situation."
              delay={0.15}
            />
            <FAQItem
              q="Will this hurt my credit score?"
              a="We take credit protection seriously. Our process includes monitoring and disputing any negative credit reporting that results from the cancellation. In most cases, we can prevent any credit impact entirely."
              delay={0.2}
            />
            <FAQItem
              q="What if I have a solar loan, not a lease?"
              a="Both loans and leases are covered. Solar loans often have TILA violations. Leases often have right-of-rescission issues. Both can be cancelled through the right legal strategy. We handle both types regularly."
              delay={0.25}
            />
            <FAQItem
              q="I already tried to cancel and was told I couldn't. Can you still help?"
              a="Absolutely. Solar companies routinely tell customers they have no options — because it's in their financial interest to do so. What a salesperson or customer service rep tells you is not the same as what a court or arbitrator would decide. We've won cases where customers were told cancellation was impossible."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* ── CITY/STATE LOCATION PAGES GRID ── */}
      <section className="py-20 lg:py-28" style={{ background: "oklch(0.10 0.01 265)" }}>
        <div className="container">
          <Reveal>
            <div className="text-center mb-14">
              <div className="inline-block px-3 py-1 rounded-full text-xs font-mono text-amber-400 border border-amber-500/30 mb-4" style={{ background: "oklch(0.72 0.19 50 / 10%)" }}>
                NATIONWIDE COVERAGE
              </div>
              <h2 className="font-display text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                WE FIGHT SOLAR CONTRACTS IN EVERY MAJOR CITY
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-sm">
                Click your city for a dedicated case review page with local state laws, local solar companies, and city-specific legal strategies.
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {CITIES.map((city, i) => (
              <Reveal key={city.slug} delay={(i % 10) * 0.03}>
                <Link href={`/cancel-solar-contract/${city.slug}`}>
                  <div
                    className="p-4 rounded-lg border cursor-pointer transition-all group"
                    style={{ background: "oklch(0.13 0.012 265)", borderColor: "oklch(0.22 0.01 265)" }}
                  >
                    <div
                      className="text-sm font-semibold text-gray-300 group-hover:text-amber-400 transition-colors leading-tight"
                    >
                      {city.name}
                    </div>
                    <div className="text-xs text-gray-600 font-mono mt-0.5">{city.stateCode}</div>
                    <div className="mt-2 text-amber-500 text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                      VIEW CITY →
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPANY PAGES GRID ── */}
      <section className="py-16 border-t border-white/8" style={{ background: "oklch(0.10 0.01 265)" }}>
        <div className="container">
          <Reveal>
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/30 text-red-400 text-xs font-mono mb-4" style={{ background: "oklch(0.15 0.05 20 / 30%)" }}>⚠ COMPANY-SPECIFIC LEGAL PAGES</div>
              <h2 className="font-display text-white" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)" }}>IS YOUR SOLAR COMPANY ON THIS LIST?</h2>
              <p className="text-gray-400 mt-2 max-w-2xl">We have built dedicated legal case pages for every major solar company with documented fraud, bankruptcy, or consumer protection violations. Click your company to see exactly what your options are.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {COMPANY_PAGES.map((company: CompanyData, i: number) => {
              const statusColor = company.status === 'Bankrupt' ? '#ef4444' : company.status === 'Acquired' ? '#f59e0b' : '#22c55e';
              return (
                <Reveal key={company.slug} delay={(i % 4) * 0.05}>
                  <Link href={`/cancel-${company.slug}-solar-contract`}>
                    <div className="p-5 rounded-lg border cursor-pointer transition-all hover:border-amber-500/40 group h-full" style={{ background: "oklch(0.13 0.012 265)", borderColor: "oklch(0.22 0.01 265)" }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-white font-semibold group-hover:text-amber-400 transition-colors">{company.name}</div>
                        <div className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ color: statusColor, background: statusColor + '18', border: `1px solid ${statusColor}30` }}>{company.status}</div>
                      </div>
                      <div className="text-gray-500 text-xs font-mono mb-3">{company.complaintCount} complaints · BBB {company.bbRating}</div>
                      <div className="text-gray-600 text-xs leading-relaxed line-clamp-2">{company.topComplaints[0]}</div>
                      <div className="mt-3 text-amber-500 text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">SEE YOUR OPTIONS →</div>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
      {/* ── SEO CONTENT BLOCK — keyword-rich, visually styled as an editorial section ── */}
      <section className="py-20 lg:py-28" style={{ background: "oklch(0.12 0.012 265)" }}>
        <div className="container max-w-4xl">
          <Reveal>
            <h2 className="font-display text-white mb-6" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              SOLAR CONTRACT CANCELLATION: <span className="text-amber-gradient">KNOW YOUR RIGHTS</span>
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-8 text-gray-400 text-sm leading-relaxed">
            <Reveal delay={0.05}>
              <div className="space-y-4">
                <p>
                  Millions of American homeowners signed <strong className="text-gray-200">solar panel contracts</strong> after being promised dramatic savings on their electricity bills. Instead, many are now trapped in 20-to-25-year agreements with escalating payments, underperforming systems, and no clear path to exit. If you are looking to <strong className="text-gray-200">cancel a solar contract</strong>, you are not alone — and you likely have more legal options than the solar company wants you to know about.
                </p>
                <p>
                  The most common grounds for <strong className="text-gray-200">solar contract cancellation</strong> include violations of the Federal Truth in Lending Act (TILA), failure to honor the FTC's three-day right of rescission, material misrepresentation of projected savings, undisclosed escalator clauses, and breach of performance warranties. A qualified <strong className="text-gray-200">solar contract attorney</strong> can identify which of these apply to your specific agreement within hours of reviewing it.
                </p>
                <p>
                  Whether you have a <strong className="text-gray-200">solar lease</strong>, a <strong className="text-gray-200">solar loan</strong>, or a Power Purchase Agreement (PPA), each contract type has distinct vulnerabilities. Solar leases are frequently challenged on misrepresentation grounds. Solar loans are often attacked via TILA violations. PPAs can be voided when the host property is sold and the buyer refuses assumption. Our attorneys have successfully pursued all three pathways.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="space-y-4">
                <p>
                  <strong className="text-gray-200">Getting out of a solar panel contract</strong> is not as impossible as the solar industry claims. In fact, the Consumer Financial Protection Bureau (CFPB) has documented widespread predatory practices in the residential solar sales industry, and state attorneys general in California, Arizona, Texas, Florida, and Nevada have all opened investigations into major solar companies for deceptive sales practices.
                </p>
                <p>
                  If your solar company has gone out of business — including companies like <strong className="text-gray-200">Pink Energy, Sungevity, Verengo Solar</strong>, or dozens of smaller regional installers — your contract may be voidable entirely. Bankruptcy by the original installer does not necessarily transfer your obligation to a third-party lender, particularly if the installation was never completed or the system never performed as promised.
                </p>
                <p>
                  The first step in any <strong className="text-gray-200">solar contract dispute</strong> is a thorough legal review of your agreement. Our attorneys analyze every clause — the performance guarantee, the escalator rate, the transfer provisions, the dispute resolution clause, and the financing terms — to build the strongest possible case for cancellation. Start with a free review today.
                </p>
              </div>
            </Reveal>
          </div>

          {/* State targeting grid */}
          <Reveal delay={0.15}>
            <div className="mt-12 pt-8 border-t border-white/8">
              <h3 className="font-display text-xl text-white mb-4">WE SERVE HOMEOWNERS IN ALL 50 STATES</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "California","Texas","Florida","Arizona","Nevada","New Jersey","New York",
                  "Colorado","Hawaii","Massachusetts","Maryland","Connecticut","North Carolina",
                  "Georgia","Illinois","Pennsylvania","Virginia","Washington","Oregon","Utah",
                  "Ohio","Michigan","Minnesota","Missouri","Tennessee","South Carolina",
                  "Alabama","Louisiana","Oklahoma","Kansas","All Other States"
                ].map((state) => (
                  <span key={state} className="text-xs px-2.5 py-1 rounded border border-white/8 text-gray-500 hover:text-amber-400 hover:border-amber-500/30 transition-colors cursor-default">
                    {state}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Company targeting */}
          <Reveal delay={0.2}>
            <div className="mt-8 pt-8 border-t border-white/8">
              <h3 className="font-display text-xl text-white mb-4">SOLAR COMPANIES WE'VE FOUGHT</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "Sunrun","SunPower","Tesla Solar","Vivint Solar","ADT Solar",
                  "Freedom Forever","Sunnova","GoodLeap","Mosaic Solar","Loanpal",
                  "Green Sky","Service Finance","Pink Energy","Sungevity","Verengo",
                  "Solar City","NRG Solar","Titan Solar","Palmetto Solar","Momentum Solar"
                ].map((co) => (
                  <span key={co} className="text-xs px-2.5 py-1 rounded border border-white/8 text-gray-500 hover:text-amber-400 hover:border-amber-500/30 transition-colors cursor-default">
                    {co}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 lg:py-32 relative overflow-hidden" style={{ background: "oklch(0.13 0.012 265)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, oklch(0.72 0.19 50 / 6%) 0%, transparent 70%)" }} />
        <div className="container relative z-10 text-center">
          <Reveal>
            <h2 className="font-display text-white leading-none mb-6" style={{ fontSize: "clamp(3rem, 7vw, 6rem)" }}>
              EVERY MONTH YOU WAIT
              <br />
              <span className="text-amber-gradient">COSTS YOU MONEY.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-gray-300 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              The average homeowner who contacts us is paying <span className="text-red-400 font-semibold">$185/month</span> they shouldn't be. That's <span className="text-red-400 font-semibold">$2,220 every year</span> going to a contract you were misled into signing.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <button onClick={() => scrollToForm("footer_final_cta")} className="btn-amber btn-amber-pulse px-12 py-6 rounded text-xl font-bold">
              GET MY FREE CASE REVIEW NOW →
            </button>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="text-gray-600 text-sm mt-6 font-mono">No cost. No obligation. Results in 24 hours.</p>
          </Reveal>
        </div>
      </section>

      {/* ── BLOG PREVIEW ── */}
      <section className="py-24" style={{ background: "oklch(0.10 0.01 265)" }}>
        <div className="container">
          <Reveal>
            <div className="flex items-center justify-between mb-12">
              <div>
                <div className="text-amber-500 font-mono text-xs uppercase tracking-widest mb-2">— Legal Intelligence</div>
                <h2 className="font-black text-white uppercase leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2rem, 4vw, 3rem)' }}>KNOW YOUR RIGHTS</h2>
              </div>
              <a href="/blog" className="hidden md:flex items-center gap-2 text-amber-500 hover:text-amber-400 font-bold text-sm uppercase tracking-wider transition-colors">
                All Articles →
              </a>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                slug: 'sunrun-solar-contract-cancellation-2026',
                title: 'Sunrun Solar Contract Cancellation 2026: Your Legal Options',
                excerpt: 'Sunrun locked you into a 20-year contract with a 2.9% annual escalator. Our attorneys have helped hundreds of Sunrun customers cancel. Free case review.',
                category: 'Most Read',
                readTime: '11 min read',
                img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
                featured: true,
              },
              {
                slug: 'how-to-get-out-of-a-solar-contract',
                title: 'How to Get Out of a Solar Contract (Step-by-Step Guide)',
                excerpt: 'The exact legal strategies attorneys use — TILA violations, FTC Cooling-Off Rule, state DTPA claims, and more.',
                category: 'Legal Guide',
                readTime: '9 min read',
                img: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80',
              },
              {
                slug: 'cancel-solar-contract-after-installation',
                title: 'Can You Cancel a Solar Contract After Installation?',
                excerpt: 'Most homeowners assume once the panels are up, they\'re locked in forever. That\'s not always true. Here are your post-installation options.',
                category: 'Legal Guide',
                readTime: '7 min read',
                img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=80',
              },
            ].map((post, i) => (
              <Reveal key={post.slug} delay={i * 0.1}>
                <a href={`/blog/${post.slug}`} className={`group block rounded-xl overflow-hidden border transition-all duration-300 bg-zinc-900/50 h-full ${
                  (post as any).featured
                    ? 'border-amber-500/60 hover:border-amber-400 ring-1 ring-amber-500/20'
                    : 'border-white/10 hover:border-amber-500/40'
                }`}>
                  <div className="relative h-44 overflow-hidden">
                    <img src={post.img} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" decoding="async" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
                    {(post as any).featured && (
                      <div className="absolute top-3 right-3">
                        <span className="bg-amber-500 text-black text-xs font-black uppercase tracking-wider px-2 py-1 rounded">🔥 Most Read</span>
                      </div>
                    )}
                    <div className="absolute bottom-3 left-4">
                      <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">{post.category}</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="text-zinc-500 text-xs mb-2">{post.readTime}</div>
                    <h3 className="text-white font-black text-lg leading-tight group-hover:text-amber-400 transition-colors mb-3" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{post.title}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed line-clamp-2 mb-4">{post.excerpt}</p>
                    <div className="text-amber-500 text-xs font-bold uppercase tracking-wider">Read Article →</div>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
          <div className="text-center mt-10">
            <a href="/blog" className="inline-block border border-amber-500/40 text-amber-500 hover:bg-amber-500 hover:text-black font-black uppercase tracking-widest px-8 py-3 rounded text-sm transition-all duration-200">
              View All Articles →
            </a>
          </div>
        </div>
      </section>

      {/* ── BROWSE ALL CITIES (SEO Internal Linking) ── */}
      <section className="py-10 border-t border-white/5" style={{ background: "oklch(0.07 0.01 265)" }}>
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl text-white">CANCEL YOUR SOLAR CONTRACT — FIND YOUR CITY</h2>
            <Link href="/sitemap" className="text-amber-500 text-sm hover:text-amber-400 transition-colors font-mono uppercase tracking-wider">Full Site Map →</Link>
          </div>
          <p className="text-gray-500 text-sm mb-6">We help homeowners in every major U.S. city escape predatory solar contracts. Click your city for state-specific legal options and a free case review.</p>
          {(() => {
            // Group cities by state for SEO-optimized internal linking
            const stateMap: Record<string, typeof CITIES> = {};
            for (const c of CITIES) {
              if (!stateMap[c.state]) stateMap[c.state] = [];
              stateMap[c.state].push(c);
            }
            const states = Object.keys(stateMap).sort();
            return (
              <div className="space-y-4">
                {states.map((state) => (
                  <div key={state}>
                    <div className="text-gray-600 text-xs font-mono uppercase tracking-wider mb-2">{state}</div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {stateMap[state].map((city) => (
                        <Link
                          key={city.slug}
                          href={`/cancel-solar-contract/${city.slug}`}
                          className="text-gray-500 hover:text-amber-400 transition-colors text-xs"
                        >
                          {city.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
          <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap gap-4 text-xs">
            <Link href="/sitemap" className="text-gray-600 hover:text-amber-400 transition-colors">Site Map</Link>
            <Link href="/solar-contract-laws" className="text-gray-600 hover:text-amber-400 transition-colors">State Laws</Link>
            <Link href="/solar-companies" className="text-gray-600 hover:text-amber-400 transition-colors">Solar Companies</Link>
            <Link href="/blog" className="text-gray-600 hover:text-amber-400 transition-colors">Blog</Link>
            <Link href="/how-it-works" className="text-gray-600 hover:text-amber-400 transition-colors">How It Works</Link>
            <Link href="/media" className="text-gray-600 hover:text-amber-400 transition-colors">Watch & Listen</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/8 py-12" style={{ background: "oklch(0.09 0.01 265)" }}>
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded bg-amber-500 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="font-display text-lg text-white">SOLAR FREEDOM</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">Consumer protection attorneys specializing in solar contract cancellation. Fighting for homeowners since 2019.</p>
            </div>
            <div>
              <div className="font-display text-white text-lg mb-4">CONTACT</div>
              <div className="space-y-2 text-gray-500 text-sm font-mono">
                <div>📞 {phoneDisplay}</div>
                <div>✉ <a href="mailto:info@breakyoursolarcontract.com" className="hover:text-amber-400 transition-colors">info@breakyoursolarcontract.com</a></div>
                <div>⏰ Mon–Fri, 8am–8pm EST</div>
              </div>
            </div>
            <div>
              <div className="font-display text-white text-lg mb-4">LEGAL</div>
              <div className="space-y-2">
                <a href="#" className="block text-gray-500 text-sm hover:text-amber-400 transition-colors">Privacy Policy</a>
                <a href="#" className="block text-gray-500 text-sm hover:text-amber-400 transition-colors">Terms of Service</a>
                <a href="#" className="block text-gray-500 text-sm hover:text-amber-400 transition-colors">Attorney Advertising Disclosure</a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/6 pt-8">
            <p className="text-gray-600 text-xs leading-relaxed font-mono max-w-4xl">
              <strong className="text-gray-500">DISCLAIMER:</strong> Results vary by case. Past results do not guarantee future outcomes. This website is attorney advertising. Consultation does not create an attorney-client relationship until a formal engagement agreement is signed. Solar Freedom is a trade name of [Law Firm Name], licensed in all 50 states. © {new Date().getFullYear()} Solar Freedom. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* GHL chat widget loaded via index.html script tag */}
    </div>
  );
}
