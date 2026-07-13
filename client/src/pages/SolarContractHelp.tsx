// Solar Contract Help — Pillar Page
// Design: Dark Industrial — same system as rest of site
// Primary keyword: solar contract help
// Pillar page aggregating all content about solar contract cancellation options

import { Link } from "wouter";
import { ArrowRight, CheckCircle, Phone, Shield, FileText, Scale, Home, DollarSign, AlertTriangle, Clock } from "lucide-react";
import { blogPosts } from "@/data/blog";
import { isBlogPostPublishable } from "@/data/publication-governance";
import { useSeoMeta } from "@/hooks/useSeoMeta";

const exitOptions = [
  {
    icon: <Scale className="w-6 h-6" />,
    title: "Legal Cancellation",
    description: "A fact-specific review can examine the agreement, transaction history, disclosures, and current law without assuming that cancellation is available.",
    timeline: "Varies by facts and process",
    cost: "Terms require written confirmation",
    href: "/solar-contract-laws",
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "Contract Rescission",
    description: "Review any cancellation notice, transaction location, dates, scope rules, and exemptions before relying on a cooling-off period.",
    timeline: "Requires document review",
    cost: "Confirm individually",
    href: "/solar-contract-laws",
  },
  {
    icon: <DollarSign className="w-6 h-6" />,
    title: "Negotiated Buyout",
    description: "Review the written buyout terms and ask the company or lender whether any negotiated option is available. No reduction is promised.",
    timeline: "Varies by party and process",
    cost: "Confirm in writing",
    href: "/solar-exit-options",
  },
  {
    icon: <Home className="w-6 h-6" />,
    title: "Transfer to Buyer",
    description: "Check the agreement, buyer and lender requirements, approval process, fees, payoff terms, and closing timeline before relying on a transfer.",
    timeline: "Depends on closing and approval",
    cost: "Confirm in the agreement",
    href: "/selling-house-with-solar",
  },
];

const commonProblems = [
  { label: "Loan payment or disclosure questions", href: "/solar-loan-help" },
  { label: "System performance or sales-record questions", href: "/solar-panel-scam" },
  { label: "Title, lien, or filing questions", href: "/solar-lien-removal" },
  { label: "Trying to sell your home", href: "/selling-house-with-solar" },
  { label: "Comparing possible contract paths", href: "/solar-exit-options" },
  { label: "State-law research", href: "/solar-contract-laws" },
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
  useSeoMeta({
    title: 'Solar Contract Help: Records and Questions to Review | Solar Freedom',
    description: 'Review solar agreement records, cancellation questions, financing disputes, negotiated options, and transfer requirements before choosing a path.',
    canonical: 'https://breakyoursolarcontract.com/solar-contract-help',
  });
  const articles = blogPosts.filter(
    (post) => featuredArticles.includes(post.slug) && isBlogPostPublishable(post),
  );

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
          <Shield className="w-3 h-3" /> SOLAR CONTRACT HELP
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          SOLAR CONTRACT<br /><span className="text-amber-400">HELP CENTER</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mb-8 leading-relaxed">
          Review common solar agreement questions and possible paths, from cancellation provisions and financing disputes to negotiated options and transfer at sale. Availability depends on the documents, facts, parties, and current law.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/#contact">
            <button className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-black" style={{ background: "oklch(0.78 0.18 85)" }}>
              Request Document Review <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          <a href="tel:+19049214971" className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white border border-white/20 hover:border-white/40 transition-colors">
            <Phone className="w-4 h-4" /> Call (904) 921-4971
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
          <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>RULES TO VERIFY</h2>
          <p className="text-gray-400 mb-8">Coverage, exceptions, deadlines, and remedies depend on the transaction. Use the official rule and the signed records; do not assume a general rule applies.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: <Clock className="w-5 h-5" />, title: "FTC Cooling-Off Rule", body: "The FTC rule covers certain door-to-door sales and requires cancellation disclosures for covered transactions. Check its scope and exceptions before relying on the three-business-day period.", sourceUrl: "https://www.ftc.gov/legal-library/browse/rules/cooling-period-sales-made-home-or-other-locations", sourceLabel: "FTC rule" },
              { icon: <AlertTriangle className="w-5 h-5" />, title: "Regulation Z Rescission", body: "Regulation Z provides a rescission right for some credit transactions secured by a consumer's principal dwelling, with stated exceptions and time limits. The loan and security documents determine whether it applies.", sourceUrl: "https://www.consumerfinance.gov/rules-policy/regulations/1026/23/", sourceLabel: "CFPB Regulation Z" },
              { icon: <Shield className="w-5 h-5" />, title: "Solar Financing Records", body: "The CFPB has identified risks in some solar-specific loans, including markups, tax-credit assumptions, payment changes, and savings representations. Compare those topics with the actual agreement; the report does not establish a violation in an individual case.", sourceUrl: "https://www.consumerfinance.gov/data-research/research-reports/issue-spotlight-solar-financing/", sourceLabel: "CFPB issue spotlight" },
            ].map((fact) => (
              <div key={fact.title} className="p-5 rounded-xl border border-white/8" style={{ background: "oklch(0.13 0.01 265)" }}>
                <div className="text-amber-400 mb-3">{fact.icon}</div>
                <h3 className="font-bold text-white mb-2">{fact.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{fact.body}</p>
                <a href={fact.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2">
                  Official source: {fact.sourceLabel}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED ARTICLES */}
      <section className="px-6 py-16 border-t border-white/8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-white mb-8" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>ESSENTIAL READING</h2>
          {articles.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          </div> : <p className="rounded-xl border border-white/8 p-5 text-sm text-gray-400">Articles remain out of public discovery until their claims, primary sources, reviewer, review date, and unique value pass the publication gate.</p>}
          {articles.length > 0 && <div className="mt-6 text-center">
            <Link href="/blog">
              <button className="text-amber-400 text-sm font-semibold hover:text-amber-300 transition-colors flex items-center gap-2 mx-auto">
                View reviewed articles <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 border-t border-white/8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            NOT SURE WHICH PATH IS RIGHT FOR YOU?
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Every solar contract situation is different. Gather the agreement and supporting records for an individual review before choosing a path. No result, fee arrangement, or timeline is guaranteed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/#contact">
              <button className="flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-black text-lg" style={{ background: "oklch(0.78 0.18 85)" }}>
                <CheckCircle className="w-5 h-5" /> Request Document Review
              </button>
            </Link>
          </div>
          <p className="text-gray-600 text-xs mt-4">Availability, fees, and response time require individual confirmation.</p>
        </div>
      </section>
    </div>
  );
}
