// Solar Contract Help — Pillar Page
// Design: Dark Industrial — same system as rest of site
// Primary keyword: solar contract help
// Pillar page aggregating all content about solar contract cancellation options

import { Link } from "wouter";
import { ArrowRight, CheckCircle, Phone, Shield, FileText, Scale, Home, DollarSign, AlertTriangle, Clock } from "lucide-react";
import { blogPosts } from "@/data/blog";
import StickyMobileBar from "@/components/StickyMobileBar";
import { useEffect } from "react";
import { useSeoMeta } from "@/hooks/useSeoMeta";

const exitOptions = [
  {
    icon: <Scale className="w-6 h-6" />,
    title: "Check Written Cancellation Terms",
    description: "Locate the signed Notice of Cancellation and the agreement's cancellation, termination, funding, default, and dispute sections.",
    timing: "Act promptly",
    record: "Notice + delivery proof",
    href: "/blog/solar-contract-rescission-rights",
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "Map the Contract Parties",
    description: "Identify the seller, installer, lender, system owner, servicer, warranty provider, and equipment manufacturers before directing a request.",
    timing: "Before escalating",
    record: "Contracts + statements",
    href: "/blog/how-to-get-out-of-a-solar-contract",
  },
  {
    icon: <DollarSign className="w-6 h-6" />,
    title: "Review Loan and Payoff Records",
    description: "Compare the cash price, amount financed, disclosures, payment schedule, account history, and a current written payoff quote.",
    timing: "Before missing payment",
    record: "Agreement + payoff quote",
    href: "/blog/goodleap-solar-loan-cancellation-hidden-fees-2026",
  },
  {
    icon: <Home className="w-6 h-6" />,
    title: "Prepare for a Home Sale",
    description: "Request transfer, assumption, prepayment, payoff, title, and escrow requirements early enough to avoid a closing delay.",
    timing: "Before listing or closing",
    record: "Written transfer terms",
    href: "/selling-house-with-solar",
  },
];

const commonProblems = [
  { label: "Payment changed or is higher than expected", href: "/blog/solar-payment-shock-help" },
  { label: "System production differs from the proposal", href: "/blog/undersized-solar-system-legal-options" },
  { label: "Sales savings statements did not match", href: "/blog/solar-misleading-savings-claims" },
  { label: "The company has not resolved a documented request", href: "/blog/how-to-file-a-complaint-against-solar-company-attorney-general" },
  { label: "Preparing to sell a home with solar", href: "/selling-house-with-solar" },
  { label: "Checking door-to-door sales statements", href: "/blog/solar-fraud-warning-signs" },
  { label: "The installer changed, closed, or stopped servicing", href: "/blog/solar-installer-out-of-business" },
  { label: "Reviewing a Sunrun agreement", href: "/blog/sunrun-solar-contract-cancellation-2026" },
  { label: "Reviewing a GoodLeap loan", href: "/blog/goodleap-solar-loan-cancellation-hidden-fees-2026" },
  { label: "Checking New Jersey records and complaints", href: "/blog/new-jersey-solar-contract-rights" },
];

const featuredArticles = [
  "sunrun-solar-contract-cancellation-2026",
  "goodleap-solar-loan-cancellation-hidden-fees-2026",
  "how-to-get-out-of-a-solar-contract",
  "blue-raven-solar-complaints",
  "adt-solar-complaints",
  "new-jersey-solar-contract-rights",
];

export default function SolarContractHelp() {
  useSeoMeta({
    title: 'Solar Contract Help: Documents, Options and Next Steps',
    description: 'Start with the solar agreement, financing records, cancellation notice, bills, production data, company status, home-sale requirements, and complaint channels.',
    canonical: 'https://breakyoursolarcontract.com/solar-contract-help',
  });
  useEffect(() => {
    document.title = "Solar Contract Help: Documents, Options and Next Steps";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Start with the solar agreement, financing records, cancellation notice, bills, production data, company status, home-sale requirements, and complaint channels.");
  }, []);

  const articles = blogPosts.filter(p => featuredArticles.includes(p.slug));

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.10 0.01 265)", color: "oklch(0.95 0.01 265)" }}>
      <StickyMobileBar />
      {/* NAV */}
      <nav className="border-b border-white/8 px-6 py-4 flex items-center justify-between sticky top-0 z-50" style={{ background: "oklch(0.10 0.01 265 / 95%)", backdropFilter: "blur(12px)" }}>
        <Link href="/">
          <span className="text-xl font-black tracking-tight text-white cursor-pointer" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>
            SOLAR<span className="text-amber-400">FREEDOM</span>
          </span>
        </Link>
        <Link href="/#contact">
          <button className="text-sm font-semibold px-4 py-2 rounded-lg text-black" style={{ background: "oklch(0.78 0.18 85)" }}>
            Contract Review
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
          Use this page to identify the agreement, parties, written cancellation terms, financing records, service history, company status, and home-sale requirements before choosing a financial or legal next step.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/#contact">
            <button className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-black" style={{ background: "oklch(0.78 0.18 85)" }}>
              Request Contract Review <ArrowRight className="w-4 h-4" />
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
          <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>PATHS TO CHECK</h2>
          <p className="text-gray-400 mb-10">There is no universal exit. Use the written agreement and current records to determine which path is relevant before taking action.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exitOptions.map((opt) => (
              <Link key={opt.href} href={opt.href}>
                <div className="p-6 rounded-xl border border-white/8 hover:border-amber-500/30 transition-all cursor-pointer h-full" style={{ background: "oklch(0.13 0.01 265)" }}>
                  <div className="text-amber-400 mb-4">{opt.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{opt.title}</h3>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">{opt.description}</p>
                  <div className="flex gap-4 text-xs">
                    <div>
                      <span className="text-gray-500">Timing: </span>
                      <span className="text-amber-400 font-mono">{opt.timing}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Key record: </span>
                      <span className="text-green-400 font-mono">{opt.record}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* VERIFICATION CHECKPOINTS */}
      <section className="px-6 py-16 border-t border-white/8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-white mb-8" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>VERIFICATION CHECKPOINTS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: <Clock className="w-5 h-5" />, title: "Cancellation Coverage", body: "The FTC Cooling-Off Rule covers certain sales made at a home or temporary location and has exclusions. Check the signed notice, transaction method, jurisdiction, and actual rule coverage." },
              { icon: <AlertTriangle className="w-5 h-5" />, title: "Financing Disclosures", body: "Compare the cash price, amount financed, APR, finance charge, total of payments, payment schedule, and expected-prepayment terms. A discrepancy requires fact-specific review." },
              { icon: <Shield className="w-5 h-5" />, title: "Official State Records", body: "Contractor registration, licensing, complaint channels, and remedies vary by state and transaction. Use official agency records rather than a universal online summary." },
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
                View All Articles <ArrowRight className="w-4 h-4" />
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
            Every solar contract situation is different. Gather the agreement and supporting records for an individual review before choosing a path. No result, fee arrangement, or timeline is guaranteed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/#contact">
              <button className="flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-black text-lg" style={{ background: "oklch(0.78 0.18 85)" }}>
                <CheckCircle className="w-5 h-5" /> Get Free Case Review
              </button>
            </Link>
          </div>
          <p className="text-gray-600 text-xs mt-4">Availability, fees, and response time require individual confirmation.</p>
        </div>
      </section>
    </div>
  );
}
