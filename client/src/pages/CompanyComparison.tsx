import { useState } from 'react';
import { Link } from 'wouter';
import { companies } from '@/data/companies';
import { useSeoMeta } from '@/hooks/useSeoMeta';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, XCircle, Star } from 'lucide-react';

// Cancellation difficulty scoring based on company data
const DIFFICULTY_MAP: Record<string, { score: number; label: string; color: string }> = {
  'sunrun': { score: 9, label: 'Very Hard', color: 'text-red-400' },
  'sunnova': { score: 7, label: 'Hard (Bankrupt)', color: 'text-orange-400' },
  'tesla-solar': { score: 8, label: 'Very Hard', color: 'text-red-400' },
  'vivint-solar': { score: 7, label: 'Hard', color: 'text-orange-400' },
  'freedom-forever': { score: 6, label: 'Moderate', color: 'text-yellow-400' },
  'adt-solar': { score: 5, label: 'Moderate (Closed)', color: 'text-yellow-400' },
  'goodleap': { score: 7, label: 'Hard', color: 'text-orange-400' },
  'mosaic-solar': { score: 7, label: 'Hard', color: 'text-orange-400' },
  'sunlight-financial': { score: 6, label: 'Moderate', color: 'text-yellow-400' },
  'dividend-finance': { score: 6, label: 'Moderate', color: 'text-yellow-400' },
  'loanpal': { score: 7, label: 'Hard', color: 'text-orange-400' },
  'pink-energy': { score: 3, label: 'Easy (Bankrupt)', color: 'text-green-400' },
  'sunpower': { score: 6, label: 'Moderate (Bankrupt)', color: 'text-yellow-400' },
  'momentum-solar': { score: 5, label: 'Moderate', color: 'text-yellow-400' },
  'titan-solar': { score: 5, label: 'Moderate', color: 'text-yellow-400' },
  'palmetto-solar': { score: 5, label: 'Moderate', color: 'text-yellow-400' },
  'sungevity': { score: 4, label: 'Easier (Bankrupt)', color: 'text-green-400' },
  'everbright-solar': { score: 6, label: 'Moderate', color: 'text-yellow-400' },
  'blue-raven-solar': { score: 5, label: 'Moderate (Closed)', color: 'text-yellow-400' },
};

const STATUS_COLORS: Record<string, string> = {
  'Active': 'text-green-400',
  'Bankrupt': 'text-red-400',
  'Acquired': 'text-yellow-400',
  'Closed': 'text-red-400',
};

type SortKey = 'name' | 'bbRating' | 'complaintCount' | 'difficulty' | 'status';

function getRatingScore(rating: string): number {
  if (rating === 'A+') return 11;
  if (rating === 'A') return 10;
  if (rating === 'A-') return 9;
  if (rating === 'B+') return 8;
  if (rating === 'B') return 7;
  if (rating === 'B-') return 6;
  if (rating === 'C+') return 5;
  if (rating === 'C') return 4;
  if (rating === 'C-') return 3;
  if (rating === 'D') return 2;
  if (rating === 'F') return 1;
  if (rating === 'NR') return 0;
  return 0;
}

