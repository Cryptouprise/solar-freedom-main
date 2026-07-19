// Solar Freedom — Solar Company Hub Page
// Master page with cards for all solar companies — captures branded complaint searches
// Creates powerful internal link cluster for SEO authority
import { Link } from 'wouter';
import { companies } from '@/data/companies';
import { useSeoMeta } from '@/hooks/useSeoMeta';
import { SchemaInjector } from '@/components/SchemaInjector';
import { AlertTriangle, ExternalLink, TrendingDown, Shield } from 'lucide-react';

function getStatusColor(status: string) {
  if (status === 'Bankrupt') return 'text-red-400 bg-red-500/10 border-red-500/30';
  if (status === 'Acquired') return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
  return 'text-green-400 bg-green-500/10 border-green-500/30';
}

function getBBBColor(rating: string) {
  if (rating === 'F' || rating === 'NR') return 'text-red-400';
  if (rating.startsWith('D') || rating.startsWith('C')) return 'text-yellow-400';
  return 'text-green-400';
}

export default function SolarCompanyHub() {
  useSeoMeta({
    title: 'Solar Company Complaints & Cancellation Guide 2026 | Solar Freedom',
    description: 'Complete guide to canceling contracts with Sunrun, SunPower, Vivint Solar, Freedom Forever, GoodLeap, Sunnova, Tesla Solar & more. BBB ratings, complaint data, and legal grounds for cancellation.',
    canonical: 'https://breakyoursolarcontract.com/solar-companies',
    ogType: 'website',
  });

  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Solar Company Complaints & Cancellation Guide 2026',
      description: 'Comprehensive directory of solar companies with complaint data, BBB ratings, and cancellation grounds for homeowners trapped in bad contracts.',
      url: 'https://breakyoursolarcontract.com/solar-companies',
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: companies.map((c, i) => ({
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

  // Sort: bankrupt first, then by complaint count
  const sorted = [...companies].sort((a, b) => {
    if (a.status === 'Bankrupt' && b.status !== 'Bankrupt') return -1;
    if (b.status === 'Bankrupt' && a.status !== 'Bankrupt') return 1;
    const aCount = parseInt(a.complaintCount.replace(/[^0-9]/g, '')) || 0;
    const bCount = parseInt(b.complaintCount.replace(/[^0-9]/g, '')) || 0;
    return bCount - aCount;
  });

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
              Free Review
            </span>
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-28 pb-16 px-6 border-b border-white/5">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-1.5 mb-6">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-xs font-bold uppercase tracking-wider">13 Companies Investigated</span>
          </div>
          <h1 className="font-black text-white leading-none mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2.2rem, 5vw, 4rem)' }}>
            SOLAR COMPANY COMPLAINTS &<br />
            <span className="text-amber-500">CANCELLATION GUIDE 2026</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-3xl mx-auto leading-relaxed mb-8">
            Every major residential solar company investigated. BBB ratings, complaint counts, known fraud patterns, 
            and your legal grounds for cancellation — all in one place. Click any company below for a full case analysis.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="rounded-xl bg-zinc-900 border border-white/10 p-4 text-center">
              <div className="font-black text-amber-500 text-2xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>13</div>
              <div className="text-zinc-500 text-xs">Companies</div>
            </div>
            <div className="rounded-xl bg-zinc-900 border border-white/10 p-4 text-center">
              <div className="font-black text-red-400 text-2xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>4</div>
              <div className="text-zinc-500 text-xs">Bankrupt</div>
            </div>
            <div className="rounded-xl bg-zinc-900 border border-white/10 p-4 text-center">
              <div className="font-black text-amber-500 text-2xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>10K+</div>
              <div className="text-zinc-500 text-xs">Complaints</div>
            </div>
            <div className="rounded-xl bg-zinc-900 border border-white/10 p-4 text-center">
              <div className="font-black text-green-400 text-2xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>50</div>
              <div className="text-zinc-500 text-xs">States Covered</div>
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
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getStatusColor(company.status)}`}>
                        {company.status}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-4 line-clamp-2">
                      {company.tagline}
                    </p>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center">
                        <div className={`font-black text-lg ${getBBBColor(company.bbRating)}`} style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                          {company.bbRating}
                        </div>
                        <div className="text-zinc-600 text-[10px] uppercase tracking-wider">BBB</div>
                      </div>
                      <div className="text-center">
                        <div className="font-black text-lg text-red-400" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                          {company.complaintCount}
                        </div>
                        <div className="text-zinc-600 text-[10px] uppercase tracking-wider">Complaints</div>
                      </div>
                      <div className="text-center">
                        <div className="font-black text-lg text-zinc-300" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                          {company.avgMonthlyPayment.split('$')[1]?.split('/')[0] || company.avgMonthlyPayment}
                        </div>
                        <div className="text-zinc-600 text-[10px] uppercase tracking-wider">Avg/Mo</div>
                      </div>
                    </div>

                    {/* Top complaints preview */}
                    <div className="space-y-1.5">
                      {company.topComplaints.slice(0, 2).map((complaint, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-zinc-500">
                          <TrendingDown className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{complaint}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                    <span className="text-amber-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                      <Shield className="w-3 h-3" /> View Cancellation Guide
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover:text-amber-500 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto rounded-2xl bg-amber-500 p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }} />
          <h2 className="font-black text-black uppercase mb-3 relative" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>
            DON'T SEE YOUR COMPANY? WE STILL HELP.
          </h2>
          <p className="text-black/70 mb-6 relative max-w-lg mx-auto">
            We've helped homeowners cancel contracts with over 50 solar companies. Get your free case review today.
          </p>
          <Link href="/#form">
            <span className="inline-block bg-black text-white font-black uppercase tracking-widest px-10 py-4 rounded-lg text-sm hover:bg-zinc-900 transition-colors cursor-pointer relative">
              Start My Free Review
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
            <Link href="/#form"><span className="text-zinc-500 hover:text-white text-sm transition-colors cursor-pointer">Free Review</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
