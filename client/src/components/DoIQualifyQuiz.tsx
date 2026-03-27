// Solar Freedom — "Do I Qualify?" Quiz Funnel
// 5-question interactive quiz that qualifies visitors and captures leads
// Designed to embed in blog posts and landing pages

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, ChevronRight, AlertTriangle } from "lucide-react";

const WEBHOOK_URL = "https://services.leadconnectorhq.com/hooks/WBEbDUNxKL5GyxIUjjdZ/webhook-trigger/ef73980f-0111-46a0-8bb9-1cbed104028b";

type Answer = { label: string; value: string; qualifies: boolean };
type Question = { id: string; text: string; sub?: string; answers: Answer[] };

const QUESTIONS: Question[] = [
  {
    id: "company_status",
    text: "What is the current status of your solar company?",
    sub: "Select the option that best describes your situation",
    answers: [
      { label: "🏚️ They went bankrupt or out of business", value: "bankrupt", qualifies: true },
      { label: "📞 They're still operating but unresponsive", value: "unresponsive", qualifies: true },
      { label: "✅ They're still operating normally", value: "operating", qualifies: true },
      { label: "❓ I'm not sure", value: "unsure", qualifies: true },
    ],
  },
  {
    id: "problem_type",
    text: "What is your main problem with your solar contract?",
    sub: "Pick the one that bothers you most",
    answers: [
      { label: "💸 Paying more than my old electric bill", value: "high_payments", qualifies: true },
      { label: "🔧 System doesn't work / poor performance", value: "not_working", qualifies: true },
      { label: "🏠 Trying to sell my home but can't", value: "home_sale", qualifies: true },
      { label: "📋 Never got the tax credit I was promised", value: "no_tax_credit", qualifies: true },
      { label: "🚪 Was misled by a door-to-door salesperson", value: "misled", qualifies: true },
    ],
  },
  {
    id: "contract_type",
    text: "What type of solar agreement do you have?",
    answers: [
      { label: "💳 Solar Loan (GoodLeap, Mosaic, Sunlight, etc.)", value: "loan", qualifies: true },
      { label: "📄 Solar Lease (monthly payments to company)", value: "lease", qualifies: true },
      { label: "⚡ PPA — Power Purchase Agreement", value: "ppa", qualifies: true },
      { label: "🤷 I'm not sure what type", value: "unsure", qualifies: true },
    ],
  },
  {
    id: "credit_impact",
    text: "Has your credit been affected or were you promised a tax credit?",
    answers: [
      { label: "✅ Yes — I was promised a tax credit I never received", value: "no_tax_credit", qualifies: true },
      { label: "📉 Yes — my credit score dropped after signing", value: "credit_drop", qualifies: true },
      { label: "🏦 Yes — both happened to me", value: "both", qualifies: true },
      { label: "❌ No credit issues", value: "none", qualifies: true },
    ],
  },
  {
    id: "timeline",
    text: "How long have you been in your solar contract?",
    answers: [
      { label: "📅 Less than 1 year", value: "under_1yr", qualifies: true },
      { label: "📅 1–3 years", value: "1_3yr", qualifies: true },
      { label: "📅 3–5 years", value: "3_5yr", qualifies: true },
      { label: "📅 More than 5 years", value: "over_5yr", qualifies: true },
    ],
  },
];

interface QuizProps {
  compact?: boolean;
}

