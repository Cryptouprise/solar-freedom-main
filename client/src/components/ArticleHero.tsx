import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Clock, FileText } from 'lucide-react';

// Existing managed site asset, visually checked: solar panels only, no staff,
// brand, results or geographic claim. Never substituted for a supplied hero.
export const EXISTING_SOLAR_HERO = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663287718525/46qo2AwgwNWJ4wJwr8EnH8/hero-bg-FmKRyibRwC4JGhU5naV2R2.webp';
export function resolveBlogHero(image: string | null | undefined, subject: string) {
  return image?.trim() || (/\bsolar\b/i.test(subject) ? EXISTING_SOLAR_HERO : undefined);
}

export default function ArticleHero({ title, image, alt, category, readTime, date, excerpt }: { title: string; image?: string; alt?: string; category: string; readTime: string; date: string; excerpt?: string }) {
  const [failedImage, setFailedImage] = useState<string>();
  const source = resolveBlogHero(image, `${title} ${excerpt ?? ''}`);
  const visibleImage = source && failedImage !== source;
  return <header className="relative isolate overflow-hidden border-b border-white/10 bg-zinc-900 pt-16" data-article-hero>
    {visibleImage ? <img src={source} alt={image ? alt || title : 'Illustrative solar panels; not a specific property or location'} className="absolute inset-0 -z-20 h-full w-full object-cover" loading="eager" fetchPriority="high" decoding="async" onError={() => setFailedImage(source)} /> : <FileText aria-hidden="true" className="absolute right-4 top-24 -z-20 h-56 w-56 text-white/5 sm:right-16" />}
    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0a0a0a]/95 via-[#0a0a0a]/85 to-[#0a0a0a]/40" />
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3 text-xs">
        {category && <span className="rounded-full border border-amber-500/30 bg-amber-500/20 px-3 py-1 font-bold uppercase tracking-wider text-amber-400">{category}</span>}
        <span className="flex items-center gap-1 text-zinc-300"><Clock className="h-3 w-3" aria-hidden="true" />{readTime}</span>
        <span className="text-zinc-300">{date}</span>
      </div>
      <h1 className="max-w-3xl font-black leading-tight text-white" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2rem, 4.5vw, 3.5rem)' }}>{title}</h1>
      <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
        <Link href="/#form" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-3 text-sm font-bold text-black hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400">Request a case review <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        <p className="max-w-sm text-xs leading-5 text-zinc-300">Options depend on your agreement, facts and jurisdiction. No guaranteed result.</p>
      </div>
    </div>
  </header>;
}
