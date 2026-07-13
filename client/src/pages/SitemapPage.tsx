import { Link } from "wouter";
import { hasPublishableStateLawEvidence, stateLaws } from "@/data/state-laws";
import { blogPosts } from "@/data/blog";
import { isBlogPostPublishable } from "@/data/publication-governance";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { trackPhoneClick } from "@/lib/analytics";

const STATIC_PAGES = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/solar-companies", label: "Solar Company Hub" },
  { href: "/solar-contract-laws", label: "Solar Contract Laws by State" },
  { href: "/solar-panel-scam", label: "Solar Panel Scam Guide" },
  { href: "/solar-contract-help", label: "Solar Contract Help" },
  { href: "/solar-exit-options", label: "Solar Exit Options" },
  { href: "/solar-lien-removal", label: "Solar Lien Removal" },
  { href: "/solar-loan-help", label: "Solar Loan Help" },
  { href: "/media", label: "Watch & Listen" },
  { href: "/blog", label: "Blog" },
];

export default function SitemapPage() {
  const { phoneDisplay, phoneHref, phoneDigits } = useSiteConfig();
  const reviewedStateLaws = stateLaws.filter(hasPublishableStateLawEvidence);
  const reviewedBlogPosts = blogPosts.filter(isBlogPostPublishable);

  return (
    <div className="min-h-screen bg-[#0D0F14] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0D0F14]/95">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link href="/" className="text-amber-400 text-sm font-mono hover:text-amber-300 transition-colors">
            ← Back to Home
          </Link>
          <h1 className="font-display text-4xl md:text-5xl text-white mt-4">SITE MAP</h1>
          <p className="text-gray-400 mt-2">
            Directory of search-publication-eligible pages on{" "}
            <a href="https://breakyoursolarcontract.com" className="text-amber-400 hover:underline">
              breakyoursolarcontract.com
            </a>{" "}
            — {reviewedStateLaws.length} source-reviewed state detail pages and {reviewedBlogPosts.length} source-reviewed blog articles. Unreviewed city, company, state, and article backlogs are intentionally omitted.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">

        {/* Main Pages */}
        <section>
          <h2 className="font-display text-2xl text-amber-400 mb-6 pb-2 border-b border-amber-500/20">
            MAIN PAGES
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {STATIC_PAGES.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="text-gray-300 hover:text-amber-400 transition-colors text-sm">
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* State Law Pages */}
        <section>
          <h2 className="font-display text-2xl text-amber-400 mb-2 pb-2 border-b border-amber-500/20">
            SOLAR CONTRACT LAWS BY STATE
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Detail pages appear here only after primary sources, a reviewer, and a review date are recorded.
          </p>
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {reviewedStateLaws.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/solar-contract-laws/${s.slug}`}
                  className="text-gray-300 hover:text-amber-400 transition-colors text-sm"
                >
                  {s.state}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Blog Articles */}
        <section>
          <h2 className="font-display text-2xl text-amber-400 mb-2 pb-2 border-b border-amber-500/20">
            BLOG — SOLAR CONTRACT RESOURCES
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Only articles with a complete source-and-editorial-review record appear here.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {reviewedBlogPosts.slice(0, 100).map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/blog/${a.slug}`}
                  className="text-gray-300 hover:text-amber-400 transition-colors text-sm"
                >
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="border border-amber-500/30 rounded-lg p-8 bg-amber-500/5 text-center">
          <h2 className="font-display text-3xl text-white mb-3">READY TO FIGHT BACK?</h2>
          <p className="text-gray-300 mb-6">
            Request an individual review of your agreement and supporting records. Options depend on the documents, facts, and jurisdiction.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={phoneHref}
              onClick={() => trackPhoneClick("sitemap_cta", phoneDigits)}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 px-8 rounded transition-colors"
            >
              CALL {phoneDisplay} — DOCUMENT REVIEW
            </a>
            <Link
              href="/"
              className="border border-amber-500 text-amber-400 hover:bg-amber-500/10 font-bold py-3 px-8 rounded transition-colors"
            >
              START ONLINE REVIEW
            </Link>
          </div>
          <p className="text-gray-500 text-xs mt-4">
            breakyoursolarcontract.com · solarfreedom.com
          </p>
        </section>

      </div>
    </div>
  );
}
