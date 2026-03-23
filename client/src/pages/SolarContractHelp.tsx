// Solar Contract Help — Pillar Page
// Design: Dark Industrial — same system as rest of site
// Primary keyword: solar contract help
// Pillar page aggregating all content about solar contract cancellation options

import { Link } from "wouter";
import { ArrowRight, CheckCircle, Phone, Shield, FileText, Scale, Home, DollarSign, AlertTriangle, Clock } from "lucide-react";
import { blogPosts } from "@/data/blog";
import { useEffect } from "react";

const exitOptions = [
  {
    icon: <Scale className="w-6 h-6" />,
    title: "Legal Cancellation",
    description: "Challenge the contract based on misrepresentation, TILA violations, or state consumer protection law. Often the lowest-cost path.",
    timeline: "30–90 days",
    cost: "Contingency basis available",
    href: "/blog/how-to-get-out-of-a-solar-contract",
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "Contract Rescission",
    description: "If you were not given a proper Notice of Cancellation at signing, your 3-day FTC cooling-off window may still be legally open.",
    timeline: "7–30 days",
    cost: "Low to none",
    href: "/blog/solar-contract-rescission-rights",
  },
  {
    icon: <DollarSign className="w-6 h-6" />,
    title: "Negotiated Buyout",
    description: "Negotiate a reduced buyout amount with the solar company or lender. Often possible for 30–60% less than the stated buyout price.",
    timeline: "30–60 days",
    cost: "Reduced buyout",
    href: "/blog/how-to-negotiate-solar-contract-cancellation",
  },
  {
    icon: <Home className="w-6 h-6" />,
    title: "Transfer to Buyer",
    description: "When selling your home, transfer the solar agreement to the buyer. Works best for leases and PPAs with reasonable terms.",
    timeline: "At closing",
    cost: "None if successful",
    href: "/blog/sell-house-with-solar-panels",
  },
];

const commonProblems = [
  { label: "Payment higher than electric bill", href: "/blog/solar-payments-too-high-help" },
  { label: "System not producing what was promised", href: "/blog/solar-system-underperforming" },
  { label: "Misleading savings claims", href: "/blog/solar-misleading-savings-claims" },
  { label: "Solar company won't respond", href: "/blog/solar-company-wont-help" },
  { label: "Trying to sell your home", href: "/blog/selling-house-with-solar-loan" },
  { label: "Door-to-door sales pressure", href: "/blog/solar-door-to-door-sales-pressure" },
  { label: "Solar company went bankrupt", href: "/blog/solar-company-went-bankrupt" },
  { label: "Contract red flags", href: "/blog/solar-contract-red-flags" },
  { label: "Solar regret", href: "/blog/solar-regret-what-to-do" },
  { label: "Credit score concerns", href: "/blog/solar-credit-score-fears" },
];

const featuredArticles = [
  "how-to-get-out-of-a-solar-contract",
  "solar-contract-rescission-rights",
  "solar-panel-scam-signs-and-solutions",
  "cancel-solar-loan-or-lease-early",
  "solar-payments-too-high-help",
  "how-to-negotiate-solar-contract-cancellation",
];

