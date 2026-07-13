// Solar Exit Options — Pillar Page
// Design: Dark Industrial — same system as rest of site
// Primary keyword: solar exit options
// Pillar page for homeowners exploring how to exit solar agreements

import { Link } from "wouter";
import { ArrowRight, CheckCircle, Shield, Scale, FileText, DollarSign, Home, AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { useSeoMeta } from "@/hooks/useSeoMeta";

const steps = [
  {
    step: "01",
    title: "Identify Your Contract Type",
    body: "Identify whether the signed documents describe a loan, lease, power-purchase agreement, cash purchase, or another structure. Ownership, payment, transfer, and purchase terms vary.",
    link: "/solar-contract-help",
    linkText: "Contract record checklist",
  },
  {
    step: "02",
    title: "Review the Records and Applicable Rules",
    body: "Compare the signed agreement, disclosures, sales materials, payment history, and current official rules. A document or rule is not a legal ground or remedy until its applicability is established for the individual transaction.",
    link: "/solar-panel-scam",
    linkText: "Sales and financing records",
  },
  {
    step: "03",
    title: "Request Written Terms",
    body: "Ask the relevant counterparty for any current payoff, purchase, transfer, termination, dispute, or release terms. A listed process is not necessarily available in an individual agreement.",
    link: "/selling-house-with-solar",
    linkText: "Sale and transfer records",
  },
  {
    step: "04",
    title: "Get Legal Representation",
    body: "Solar agreement disputes can involve contract, financing, property, and consumer-protection questions. Ask any attorney you consider about relevant experience, jurisdiction, scope, and fees in writing.",
    link: "/how-it-works",
    linkText: "How document review works",
  },
];

const contractTypes = [
  {
    type: "Solar Loan",
    icon: <DollarSign className="w-5 h-5" />,
    description: "Review the note, payment schedule, system-ownership terms, security documents, payoff provision, and written dispute procedure. These terms vary by agreement.",
    exitOptions: ["Request a current payoff", "Check any transfer provision", "Compare disclosures with the note", "Ask which written dispute process applies"],
    difficulty: "Requires document review",
  },
  {
    type: "Solar Lease",
    icon: <FileText className="w-5 h-5" />,
    description: "Review the stated owner, term, payment or escalator formula, transfer process, purchase option, early-termination language, and required approvals.",
    exitOptions: ["Check transfer requirements", "Request written purchase terms", "Review early-termination language", "Confirm title and closing requirements"],
    difficulty: "Terms vary by agreement",
  },
  {
    type: "PPA",
    icon: <Scale className="w-5 h-5" />,
    description: "Review the energy-rate formula, system ownership, term, transfer and purchase provisions, recorded filings, and any required counterparty approval.",
    exitOptions: ["Check transfer requirements", "Request written purchase terms", "Verify the rate formula", "Review recorded filings and approvals"],
    difficulty: "Terms vary by agreement",
  },
];

export default function SolarExitOptions() {
  useSeoMeta({
    title: 'Solar Exit Options: Documents and Questions to Review | Solar Freedom',
    description: 'Compare solar agreement types, written transfer or payoff terms, financing records, and current official resources before choosing a next step.',
    canonical: 'https://breakyoursolarcontract.com/solar-exit-options',
  });
  useEffect(() => {
    document.title = "Solar Exit Options: Documents and Questions to Review | Solar Freedom";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Compare solar agreement types, written transfer or payoff terms, financing records, and current official resources before choosing a next step.");
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
            Document Review
          </button>
        </Link>
      </nav>

      {/* HERO */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full mb-6" style={{ background: "oklch(0.14 0.03 50 / 20%)" }}>
          <Shield className="w-3 h-3" /> SOLAR EXIT OPTIONS
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          REVIEW YOUR<br /><span className="text-amber-400">SOLAR OPTIONS</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mb-8 leading-relaxed">
          This page organizes the agreement types, records, written terms, and current sources to check before deciding whether any payoff, purchase, transfer, dispute, or other process is available.
        </p>
        <Link href="/#contact">
          <button className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-black" style={{ background: "oklch(0.78 0.18 85)" }}>
            Request Document Review <ArrowRight className="w-4 h-4" />
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
          <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>RECORDS BY AGREEMENT TYPE</h2>
          <p className="text-gray-400 mb-10">The written agreement type affects which ownership, payment, transfer, purchase, payoff, and approval provisions should be checked.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contractTypes.map((ct) => (
                <div key={ct.type} className="p-6 rounded-xl border border-white/8 h-full flex flex-col" style={{ background: "oklch(0.13 0.01 265)" }}>
                  <div className="text-amber-400 mb-3">{ct.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{ct.type}</h3>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">{ct.description}</p>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-2 font-mono uppercase tracking-wider">Questions to Resolve</div>
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
                    <span className="text-xs text-gray-500">Review status: </span>
                    <span className="text-xs font-mono text-amber-400">{ct.difficulty}</span>
                  </div>
                </div>
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
                Stopping payments can trigger default or other consequences under the agreement. Review the documents and obtain qualified advice before changing payments. Any service, fee, or response time requires individual written confirmation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STATE RESEARCH */}
      <section className="px-6 py-16 border-t border-white/8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>STATE-LAW RESEARCH</h2>
          <p className="text-gray-400 mb-8">State rules, filing systems, limitation periods, and available processes differ. Verify every proposition against a current official source before relying on it.</p>
          <Link href="/solar-contract-laws">
            <span className="inline-flex px-4 py-2 rounded-lg text-sm font-medium text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-all cursor-pointer">
              Open state-law research hub →
            </span>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 border-t border-white/8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            READY TO REVIEW THE DOCUMENTS?
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Request an individual review of the agreement and supporting records. Options, availability, fees, and timing depend on the facts and any written engagement terms.
          </p>
          <Link href="/#contact">
            <button className="flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-black text-lg mx-auto" style={{ background: "oklch(0.78 0.18 85)" }}>
              <CheckCircle className="w-5 h-5" /> Request Document Review
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