function getComplaintNumber(count: string): number {
  const n = parseInt(count.replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

export default function CompanyComparison() {
  useSeoMeta({
    title: 'Solar Company Comparison 2026: Complaints, Ratings & Cancellation Difficulty',
    description: 'Compare all 19 major solar companies side-by-side: BBB ratings, complaint counts, cancellation difficulty, and known issues. Find out which companies are hardest to leave.',
    canonical: 'https://breakyoursolarcontract.com/compare',
  });

  const [sortKey, setSortKey] = useState<SortKey>('difficulty');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState<string>('all');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filtered = companies.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'bankrupt') return c.status.toLowerCase().includes('bankrupt') || c.status.toLowerCase().includes('closed');
    if (filter === 'active') return c.status === 'Active';
    if (filter === 'lenders') return ['goodleap', 'mosaic-solar', 'sunlight-financial', 'dividend-finance', 'loanpal'].includes(c.slug);
    if (filter === 'installers') return !['goodleap', 'mosaic-solar', 'sunlight-financial', 'dividend-finance', 'loanpal'].includes(c.slug);
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let aVal: number | string = 0;
    let bVal: number | string = 0;

    if (sortKey === 'name') {
      aVal = a.name;
      bVal = b.name;
    } else if (sortKey === 'bbRating') {
      aVal = getRatingScore(a.bbRating);
      bVal = getRatingScore(b.bbRating);
    } else if (sortKey === 'complaintCount') {
      aVal = getComplaintNumber(a.complaintCount);
      bVal = getComplaintNumber(b.complaintCount);
    } else if (sortKey === 'difficulty') {
      aVal = DIFFICULTY_MAP[a.slug]?.score ?? 5;
      bVal = DIFFICULTY_MAP[b.slug]?.score ?? 5;
    } else if (sortKey === 'status') {
      aVal = a.status;
      bVal = b.status;
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown className="w-3 h-3 opacity-30 inline ml-1" />;
    return sortDir === 'desc'
      ? <ChevronDown className="w-3 h-3 text-amber-400 inline ml-1" />
      : <ChevronUp className="w-3 h-3 text-amber-400 inline ml-1" />;
  };

  return (
    <div className="min-h-screen bg-[#0D0F14] text-white">
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Table',
        'name': 'Solar Company Comparison 2026',
        'description': 'Side-by-side comparison of 19 major solar companies including BBB ratings, complaint counts, and cancellation difficulty.',
        'url': 'https://breakyoursolarcontract.com/compare'
      })}} />

      {/* Hero */}
      <section className="pt-24 pb-12 px-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded px-3 py-1 text-amber-400 text-xs font-mono uppercase tracking-wider mb-6">
            <AlertTriangle className="w-3 h-3" />
            Updated July 2026
          </div>
          <h1 className="font-display text-5xl md:text-6xl text-white mb-4">
            SOLAR COMPANY<br />
            <span className="text-amber-400">COMPARISON</span>
          </h1>
          <p className="text-gray-300 text-xl max-w-3xl mb-8">
            All 19 major solar companies ranked by complaint volume, BBB rating, and how hard they make it to cancel your contract. Use this to understand what you are dealing with — and what your options are.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/case-review">
              <button className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded transition-colors">
                Get Free Case Review →
              </button>
            </Link>
            <Link href="/calculator">
              <button className="border border-white/20 hover:border-amber-500/50 text-white px-6 py-3 rounded transition-colors">
                Check Your Cancellation Strength
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-6 px-4 bg-white/5 border-b border-white/10">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Companies Tracked', value: '19' },
            { label: 'Currently Bankrupt/Closed', value: companies.filter(c => c.status !== 'Active').length.toString() },
            { label: 'Total BBB Complaints', value: '15,000+' },
            { label: 'Avg Cancellation Difficulty', value: '7/10' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-display text-amber-400">{stat.value}</div>
              <div className="text-gray-400 text-xs font-mono uppercase tracking-wider mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 px-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Companies' },
            { key: 'active', label: 'Active' },
            { key: 'bankrupt', label: 'Bankrupt / Closed' },
            { key: 'installers', label: 'Installers' },
            { key: 'lenders', label: 'Lenders' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                filter === f.key
                  ? 'bg-amber-500 text-black'
                  : 'border border-white/20 text-gray-300 hover:border-amber-500/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  <th
                    className="text-left py-3 px-4 text-gray-400 font-mono text-xs uppercase tracking-wider cursor-pointer hover:text-amber-400 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    Company <SortIcon col="name" />
                  </th>
                  <th
                    className="text-left py-3 px-4 text-gray-400 font-mono text-xs uppercase tracking-wider cursor-pointer hover:text-amber-400 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    Status <SortIcon col="status" />
                  </th>
                  <th
                    className="text-left py-3 px-4 text-gray-400 font-mono text-xs uppercase tracking-wider cursor-pointer hover:text-amber-400 transition-colors"
                    onClick={() => handleSort('bbRating')}
                  >
                    BBB Rating <SortIcon col="bbRating" />
                  </th>
                  <th
                    className="text-left py-3 px-4 text-gray-400 font-mono text-xs uppercase tracking-wider cursor-pointer hover:text-amber-400 transition-colors"
                    onClick={() => handleSort('complaintCount')}
                  >
                    Complaints <SortIcon col="complaintCount" />
                  </th>
                  <th
                    className="text-left py-3 px-4 text-gray-400 font-mono text-xs uppercase tracking-wider cursor-pointer hover:text-amber-400 transition-colors"
                    onClick={() => handleSort('difficulty')}
                  >
                    Cancel Difficulty <SortIcon col="difficulty" />
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-mono text-xs uppercase tracking-wider">
                    Contract Types
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-mono text-xs uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((company, idx) => {
                  const difficulty = DIFFICULTY_MAP[company.slug] ?? { score: 5, label: 'Moderate', color: 'text-yellow-400' };
                  const statusColor = STATUS_COLORS[company.status] ?? 'text-gray-400';
                  const ratingScore = getRatingScore(company.bbRating);
                  const ratingColor = ratingScore >= 8 ? 'text-green-400' : ratingScore >= 5 ? 'text-yellow-400' : 'text-red-400';

                  return (
                    <tr
                      key={company.slug}
                      className={`border-b border-white/10 hover:bg-white/5 transition-colors ${idx % 2 === 0 ? '' : 'bg-white/[0.02]'}`}
                    >
                      <td className="py-4 px-4">
                        <div className="font-semibold text-white">{company.name}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{company.headquarters}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`font-mono text-xs font-semibold ${statusColor}`}>
                          {company.status === 'Active' ? (
                            <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>
                          ) : company.status.includes('Bankrupt') ? (
                            <span className="flex items-center gap-1"><XCircle className="w-3 h-3" /> {company.status}</span>
                          ) : (
                            <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {company.status}</span>
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`font-mono font-bold text-lg ${ratingColor}`}>{company.bbRating}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono text-gray-300">{company.complaintCount}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5,6,7,8,9,10].map(n => (
                              <div
                                key={n}
                                className={`w-1.5 h-4 rounded-sm ${n <= difficulty.score ? 'bg-amber-500' : 'bg-white/10'}`}
                              />
                            ))}
                          </div>
                          <span className={`text-xs font-mono ${difficulty.color}`}>{difficulty.label}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {company.contractTypes.slice(0, 2).map(type => (
                            <span key={type} className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded">
                              {type}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Link href={`/solar-companies/${company.slug}`}>
                          <button className="text-amber-400 hover:text-amber-300 text-xs font-mono uppercase tracking-wider transition-colors whitespace-nowrap">
                            View Details →
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Key Insights */}
      <section className="py-12 px-4 bg-white/5 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-4xl text-white mb-8">KEY FINDINGS</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <XCircle className="w-6 h-6 text-red-400" />,
                title: 'Hardest to Cancel',
                body: 'Sunrun (score 9/10) and Tesla Solar (8/10) are the most difficult companies to exit. Both use aggressive legal teams and complex lease structures designed to make cancellation expensive.',
                link: '/solar-companies/sunrun',
                linkText: 'Sunrun Cancellation Guide →'
              },
              {
                icon: <AlertTriangle className="w-6 h-6 text-orange-400" />,
                title: 'Most Complaints',
                body: 'GoodLeap leads all solar lenders with 1,000+ BBB complaints, primarily about hidden dealer fees. Sunrun leads installers with 800+ complaints about billing, maintenance, and misrepresentation.',
                link: '/solar-companies/goodleap',
                linkText: 'GoodLeap Complaints Guide →'
              },
              {
                icon: <CheckCircle className="w-6 h-6 text-green-400" />,
                title: 'Easiest to Cancel',
                body: 'Companies that have gone bankrupt (Pink Energy, Sungevity, Sunnova) are generally easier to exit because their failure constitutes a material breach of contract. Act quickly — bankruptcy windows close.',
                link: '/blog/solar-company-went-out-of-business-what-to-do',
                linkText: 'Bankrupt Company Guide →'
              }
            ].map(insight => (
              <div key={insight.title} className="bg-white/5 border border-white/10 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  {insight.icon}
                  <h3 className="font-semibold text-white">{insight.title}</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{insight.body}</p>
                <Link href={insight.link}>
                  <span className="text-amber-400 text-xs font-mono hover:text-amber-300 transition-colors cursor-pointer">
                    {insight.linkText}
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 border-t border-white/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl text-white mb-4">
            KNOW YOUR COMPANY.<br />
            <span className="text-amber-400">KNOW YOUR OPTIONS.</span>
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Every company on this list has homeowners who successfully got out of their contracts. Find out if you qualify for a free case review.
          </p>
          <Link href="/case-review">
            <button className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-4 rounded text-lg transition-colors">
              Get Your Free Case Review →
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
