import type { ReactNode } from 'react';
import { Link } from 'wouter';
import { ArrowRight, FileCheck2, MapPin, ShieldCheck } from 'lucide-react';
import { SchemaInjector } from './SchemaInjector';
import { buildPriorityCitySchemas, type PriorityCityContent } from '@shared/priorityCityContent';
import { isVegasCityPath } from '@shared/vegasCampaign';
import VegasBookingCTA from './VegasBookingCTA';

export default function PriorityCityGuide({ data, heroImage, form }: {data:PriorityCityContent;heroImage:string;form:ReactNode}) {
  const path=`/cancel-solar-contract/${data.slug}`;
  const vegas=isVegasCityPath(path);
  return <div className={`min-h-screen bg-[#0D0F14] text-white ${vegas?'pb-28':''}`}>
    <SchemaInjector schemas={buildPriorityCitySchemas(data,path)} replaceExisting />
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#0D0F14]/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-3">
        <Link href="/" className="font-display text-xl tracking-wider">SOLAR FREEDOM</Link>
        <a href="#city-form" className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black transition-opacity hover:opacity-90">REQUEST A CASE REVIEW</a>
      </div>
    </nav>
    <main data-priority-city-guide={data.slug}>
      <header className="relative overflow-hidden border-b border-white/10">
        <img src={heroImage} alt={`Solar contract resources for ${data.city}, ${data.state}`} className="absolute inset-0 h-full w-full object-cover" loading="eager" fetchPriority="high" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D0F14] via-[#0D0F14]/90 to-[#0D0F14]/40" />
        <div className={`container relative ${vegas?'py-10 md:py-14':'py-16 md:py-24'}`}>
          <p className="mb-5 flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-amber-400"><MapPin className="h-4 w-4" />{data.city}, {data.state} · Solar agreement guide</p>
          <h1 className={`max-w-3xl font-display leading-tight ${vegas?'text-4xl md:text-6xl':'text-5xl md:text-7xl'}`}>Solar contract help in <span className="text-amber-400">{data.city}, {data.stateCode}</span></h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">{data.heroCopy}</p>
          {vegas?<div className="mt-6 max-w-xl" data-vegas-hero-actions>
            <p className="mb-3 font-semibold text-white">Talk through your situation in a no-obligation case review.</p>
            <VegasBookingCTA city={data.city} path={path} placement="hero" />
            <a href="#city-form" className="mt-4 inline-flex items-center gap-2 font-medium text-amber-300 underline underline-offset-4">Prefer to send your details? Start your case review <ArrowRight className="h-4 w-4" /></a>
          </div>:<div className="mt-8 flex flex-wrap gap-3"><a href="#city-form" className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 font-bold text-black">Request a no-obligation review <ArrowRight className="h-4 w-4" /></a><a href="#city-answer" className="rounded-lg border border-white/20 px-6 py-3 text-zinc-200">Understand your next step</a></div>}
          <p className="mt-5 text-xs text-zinc-400">Educational information—not legal advice. No guaranteed result.</p>
        </div>
      </header>
      <div className="container grid max-w-6xl gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <article className="min-w-0 space-y-10">
          <section id="city-answer" className="scroll-mt-24 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-6 md:p-8">
            <p className="mb-3 text-xs font-mono uppercase tracking-wider text-amber-400">The short answer</p><h2 className="font-display text-3xl">{data.question}</h2><p className="mt-4 leading-8 text-zinc-300">{data.answer}</p>
          </section>
          {vegas&&<section className="rounded-2xl border-2 border-amber-500/50 bg-[#171A21] p-6" data-vegas-mid-cta>
            <h2 className="font-display text-3xl">You do not have to work this out alone</h2>
            <p className="mb-5 mt-3 leading-7 text-zinc-300">Tell us what was promised and what is going wrong. A case review can help identify the documents and questions to address next. It does not guarantee that you can cancel.</p>
            <VegasBookingCTA city={data.city} path={path} placement="mid_page" />
          </section>}
          <section><h2 className="flex items-center gap-3 font-display text-3xl"><FileCheck2 className="h-6 w-6 shrink-0 text-amber-400" />What to gather before requesting help</h2><ul className="mt-5 space-y-3 text-zinc-300">{data.documents.map(item=><li key={item} className="flex gap-3 leading-7"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />{item}</li>)}</ul></section>
          {data.reviewSteps.map((section,index)=><section key={section.heading} className="border-t border-white/10 pt-8"><p className="mb-2 text-xs font-mono text-amber-400">STEP {index+1}</p><h2 className="font-display text-3xl">{section.heading}</h2><p className="mt-4 leading-8 text-zinc-300">{section.body}</p></section>)}
          <section id="city-local-resources" className="scroll-mt-24 rounded-2xl border border-white/10 bg-white/[0.025] p-6"><h2 className="font-display text-3xl">{data.state} consumer resources</h2><p className="mt-4 leading-8 text-zinc-300">{data.localNote}</p><ul className="mt-6 space-y-3">{data.sources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="text-amber-400 underline underline-offset-4">{source.label}</a></li>)}</ul><p className="mt-5 text-xs leading-6 text-zinc-500">Sources checked: {data.sourceCheckedOn}. Official guidance can change.</p></section>
          <section id="city-faq"><h2 className="font-display text-3xl">Frequently asked questions</h2><div className="mt-5 space-y-3">{data.faq.map((item,index)=><details key={item.q} open={index===0} className="rounded-xl border border-white/10 p-5"><summary className="cursor-pointer font-medium leading-7">{item.q}</summary><p className="mt-3 leading-8 text-zinc-300">{item.a}</p></details>)}</div></section>
          <nav aria-label="Related solar contract resources" className="border-t border-white/10 pt-8"><h2 className="font-display text-3xl">Related resources</h2><ul className="mt-4 space-y-3">{data.links.map(link=><li key={link.url}><Link href={link.url} className="inline-flex items-center gap-2 text-amber-400">{link.label}<ArrowRight className="h-4 w-4" /></Link></li>)}</ul></nav>
        </article>
        <aside id="city-form" className={`scroll-mt-24 self-start rounded-2xl border border-amber-500/20 bg-[#171A21] p-6 lg:sticky lg:top-24 ${vegas?'order-first lg:order-last':''}`}>
          <p className="mb-4 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400"><ShieldCheck className="h-4 w-4" />No obligation</p><h2 className="font-display text-3xl">{data.ctaHeading}</h2><p className="mb-6 mt-4 text-sm leading-7 text-zinc-400">{data.ctaCopy}</p>
          {vegas && <VegasBookingCTA city={data.city} path={path} />}
          {form}
        </aside>
      </div>
    </main>
    <footer className="border-t border-white/10 py-8"><div className="container flex flex-wrap items-center justify-between gap-4 text-sm text-zinc-500"><Link href="/" className="font-display text-lg text-white">SOLAR FREEDOM</Link><p>Consumer information for {data.city}, {data.state}. Options depend on the agreement, facts and jurisdiction.</p><Link href="/privacy-policy">Privacy</Link></div></footer>
    {vegas&&<div data-vegas-sticky-actions className="fixed inset-x-0 bottom-0 z-[10000] border-t border-amber-500/40 bg-[#0D0F14]/95 py-3 backdrop-blur" style={{paddingBottom:'max(0.75rem, env(safe-area-inset-bottom))'}}>
      <div className="container flex max-w-4xl items-center gap-5 pr-20 md:pr-6">
        <p className="hidden flex-1 text-sm text-zinc-200 md:block">Questions about your solar agreement? Start with a no-obligation review.</p>
        <div className="w-full md:w-80"><VegasBookingCTA city={data.city} path={path} placement="sticky" /></div>
      </div>
    </div>}
  </div>;
}
