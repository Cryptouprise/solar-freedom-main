// Solar Freedom — StateLawPage
// Design: Pro-homeowner, pro-solar technology, anti-predatory-sales
// Psychology: Curiosity gaps, social proof, authority, urgency, specificity
// AEO: FAQ schema, HowTo schema, structured Q&A for AI answer engines

import { useParams, Link } from 'wouter';
import { useEffect } from 'react';
import { useSeoMeta } from '@/hooks/useSeoMeta';
import { SchemaInjector } from '@/components/SchemaInjector';
import { getStateLaw, StateLawSection } from '@/data/state-laws';
import { cities as ALL_CITIES } from '@/data/cities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertTriangle,
  CheckCircle,
  Scale,
  BookOpen,
  ArrowRight,
  Shield,
  Clock,
  Phone,
  ChevronRight,
  Gavel,
  FileText,
  HelpCircle,
} from 'lucide-react';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1600&q=80&auto=format&fit=crop';

function AggressivenessBar({ rating }: { rating: number }) {
  const labels = ['', 'Low', 'Moderate', 'Active', 'High', 'Very High'];
  const colors = ['', 'bg-green-500', 'bg-yellow-400', 'bg-orange-400', 'bg-red-400', 'bg-red-600'];
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-400 whitespace-nowrap">Solar Sales Activity:</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-2 w-6 rounded-full ${i <= rating ? colors[rating] : 'bg-slate-700'}`}
          />
        ))}
      </div>
      <span className={`text-sm font-semibold ${rating >= 4 ? 'text-red-400' : rating >= 3 ? 'text-orange-400' : 'text-yellow-400'}`}>
        {labels[rating]}
      </span>
    </div>
  );
}

