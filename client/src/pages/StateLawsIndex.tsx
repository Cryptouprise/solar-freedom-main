// Solar Freedom — StateLawsIndex
// All 50 states solar consumer rights hub page
// AEO optimized with structured content and curiosity-driven copy

import { Link } from 'wouter';
import { useEffect } from 'react';
import { useSeoMeta } from '@/hooks/useSeoMeta';
import { SchemaInjector } from '@/components/SchemaInjector';
import { getAllStateLaws } from '@/data/state-laws';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Scale,
  Shield,
  ArrowRight,
  ChevronRight,
  MapPin,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1600&q=80&auto=format&fit=crop';

const aggressivenessColors: Record<number, string> = {
  1: 'bg-green-500/20 text-green-400 border-green-500/30',
  2: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  3: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  4: 'bg-red-500/20 text-red-400 border-red-500/30',
  5: 'bg-red-600/20 text-red-300 border-red-600/30',
};

const aggressivenessLabels: Record<number, string> = {
  1: 'Low Activity',
  2: 'Moderate',
  3: 'Active Market',
  4: 'High Activity',
  5: 'Very High',
};

export default function StateLawsIndex() {
  const states = getAllStateLaws();
  useSeoMeta({
    title: 'Solar Contract Rights by State: All 50 States (2026) | Break Your Solar Contract',
    description: "Find your state's solar consumer protection laws, cooling-off rights, and legal options for canceling a predatory solar contract. Updated for 2026.",
    canonical: 'https://breakyoursolarcontract.com/solar-contract-laws',
  });

  useEffect(() => {
    document.title = 'Solar Contract Rights by State: All 50 States (2026) | Break Your Solar Contract';
    const desc = document.querySelector('meta[name="description"]');
    if (desc)
      desc.setAttribute(
        'content',
        'Find your state\'s solar consumer protection laws, cooling-off rights, and legal options for canceling a predatory solar contract. Updated for 2026.'
      );
  }, []);

  const highActivityStates = states.filter((s) => s.aggressivenessRating >= 4);
  const otherStates = states.filter((s) => s.aggressivenessRating < 4);

  const stateIndexSchemas: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://breakyoursolarcontract.com' },
        { '@type': 'ListItem', position: 2, name: 'Solar Contract Rights by State', item: 'https://breakyoursolarcontract.com/solar-contract-laws' },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What are my rights when canceling a solar contract?',
          acceptedAnswer: { '@type': 'Answer', text: 'Your rights depend on your state. Most states provide a 3-day right of rescission for contracts signed at home. Many states have additional consumer protection laws covering solar contracts, including extended cancellation windows, mandatory disclosures, and contractor licensing requirements. Find your state above for specific rights.' },
        },
        {
          '@type': 'Question',
          name: 'Which states have the strongest solar consumer protection laws?',
          acceptedAnswer: { '@type': 'Answer', text: 'California, Florida, Texas, Arizona, and Nevada have the most active solar markets and the most developed consumer protection frameworks. California in particular has strong CSLB licensing requirements and the PACE financing consumer protection law.' },
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <SchemaInjector schemas={stateIndexSchemas} />
      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div
        className="relative min-h-[400px] flex items-end pb-12 pt-24"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(15,23,42,0.6) 0%, rgba(15,23,42,0.9) 60%, rgba(15,23,42,1) 100%), url(${HERO_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container max-w-5xl">
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
            <Link href="/" className="hover:text-amber-400 transition-colors">Home</Link>
            <ChevronRight size={14} />
            <span className="text-white">Solar Contract Rights by State</span>
          </nav>

          <Badge className="bg-amber-400/20 text-amber-400 border-amber-400/30 mb-4">
            All 50 States · Updated 2026
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
            Your State Has Laws That Protect You From Predatory Solar Contracts.
            <span className="text-amber-400"> Most Homeowners Never Find Out.</span>
          </h1>
          <p className="text-xl text-slate-300 leading-relaxed mb-6 max-w-3xl">
            Every state has consumer protection statutes, cooling-off rights, and contractor licensing requirements that solar companies are supposed to follow. When they don't, those violations become your legal leverage. Find your state below.
          </p>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle size={16} className="text-green-400" />
              <span>Real statute citations</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle size={16} className="text-green-400" />
              <span>State-specific net metering reality</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle size={16} className="text-green-400" />
              <span>2026 law updates included</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────────────── */}
      <div className="container max-w-5xl py-16">

        {/* The honest framing */}
        <div className="bg-amber-400/10 border border-amber-400/30 rounded-2xl p-8 mb-14">
          <div className="flex items-start gap-4">
            <Scale className="text-amber-400 mt-1 shrink-0" size={28} />
            <div>
              <h2 className="text-2xl font-bold text-white mb-3">
                We Love Solar. We Hate How It's Being Sold.
              </h2>
              <p className="text-slate-300 leading-relaxed mb-3">
                Solar energy is one of the most powerful tools a homeowner has for energy independence. The technology is real. The savings potential is real. The environmental benefit is real. What is not okay — what has never been okay — is the wave of predatory sales tactics that have trapped hundreds of thousands of American families in contracts they didn't understand.
              </p>
              <p className="text-slate-300 leading-relaxed">
                Undersized systems sold knowing they won't cover the whole bill. Tax credit "refund checks" that don't exist. "Government programs" that are private 25-year loans. Homeowners who will never qualify for the tax credit because they owe $0 in federal taxes. Every one of these is a violation of state law. Every one of them gives you legal leverage. This page is your guide to finding it.
              </p>
            </div>
          </div>
        </div>

        {/* High-activity states first */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="text-red-400" size={22} />
            <h2 className="text-2xl font-bold text-white">Highest-Activity Solar Markets</h2>
          </div>
          <p className="text-slate-400 mb-6 text-sm">
            These states have the most aggressive solar sales activity — and the strongest consumer protection laws to match.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {highActivityStates.map((state) => (
              <Link key={state.slug} href={`/solar-contract-laws/${state.slug}`}>
                <div className="group bg-slate-800/60 border border-slate-700 hover:border-amber-400/50 rounded-xl p-5 cursor-pointer transition-all hover:bg-slate-800">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-amber-400" />
                      <span className="font-bold text-white group-hover:text-amber-400 transition-colors">
                        {state.state}
                      </span>
                      <span className="text-slate-500 text-xs">{state.stateAbbr}</span>
                    </div>
                    <Badge className={`text-xs ${aggressivenessColors[state.aggressivenessRating]}`}>
                      {aggressivenessLabels[state.aggressivenessRating]}
                    </Badge>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed mb-3 line-clamp-2">
                    {state.metaDescription}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-amber-400/70">{state.primaryStatute}</span>
                    <ArrowRight size={14} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* All other states */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Shield className="text-slate-400" size={22} />
            <h2 className="text-2xl font-bold text-white">All Other States</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherStates.map((state) => (
              <Link key={state.slug} href={`/solar-contract-laws/${state.slug}`}>
                <div className="group bg-slate-800/40 border border-slate-700/60 hover:border-amber-400/40 rounded-xl p-4 cursor-pointer transition-all hover:bg-slate-800/60">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white group-hover:text-amber-400 transition-colors text-sm">
                        {state.state}
                      </span>
                      <span className="text-slate-500 text-xs">{state.stateAbbr}</span>
                    </div>
                    <ArrowRight size={12} className="text-slate-600 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                    {state.primaryStatuteTitle}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-black text-white mb-3">
            Not Sure If Your Contract Qualifies?
          </h2>
          <p className="text-amber-100 mb-6 max-w-xl mx-auto leading-relaxed">
            Browse state-specific consumer information and official resources. An individual review is required to assess any agreement, and no response time or outcome is guaranteed.
          </p>
          <Link href="/#qualify">
            <Button className="bg-white text-orange-600 hover:bg-amber-50 font-bold text-lg px-8 py-3">
              Get a Free Case Review
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>
          <p className="text-amber-200 text-xs mt-3">No obligation · Takes 60 seconds</p>
        </div>
      </div>
    </div>
  );
}
