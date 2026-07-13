// Solar Freedom — Solar Company Hub Page
// Master page with cards for all solar companies — captures branded complaint searches
// Creates powerful internal link cluster for SEO authority
import { Link } from 'wouter';
import { companies } from '@/data/companies';
import { hasPublishableEditorialReview } from '@/data/publication-governance';
import { useSeoMeta } from '@/hooks/useSeoMeta';
import { SchemaInjector } from '@/components/SchemaInjector';
import { AlertTriangle, ExternalLink, Shield } from 'lucide-react';

export default function SolarCompanyHub() {
  const publishableCompanies = companies.filter((candidate) => hasPublishableEditorialReview(candidate));
  const pendingCount = companies.length - publishableCompanies.length;

  useSeoMeta({
    title: 'Solar Company Agreement Research Directory | Solar Freedom',
    description: 'Browse solar-company agreement research pages, records to gather, and source-verification status before requesting an individual document review.',
    canonical: 'https://breakyoursolarcontract.com/solar-companies',
    ogType: 'website',
  });

  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Solar Company Agreement Research Directory',
      description: 'Directory of company-specific solar agreement research pages and records to gather for an individual review.',
      url: 'https://breakyoursolarcontract.com/solar-companies',
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: publishableCompanies.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.name,
          url: `https://breakyoursolarcontract.com/cancel-${c.slug}-solar-contract`,
        })),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://breakyoursolarcontract.com' },
        { '@type': 'ListItem', position: 2, name: 'Solar Companies', item: 'https://breakyoursolarcontract.com/solar-companies' },
      ],
    },
  ];

  const sorted = [...publishableCompanies].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <SchemaInjector schemas={schemas} />

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <span className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center">
                <span className="text-black font-black text-sm">SF</span>
              </div>
              <span className="font-black text-white tracking-wider text-sm uppercase">Solar Freedom</span>
            </span>
          </Link>
          <Link href="/#form">
            <span className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest px-5 py-2.5 rounded cursor-pointer transition-colors">
              Document Review
            </span>
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-28 pb-16 px-6 border-b border-white/5">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-1.5 mb-6">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-xs font-bold uppercase tracking-wider">{publishableCompanies.length} source-reviewed company pages</span>
          </div>
          <h1 className="font-black text-white leading-none mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2.2rem, 5vw, 4rem)' }}>
            SOLAR COMPANY AGREEMENT<br />
            <span className="text-amber-500">RESEARCH DIRECTORY</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-3xl mx-auto leading-relaxed mb-8">
            Only company-specific pages with current primary sources, a named reviewer, and unique user value are linked here. {pendingCount} draft {pendingCount === 1 ? 'page is' : 'pages are'} withheld from public discovery.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="rounded-xl bg-zinc-900 border border-white/10 p-4 text-center">
              <div className="font-black text-amber-500 text-2xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{publishableCompanies.length}</div>
              <div className="text-zinc-500 text-xs">Reviewed pages</div>
            </div>
            <div className="rounded-xl bg-zinc-900 border border-white/10 p-4 text-center">
              <div className="font-black text-red-400 text-2xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Source</div>
              <div className="text-zinc-500 text-xs">Required</div>
            </div>
            <div className="rounded-xl bg-zinc-900 border border-white/10 p-4 text-center">
              <div className="font-black text-amber-500 text-2xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Date</div>
              <div className="text-zinc-500 text-xs">Required</div>
            </div>
            <div className="rounded-xl bg-zinc-900 border border-white/10 p-4 text-center">
              <div className="font-black text-green-400 text-2xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Individual</div>
              <div className="text-zinc-500 text-xs">Review</div>
            </div>
          </div>
        </div>
      </section>

      {/* BREADCRUMB */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/"><span className="hover:text-zinc-300 cursor-pointer transition-colors">Home</span></Link>
          <span>/</span>
          <span className="text-zinc-400">Solar Companies</span>
        </div>
      </div>

      {/* COMPANY GRID */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map((company) => (
              <Link key={company.slug} href={`/cancel-${company.slug}-solar-contract`}>
                <div className="group rounded-xl border border-white/10 hover:border-amber-500/40 bg-zinc-900/50 hover:bg-zinc-900 transition-all duration-300 cursor-pointer overflow-hidden h-full flex flex-col">
                  {/* Header */}
                  <div className="p-6 pb-4 flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h2 className="font-black text-white text-xl group-hover:text-amber-400 transition-colors" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                        {company.name}
                      </h2>
                      <span className="text-xs font-bold px-2 py-0.5 rounded border border-white/10 text-zinc-500">Research page</span>
                    </div>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-4 line-clamp-2">
                      Company-specific claims are withheld until source and as-of metadata are attached.
                    </p>

                    <p className="text-zinc-600 text-xs">A company listing does not establish wrongdoing, liability, or an available remedy.</p>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                    <span className="text-amber-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                      <Shield className="w-3 h-3" /> View Research Page
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover:text-amber-500 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {sorted.length === 0 && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
              <h2 className="font-black text-white text-2xl mb-3" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Company detail reviews are in progress</h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                Draft company pages are not linked until their factual claims, sources, review date, and page-specific value pass the publication gate.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto rounded-2xl bg-amber-500 p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }} />
          <h2 className="font-black text-black uppercase mb-3 relative" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>
            DON'T SEE YOUR COMPANY?
          </h2>
          <p className="text-black/70 mb-6 relative max-w-lg mx-auto">
            Request a document-focused review of the agreement and supporting records. No representation, result, or response time is promised.
          </p>
          <Link href="/#form">
            <span className="inline-block bg-black text-white font-black uppercase tracking-widest px-10 py-4 rounded-lg text-sm hover:bg-zinc-900 transition-colors cursor-pointer relative">
              Request Document Review
            </span>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-zinc-600 text-sm">&copy; 2026 Solar Freedom. All rights reserved.</div>
          <div className="flex gap-6">
            <Link href="/"><span className="text-zinc-500 hover:text-white text-sm transition-colors cursor-pointer">Home</span></Link>
            <Link href="/blog"><span className="text-zinc-500 hover:text-white text-sm transition-colors cursor-pointer">Blog</span></Link>
            <Link href="/#form"><span className="text-zinc-500 hover:text-white text-sm transition-colors cursor-pointer">Document Review</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