function ContentSection({ section }: { section: StateLawSection }) {
  switch (section.type) {
    case 'h2':
      return (
        <h2 className="text-2xl font-bold text-white mt-10 mb-4 leading-tight">
          {section.content}
        </h2>
      );
    case 'h3':
      return (
        <h3 className="text-xl font-semibold text-amber-400 mt-8 mb-3">
          {section.content}
        </h3>
      );
    case 'p':
      return (
        <p className="text-slate-300 leading-relaxed mb-5 text-[1.05rem]">
          {section.content}
        </p>
      );
    case 'callout':
      return (
        <div className="my-6 border-l-4 border-amber-400 bg-amber-400/10 rounded-r-lg p-5">
          <div className="flex gap-3">
            <CheckCircle className="text-amber-400 mt-0.5 shrink-0" size={20} />
            <p className="text-amber-100 leading-relaxed text-sm">{section.content}</p>
          </div>
        </div>
      );
    case 'warning':
      return (
        <div className="my-6 border-l-4 border-red-500 bg-red-500/10 rounded-r-lg p-5">
          <div className="flex gap-3">
            <AlertTriangle className="text-red-400 mt-0.5 shrink-0" size={20} />
            <p className="text-red-100 leading-relaxed text-sm font-medium">{section.content}</p>
          </div>
        </div>
      );
    case 'list':
      return (
        <ul className="my-5 space-y-3">
          {section.items?.map((item, i) => (
            <li key={i} className="flex gap-3 text-slate-300 text-sm leading-relaxed">
              <ChevronRight className="text-amber-400 mt-0.5 shrink-0" size={16} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case 'stat-block':
      return (
        <div className="my-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {section.stats?.map((stat, i) => (
            <div key={i} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-amber-400 mb-1">{stat.value}</div>
              <div className="text-xs text-slate-400 leading-tight">{stat.label}</div>
            </div>
          ))}
        </div>
      );
    case 'law-card':
      return (
        <div className="my-6 bg-slate-800/60 border border-slate-600 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Gavel className="text-amber-400 mt-0.5 shrink-0" size={20} />
            <div>
              <div className="text-xs text-amber-400 font-mono mb-1">{section.statute}</div>
              <div className="text-white font-semibold mb-2">{section.statuteTitle}</div>
              <p className="text-slate-300 text-sm leading-relaxed">{section.statuteDescription}</p>
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
}

export default function StateLawPage() {
  const params = useParams<{ state: string }>();
  const stateSlug = params.state;
  const law = getStateLaw(stateSlug || '');

  useSeoMeta({
    title: law ? law.metaTitle : 'Solar Contract Laws by State | Solar Freedom',
    description: law ? law.metaDescription : 'Understand your state\'s solar contract laws and consumer protections.',
    canonical: `https://breakyoursolarcontract.com/solar-contract-laws/${stateSlug ?? ''}`,
  });

  const stateLawSchemas = law ? [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: law.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://breakyoursolarcontract.com' },
        { '@type': 'ListItem', position: 2, name: 'Solar Contract Laws', item: 'https://breakyoursolarcontract.com/solar-contract-help' },
        { '@type': 'ListItem', position: 3, name: `${law.state} Solar Contract Laws`, item: `https://breakyoursolarcontract.com/solar-contract-laws/${law.slug}` },
      ],
    },
  ] : [];

  useEffect(() => {
    if (law) {
      document.title = law.metaTitle;
      const desc = document.querySelector('meta[name="description"]');
      if (desc) desc.setAttribute('content', law.metaDescription);
    }
  }, [law]);

  if (!law) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">State Not Found</h1>
          <Link href="/solar-contract-help">
            <Button>View All States</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <SchemaInjector schemas={stateLawSchemas} />
      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div
        className="relative min-h-[480px] flex items-end pb-12 pt-24"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(15,23,42,0.7) 0%, rgba(15,23,42,0.92) 60%, rgba(15,23,42,1) 100%), url(${HERO_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container max-w-4xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
            <Link href="/" className="hover:text-amber-400 transition-colors">Home</Link>
            <ChevronRight size={14} />
            <Link href="/solar-contract-help" className="hover:text-amber-400 transition-colors">State Solar Laws</Link>
            <ChevronRight size={14} />
            <span className="text-white">{law.state}</span>
          </nav>

          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className="bg-amber-400/20 text-amber-400 border-amber-400/30 font-mono text-xs">
              {law.primaryStatute}
            </Badge>
            <Badge className="bg-slate-700 text-slate-300 border-slate-600 text-xs">
              {law.coolingOffDays}-Day Cancellation Right
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30 text-xs">
              Updated 2026
            </Badge>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
            {law.heroHook}
          </h1>
          <p className="text-xl text-slate-300 leading-relaxed mb-6 max-w-3xl">
            {law.heroSubhook}
          </p>

          <AggressivenessBar rating={law.aggressivenessRating} />
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <div className="container max-w-4xl py-12">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Article body */}
          <div className="lg:col-span-2">
            {/* Primary statute card */}
            <div className="bg-slate-800/60 border border-amber-400/30 rounded-2xl p-6 mb-10">
              <div className="flex items-start gap-4">
                <div className="bg-amber-400/10 rounded-xl p-3 shrink-0">
                  <Scale className="text-amber-400" size={24} />
                </div>
                <div>
                  <div className="text-xs text-amber-400 font-mono mb-1">{law.primaryStatute}</div>
                  <div className="text-white font-bold text-lg mb-2">{law.primaryStatuteTitle}</div>
                  <div className="flex items-start gap-2">
                    <Clock className="text-slate-400 mt-0.5 shrink-0" size={14} />
                    <p className="text-slate-300 text-sm leading-relaxed">{law.coolingOffNote}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content sections */}
            {law.content.map((section, i) => (
              <ContentSection key={i} section={section} />
            ))}

            {/* FAQ Section */}
            <div className="mt-12">
              <div className="flex items-center gap-3 mb-6">
                <HelpCircle className="text-amber-400" size={24} />
                <h2 className="text-2xl font-bold text-white">
                  {law.state} Solar Contract FAQ
                </h2>
              </div>
              <Accordion type="single" collapsible className="space-y-3">
                {law.faq.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="bg-slate-800/60 border border-slate-700 rounded-xl px-5 overflow-hidden"
                  >
                    <AccordionTrigger className="text-left text-white hover:text-amber-400 py-4 font-medium">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-300 pb-4 leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Related cities — pull from main cities data for this state */}
            {(() => {
              const stateCities = ALL_CITIES.filter((c) => c.state === law.state).slice(0, 12);
              if (stateCities.length === 0) return null;
              return (
                <div className="mt-12 bg-slate-800/40 border border-slate-700 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <BookOpen size={18} className="text-amber-400" />
                    Cancel Your Solar Contract in {law.state} — City Resources
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">We serve homeowners across all of {law.state}. Select your city for local attorney resources and case reviews.</p>
                  <div className="flex flex-wrap gap-2">
                    {stateCities.map((city) => (
                      <Link key={city.slug} href={`/cancel-solar-contract/${city.slug}`}>
                        <Badge className="bg-slate-700 hover:bg-amber-400/20 text-slate-300 hover:text-amber-400 border-slate-600 hover:border-amber-400/30 cursor-pointer transition-all">
                          {city.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* CTA Card */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white sticky top-6">
              <Shield className="mb-3" size={28} />
              <h3 className="text-xl font-black mb-2">Get a Free Case Review</h3>
              <p className="text-amber-100 text-sm mb-4 leading-relaxed">
                Find out in 60 seconds if your {law.state} solar contract has grounds for cancellation.
              </p>
              <Link href="/#qualify">
                <Button className="w-full bg-white text-orange-600 hover:bg-amber-50 font-bold">
                  Check My Contract
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
              <p className="text-amber-200 text-xs text-center mt-3">
                No obligation · Takes 60 seconds
              </p>
            </div>

            {/* Key Rights Card */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
              <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                <FileText size={16} className="text-amber-400" />
                Your Key Rights in {law.state}
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-slate-300">
                  <CheckCircle size={14} className="text-green-400 mt-0.5 shrink-0" />
                  <span>{law.coolingOffDays}-day right to cancel after signing</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-300">
                  <CheckCircle size={14} className="text-green-400 mt-0.5 shrink-0" />
                  <span>Protection under {law.primaryStatuteTitle}</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-300">
                  <CheckCircle size={14} className="text-green-400 mt-0.5 shrink-0" />
                  <span>Right to accurate savings projections</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-300">
                  <CheckCircle size={14} className="text-green-400 mt-0.5 shrink-0" />
                  <span>Right to clear disclosure of all fees</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-300">
                  <CheckCircle size={14} className="text-green-400 mt-0.5 shrink-0" />
                  <span>Protection against misrepresentation of tax credits</span>
                </li>
              </ul>
            </div>

            {/* Emergency contact */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
              <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                <Phone size={16} className="text-amber-400" />
                Need Help Now?
              </h4>
              <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                Our team reviews {law.state} solar contracts and can tell you within 24 hours if you have grounds to cancel.
              </p>
              <Link href="/#contact">
                <Button variant="outline" className="w-full border-amber-400/50 text-amber-400 hover:bg-amber-400/10">
                  Contact Us
                </Button>
              </Link>
            </div>

            {/* All states link */}
            <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 text-center">
              <p className="text-slate-400 text-xs mb-2">Looking for another state?</p>
              <Link href="/solar-contract-help">
                <button className="text-amber-400 text-sm font-medium hover:underline">
                  View All 50 States →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
