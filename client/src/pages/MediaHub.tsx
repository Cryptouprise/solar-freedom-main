/**
 * SOLAR FREEDOM — Media Hub
 * Standalone public page: Podcast Episodes + Explainer Videos
 * SEO: VideoObject JSON-LD schema for each video, H1, meta, canonical
 * Cross-linking: Company pages, state pages, blog posts, landing pages
 * Design: Dark industrial brutalism — Charcoal bg, Amber accent, Bebas Neue
 */

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "wouter";
import PrivacyVideoEmbed from "@/components/PrivacyVideoEmbed";
import { blogPosts } from "@/data/blog";
import { companies } from "@/data/companies";
import { hasPublishableEditorialReview, isBlogPostPublishable } from "@/data/publication-governance";
import { hasPublishableStateLawEvidence, stateLaws } from "@/data/state-laws";

// ─── Reveal wrapper ──────────────────────────────────────────────────────────
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

// ─── VideoObject JSON-LD schema ───────────────────────────────────────────────
function VideoSchema({ id, name, description, uploadDate, thumbnailUrl }: {
  id: string; name: string; description: string; uploadDate?: string; thumbnailUrl: string;
}) {
  // Do not manufacture an upload date merely to qualify for VideoObject markup.
  if (!uploadDate) return null;
  const schema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": name,
    "description": description,
    "thumbnailUrl": thumbnailUrl,
    "uploadDate": uploadDate,
    "embedUrl": `https://www.youtube-nocookie.com/embed/${id}`,
    "contentUrl": `https://www.youtube.com/watch?v=${id}`,
    "publisher": {
      "@type": "Organization",
      "name": "Solar Freedom",
      "url": "https://breakyoursolarcontract.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://breakyoursolarcontract.com/favicon.ico"
      }
    }
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ─── Video data ───────────────────────────────────────────────────────────────
const VIDEOS = [
  {
    id: "s6V76pijGKI",
    type: "explainer" as const,
    title: "SOLAR AGREEMENT RECORD REVIEW",
    subtitle: "Full Explainer — Agreement Types, Records & Questions to Review",
    description: "An educational overview of solar agreement types, records to gather, federal consumer resources, and questions that may require an individual review. Options depend on the documents, facts, and current law.",
    uploadDate: undefined as string | undefined,
    thumbnailUrl: `https://img.youtube.com/vi/s6V76pijGKI/maxresdefault.jpg`,
    duration: "~10 min",
    tags: ["Solar Agreement Records", "FTC Cooling-Off Rule", "TILA", "Solar Lease"],
  },
  {
    id: "l0A3I_CvI0c",
    type: "podcast" as const,
    title: "ELITE SOLAR RECOVERY PODCAST",
    subtitle: "Episode 1 — Contract Scenarios and Questions",
    description: "An educational discussion of solar agreement scenarios, documents to review, and questions to investigate. It does not report verified client outcomes or promise a result.",
    uploadDate: undefined as string | undefined,
    thumbnailUrl: `https://img.youtube.com/vi/l0A3I_CvI0c/maxresdefault.jpg`,
    duration: "~25 min",
    tags: ["Solar Podcast", "Solar Agreement Records", "Company Status", "Financing Records", "Document Review"],
  },
];

// ─── Company cross-links ──────────────────────────────────────────────────────
const COMPANY_LINKS = [
  { name: "Sunrun", slug: "sunrun" },
  { name: "SunPower", slug: "sunpower" },
  { name: "Tesla Solar", slug: "tesla-solar" },
  { name: "Vivint Solar", slug: "vivint-solar" },
  { name: "ADT Solar", slug: "adt-solar" },
  { name: "Freedom Forever", slug: "freedom-forever" },
  { name: "Sunnova", slug: "sunnova" },
  { name: "GoodLeap", slug: "goodleap" },
  { name: "Pink Energy", slug: "pink-energy" },
  { name: "Titan Solar", slug: "titan-solar" },
  { name: "Palmetto Solar", slug: "palmetto-solar" },
  { name: "Momentum Solar", slug: "momentum-solar" },
].filter((link) => {
  const company = companies.find((candidate) => candidate.slug === link.slug);
  return Boolean(company && hasPublishableEditorialReview(company));
});

