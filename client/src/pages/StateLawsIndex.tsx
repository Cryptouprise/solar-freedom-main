import { Link } from 'wouter';
import { useSeoMeta } from '@/hooks/useSeoMeta';
import { SchemaInjector } from '@/components/SchemaInjector';
import { getAllStateLaws, hasPublishableStateLawEvidence } from '@/data/state-laws';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, ChevronRight, ExternalLink, FileSearch, ShieldCheck } from 'lucide-react';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1600&q=80&auto=format&fit=crop';

const stateIndexSchemas: object[] = [
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://breakyoursolarcontract.com/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Solar contract information by state',
        item: 'https://breakyoursolarcontract.com/solar-contract-laws',
      },
    ],
  },
];

const officialResearchLinks = [
  {
    title: 'Federal Cooling-Off Rule — 16 CFR Part 429',
    description: 'Current eCFR text, scope, requirements, and exemptions.',
    href: 'https://www.ecfr.gov/current/title-16/part-429',
  },
  {
    title: 'State attorneys general directory',
    description: 'USA.gov directory for current state consumer-protection offices.',
    href: 'https://www.usa.gov/state-attorney-general',
  },
];

export default function StateLawsIndex() {
  const allStates = [...getAllStateLaws()].sort((a, b) => a.state.localeCompare(b.state));
  const states = allStates.filter(hasPublishableStateLawEvidence);
  const reviewedCount = states.length;
  const pendingCount = allStates.length - reviewedCount;

  useSeoMeta({
    title: 'Solar Contract Information by State | Solar Freedom',
    description:
      'Browse state solar-contract research pages, official consumer-protection sources, and the records to verify before relying on a legal claim.',
    canonical: 'https://breakyoursolarcontract.com/solar-contract-laws',
  });

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <SchemaInjector schemas={stateIndexSchemas} />

      <header
        className="relative min-h-[400px] flex items-end pb-12 pt-24"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(15,23,42,0.62) 0%, rgba(15,23,42,0.92) 62%, rgba(15,23,42,1) 100%), url(${HERO_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container max-w-5xl">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-400 mb-6">
            <Link href="/" className="hover:text-amber-400 transition-colors">Home</Link>
            <ChevronRight size={14} />
            <span className="text-white">State research</span>
          </nav>

          <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/30 mb-4">
            Source-first publishing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
            Solar contract information, organized by state
          </h1>
          <p className="text-xl text-slate-300 leading-relaxed max-w-3xl">
            State law changes, and the result for any agreement depends on its terms and facts. Detail pages stay out of search and do not emit FAQ schema until primary sources, a reviewer, and a review date are recorded.
          </p>
        </div>
      </header>

      <main className="container max-w-5xl py-14 space-y-14">
        <section className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-7">
          <div className="flex items-start gap-4">
            <ShieldCheck className="text-amber-400 mt-1 shrink-0" size={26} />
            <div>
              <h2 className="text-2xl font-bold mb-2">Publication status</h2>
              <p className="text-slate-300 leading-relaxed">
                {reviewedCount} of {allStates.length} state detail pages currently meet the source-and-review gate. The {pendingCount} pending {pendingCount === 1 ? 'draft is' : 'drafts are'} not linked from public pages.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-5">
            <BookOpen className="text-amber-400" size={22} />
            <h2 className="text-2xl font-bold">Official starting points</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {officialResearchLinks.map((source) => (
              <a
                key={source.href}
                href={source.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-slate-700 bg-slate-800/60 p-5 hover:border-amber-400/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white mb-2">{source.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{source.description}</p>
                  </div>
                  <ExternalLink className="text-amber-400 shrink-0" size={17} />
                </div>
              </a>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-5">
            <FileSearch className="text-amber-400" size={22} />
            <h2 className="text-2xl font-bold">State research pages</h2>
          </div>
          <p className="text-slate-400 text-sm mb-6">
            A listing is not a legal conclusion. Verify current law with the linked official sources and qualified counsel before acting.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {states.map((state) => (
                <Link key={state.slug} href={`/solar-contract-laws/${state.slug}`}>
                  <article className="group h-full rounded-xl border border-slate-700 bg-slate-800/50 p-5 hover:border-amber-400/50 hover:bg-slate-800 transition-all cursor-pointer">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-bold group-hover:text-amber-400 transition-colors">{state.state}</h3>
                        <span className="text-xs text-slate-500">{state.stateAbbr}</span>
                      </div>
                      <ArrowRight size={15} className="text-slate-500 group-hover:text-amber-400" />
                    </div>
                    <Badge className="bg-green-500/15 text-green-300 border-green-500/30">
                      Sources reviewed
                    </Badge>
                  </article>
                </Link>
            ))}
          </div>
          {states.length === 0 && (
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-slate-300">
              No state detail page currently meets the public source-and-review gate. Use the official starting points above while editorial review is completed.
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-8 text-center">
          <h2 className="text-3xl font-black mb-3">Need help organizing your records?</h2>
          <p className="text-amber-100 mb-6 max-w-2xl mx-auto leading-relaxed">
            Gather the signed agreement, financing documents, disclosures, sales materials, bills, installation records, and communications before requesting an individual review. No representation, result, or response time is promised.
          </p>
          <Link href="/#qualify">
            <Button className="bg-white text-orange-600 hover:bg-amber-50 font-bold text-lg px-8 py-3">
              Request a document review <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>
        </section>
      </main>
    </div>
  );
}