export default function DoIQualifyQuiz({ compact = false }: QuizProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showCapture, setShowCapture] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentQ = QUESTIONS[step];
  const progress = ((step) / QUESTIONS.length) * 100;
  const isComplete = step === QUESTIONS.length;

  const handleAnswer = (value: string) => {
    const updated = { ...answers, [currentQ.id]: value };
    setAnswers(updated);
    if (step < QUESTIONS.length - 1) {
      setTimeout(() => setStep(s => s + 1), 300);
    } else {
      setTimeout(() => setShowCapture(true), 300);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: name.split(" ")[0] || name,
          last_name: name.split(" ").slice(1).join(" ") || "",
          phone,
          email,
          source: "qualify_quiz",
          form_name: "Do I Qualify Quiz — Solar Freedom",
          quiz_answers: answers,
          problem_type: answers.problem_type,
          contract_type: answers.contract_type,
          company_status: answers.company_status,
        }),
      });
    } catch (_) { /* silent */ }
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div
        className={`rounded-2xl p-8 text-center ${compact ? "" : "my-10"}`}
        style={{ background: "oklch(0.13 0.012 265)", border: "1px solid oklch(0.72 0.19 50 / 0.4)" }}
      >
        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-amber-500" />
        </div>
        <h3
          className="font-black text-white mb-2"
          style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(1.6rem, 3vw, 2rem)" }}
        >
          YOU LIKELY QUALIFY
        </h3>
        <p className="text-zinc-400 text-sm leading-relaxed mb-4">
          Based on your answers, our attorneys will review your case within 24 hours. Grace Silver will reach out to schedule your free 15-minute consultation.
        </p>
        <div className="text-amber-500 text-sm font-bold">📞 (904) 921-4971 — Text or Call Grace Silver</div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl overflow-hidden ${compact ? "" : "my-10"}`}
      style={{ background: "oklch(0.13 0.012 265)", border: "1px solid oklch(0.72 0.19 50 / 0.3)" }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ background: "oklch(0.10 0.01 265)", borderBottom: "1px solid oklch(0.2 0.01 265)" }}
      >
        <div>
          <div className="text-amber-500 text-xs font-mono uppercase tracking-widest mb-0.5">Free Qualification Check</div>
          <div className="font-black text-white text-sm" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            DO I QUALIFY TO CANCEL MY SOLAR CONTRACT?
          </div>
        </div>
        <div className="text-zinc-500 text-xs font-mono shrink-0">
          {isComplete || showCapture ? QUESTIONS.length : step + 1}/{QUESTIONS.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-zinc-800">
        <motion.div
          className="h-full"
          style={{ background: "linear-gradient(90deg, oklch(0.72 0.19 50), oklch(0.65 0.21 40))" }}
          animate={{ width: `${showCapture ? 100 : progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {!showCapture ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h3 className="text-white font-bold text-lg mb-1 leading-snug">{currentQ.text}</h3>
              {currentQ.sub && <p className="text-zinc-500 text-xs mb-5">{currentQ.sub}</p>}
              <div className="space-y-2.5">
                {currentQ.answers.map((ans) => (
                  <button
                    key={ans.value}
                    onClick={() => handleAnswer(ans.value)}
                    className="w-full text-left px-4 py-3.5 rounded-xl text-sm font-medium transition-all hover:border-amber-500/60 hover:bg-amber-500/5 active:scale-[0.98] group"
                    style={{
                      background: "oklch(0.17 0.012 265)",
                      border: "1px solid oklch(0.25 0.01 265)",
                      color: "oklch(0.85 0.01 265)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span>{ans.label}</span>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-500 transition-colors shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="capture"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Result banner */}
              <div className="flex items-center gap-3 mb-5 p-4 rounded-xl" style={{ background: "oklch(0.72 0.19 50 / 0.1)", border: "1px solid oklch(0.72 0.19 50 / 0.3)" }}>
                <CheckCircle className="w-6 h-6 text-amber-500 shrink-0" />
                <div>
                  <div className="text-amber-400 font-black text-sm uppercase tracking-wide">You Likely Qualify!</div>
                  <div className="text-zinc-400 text-xs">Based on your answers, our attorneys can review your case.</div>
                </div>
              </div>

              <h3 className="text-white font-bold text-base mb-4">
                Where should we send your free case review?
              </h3>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500/50"
                  style={{ background: "oklch(0.18 0.012 265)", border: "1px solid oklch(0.3 0.01 265)" }}
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Phone number"
                  required
                  className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500/50"
                  style={{ background: "oklch(0.18 0.012 265)", border: "1px solid oklch(0.3 0.01 265)" }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500/50"
                  style={{ background: "oklch(0.18 0.012 265)", border: "1px solid oklch(0.3 0.01 265)" }}
                />
                <button
                  type="submit"
                  disabled={loading || !name || !phone || !email}
                  className="w-full py-3.5 rounded-lg font-black text-black text-sm uppercase tracking-widest transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.65 0.21 40))" }}
                >
                  {loading ? "Submitting..." : "GET MY FREE CASE REVIEW →"}
                </button>
              </form>
              <p className="text-zinc-600 text-[10px] text-center mt-3">
                No obligation. No cost. Grace Silver will reach out within minutes.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