// ─── Blog cross-links ─────────────────────────────────────────────────────────
const BLOG_LINKS = [
  { title: "How to Get Out of a Solar Contract", slug: "how-to-get-out-of-a-solar-contract" },
  { title: "Solar Contract Rescission Rights", slug: "solar-contract-rescission-rights" },
  { title: "Solar Fraud Warning Signs", slug: "solar-fraud-warning-signs" },
  { title: "Cancel a Solar Loan or Lease Early", slug: "cancel-solar-loan-or-lease-early" },
  { title: "Selling a House With Solar Panels", slug: "sell-house-with-solar-panels" },
  { title: "Sunrun Solar Contract Cancellation 2026", slug: "sunrun-solar-contract-cancellation-2026" },
  { title: "SunPower Bankruptcy — What Homeowners Can Do", slug: "sunpower-bankruptcy-homeowners" },
  { title: "GoodLeap Loan Complaints & Legal Options", slug: "goodleap-complaints" },
  { title: "How to File a Complaint Against a Solar Company", slug: "how-to-file-a-complaint-against-solar-company-attorney-general" },
  { title: "Solar Contract 3-Day Cancellation Right", slug: "solar-contract-3-day-cancellation-right" },
].filter((link) => {
  const post = blogPosts.find((candidate) => candidate.slug === link.slug);
  return Boolean(post && isBlogPostPublishable(post));
});

// ─── State law cross-links ────────────────────────────────────────────────────
const STATE_LINKS = [
  { name: "Texas", slug: "texas" },
  { name: "California", slug: "california" },
  { name: "Florida", slug: "florida" },
  { name: "Arizona", slug: "arizona" },
  { name: "Nevada", slug: "nevada" },
  { name: "Colorado", slug: "colorado" },
  { name: "New Jersey", slug: "new-jersey" },
  { name: "New York", slug: "new-york" },
  { name: "Georgia", slug: "georgia" },
  { name: "North Carolina", slug: "north-carolina" },
  { name: "Ohio", slug: "ohio" },
  { name: "Pennsylvania", slug: "pennsylvania" },
].filter((link) => {
  const stateLaw = stateLaws.find((candidate) => candidate.slug === link.slug);
  return Boolean(stateLaw && hasPublishableStateLawEvidence(stateLaw));
});

// ─── Landing page links ───────────────────────────────────────────────────────
const LANDING_LINKS = [
  { label: "Document Review — Start Here", href: "/youtube" },
  { label: "Trapped in a Solar Contract?", href: "/yt2" },
  { label: "Is Your Solar Company Ripping You Off?", href: "/yt3" },
  { label: "Solar Contract Help Center", href: "/solar-contract-help" },
  { label: "Solar Exit Options", href: "/solar-exit-options" },
  { label: "Solar Lien Removal", href: "/solar-lien-removal" },
  { label: "Solar Loan Help", href: "/solar-loan-help" },
  { label: "Selling Your House With Solar", href: "/selling-house-with-solar" },
  { label: "Solar Contract Laws by State", href: "/solar-contract-laws" },
  { label: "All Solar Companies", href: "/solar-companies" },
];

