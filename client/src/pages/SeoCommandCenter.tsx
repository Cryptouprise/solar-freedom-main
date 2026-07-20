import { Link } from "wouter";

const evidence = [
  "Exact Google Search Console manual-action or security-issue text, scope, examples, and notification date",
  "Fresh GSC page, query, indexing, and crawl-stat exports",
  "GA4 organic landing-page and qualified-conversion baseline",
  "Complete backlink export with source, target, anchor, first seen, and current status",
];

const safeguards = [
  "Automated publishing, indexing submission, mutation, and link-building commands are locked",
  "Only URLs retained in shared/seo-policy.json may be indexed or included in the sitemap",
  "Database-authored articles remain noindex until the model records editorial review",
  "PBNs, paid insertions, expired-domain redirects, satellite sites, and disguised seeding are prohibited",
  "Unsupported professional, outcome, fee, rating, urgency, and testimonial claims must remain unpublished",
];

const workflow = [
  "Capture evidence before changing another URL cohort",
  "Classify each URL as retain, consolidate, noindex, 404/410, or genuine equivalent redirect",
  "Review retained YMYL pages for originality, primary sources, ownership, and qualified review",
  "Request removal of documented manipulative links; consider disavow only when evidence justifies it",
  "Submit a factual reconsideration request only when a manual action exists and corrective work is documented",
  "Measure recovery by cohort, non-branded qualified traffic, and conversions rather than URL count",
];

export default function SeoCommandCenter() {
  return (
    <main className="min-h-screen bg-[#090b0f] px-5 py-14 text-zinc-200">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm text-amber-400 hover:text-amber-300">← Home</Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-red-400">Private · noindex · recovery mode</p>
        <h1 className="mt-3 text-4xl font-bold text-white">SEO Penalty Recovery Control</h1>
        <p className="mt-5 max-w-3xl leading-7 text-zinc-400">
          Ranking recovery cannot be guaranteed. This workspace permits evidence collection and corrective work only; scaled growth and manipulative link tactics are paused.
        </p>

        <Section title="Evidence required now" items={evidence} />
        <Section title="Enforced safeguards" items={safeguards} />
        <Section title="Recovery workflow" items={workflow} />

        <section className="mt-12 rounded-lg border border-amber-500/30 bg-amber-500/5 p-6">
          <h2 className="text-xl font-semibold text-white">Editorial gate</h2>
          <p className="mt-3 leading-7 text-zinc-300">
            A URL may be added to the retained policy only after a named editor records its user need, source review, originality assessment, update owner, and any required professional review.
          </p>
        </section>
      </div>
    </main>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map(item => (
          <li key={item} className="rounded border border-white/10 bg-white/[0.03] px-4 py-3 leading-6 text-zinc-300">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
