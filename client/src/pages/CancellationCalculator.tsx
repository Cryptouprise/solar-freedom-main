import { useState } from "react";
import { Link } from "wouter";
import { useSeoMeta } from "@/hooks/useSeoMeta";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CalcState {
  contractType: string;
  monthlyPayment: string;
  yearsRemaining: string;
  company: string;
  issueType: string;
  signedWhere: string;
  disclosedRescission: string;
  systemWorking: string;
  escalatorClause: string;
  dealerFeeDisclosed: string;
}

interface CalcResult {
  score: number; // 0-100 cancellation strength
  grounds: string[];
  estimatedSavings: string;
  recommendedAction: string;
  urgency: "high" | "medium" | "low";
  headline: string;
  subtext: string;
}

const INITIAL_STATE: CalcState = {
  contractType: "",
  monthlyPayment: "",
  yearsRemaining: "",
  company: "",
  issueType: "",
  signedWhere: "",
  disclosedRescission: "",
  systemWorking: "",
  escalatorClause: "",
  dealerFeeDisclosed: "",
};

// ─── Calculator Logic ─────────────────────────────────────────────────────────
function calculateResult(state: CalcState): CalcResult {
  let score = 0;
  const grounds: string[] = [];

  const payment = parseFloat(state.monthlyPayment) || 0;
  const years = parseFloat(state.yearsRemaining) || 0;
  const totalRemaining = payment * years * 12;

  // FTC Cooling-Off / TILA rescission
  if (state.signedWhere === "home") {
    score += 25;
    grounds.push("Home solicitation: check whether a written cancellation notice was provided.");
  }
  if (state.disclosedRescission === "no") {
    score += 30;
    grounds.push("Right-to-cancel disclosure: check whether the agreement includes the written notice.");
  }

  // Dealer fee / TILA violation
  if (state.dealerFeeDisclosed === "no" && (state.contractType === "loan" || state.contractType === "both")) {
    score += 25;
    grounds.push("Dealer fee: check the financing paperwork for a markup that was not explained.");
  }

  // System not working
  if (state.systemWorking === "no" || state.systemWorking === "partial") {
    score += 20;
    grounds.push("Performance: compare the proposal estimate to monitoring or utility records.");
  }

  // Escalator clause
  if (state.escalatorClause === "yes") {
    score += 15;
    grounds.push("Annual increase: check whether the rate in the signed agreement matches what was explained.");
  }

  // Company-specific grounds
  const bankruptCompanies = ["pink-energy", "sunnova", "sungevity", "adt-solar", "sunpower"];
  if (bankruptCompanies.includes(state.company)) {
    score += 20;
    grounds.push(`${state.company === "pink-energy" ? "Pink Energy" : state.company === "sunnova" ? "Sunnova" : state.company === "sungevity" ? "Sungevity" : state.company === "adt-solar" ? "ADT Solar" : "SunPower"} status: confirm who still services the system and who collects payments.`);
  }

  // Issue type
  if (state.issueType === "misled") {
    score += 15;
    grounds.push("Sales claims: gather the proposal, texts, and what was promised versus the signed terms.");
  } else if (state.issueType === "cant-sell") {
    score += 10;
    grounds.push("Home sale: gather the lien, transfer, and buyout paperwork.");
  } else if (state.issueType === "company-gone") {
    score += 15;
    grounds.push("Installer out of business: gather warranty and lender documents and confirm who still collects.");
  }

  // Cap at 100
  score = Math.min(score, 100);

  // Remaining payments from the answers entered. Not a savings promise.
  const estimatedSavings =
    totalRemaining > 0
      ? `$${Math.round(totalRemaining).toLocaleString()} remaining`
      : "Add payment and years to see remaining payments";

  // Urgency
  let urgency: "high" | "medium" | "low" = "low";
  if (score >= 60) urgency = "high";
  else if (score >= 35) urgency = "medium";

  // Headline & subtext
  let headline = "";
  let subtext = "";
  let recommendedAction = "";

  if (score >= 70) {
    headline = "SEVERAL DOCUMENTS TO CHECK";
    subtext =
      "Your answers point to several items worth checking in the signed agreement, proposal, and payment records. That is a document review, not a finding that you can cancel.";
    recommendedAction = "Use the cancellation letter to send a written request, then book a review of the actual documents.";
  } else if (score >= 45) {
    headline = "WORTH A DOCUMENT REVIEW";
    subtext =
      "A few answers suggest terms worth comparing to what was promised. Options depend on the agreement, the facts, and the state. Nothing here is a legal conclusion.";
    recommendedAction = "Start with the written cancellation letter, then have the signed documents reviewed.";
  } else if (score >= 20) {
    headline = "CHECK THE PAPERWORK";
    subtext =
      "The answers do not show a clear path by themselves. The signed contract, proposal, and lender paperwork decide what is actually available.";
    recommendedAction = "Pull the contract and the original proposal, then use the letter if you want a written request on file.";
  } else {
    headline = "NO SCORE REPLACES THE CONTRACT";
    subtext =
      "These answers do not show an obvious issue. That does not mean there is no option, and it does not mean there is one. Read the agreement before deciding.";
    recommendedAction = "The calculator cannot tell you that you qualify. The letter and a document review are the next step if you want one.";
  }

  return {
    score,
    grounds,
    estimatedSavings,
    recommendedAction,
    urgency,
    headline,
    subtext,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CancellationCalculator() {
  useSeoMeta({
    title: "Solar Contract Cancellation Calculator — What to Check | Solar Freedom",
    description:
      "Answer a few questions about your solar agreement and see which documents to gather before a review. Not a cancellation finding and not legal advice.",
    canonical: "https://breakyoursolarcontract.com/calculator",
  });

  const [state, setState] = useState<CalcState>(INITIAL_STATE);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [step, setStep] = useState(0);

  const update = (key: keyof CalcState, val: string) =>
    setState((s) => ({ ...s, [key]: val }));

  const isComplete =
    state.contractType &&
    state.monthlyPayment &&
    state.yearsRemaining &&
    state.company &&
    state.issueType &&
    state.signedWhere &&
    state.disclosedRescission &&
    state.systemWorking;

  const handleCalculate = () => {
    setResult(calculateResult(state));
    setStep(10); // jump to results
  };

  const scoreColor = (score: number) => {
    if (score >= 60) return "text-amber-400";
    if (score >= 35) return "text-yellow-400";
    return "text-gray-400";
  };

  const scoreBg = (score: number) => {
    if (score >= 60) return "from-amber-500/20 to-amber-500/5 border-amber-500/40";
    if (score >= 35) return "from-yellow-500/20 to-yellow-500/5 border-yellow-500/40";
    return "from-gray-500/20 to-gray-500/5 border-gray-500/40";
  };

  const questions = [
    // Q0 — contract type
    {
      key: "contractType" as keyof CalcState,
      question: "What type of solar contract do you have?",
      options: [
        { val: "loan", label: "Solar Loan", desc: "You own the panels, paying a monthly loan" },
        { val: "lease", label: "Solar Lease / PPA", desc: "You rent the panels or pay per kWh" },
        { val: "both", label: "Not sure", desc: "I need help identifying my contract type" },
      ],
    },
    // Q1 — monthly payment
    {
      key: "monthlyPayment" as keyof CalcState,
      question: "What is your current monthly solar payment?",
      options: [
        { val: "75", label: "Under $100/mo" },
        { val: "125", label: "$100 – $150/mo" },
        { val: "175", label: "$150 – $200/mo" },
        { val: "225", label: "$200 – $250/mo" },
        { val: "300", label: "Over $250/mo" },
      ],
    },
    // Q2 — years remaining
    {
      key: "yearsRemaining" as keyof CalcState,
      question: "How many years are left on your contract?",
      options: [
        { val: "3", label: "Less than 5 years" },
        { val: "8", label: "5 – 10 years" },
        { val: "15", label: "10 – 20 years" },
        { val: "22", label: "20 – 25 years" },
        { val: "25", label: "Full 25 years remaining" },
      ],
    },
    // Q3 — company
    {
      key: "company" as keyof CalcState,
      question: "Who is your solar company or lender?",
      options: [
        { val: "sunrun", label: "Sunrun" },
        { val: "goodleap", label: "GoodLeap / Loanpal" },
        { val: "sunnova", label: "Sunnova" },
        { val: "pink-energy", label: "Pink Energy" },
        { val: "adt-solar", label: "ADT Solar" },
        { val: "sunpower", label: "SunPower" },
        { val: "freedom-forever", label: "Freedom Forever" },
        { val: "mosaic", label: "Mosaic Solar" },
        { val: "tesla", label: "Tesla Solar" },
        { val: "other", label: "Other / Not listed" },
      ],
    },
    // Q4 — issue type
    {
      key: "issueType" as keyof CalcState,
      question: "What is your main issue?",
      options: [
        { val: "payment-too-high", label: "Monthly payment is too high" },
        { val: "misled", label: "I was misled during the sale" },
        { val: "not-working", label: "System doesn't work / underperforms" },
        { val: "cant-sell", label: "Can't sell my home because of the solar lien" },
        { val: "company-gone", label: "Company went out of business" },
        { val: "hidden-fees", label: "Hidden fees I wasn't told about" },
      ],
    },
    // Q5 — where signed
    {
      key: "signedWhere" as keyof CalcState,
      question: "Where did you sign your solar contract?",
      options: [
        { val: "home", label: "At my home (salesperson came to me)" },
        { val: "office", label: "At a company office or showroom" },
        { val: "online", label: "Online / electronically" },
        { val: "unsure", label: "I don't remember" },
      ],
    },
    // Q6 — rescission disclosed
    {
      key: "disclosedRescission" as keyof CalcState,
      question: "Were you told about your right to cancel within 3 business days?",
      options: [
        { val: "yes", label: "Yes — I received a cancellation notice" },
        { val: "no", label: "No — nobody mentioned this right" },
        { val: "unsure", label: "I'm not sure" },
      ],
    },
    // Q7 — system working
    {
      key: "systemWorking" as keyof CalcState,
      question: "Is your solar system working as promised?",
      options: [
        { val: "yes", label: "Yes — it works fine" },
        { val: "partial", label: "Partially — underperforms vs. what was promised" },
        { val: "no", label: "No — it barely works or never worked" },
        { val: "unsure", label: "I haven't checked" },
      ],
    },
    // Q8 — escalator clause
    {
      key: "escalatorClause" as keyof CalcState,
      question: "Does your contract include an annual payment escalator (payments increase each year)?",
      options: [
        { val: "yes", label: "Yes — my payment increases annually" },
        { val: "no", label: "No — fixed payment" },
        { val: "unsure", label: "I'm not sure — need to check" },
      ],
    },
    // Q9 — dealer fee
    {
      key: "dealerFeeDisclosed" as keyof CalcState,
      question: "Were you told your loan included a dealer fee (a markup added by the installer)?",
      options: [
        { val: "yes", label: "Yes — it was explained to me" },
        { val: "no", label: "No — I had no idea about any dealer fee" },
        { val: "unsure", label: "I'm not sure what a dealer fee is" },
        { val: "na", label: "I have a lease/PPA, not a loan" },
      ],
    },
  ];

  const currentQ = questions[step];

  return (
    <div className="min-h-screen bg-[#0D0F14] text-white">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-white/10 bg-[#0D0F14]/95 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-mono uppercase tracking-wider">Solar Freedom</span>
          </Link>
          <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
            Free Cancellation Calculator
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* ─── Hero ─────────────────────────────────────────────────────────── */}
        {step === 0 && !result && (
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5 mb-6">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-amber-400 text-xs font-mono uppercase tracking-wider">Free — Takes 60 Seconds</span>
            </div>
            <h1 className="font-display text-5xl md:text-6xl text-white mb-4 leading-tight">
              SOLAR CONTRACT<br />
              <span className="text-amber-400">CANCELLATION</span><br />
              CALCULATOR
            </h1>
            <p className="text-gray-300 text-lg max-w-xl mx-auto">
              Answer 10 questions about your solar agreement and see which documents to gather. This is not a cancellation finding and not legal advice.
            </p>
          </div>
        )}

        {/* ─── Progress Bar ─────────────────────────────────────────────────── */}
        {step < 10 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-xs font-mono uppercase tracking-wider">
                Question {Math.min(step + 1, 10)} of 10
              </span>
              <span className="text-amber-400 text-xs font-mono">
                {Math.round(((step + 1) / 10) * 100)}% complete
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                style={{ width: `${((step + 1) / 10) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* ─── Questions ────────────────────────────────────────────────────── */}
        {step < 10 && currentQ && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8">
            <h2 className="font-display text-2xl md:text-3xl text-white mb-6">{currentQ.question}</h2>
            <div className="space-y-3">
              {currentQ.options.map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => {
                    update(currentQ.key, opt.val);
                    if (step < 9) {
                      setStep((s) => s + 1);
                    }
                  }}
                  className={`w-full p-4 rounded-lg border text-left transition-all duration-200 ${
                    state[currentQ.key] === opt.val
                      ? "border-amber-500 bg-amber-500/15 text-amber-300"
                      : "border-white/10 bg-white/5 text-gray-300 hover:border-amber-500/50 hover:bg-white/10"
                  }`}
                >
                  <div className="font-semibold">{opt.label}</div>
                  {"desc" in opt && opt.desc && (
                    <div className="text-gray-400 text-sm mt-0.5">{opt.desc}</div>
                  )}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-6 pt-6 border-t border-white/10">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="text-gray-400 hover:text-white text-sm font-mono uppercase tracking-wider transition-colors"
                >
                  ← Back
                </button>
              ) : (
                <div />
              )}
              {step === 9 && state[currentQ.key] && (
                <button
                  type="button"
                  onClick={handleCalculate}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-3 rounded-lg transition-all duration-200 hover:scale-105 text-sm uppercase tracking-wider"
                >
                  Calculate My Score →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─── Results ──────────────────────────────────────────────────────── */}
        {result && (
          <div className="space-y-6">
            {/* Score Card */}
            <div className={`bg-gradient-to-br ${scoreBg(result.score)} border rounded-xl p-8 text-center`}>
              <div className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-3">
                Document-check score
              </div>
              <div className={`font-display text-8xl ${scoreColor(result.score)} mb-2`}>
                {result.score}
              </div>
              <div className="text-gray-400 text-sm font-mono mb-4">out of 100</div>
              <h2 className={`font-display text-3xl md:text-4xl ${scoreColor(result.score)} mb-3`}>
                {result.headline}
              </h2>
              <p className="text-gray-300 max-w-lg mx-auto">{result.subtext}</p>
            </div>

            {/* Estimated Savings */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">
                Remaining payments from your answers
              </div>
              <div className="font-display text-4xl text-amber-400">{result.estimatedSavings}</div>
              <p className="text-gray-400 text-sm mt-2">
                This is the payment and years you entered, multiplied out. It is not an estimate of what you will save.
              </p>
            </div>

            {/* Legal Grounds */}
            {result.grounds.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-display text-xl text-white mb-4">What to check in the documents</h3>
                <div className="space-y-3">
                  {result.grounds.map((ground, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-300 text-sm">{ground}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/40 rounded-xl p-8 text-center">
              <h3 className="font-display text-3xl text-white mb-3">NEXT STEP: WRITE IT DOWN</h3>
              <p className="text-gray-300 mb-6">{result.recommendedAction}</p>
              <Link
                href="/free-cancellation-letter"
                className="inline-block bg-amber-500 hover:bg-amber-400 text-black font-bold px-10 py-4 rounded-lg transition-all duration-200 hover:scale-105 text-lg uppercase tracking-wider"
              >
                Get the cancellation letter
              </Link>
              <p className="text-gray-500 text-xs mt-4 font-mono">
                The letter is a written request. It does not cancel the agreement by itself.
              </p>
            </div>

            {/* Disclaimer */}
            <p className="text-gray-600 text-xs text-center leading-relaxed">
              This calculator only sorts the answers you typed. It is not legal advice and it does not say you can cancel. Options depend on the signed agreement, the facts, and the state.
            </p>

            {/* Restart */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => { setState(INITIAL_STATE); setResult(null); setStep(0); }}
                className="text-gray-500 hover:text-gray-300 text-sm font-mono uppercase tracking-wider transition-colors"
              >
                ← Start Over
              </button>
            </div>
          </div>
        )}

        {/* ─── SEO Content Below Calculator ─────────────────────────────────── */}
        {!result && step === 0 && (
          <div className="mt-16 space-y-8 text-gray-400">
            <div className="border-t border-white/10 pt-8">
              <h2 className="font-display text-2xl text-white mb-4">How the Calculator Works</h2>
              <p className="mb-4">
                This calculator compares your answers to documents that are worth gathering: a home-solicitation cancellation notice, a right-to-cancel disclosure, dealer-fee paperwork, an annual increase clause, and who still services the system. It does not weigh the likelihood of any outcome.
              </p>
              <p>
                The score is not a finding. A low score does not mean you have no options, and a high score does not mean you can cancel. The signed agreement decides that.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl text-white mb-4">What the Score Means</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { range: "60 – 100", label: "Several items", color: "border-amber-500/40 bg-amber-500/10", textColor: "text-amber-400", desc: "Several documents to compare. Not a finding that you can cancel." },
                  { range: "35 – 59", label: "Compare paperwork", color: "border-yellow-500/40 bg-yellow-500/10", textColor: "text-yellow-400", desc: "A few answers are worth checking against the signed agreement." },
                  { range: "0 – 34", label: "Read the contract", color: "border-gray-500/40 bg-gray-500/10", textColor: "text-gray-300", desc: "The answers alone do not show an issue. Read the signed agreement." },
                ].map((tier) => (
                  <div key={tier.range} className={`border rounded-lg p-4 ${tier.color}`}>
                    <div className={`font-display text-2xl ${tier.textColor} mb-1`}>{tier.range}</div>
                    <div className="font-semibold text-white text-sm mb-2">{tier.label}</div>
                    <p className="text-xs">{tier.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl text-white mb-4">Common Legal Grounds Explained</h2>
              <div className="space-y-4">
                {[
                  { title: "FTC Cooling-Off Rule", body: "Federal law gives you 3 business days to cancel any contract signed in your home. If the salesperson did not give you a written notice of this right, the cancellation window may extend significantly." },
                  { title: "TILA Right of Rescission", body: "The Truth in Lending Act gives you 3 business days to rescind a loan secured by your home. If this right was not properly disclosed, the window extends to 3 years from the date of signing." },
                  { title: "Dealer fees", body: "Some solar loans include a dealer fee, a markup paid to the installer. Check the financing paperwork to see whether that fee was explained before you signed." },
                  { title: "Escalator Clauses", body: "Many Sunrun and SunPower leases include annual payment escalators of 2.9%. If this was not clearly disclosed, it may constitute misrepresentation under your state's consumer protection laws." },
                  { title: "Installer no longer operating", body: "If the installer is no longer operating, confirm who still services the system and who still collects the payments. That status does not by itself cancel the loan or lease." },
                ].map((item) => (
                  <div key={item.title} className="border border-white/10 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-sm">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