// ─── VideoCard component ──────────────────────────────────────────────────────
function VideoCard({ video, index }: { video: typeof VIDEOS[0]; index: number }) {
  const isExplainer = video.type === "explainer";

  return (
    <Reveal delay={index * 0.1}>
      <VideoSchema
        id={video.id}
        name={video.title + " — " + video.subtitle}
        description={video.description}
        uploadDate={video.uploadDate}
        thumbnailUrl={video.thumbnailUrl}
      />
      <div className="rounded-2xl overflow-hidden border"
        style={{ background: "oklch(0.13 0.012 265)", borderColor: isExplainer ? "oklch(0.72 0.19 50 / 40%)" : "oklch(0.55 0.18 240 / 40%)" }}>
        {/* Video embed */}
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <PrivacyVideoEmbed
            videoId={video.id}
            title={video.title}
            accent={isExplainer ? "amber" : "blue"}
          />
        </div>

        {/* Card body */}
        <div className="p-6">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-1">
              <h3 className="font-display text-2xl text-white leading-none mb-1">{video.title}</h3>
              <p className="text-sm font-mono" style={{ color: isExplainer ? "oklch(0.85 0.19 50)" : "oklch(0.75 0.18 240)" }}>
                {video.subtitle}
              </p>
            </div>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">{video.description}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-5">
            {video.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded text-xs font-mono text-gray-400"
                style={{ background: "oklch(0.18 0.012 265)", border: "1px solid oklch(0.25 0.012 265)" }}>
                #{tag.replace(/ /g, "")}
              </span>
            ))}
          </div>

          {/* CTA */}
          <a
            href="https://api.leadconnectorhq.com/widget/booking/3v6GXFtDrHMzs1j2DBkI"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded font-bold text-sm transition-all duration-200 hover:scale-105"
            style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.60 0.21 40))", color: "black" }}
          >
            REQUEST DOCUMENT REVIEW →
          </a>
        </div>
      </div>
    </Reveal>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MediaHub() {
  const explainerVideos = VIDEOS.filter(v => v.type === "explainer");
  const podcastEpisodes = VIDEOS.filter(v => v.type === "podcast");

  return (
    <div style={{ background: "oklch(0.09 0.012 265)", minHeight: "100vh", color: "#F8FAFC" }}>
      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/8"
        style={{ background: "oklch(0.11 0.012 265 / 92%)", backdropFilter: "blur(12px)" }}>
        <div className="container flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: "oklch(0.72 0.19 50)" }}>
              <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-display text-xl tracking-wider text-white">SOLAR FREEDOM</span>
          </a>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <a href="/" className="hover:text-white transition-colors">Home</a>
            <a href="/solar-companies" className="hover:text-white transition-colors">Companies</a>
            <a href="/blog" className="hover:text-white transition-colors">Blog</a>
            <a href="/media" className="text-amber-400 font-semibold transition-colors">Watch & Listen</a>
          </div>
          <a
            href="/youtube"
            className="btn-amber px-5 py-2.5 rounded text-sm font-bold"
            style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.60 0.21 40))", color: "black", textDecoration: "none" }}
          >
            DOCUMENT REVIEW
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-32 pb-16 px-4" style={{ background: "linear-gradient(180deg, oklch(0.11 0.015 265) 0%, oklch(0.09 0.012 265) 100%)" }}>
        <div className="container max-w-4xl text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest mb-6"
              style={{ background: "oklch(0.72 0.19 50 / 15%)", color: "oklch(0.85 0.19 50)", border: "1px solid oklch(0.72 0.19 50 / 40%)" }}>
              WATCH & LISTEN
            </div>
            <h1 className="font-display text-white leading-none mb-4" style={{ fontSize: "clamp(3rem, 8vw, 6rem)" }}>
              SOLAR CONTRACT<br />
              <span style={{ background: "linear-gradient(90deg, oklch(0.85 0.19 50), oklch(0.72 0.19 50))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                RECORD REVIEW HUB
              </span>
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
              Watch the explainer videos and listen to the <strong className="text-white">Elite Solar Recovery Podcast</strong> for educational scenarios, records to gather, and questions to investigate before choosing a next step.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#explainer-videos"
                className="px-6 py-3 rounded font-bold text-sm transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.60 0.21 40))", color: "black" }}>
                ▶ WATCH EXPLAINER VIDEOS
              </a>
              <a href="#podcast-episodes"
                className="px-6 py-3 rounded font-bold text-sm border transition-all hover:border-white/40 hover:text-white"
                style={{ border: "1px solid oklch(0.55 0.18 240 / 60%)", color: "oklch(0.75 0.18 240)" }}>
                🎙 LISTEN TO PODCAST
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── QUICK STATS BAR ── */}
      <div className="border-y border-white/8 py-4" style={{ background: "oklch(0.11 0.012 265)" }}>
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { val: "4", label: "Core Record Types" },
              { val: "Current", label: "Sources to Verify" },
              { val: "Individual", label: "Document Review" },
              { val: "Varies", label: "Response and Resolution Time" },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-display text-2xl" style={{ color: "oklch(0.85 0.19 50)" }}>{s.val}</div>
                <div className="text-gray-500 text-xs font-mono uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── EXPLAINER VIDEOS ── */}
      <section id="explainer-videos" className="py-20 px-4">
        <div className="container max-w-5xl">
          <Reveal>
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest mb-4"
                style={{ background: "oklch(0.72 0.19 50 / 15%)", color: "oklch(0.85 0.19 50)", border: "1px solid oklch(0.72 0.19 50 / 40%)" }}>
                ▶ EXPLAINER VIDEOS
              </div>
              <h2 className="font-display text-white leading-none" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                REVIEW THE RECORDS.<br />
                <span style={{ color: "oklch(0.85 0.19 50)" }}>IDENTIFY THE QUESTIONS.</span>
              </h2>
            </div>
          </Reveal>
          <div className="grid gap-8">
            {explainerVideos.map((video, i) => (
              <VideoCard key={video.id} video={video} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── PODCAST EPISODES ── */}
      <section id="podcast-episodes" className="py-20 px-4" style={{ background: "oklch(0.10 0.012 265)" }}>
        <div className="container max-w-5xl">
          <Reveal>
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest mb-4"
                style={{ background: "oklch(0.55 0.18 240 / 15%)", color: "oklch(0.75 0.18 240)", border: "1px solid oklch(0.55 0.18 240 / 40%)" }}>
                🎙 PODCAST EPISODES
              </div>
              <h2 className="font-display text-white leading-none" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                ELITE SOLAR RECOVERY<br />
                <span style={{ color: "oklch(0.75 0.18 240)" }}>PODCAST</span>
              </h2>
              <p className="text-gray-400 mt-3 max-w-xl">
                Educational scenarios and document-focused questions. Episodes do not establish an attorney relationship or report a verified client outcome unless source and consent records are published.
              </p>
            </div>
          </Reveal>
          <div className="grid gap-8">
            {podcastEpisodes.map((video, i) => (
              <VideoCard key={video.id} video={video} index={i} />
            ))}
          </div>

          {/* Subscribe links */}
          <Reveal delay={0.2}>
            <div className="mt-10 p-6 rounded-xl border border-white/10" style={{ background: "oklch(0.13 0.012 265)" }}>
              <p className="text-gray-400 text-sm font-mono uppercase tracking-wider mb-3">VIDEO SOURCE CHANNEL</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: "YouTube", href: "https://www.youtube.com/@BossAIBiz", color: "oklch(0.55 0.22 25)" },
                ].map((link) => (
                  <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 rounded text-sm font-bold transition-all hover:scale-105"
                    style={{ background: link.color + " / 20%", color: link.color, border: `1px solid ${link.color} / 40%` }}>
                    {link.label} →
                  </a>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── THREE OUTCOMES ── */}
      <section className="py-20 px-4" style={{ background: "oklch(0.09 0.012 265)" }}>
        <div className="container max-w-5xl">
          <Reveal>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest mb-4"
                style={{ background: "oklch(0.72 0.19 50 / 15%)", color: "oklch(0.85 0.19 50)", border: "1px solid oklch(0.72 0.19 50 / 40%)" }}>
                THREE REVIEW AREAS
              </div>
              <h2 className="font-display text-white leading-none" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                WHAT TO ORGANIZE<br />
                <span style={{ background: "linear-gradient(90deg, oklch(0.85 0.19 50), oklch(0.72 0.19 50))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  BEFORE CHOOSING A PATH
                </span>
              </h2>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                title: "CANCELLATION QUESTIONS",
                desc: "Review the agreement, transaction history, notices, disclosures, and current law before concluding that cancellation or rescission is available.",
                color: "oklch(0.72 0.19 50)",
              },
              {
                num: "02",
                title: "FINANCING QUESTIONS",
                desc: "Compare the payment schedule, total cost, disclosures, payoff terms, servicing records, and any written dispute process.",
                color: "oklch(0.65 0.18 145)",
              },
              {
                num: "03",
                title: "TITLE AND CREDIT RECORDS",
                desc: "Identify the actual filing, secured party, balance, release terms, and reporting records before choosing a response.",
                color: "oklch(0.75 0.18 240)",
              },
            ].map((outcome, i) => (
              <Reveal key={outcome.num} delay={i * 0.1}>
                <div className="p-6 rounded-xl border h-full"
                  style={{ background: "oklch(0.13 0.012 265)", borderColor: outcome.color + " / 30%" }}>
                  <div className="font-display text-5xl mb-3" style={{ color: outcome.color + " / 40%", lineHeight: 1 }}>{outcome.num}</div>
                  <h3 className="font-display text-xl text-white mb-3 leading-tight">{outcome.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{outcome.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.3}>
            <div className="text-center mt-10">
              <a href="/youtube"
                className="inline-flex items-center gap-2 px-8 py-4 rounded font-bold text-base transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.60 0.21 40))", color: "black" }}>
                REQUEST DOCUMENT REVIEW →
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── MASSIVE CROSS-LINK SECTION ── */}
      <section className="py-20 px-4 border-t border-white/8" style={{ background: "oklch(0.10 0.012 265)" }}>
        <div className="container max-w-6xl">
          <Reveal>
            <h2 className="font-display text-white mb-12 text-center" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
              EXPLORE PUBLIC RESOURCES
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company pages */}
            <Reveal delay={0}>
              <div>
                <h3 className="font-display text-lg mb-4" style={{ color: "oklch(0.85 0.19 50)" }}>
                  SOURCE-REVIEWED COMPANIES
                </h3>
                <ul className="space-y-2">
                  {COMPANY_LINKS.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/cancel-${c.slug}-solar-contract`}
                        className="text-gray-400 hover:text-amber-400 text-sm transition-colors flex items-center gap-1.5">
                        <span style={{ color: "oklch(0.72 0.19 50)" }}>›</span> Cancel {c.name}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link href="/solar-companies"
                      className="text-amber-400 hover:text-amber-300 text-sm font-semibold transition-colors flex items-center gap-1.5">
                      <span>›</span> Company Research Hub →
                    </Link>
                  </li>
                </ul>
              </div>
            </Reveal>

            {/* Blog posts */}
            <Reveal delay={0.1}>
              <div>
                <h3 className="font-display text-lg mb-4" style={{ color: "oklch(0.85 0.19 50)" }}>
                  REVIEWED ARTICLES
                </h3>
                <ul className="space-y-2">
                  {BLOG_LINKS.map((b) => (
                    <li key={b.slug}>
                      <Link href={`/blog/${b.slug}`}
                        className="text-gray-400 hover:text-amber-400 text-sm transition-colors flex items-center gap-1.5">
                        <span style={{ color: "oklch(0.72 0.19 50)" }}>›</span> {b.title}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link href="/blog"
                      className="text-amber-400 hover:text-amber-300 text-sm font-semibold transition-colors flex items-center gap-1.5">
                      <span>›</span> Reviewed Article Hub →
                    </Link>
                  </li>
                </ul>
              </div>
            </Reveal>

            {/* State laws */}
            <Reveal delay={0.2}>
              <div>
                <h3 className="font-display text-lg mb-4" style={{ color: "oklch(0.85 0.19 50)" }}>
                  SOURCE-REVIEWED STATE PAGES
                </h3>
                <ul className="space-y-2">
                  {STATE_LINKS.map((s) => (
                    <li key={s.slug}>
                      <Link href={`/solar-contract-laws/${s.slug}`}
                        className="text-gray-400 hover:text-amber-400 text-sm transition-colors flex items-center gap-1.5">
                        <span style={{ color: "oklch(0.72 0.19 50)" }}>›</span> {s.name} Solar Laws
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link href="/solar-contract-laws"
                      className="text-amber-400 hover:text-amber-300 text-sm font-semibold transition-colors flex items-center gap-1.5">
                      <span>›</span> State Information →
                    </Link>
                  </li>
                </ul>
              </div>
            </Reveal>

            {/* Resources & landing pages */}
            <Reveal delay={0.3}>
              <div>
                <h3 className="font-display text-lg mb-4" style={{ color: "oklch(0.85 0.19 50)" }}>
                  GET HELP NOW
                </h3>
                <ul className="space-y-2">
                  {LANDING_LINKS.map((l) => (
                    <li key={l.href}>
                      <a href={l.href}
                        className="text-gray-400 hover:text-amber-400 text-sm transition-colors flex items-center gap-1.5">
                        <span style={{ color: "oklch(0.72 0.19 50)" }}>›</span> {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 px-4 border-t border-white/8" style={{ background: "oklch(0.08 0.01 265)" }}>
        <div className="container max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "oklch(0.72 0.19 50)" }}>
                <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-display text-lg tracking-wider text-white">SOLAR FREEDOM</span>
            </div>
            <p className="text-gray-600 text-xs text-center">
              © 2026 Solar Freedom. Educational information only. No representation, result, or response time is promised.
            </p>
            <div className="flex gap-4 text-xs text-gray-500">
              <a href="/" className="hover:text-white transition-colors">Home</a>
              <a href="/blog" className="hover:text-white transition-colors">Blog</a>
              <a href="/youtube" className="hover:text-amber-400 transition-colors">Document Review</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
