import type { ReactNode } from 'react';
import { Link } from 'wouter';
import { ArrowRight, FileCheck2, FileText, MapPin, ShieldCheck } from 'lucide-react';
import { SchemaInjector } from './SchemaInjector';
import { ArticleContent } from './ArticlePresentation';
import { buildPriorityCitySchemas, type PriorityCityContent } from '@shared/priorityCityContent';
import { isVegasCityPath } from '@shared/vegasCampaign';
import VegasBookingCTA from './VegasBookingCTA';

export default function PriorityCityGuide({ data, heroImage, form }: { data: PriorityCityContent; heroImage: string; form: ReactNode }) {
  const path = `/cancel-solar-contract/${data.slug}`;
  const vegas = isVegasCityPath(path);
  const reviewLinkClass = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-3 text-sm font-bold text-black transition-colors hover:bg-amber-400';
  return <div className={`min-h-screen bg-[#0D0F14] text-white [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-4 [&_a]:focus-visible:outline-amber-400 [&_summary]:focus-visible:outline-2 [&_summary]:focus-visible:outline-offset-4 [&_summary]:focus-visible:outline-amber-400 ${vegas ? 'pb-28' : ''}`}>
    <SchemaInjector schemas={buildPriorityCitySchemas(data, path)} replaceExisting />
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#0D0F14]/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-3">
        <Link href="/" className="font-display text-lg tracking-wider sm:text-xl">SOLAR FREEDOM</Link>
        <a href="#city-form" className="rounded-lg bg-amber-500 px-3 py-2.5 text-xs font-bold text-black hover:bg-amber-400 sm:text-sm">REQUEST A CASE REVIEW</a>
      </div>
    </nav>
    <main data-priority-city-guide={data.slug}>
      <header className="relative overflow-hidden border-b border-white/10">
        <img src={heroImage} alt={`Solar contract resources for ${data.city}, ${data.state}`} className="absolute inset-0 h-full w-full object-cover" loading="eager" fetchPriority="high" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D0F14] via-[#0D0F14]/90 to-[#0D0F14]/40" />
        <div className="container relative py-10 md:py-16">
          <p className="mb-5 flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-amber-400"><MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />{data.city}, {data.state} · Solar agreement guide</p>
          <h1 className="max-w-3xl font-display text-4xl leading-tight sm:text-5xl md:text-6xl">Solar contract help in <span className="text-amber-400">{data.city}, {data.stateCode}</span></h1>
          <p className="mt-5 max-w-[62ch] text-base leading-7 text-zinc-300 sm:text-lg sm:leading-8">{data.heroCopy}</p>
          {vegas ? <div className="mt-6 max-w-xl" data-vegas-hero-actions>
            <p className="mb-3 font-semibold text-white">Talk through your situation in a no-obligation case review.</p>
            <VegasBookingCTA city={data.city} path={path} placement="hero" />
            <a href="#city-form" className="mt-4 inline-flex items-center gap-2 font-medium text-amber-300 underline underline-offset-4">Prefer to send your details? Start your case review <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
          </div> : <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row">
            <a href="#city-form" className={reviewLinkClass}>Request a no-obligation review <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
            <a href="#city-answer" className="inline-flex min-h-12 items-center rounded-lg border border-white/20 px-5 py-3 text-sm text-zinc-200 hover:border-amber-500/60">Understand your next step</a>
          </div>}
          <p className="mt-4 text-xs leading-5 text-zinc-300">Educational information—not legal advice. No guaranteed result.</p>
        </div>
      </header>
      <nav aria-label="In this city guide" className="border-b border-white/10 bg-[#171A21]/50">
        <div className="container flex max-w-6xl flex-wrap gap-x-6 gap-y-3 py-4 text-sm text-amber-300">
          <a href="#city-answer" className="underline underline-offset-4">The short answer</a>
          <a href="#city-documents" className="underline underline-offset-4">Document checklist</a>
          <a href="#city-local-resources" className="underline underline-offset-4">Consumer resources</a>
          <a href="#city-faq" className="underline underline-offset-4">Common questions</a>
        </div>
      </nav>
      <div className="container grid max-w-6xl gap-8 py-8 md:py-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
        <article className="min-w-0 w-full max-w-[70ch] space-y-9">
          <section id="city-answer" className="scroll-mt-24 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 sm:p-7">
            <p className="mb-3 text-xs font-mono uppercase tracking-wider text-amber-400">The short answer</p>
            <h2 className="font-display text-3xl leading-tight">{data.question}</h2>
            <ArticleContent content={data.answer} />
          </section>
          <section id="city-documents" className="scroll-mt-24">
            <h2 className="flex items-start gap-3 font-display text-3xl leading-tight"><FileCheck2 className="mt-1 h-6 w-6 shrink-0 text-amber-400" aria-hidden="true" />What to gather before requesting help</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {data.documents.map((item, index) => <li key={item} className="rounded-xl border border-white/10 bg-[#171A21] p-5">
                <div className="mb-3 flex items-center justify-between text-amber-400" aria-hidden="true"><FileText className="h-5 w-5" /><span className="font-mono text-xs">{String(index + 1).padStart(2, '0')}</span></div>
                <p className="text-sm leading-7 text-zinc-300">{item}</p>
              </li>)}
            </ul>
          </section>
          <section className="rounded-2xl border border-amber-500/40 bg-[#171A21] p-5 sm:p-7" data-city-mid-cta data-vegas-mid-cta={vegas || undefined}>
            <h2 className="font-display text-3xl leading-tight">You do not have to work this out alone</h2>
            <p className="mb-5 mt-3 text-sm leading-7 text-zinc-300">Tell us what was promised and what is going wrong. A case review can help identify the documents and questions to address next. It does not guarantee that you can cancel.</p>
            {vegas ? <VegasBookingCTA city={data.city} path={path} placement="mid_page" /> : <a href="#city-form" className={reviewLinkClass}>Request a case review <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>}
          </section>
          <div className="space-y-4">
            {data.reviewSteps.map((section, index) => <section key={section.heading} className="rounded-xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
              <div className="mb-4 inline-flex items-center rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-mono tracking-wider text-amber-400">STEP {index + 1}</div>
              <h2 className="font-display text-3xl leading-tight">{section.heading}</h2>
              <ArticleContent content={section.body} />
            </section>)}
          </div>
          <section id="city-local-resources" className="scroll-mt-24 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
            <h2 className="font-display text-3xl leading-tight">{data.state} consumer resources</h2>
            <ArticleContent content={data.localNote} />
            <ul className="mt-6 space-y-4">{data.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="break-words text-amber-400 underline underline-offset-4 hover:text-amber-300">{source.label}</a></li>)}</ul>
            <p className="mt-5 text-xs leading-6 text-zinc-400">Sources checked: {data.sourceCheckedOn}. Official guidance can change.</p>
          </section>
          <section id="city-faq" className="scroll-mt-24">
            <h2 className="font-display text-3xl leading-tight">Frequently asked questions</h2>
            <div className="mt-5 space-y-3">{data.faq.map((item, index) => <details key={item.q} open={index === 0} className="rounded-xl border border-white/10 p-5">
              <summary className="cursor-pointer font-medium leading-7">{item.q}</summary>
              <ArticleContent content={item.a} />
            </details>)}</div>
          </section>
          <section data-city-end-cta className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 sm:p-7">
            <h2 className="font-display text-3xl leading-tight">{data.ctaHeading}</h2>
            <p className="mb-5 mt-3 text-sm leading-7 text-zinc-300">{data.ctaCopy}</p>
            <a href="#city-form" className={reviewLinkClass}>Start your case review <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
          </section>
          <nav aria-label="Related solar contract resources" className="border-t border-white/10 pt-8">
            <h2 className="font-display text-3xl">Related resources</h2>
            <ul className="mt-4 space-y-4">{data.links.map(link => <li key={link.url}><Link href={link.url} className="inline-flex items-start gap-2 text-amber-400 underline underline-offset-4 hover:text-amber-300">{link.label}<ArrowRight className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /></Link></li>)}</ul>
          </nav>
        </article>
        <aside id="city-form" data-city-intake className="order-first scroll-mt-24 self-start rounded-2xl border border-amber-500/30 bg-[#171A21] p-5 sm:p-6 lg:order-last lg:sticky lg:top-24">
          <p className="mb-4 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400"><ShieldCheck className="h-4 w-4" aria-hidden="true" />No obligation</p>
          <h2 className="font-display text-3xl leading-tight">Request your {data.city} contract review</h2>
          <p className="mb-6 mt-4 text-sm leading-7 text-zinc-300">{data.ctaCopy}</p>
          {vegas && <VegasBookingCTA city={data.city} path={path} />}
          {form}
        </aside>
      </div>
    </main>
    <footer className="border-t border-white/10 pt-8 pb-36 md:pb-24"><div className="container flex flex-wrap items-center justify-between gap-4 text-sm text-zinc-400"><Link href="/" className="font-display text-lg text-white">SOLAR FREEDOM</Link><p className="max-w-[70ch] leading-6">Consumer information for {data.city}, {data.state}. Options depend on the agreement, facts and jurisdiction.</p><Link href="/privacy-policy">Privacy</Link></div></footer>
    {vegas && <div data-vegas-sticky-actions className="fixed inset-x-0 bottom-0 z-[10000] border-t border-amber-500/40 bg-[#0D0F14]/95 py-3 backdrop-blur" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
      <div className="container flex max-w-4xl items-center gap-5 pr-20 md:pr-6">
        <p className="hidden flex-1 text-sm text-zinc-200 md:block">Questions about your solar agreement? Start with a no-obligation review.</p>
        <div className="w-full md:w-80"><VegasBookingCTA city={data.city} path={path} placement="sticky" /></div>
      </div>
    </div>}
  </div>;
}
