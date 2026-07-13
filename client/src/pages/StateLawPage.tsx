// Solar Freedom — StateLawPage
// Design: Pro-homeowner, pro-solar technology, anti-predatory-sales
// State-specific content is published only after primary-source and reviewer metadata exists.

import { useParams, Link } from 'wouter';
import { useSeoMeta } from '@/hooks/useSeoMeta';
import { SchemaInjector } from '@/components/SchemaInjector';
import { getStateLaw, hasPublishableStateLawEvidence, StateLaw, StateLawSection } from '@/data/state-laws';
import { cities as ALL_CITIES } from '@/data/cities';
import { hasPublishableEditorialReview } from '@/data/publication-governance';
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
  ExternalLink,
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

function StateResearchDraft({ law, schemas }: { law: StateLaw; schemas: object[] }) {
  const records = [
    'Signed agreement and all addenda',
    'Loan, lease, or PPA documents',
    'Cancellation notices and disclosures',
    'Sales proposals and savings estimates',
    'Utility bills and production records',
    'Installer, seller, lender, and servicer communications',
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <SchemaInjector schemas={schemas} />
      <header
        className="relative min-h-[390px] flex items-end pb-12 pt-24"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(15,23,42,0.66) 0%, rgba(15,23,42,0.94) 65%, rgba(15,23,42,1) 100%), url(${HERO_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container max-w-4xl">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-400 mb-6">
            <Link href="/" className="hover:text-amber-400">Home</Link>
            <ChevronRight size={14} />
            <Link href="/solar-contract-laws" className="hover:text-amber-400">State research</Link>
            <ChevronRight size={14} />
            <span className="text-white">{law.state}</span>
          </nav>
          <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/30 mb-4">
            Editorial review pending · noindex
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
            {law.state} solar contract research page
          </h1>
          <p className="text-xl text-slate-300 leading-relaxed max-w-3xl">
            The legacy state summary is not published here because it does not yet have a complete primary-source record, named reviewer, and review date.
          </p>
        </div>
      </header>

      <main className="container max-w-4xl py-12 space-y-10">
        <section className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-7">
          <div className="flex gap-4">
            <Shield className="text-amber-400 shrink-0 mt-1" size={25} />
            <div>
              <h2 className="text-2xl font-bold mb-3">Why this page is paused</h2>
              <p className="text-slate-300 leading-relaxed">
                Legal rules can depend on how a transaction occurred, the contract and financing structure, exemptions, later amendments, and case-specific facts. This page will remain out of search and will not emit FAQ structured data until its claims are traceable and reviewed.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-5 flex items-center gap-3">
            <BookOpen className="text-amber-400" size={23} /> Official research starting points
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: '16 CFR Part 429',
                text: 'Current eCFR text for the federal Cooling-Off Rule, including scope and exemptions.',
                href: 'https://www.ecfr.gov/current/title-16/part-429',
              },
              {
                title: 'State attorney general directory',
                text: 'USA.gov links to current state consumer-protection offices and complaint resources.',
                href: 'https://www.usa.gov/state-attorney-general',
              },
            ].map((source) => (
              <a
                key={source.href}
                href={source.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-slate-700 bg-slate-800/60 p-5 hover:border-amber-400/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold mb-2">{source.title}</h3>
                    <p className="text-sm text-slate-400">{source.text}</p>
                  </div>
                  <ExternalLink className="text-amber-400 shrink-0" size={17} />
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-7">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <FileText className="text-amber-400" size={23} /> Records to gather
          </h2>
          <ul className="grid md:grid-cols-2 gap-3 text-sm text-slate-300">
            {records.map((record) => (
              <li key={record} className="flex items-start gap-2">
                <CheckCircle size={15} className="text-amber-400 mt-0.5 shrink-0" /> {record}
              </li>
            ))}
          </ul>
        </section>

        <section className="text-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-8">
          <h2 className="text-3xl font-black mb-3">Request an individual document review</h2>
          <p className="text-amber-100 max-w-2xl mx-auto mb-6">
            No representation, result, legal conclusion, or response time is promised by submitting information.
          </p>
          <Link href="/#qualify">
            <Button className="bg-white text-orange-600 hover:bg-amber-50 font-bold">
              Submit my records <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        </section>
      </main>
    </div>
  );
}

export default function StateLawPage() {
  const params = useParams<{ state: string }>();
  const stateSlug = params.state;
  const law = getStateLaw(stateSlug || '');
  const isPublishable = Boolean(law && hasPublishableStateLawEvidence(law));

  useSeoMeta({
    title: law
      ? isPublishable
        ? law.metaTitle
        : `${law.state} Solar Contract Research Status | Solar Freedom`
      : 'Solar Contract Information by State | Solar Freedom',
    description: law && isPublishable
      ? law.metaDescription
      : 'This state research page is withheld from search until official primary sources and an editorial reviewer are recorded.',
    canonical: `https://breakyoursolarcontract.com/solar-contract-laws/${stateSlug ?? ''}`,
    noindex: !law || !isPublishable,
  });

  const stateLawSchemas: object[] = law ? [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://breakyoursolarcontract.com/' },
        { '@type': 'ListItem', position: 2, name: 'State solar contract research', item: 'https://breakyoursolarcontract.com/solar-contract-laws' },
        { '@type': 'ListItem', position: 3, name: `${law.state} Solar Contract Laws`, item: `https://breakyoursolarcontract.com/solar-contract-laws/${law.slug}` },
      ],
    },
  ] : [];

  if (law && isPublishable) {
    stateLawSchemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: law.faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    });
  }

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

  if (!isPublishable) {
    return <StateResearchDraft law={law} schemas={stateLawSchemas} />;
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
              Reviewed {law.editorialReview?.reviewedAt}
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
              const stateCities = ALL_CITIES
                .filter((city) => hasPublishableEditorialReview(city))
                .filter((city) => city.state === law.state)
                .slice(0, 12);
              if (stateCities.length === 0) return null;
              return (
                <div className="mt-12 bg-slate-800/40 border border-slate-700 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <BookOpen size={18} className="text-amber-400" />
                    Solar Contract Resources in {law.state}
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">Select a city for location-specific consumer information and records to gather.</p>
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
              <h3 className="text-xl font-black mb-2">Request a Document Review</h3>
              <p className="text-amber-100 text-sm mb-4 leading-relaxed">
                Submit your {law.state} agreement and supporting records for an individual review.
              </p>
              <Link href="/#qualify">
                <Button className="w-full bg-white text-orange-600 hover:bg-amber-50 font-bold">
                  Check My Contract
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
              <p className="text-amber-200 text-xs text-center mt-3">
                No result or response time is promised
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
                Request an individual review of your {law.state} agreement and supporting records. No result or response time is guaranteed.
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
                  View State Directory →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