export default function SolarContractHelp() {
  useEffect(() => {
    document.title = "Solar Contract Help: All Your Options Explained | Solar Freedom";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Comprehensive solar contract help: legal cancellation, rescission rights, negotiated buyout, and transfer options. Free case review available.");
  }, []);

  const articles = blogPosts.filter(p => featuredArticles.includes(p.slug));

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
          <Shield className="w-3 h-3" /> SOLAR CONTRACT HELP
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          SOLAR CONTRACT<br /><span className="text-amber-400">HELP CENTER</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mb-8 leading-relaxed">
          If you are stuck in a solar contract that is not working for you, you are not alone — and you are not necessarily trapped. This page covers every exit option available to homeowners, from legal cancellation to negotiated buyouts to transfer at sale.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/#contact">
            <button className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-black" style={{ background: "oklch(0.78 0.18 85)" }}>
              Get Free Case Review <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          <a href="tel:+18005551234" className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white border border-white/20 hover:border-white/40 transition-colors">
            <Phone className="w-4 h-4" /> Call Now
          </a>
        </div>
      </section>

      {/* WHAT IS YOUR PROBLEM */}
      <section className="px-6 py-16 border-t border-white/8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>WHAT IS YOUR SITUATION?</h2>
          <p className="text-gray-400 mb-8">Select the issue that best describes your situation for targeted guidance.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {commonProblems.map((p) => (
              <Link key={p.href} href={p.href}>
                <div className="flex items-center gap-3 p-4 rounded-lg border border-white/8 hover:border-amber-500/30 transition-all cursor-pointer group" style={{ background: "oklch(0.13 0.01 265)" }}>
                  <ArrowRight className="w-4 h-4 text-amber-400 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                  <span className="text-gray-200 text-sm font-medium">{p.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* EXIT OPTIONS */}
      <section className="px-6 py-16 border-t border-white/8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>YOUR EXIT OPTIONS</h2>
          <p className="text-gray-400 mb-10">There is no single path out of a solar contract. The right option depends on your contract type, how long ago you signed, and the specific facts of your situation.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exitOptions.map((opt) => (
              <Link key={opt.href} href={opt.href}>
                <div className="p-6 rounded-xl border border-white/8 hover:border-amber-500/30 transition-all cursor-pointer h-full" style={{ background: "oklch(0.13 0.01 265)" }}>
                  <div className="text-amber-400 mb-4">{opt.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{opt.title}</h3>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">{opt.description}</p>
                  <div className="flex gap-4 text-xs">
                    <div>
                      <span className="text-gray-500">Timeline: </span>
                      <span className="text-amber-400 font-mono">{opt.timeline}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Cost: </span>
                      <span className="text-green-400 font-mono">{opt.cost}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* KEY LEGAL FACTS */}
      <section className="px-6 py-16 border-t border-white/8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-white mb-8" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>KEY LEGAL FACTS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: <Clock className="w-5 h-5" />, title: "FTC Cooling-Off Rule", body: "You have 3 business days to cancel any contract signed at your home. If you were not given written notice of this right, the window may still be legally open — even years later." },
              { icon: <AlertTriangle className="w-5 h-5" />, title: "TILA Violations", body: "The Truth in Lending Act requires specific disclosures for solar loans. If your lender failed to provide them, you may have a right of rescission regardless of how long ago you signed." },
              { icon: <Shield className="w-5 h-5" />, title: "State Consumer Protection", body: "Most states have Deceptive Trade Practices Acts that allow consumers to void contracts obtained through misrepresentation. These laws often have stronger remedies than federal law." },
            ].map((fact) => (
              <div key={fact.title} className="p-5 rounded-xl border border-white/8" style={{ background: "oklch(0.13 0.01 265)" }}>
                <div className="text-amber-400 mb-3">{fact.icon}</div>
                <h3 className="font-bold text-white mb-2">{fact.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{fact.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED ARTICLES */}
      <section className="px-6 py-16 border-t border-white/8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-white mb-8" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>ESSENTIAL READING</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <div className="p-5 rounded-xl border border-white/8 hover:border-amber-500/30 transition-all cursor-pointer h-full flex flex-col" style={{ background: "oklch(0.13 0.01 265)" }}>
                  <div className="text-xs font-mono text-amber-400 mb-2">{post.category}</div>
                  <h3 className="font-bold text-white text-sm mb-2 leading-snug flex-1">{post.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/blog">
              <button className="text-amber-400 text-sm font-semibold hover:text-amber-300 transition-colors flex items-center gap-2 mx-auto">
                View All 45 Articles <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 border-t border-white/8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            NOT SURE WHICH PATH IS RIGHT FOR YOU?
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Every solar contract situation is different. Our attorneys review your specific agreement, identify your legal options, and recommend the path that minimizes your cost and timeline. The review is free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/#contact">
              <button className="flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-black text-lg" style={{ background: "oklch(0.78 0.18 85)" }}>
                <CheckCircle className="w-5 h-5" /> Get Free Case Review
              </button>
            </Link>
          </div>
          <p className="text-gray-600 text-xs mt-4">No obligation. No upfront cost. Results in 48 hours.</p>
        </div>
      </section>
    </div>
  );
}
