import { Link } from "wouter";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CircleDashed,
  Database,
  Gauge,
  GitPullRequest,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

const evidenceLevels = [
  {
    label: "Observed",
    detail: "A crawler, API, or repository check captured the underlying evidence.",
  },
  {
    label: "Derived",
    detail: "A deterministic rule transformed observed evidence into a finding.",
  },
  {
    label: "Modeled",
    detail: "A recommendation or priority estimate that still needs validation.",
  },
  {
    label: "Measured",
    detail: "A verified before/after outcome from analytics or search data.",
  },
  {
    label: "Unavailable",
    detail: "The required source is not connected; the system does not invent a value.",
  },
];

const completedFoundation = [
  "Fail-closed production configuration and scoped, expiring API keys",
  "Consent-gated analytics plus explicit contact and optional SMS consent",
  "Same-origin canonical URL normalization and duplicate-path redirects",
  "Approval-first change staging with release and rollback checkpoints",
  "Health, readiness, release identity, CI, dependency, and public-artifact gates",
];

const launchBlockers = [
  {
    title: "Rotate exposed credentials",
    detail: "Revoke every previously shared secret before any production cutover.",
  },
  {
    title: "Apply additive database migrations",
    detail: "Consent records and expiring API-key fields must exist before release.",
  },
  {
    title: "Connect first-party measurement",
    detail: "Authorize Search Console and GA4 so baselines and outcomes can be measured.",
  },
  {
    title: "Deploy and verify the release",
    detail: "Run readiness, release-SHA, crawl, form, and analytics-consent smoke checks.",
  },
];

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">{eyebrow}</p>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
    </div>
  );
}

export default function SeoCommandCenter() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      <header className="border-b border-white/10 bg-slate-950/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
          <Link href="/" className="text-sm font-semibold text-white hover:text-amber-300">
            Break Your Solar Contract
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
            <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" /> Private operator view
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-12 px-5 py-12">
        <section className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-400">
              Search operations control plane
            </p>
            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-6xl">
              Evidence first. Approval before change. Measurement after release.
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-slate-300">
              This console reports only what the connected sources can support. It does not claim rankings,
              traffic gains, legal outcomes, indexing, or completed work without verifiable evidence.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-5">
            <div className="flex items-center gap-3 text-emerald-300">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              <p className="font-bold">Operating policy</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-emerald-50/80">
              No paid links, private blog networks, fake reviews, cloaking, fabricated citations, or autonomous
              publication of high-risk legal or customer claims.
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeading eyebrow="Truth model" title="Every value carries an evidence label" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {evidenceLevels.map((level, index) => (
              <article key={level.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-white">{level.label}</p>
                  <span className="text-xs font-mono text-slate-500">0{index + 1}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">{level.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <SectionHeading eyebrow="Implemented" title="Safe production foundation" />
            <ul className="space-y-4">
              {completedFoundation.map(item => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-6">
            <SectionHeading eyebrow="Cutover gates" title="Still requires authorized access" />
            <ul className="space-y-5">
              {launchBlockers.map(item => (
                <li key={item.title} className="flex gap-3">
                  <CircleDashed className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeading eyebrow="Learning loop" title="How an optimization earns trust" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Database, title: "1. Observe", detail: "Capture crawl, repository, search, and analytics evidence." },
              { icon: Gauge, title: "2. Prioritize", detail: "Score impact, confidence, effort, and risk without promising an outcome." },
              { icon: GitPullRequest, title: "3. Approve", detail: "Stage a reversible diff, test it, and require approval for risky changes." },
              { icon: ArrowUpRight, title: "4. Verify", detail: "Recrawl, compare the release, measure outcomes, and retain the result." },
            ].map(step => (
              <article key={step.title} className="rounded-xl border border-white/10 bg-slate-900 p-5">
                <step.icon className="h-6 w-6 text-amber-300" aria-hidden="true" />
                <h3 className="mt-4 font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{step.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="flex flex-col gap-4 rounded-2xl border border-red-400/25 bg-red-400/[0.07] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-red-300" aria-hidden="true" />
            <div>
              <p className="font-bold text-white">No ranking guarantees</p>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-300">
                Search engines decide crawling, indexing, and ranking. The system can improve quality and measure
                changes; it cannot honestly guarantee placement or traffic growth.
              </p>
            </div>
          </div>
          <a
            href="/api/capabilities"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-amber-300 hover:text-amber-200"
          >
            Machine-readable scope <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </aside>
      </div>
    </main>
  );
}
