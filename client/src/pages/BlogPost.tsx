// Solar Freedom — Individual Blog Post Page
// Design: Dark Industrial | Long-form reading experience | Inline CTAs every ~500 words
// Psychology: Loss aversion, social proof, urgency, authority signals throughout
import { Link, useParams } from 'wouter';
import { getBlogPost, getRelatedPosts, BlogSection } from '@/data/blog';
import { isBlogIndexed } from '@/data/indexEligibility';
import { trpc } from '@/lib/trpc';
import TopicClusterWidget from '@/components/TopicClusterWidget';
import DoIQualifyQuiz from '@/components/DoIQualifyQuiz';
import QuickCallbackForm from '@/components/QuickCallbackForm';
import { Clock, ArrowLeft, ArrowRight, AlertTriangle, CheckCircle, Quote, Share2 } from 'lucide-react';
import StickyMobileBar from '@/components/StickyMobileBar';
import { motion } from 'framer-motion';
import { useEffect, ReactElement, ReactNode } from 'react';
import { useSeoMeta } from '@/hooks/useSeoMeta';
import { SchemaInjector } from '@/components/SchemaInjector';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { trackPhoneClick } from '@/lib/analytics';
import { hasVerifiedQuoteEvidence, suppressUnverifiedFirstPartyClaims, suppressUnverifiedQuoteMarkup } from '@shared/contentGovernance';

const SITE_URL = 'https://breakyoursolarcontract.com';
const ORGANIZATION_ENTITY = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'Solar Freedom',
  url: SITE_URL,
  logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.ico` },
} as const;

function renderInlineContent(content?: string): ReactNode {
  if (!content) return null;

  const parts: ReactNode[] = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(content)) !== null) {
    const [fullMatch, label, href] = match;
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    if (href.startsWith('/')) {
      parts.push(
        <Link key={`${href}-${match.index}`} href={href}>
          <span className="text-amber-400 hover:text-amber-300 underline underline-offset-4 cursor-pointer">
            {label}
          </span>
        </Link>
      );
    } else {
      parts.push(
        <a
          key={`${href}-${match.index}`}
          href={href}
          className="text-amber-400 hover:text-amber-300 underline underline-offset-4"
          target="_blank"
          rel="noopener noreferrer"
        >
          {label}
        </a>
      );
    }

    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
}

type FaqItem = { q: string; a: string };

function normalizeSchemaDate(value?: string | null): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function uniqueExternalUrls(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => /^https?:\/\//i.test(value))));
}

function extractCitationsFromSections(sections: BlogSection[]): string[] {
  const urls: string[] = [];
  const markdownLink = /\[[^\]]+\]\((https?:\/\/[^)]+)\)/g;
  for (const section of sections) {
    const textValues = [section.content ?? '', ...(section.items ?? [])];
    for (const value of textValues) {
      markdownLink.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = markdownLink.exec(value)) !== null) urls.push(match[1]);
    }
  }
  return uniqueExternalUrls(urls);
}

function extractCitationsFromHtml(html: string): string[] {
  const urls: string[] = [];
  const linkRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(html)) !== null) urls.push(match[1]);
  return uniqueExternalUrls(urls);
}

function sourceLabel(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/$/, '');
    return `${parsed.hostname.replace(/^www\./, '')}${path}`;
  } catch {
    return url;
  }
}

function VisibleFaq({ items }: { items: FaqItem[] }) {
  const governed = items
    .map((item) => ({
      q: suppressUnverifiedFirstPartyClaims(item.q).trim(),
      a: suppressUnverifiedFirstPartyClaims(item.a).trim(),
    }))
    .filter((item) => item.q && item.a);

  if (!governed.length) return null;

  return (
    <section className="faq-section mt-14 border-t border-white/10 pt-10" aria-labelledby="article-faq-heading">
      <h2 id="article-faq-heading" className="font-black text-white mb-6 leading-tight" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.7rem, 3vw, 2.3rem)' }}>
        Frequently Asked Questions
      </h2>
      <div className="space-y-4">
        {governed.map((item, index) => (
          <details key={`${item.q}-${index}`} className="rounded-xl border border-white/10 bg-zinc-900/60 p-5" open={index === 0}>
            <summary className="cursor-pointer text-white font-bold leading-snug">{item.q}</summary>
            <p className="mt-3 text-zinc-300 leading-relaxed">{renderInlineContent(item.a)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function SourceList({ citations }: { citations: string[] }) {
  if (!citations.length) return null;
  return (
    <section className="article-sources mt-14 border-t border-white/10 pt-10" aria-labelledby="article-sources-heading">
      <h2 id="article-sources-heading" className="font-black text-white mb-3 leading-tight" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.7rem, 3vw, 2.3rem)' }}>
        Primary Sources and Official Procedures
      </h2>
      <p className="text-zinc-400 text-sm mb-5">Use the linked source pages to verify current procedures, contact details, and coverage before acting.</p>
      <ul className="space-y-3">
        {citations.map((url) => (
          <li key={url} className="flex gap-3 text-sm">
            <span className="text-amber-500" aria-hidden="true">→</span>
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline underline-offset-4 break-all">
              {sourceLabel(url)}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EditorialMethod() {
  return (
    <section className="px-6 py-12 border-t border-white/10">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-xl border border-white/10 p-6 md:p-8" style={{ background: 'oklch(0.13 0.01 265)' }}>
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center shrink-0" aria-hidden="true">
              <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <div>
              <div className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-1">Editorial Method</div>
              <h3 className="text-white font-bold text-lg mb-2">Solar Freedom Editorial Team</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-3">
                Solar Freedom publishes educational contract-navigation content. Articles are checked for source accuracy, clear separation between general information and individual advice, current official procedures, and unsupported outcome claims. We do not claim attorney review unless a named reviewer and review date are displayed. This article is not legal advice.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-2.5 py-1 rounded text-xs font-medium text-amber-400 border border-amber-500/30" style={{ background: 'oklch(0.72 0.19 50 / 8%)' }}>Primary Sources</span>
                <span className="px-2.5 py-1 rounded text-xs font-medium text-amber-400 border border-amber-500/30" style={{ background: 'oklch(0.72 0.19 50 / 8%)' }}>Document First</span>
                <span className="px-2.5 py-1 rounded text-xs font-medium text-amber-400 border border-amber-500/30" style={{ background: 'oklch(0.72 0.19 50 / 8%)' }}>Fact Specific</span>
                <span className="px-2.5 py-1 rounded text-xs font-medium text-amber-400 border border-amber-500/30" style={{ background: 'oklch(0.72 0.19 50 / 8%)' }}>No Guaranteed Outcome</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function renderSection(section: BlogSection, index: number) {
  const governedContent = suppressUnverifiedFirstPartyClaims(section.content ?? '');
  const governedStats = section.stats?.filter(stat =>
    suppressUnverifiedFirstPartyClaims(stat.value) === stat.value &&
    suppressUnverifiedFirstPartyClaims(stat.label) === stat.label
  );
  switch (section.type) {
    case 'h2':
      return (
        <h2 key={index} className="font-black text-white mt-12 mb-4 leading-tight" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>
          {governedContent}
        </h2>
      );
    case 'h3':
      return (
        <h3 key={index} className="font-black text-amber-400 mt-8 mb-3 text-xl leading-tight">
          {governedContent}
        </h3>
      );
    case 'p':
      return (
        <p key={index} className="text-zinc-300 leading-relaxed text-[1.05rem] mb-5">
          {renderInlineContent(governedContent)}
        </p>
      );
    case 'callout':
      return (
        <div key={index} className="my-8 rounded-xl bg-amber-500/10 border border-amber-500/30 p-6">
          <p className="text-amber-200 leading-relaxed font-medium">{renderInlineContent(governedContent)}</p>
        </div>
      );
    case 'warning':
      return (
        <div key={index} className="my-8 rounded-xl bg-red-500/10 border border-red-500/30 p-6 flex gap-4">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-200 leading-relaxed font-medium">{renderInlineContent(governedContent)}</p>
        </div>
      );
    case 'quote':
      if (!hasVerifiedQuoteEvidence(section.verification)) return null;
      return (
        <div key={index} className="my-10 rounded-xl bg-zinc-800/60 border-l-4 border-amber-500 p-6 md:p-8">
          <Quote className="w-8 h-8 text-amber-500/40 mb-4" />
          <p className="text-white text-lg leading-relaxed italic mb-4">"{section.content}"</p>
          {section.author && (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-bold text-sm">{section.author}</span>
            </div>
          )}
        </div>
      );
    case 'list':
      return (
        <ul key={index} className="my-6 space-y-3">
          {section.items?.map((item, i) => (
            <li key={i} className="flex gap-3 text-zinc-300 leading-relaxed">
              <span className="text-amber-500 font-black mt-0.5 shrink-0">&#8594;</span>
              <span>{renderInlineContent(suppressUnverifiedFirstPartyClaims(item))}</span>
            </li>
          ))}
        </ul>
      );
    case 'stat-block':
      return (
        <div key={index} className="my-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {governedStats?.map((stat, i) => (
            <div key={i} className="rounded-xl bg-zinc-900 border border-white/10 p-5 text-center">
              <div className="font-black text-amber-500 text-2xl md:text-3xl mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                {stat.value}
              </div>
              <div className="text-zinc-500 text-xs leading-tight">{stat.label}</div>
            </div>
          ))}
        </div>
      );
    case 'image':
      return (
        <div key={index} className="my-8 rounded-xl overflow-hidden">
          <img src={section.src} alt={section.alt} className="w-full object-cover" loading="lazy" decoding="async" />
          {section.caption && (
            <p className="text-zinc-500 text-xs text-center mt-2 italic">{section.caption}</p>
          )}
        </div>
      );
    case 'video':
      return (
        <div key={index} className="my-8 rounded-xl overflow-hidden bg-zinc-900 border border-white/10">
          <video
            src={section.src}
            poster={section.poster}
            controls
            playsInline
            className="w-full"
            preload="metadata"
          />
          {section.caption && (
            <p className="text-zinc-500 text-xs text-center mt-2 italic px-4 pb-3">{section.caption}</p>
          )}
        </div>
      );
    default:
      return null;
  }
}

// Inline CTA component — appears at midpoint of article
function InlineCTA({ text, subtext }: { text: string; subtext: string }) {
  const { phoneDisplay, phoneHref, phoneDigits } = useSiteConfig();
  return (
    <div className="my-12 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800/80 border border-amber-500/40 p-8">
      <div className="text-amber-500 text-xs font-mono uppercase tracking-widest mb-3">-- Individual review</div>
      <h3 className="font-black text-white text-2xl mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
        {text}
      </h3>
      <p className="text-zinc-400 text-sm mb-6 max-w-lg">{subtext}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/#form" className="flex-1">
          <span className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest px-6 py-3.5 rounded-lg text-sm transition-colors cursor-pointer w-full">
            Request Case Review →
          </span>
        </Link>
        <a
          href={phoneHref}
          className="flex items-center justify-center gap-2 border border-white/20 hover:border-amber-500/60 text-white hover:text-amber-400 font-bold px-6 py-3.5 rounded-lg text-sm transition-colors"
          onClick={() => trackPhoneClick('blog_inline_cta', phoneDigits)}
        >
          📞 Call {phoneDisplay}
        </a>
      </div>
      <p className="text-zinc-600 text-xs mt-3 font-mono">Request a review. Options depend on your agreement, facts, and jurisdiction.</p>
    </div>
  );
}

function renderDbContentWithInlineCtas(content: string, ctaText: string, ctaSubtext: string): ReactElement[] {
  content = suppressUnverifiedFirstPartyClaims(suppressUnverifiedQuoteMarkup(content));
  const sections: ReactElement[] = [];
  const paragraphRegex = /<p\b[\s\S]*?<\/p>/gi;
  let paragraphCount = 0;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  let midpointCtaInserted = false;

  // Count total paragraphs to find midpoint
  const allMatches = Array.from(content.matchAll(/<p\b[\s\S]*?<\/p>/gi));
  const totalParagraphs = allMatches.length;
  const midpoint = Math.floor(totalParagraphs / 2);

  while ((match = paragraphRegex.exec(content)) !== null) {
    const end = match.index + match[0].length;
    const chunk = content.slice(cursor, end);
    if (chunk.trim()) {
      sections.push(
        <div
          key={`db-chunk-${key++}`}
          className="prose prose-invert max-w-none prose-headings:font-black prose-h2:text-white prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-amber-400 prose-h3:mt-8 prose-h3:mb-3 prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:mb-5 prose-li:text-zinc-300 prose-a:text-amber-400 prose-a:no-underline hover:prose-a:text-amber-300 prose-strong:text-white"
          dangerouslySetInnerHTML={{ __html: chunk }}
        />
      );
    }

    paragraphCount += 1;
    // Insert exactly ONE inline CTA at the midpoint of the article
    if (!midpointCtaInserted && paragraphCount >= midpoint && midpoint > 2) {
      sections.push(<InlineCTA key={`db-cta-mid`} text={ctaText} subtext={ctaSubtext} />);
      midpointCtaInserted = true;
    }
    cursor = end;
  }

  const tail = content.slice(cursor);
  if (tail.trim()) {
    sections.push(
      <div
        key={`db-tail-${key++}`}
        className="prose prose-invert max-w-none prose-headings:font-black prose-h2:text-white prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-amber-400 prose-h3:mt-8 prose-h3:mb-3 prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:mb-5 prose-li:text-zinc-300 prose-a:text-amber-400 prose-a:no-underline hover:prose-a:text-amber-300 prose-strong:text-white"
        dangerouslySetInnerHTML={{ __html: tail }}
      />
    );
  }

  return sections;
}

// Converts a DB post (with HTML content string) into a BlogPost-compatible shape
function dbPostToBlogPost(dbPost: Record<string, unknown>) {
  const content = typeof dbPost.content === 'string' && dbPost.content.trim().startsWith('<')
    ? [{ type: 'p' as const, content: dbPost.content }]
    : (Array.isArray(dbPost.content) ? dbPost.content : [{ type: 'p' as const, content: String(dbPost.content || '') }]);
  return {
    slug: String(dbPost.slug || ''),
    title: String(dbPost.title || ''),
    metaTitle: dbPost.metaTitle ? String(dbPost.metaTitle) : undefined,
    metaDescription: dbPost.metaDescription ? suppressUnverifiedFirstPartyClaims(String(dbPost.metaDescription)) : undefined,
    excerpt: suppressUnverifiedFirstPartyClaims(String(dbPost.excerpt || '')),
    heroImage: dbPost.heroImage ? String(dbPost.heroImage) : undefined,
    category: String(dbPost.category || 'LEGAL GUIDE'),
    readTime: String(dbPost.readTime || '8 min read'),
    publishDate: dbPost.publishedAt ? new Date(dbPost.publishedAt as string).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'May 2026',
    tags: Array.isArray(dbPost.tags) ? dbPost.tags as string[] : [],
    relatedSlugs: Array.isArray(dbPost.relatedSlugs) ? dbPost.relatedSlugs as string[] : [],
    faqItems: Array.isArray(dbPost.faqItems) ? dbPost.faqItems as Array<{ question: string; answer: string }> : [],
    canonicalUrl: dbPost.canonicalUrl ? String(dbPost.canonicalUrl) : `https://breakyoursolarcontract.com/blog/${dbPost.slug}`,
    content,
    isDbPost: true,
    // Optional fields that static posts may have but DB posts don't
    faq: Array.isArray(dbPost.faqItems) && (dbPost.faqItems as Array<{question:string;answer:string}>).length > 0
      ? (dbPost.faqItems as Array<{question:string;answer:string}>).map(f => ({ q: f.question, a: suppressUnverifiedFirstPartyClaims(f.answer) }))
      : undefined,
    ctaText: undefined as string | undefined,
    ctaSubtext: undefined as string | undefined,
    heroAlt: dbPost.title ? String(dbPost.title) : undefined,
  };
}

export default function BlogPost() {
  const { phoneDisplay, phoneHref, phoneDigits } = useSiteConfig();
  const params = useParams<{ slug: string }>();
  const slug = params.slug || '';
  const staticPost = getBlogPost(slug);
  const related = getRelatedPosts(slug, 3);

  // A published database post deliberately overrides its static predecessor.
  // This lets an approved Blog Studio edit replace a static indexed article
  // without changing the public URL or publishing agent work automatically.
  const { data: dbPostRaw, isLoading: dbLoading } = trpc.content.getPost.useQuery(
    { slug },
    { enabled: !!slug }
  );

  const dbPost = dbPostRaw ? dbPostToBlogPost(dbPostRaw as Record<string, unknown>) : null;
  const post = dbPost || staticPost;

  useSeoMeta({
    title: post ? `${post.metaTitle ?? post.title} | Solar Freedom` : 'Article Not Found | Solar Freedom',
    description: suppressUnverifiedFirstPartyClaims(post?.metaDescription ?? post?.excerpt ?? 'Review solar-contract documents and consumer information.'),
    canonical: (post as { canonicalUrl?: string | null } | undefined)?.canonicalUrl ?? `https://breakyoursolarcontract.com/blog/${slug}`,
    ogType: 'article',
    ogImage: post?.heroImage ?? undefined,
    noindex: !isBlogIndexed(slug),
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Waiting on DB lookup
  if (!staticPost && dbLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-amber-500 font-black text-6xl mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>404</div>
          <p className="text-zinc-400 mb-6">Article not found.</p>
          <Link href="/blog">
            <span className="text-amber-500 hover:text-amber-400 font-bold cursor-pointer">&larr; Back to Blog</span>
          </Link>
        </div>
      </div>
    );
  }

  // ─── DB post render path (content stored as HTML) ────────────────────────────
  if (dbPost) {
    const rawFaqItems = (dbPostRaw as Record<string,unknown>)?.faqItems;
    const faq: { q: string; a: string }[] = Array.isArray(rawFaqItems)
      ? (rawFaqItems as Array<{question?: string; answer?: string; q?: string; a?: string}>).map(f => ({
          q: f.q ?? f.question ?? '',
          a: suppressUnverifiedFirstPartyClaims(f.a ?? f.answer ?? '')
        }))
      : [];
    const rawPublishedAt = (dbPostRaw as Record<string,unknown>)?.publishedAt;
    const publishDate = rawPublishedAt
      ? new Date(String(rawPublishedAt)).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : 'Date not available';
    const dbHtmlContent = Array.isArray(dbPost.content)
      ? (dbPost.content[0]?.content ?? '')
      : String(dbPost.content ?? '');
    const dbCitations = extractCitationsFromHtml(dbHtmlContent);
    const dbPublishedAt = normalizeSchemaDate(
      (dbPostRaw as Record<string, unknown>)?.publishedAt
        ? String((dbPostRaw as Record<string, unknown>).publishedAt)
        : undefined
    );
    const dbModifiedAt = normalizeSchemaDate(
      (dbPostRaw as Record<string, unknown>)?.updatedAt
        ? String((dbPostRaw as Record<string, unknown>).updatedAt)
        : undefined
    );

    const dbSchemas: object[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: dbPost.title,
        description: suppressUnverifiedFirstPartyClaims(dbPost.metaDescription ?? dbPost.excerpt),
        datePublished: dbPublishedAt,
        dateModified: dbModifiedAt ?? dbPublishedAt,
        author: ORGANIZATION_ENTITY,
        publisher: ORGANIZATION_ENTITY,
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${slug}` },
        url: `${SITE_URL}/blog/${slug}`,
        image: dbPost.heroImage || undefined,
        citation: dbCitations.length ? dbCitations : undefined,
        inLanguage: 'en-US',
        isAccessibleForFree: true,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
          { '@type': 'ListItem', position: 3, name: dbPost.title, item: `${SITE_URL}/blog/${slug}` },
        ],
      },
    ];

    if (faq.length > 0) {
      dbSchemas.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: suppressUnverifiedFirstPartyClaims(item.a) },
        })),
      });
    }

    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <SchemaInjector schemas={dbSchemas} />
        <StickyMobileBar />
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
                Case Review
              </span>
            </Link>
          </div>
        </nav>

        {/* HERO */}
        <div className="relative pt-16 h-[50vh] min-h-[360px] max-h-[520px] overflow-hidden">
          {dbPost.heroImage ? (
            <>
              <img
                src={dbPost.heroImage}
                alt={dbPost.title}
                className="w-full h-full object-cover"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-zinc-900" />
          )}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-10">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                {dbPost.category && (
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    {dbPost.category}
                  </span>
                )}
                {dbPost.readTime && (
                  <span className="text-zinc-400 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {dbPost.readTime}
                  </span>
                )}
                <span className="text-zinc-500 text-xs">{publishDate}</span>
              </div>
              <h1 className="font-black text-white leading-tight" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
                {dbPost.title}
              </h1>
            </div>
          </div>
        </div>

        {/* BREADCRUMB */}
        <div className="px-6 py-4 border-b border-white/5">
          <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs text-zinc-500">
            <Link href="/"><span className="hover:text-zinc-300 cursor-pointer transition-colors">Home</span></Link>
            <span>/</span>
            <Link href="/blog"><span className="hover:text-zinc-300 cursor-pointer transition-colors">Blog</span></Link>
            <span>/</span>
            <span className="text-zinc-400 truncate max-w-xs">{dbPost.title}</span>
          </div>
        </div>

        {/* ARTICLE BODY */}
        <div className="px-6 py-12">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-[minmax(0,1fr)_320px] gap-10 items-start">
            <div>
              {dbPost.excerpt && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-zinc-200 text-xl leading-relaxed mb-8 border-l-4 border-amber-500 pl-6 italic"
                >
                  {suppressUnverifiedFirstPartyClaims(dbPost.excerpt)}
                </motion.p>
              )}

              <DoIQualifyQuiz />

              {/* HTML content from database with inline CTA cadence */}
              <div className="article-content space-y-0">
                {renderDbContentWithInlineCtas(
                  dbHtmlContent,
                  "Still Paying on a Solar Contract?",
                  "Request an individual review. Options depend on your agreement, facts, and jurisdiction."
                )}
              </div>

              <SourceList citations={dbCitations} />
              <VisibleFaq items={faq} />

              {/* Final CTA */}
              <div className="mt-16 rounded-2xl bg-amber-500 p-10 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }} />
                <div className="relative">
                  <div className="text-black/60 text-xs font-mono uppercase tracking-widest mb-3">-- Individual review</div>
                  <h2 className="font-black text-black uppercase mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>
                    Review the Documents That Matter.
                  </h2>
                  <p className="text-black/70 mb-6 max-w-lg text-sm">Submit the agreement and supporting records for a fact-specific review. No representation, result, or timeline is guaranteed.</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/#form">
                      <span className="inline-flex items-center justify-center gap-2 bg-black text-white font-black uppercase tracking-widest px-8 py-4 rounded-lg text-sm hover:bg-zinc-900 transition-colors cursor-pointer">
                        Request My Case Review →
                      </span>
                    </Link>
                    <a
                      href={phoneHref}
                      className="inline-flex items-center justify-center gap-2 border-2 border-black/30 hover:border-black text-black font-bold px-8 py-4 rounded-lg text-sm transition-colors"
                      onClick={() => trackPhoneClick('blog_final_cta', phoneDigits)}
                    >
                      📞 Call {phoneDisplay}
                    </a>
                  </div>
                  <p className="text-black/50 text-xs mt-4 font-mono">Request a review. No result or timeline is guaranteed.</p>
                </div>
              </div>

              <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-8">
                <Link href="/blog">
                  <span className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-bold transition-colors cursor-pointer">
                    <ArrowLeft className="w-4 h-4" /> Back to Blog
                  </span>
                </Link>
                <button
                  onClick={() => navigator.share?.({ title: dbPost.title, url: window.location.href })}
                  className="flex items-center gap-2 text-zinc-400 hover:text-amber-400 text-sm font-bold transition-colors"
                >
                  <Share2 className="w-4 h-4" /> Share Article
                </button>
              </div>
            </div>

            <aside className="hidden lg:block lg:sticky lg:top-24">
              <QuickCallbackForm
                formName="sticky_blog_sidebar"
                title="Case Review"
                subtitle="Skip the long form — leave your name and phone and we’ll call you back."
                buttonLabel="Request Callback"
                showSchedule
              />
            </aside>
          </div>
        </div>

        <EditorialMethod />

        {/* TOPIC CLUSTER INTERNAL LINKS */}
        <section className="px-6 pb-0">
          <div className="max-w-4xl mx-auto">
            <TopicClusterWidget currentUrl={`/blog/${slug}`} />
          </div>
        </section>

        {/* RELATED ARTICLES */}
        {related.length > 0 && (
          <section className="px-6 pb-24 border-t border-white/10 pt-16">
            <div className="max-w-7xl mx-auto">
              <div className="text-zinc-500 text-xs uppercase tracking-widest mb-8 font-mono">-- Related Articles</div>
              <div className="grid md:grid-cols-3 gap-6">
                {related.map((rp) => (
                  <Link key={rp.slug} href={`/blog/${rp.slug}`}>
                    <div className="group rounded-xl overflow-hidden border border-white/10 hover:border-amber-500/40 transition-all cursor-pointer bg-zinc-900/50">
                      <div className="relative h-40 overflow-hidden">
                        <img src={rp.heroImage} alt={rp.heroAlt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
                      </div>
                      <div className="p-5">
                        <div className="text-zinc-500 text-xs mb-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {rp.readTime}
                        </div>
                        <h4 className="text-white font-black text-base leading-tight group-hover:text-amber-400 transition-colors mb-3" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                          {rp.title}
                        </h4>
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-bold uppercase tracking-wider">
                          Read <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <footer className="border-t border-white/10 px-6 py-10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-zinc-600 text-sm">&copy; 2026 Solar Freedom. All rights reserved.</div>
            <div className="flex gap-6">
              <Link href="/"><span className="text-zinc-500 hover:text-white text-sm transition-colors cursor-pointer">Home</span></Link>
              <Link href="/blog"><span className="text-zinc-500 hover:text-white text-sm transition-colors cursor-pointer">Blog</span></Link>
              <Link href="/#form"><span className="text-zinc-500 hover:text-white text-sm transition-colors cursor-pointer">Case Review</span></Link>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // ─── Static post render path (existing logic) ────────────────────────────────

  // Build Article + BreadcrumbList + visible FAQ schema from the same content.
  const staticCitations = extractCitationsFromSections(post.content);
  const staticPublishedAt = normalizeSchemaDate(post.publishDate);
  const schemas: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: suppressUnverifiedFirstPartyClaims(post.metaDescription ?? post.excerpt),
      datePublished: staticPublishedAt,
      dateModified: staticPublishedAt,
      author: ORGANIZATION_ENTITY,
      publisher: ORGANIZATION_ENTITY,
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${params.slug}` },
      url: `${SITE_URL}/blog/${params.slug}`,
      image: post.heroImage || undefined,
      citation: staticCitations.length ? staticCitations : undefined,
      inLanguage: 'en-US',
      isAccessibleForFree: true,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: `${SITE_URL}/blog/${params.slug}` },
      ],
    },
  ];

  // Add FAQPage schema if post has FAQ items
  if (post.faq && post.faq.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: post.faq.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: suppressUnverifiedFirstPartyClaims(item.a) },
      })),
    });

  }


  // Insert exactly ONE inline CTA at the midpoint of the article
  const sectionsWithCTAs: ReactElement[] = [];
  let paragraphCount = 0;
  let midpointCtaInserted = false;
  const totalParagraphs = post.content.filter((s) => s.type === 'p').length;
  const midpoint = Math.floor(totalParagraphs / 2);
  post.content.forEach((section, i) => {
    sectionsWithCTAs.push(<div key={`s-${i}`}>{renderSection(section, i)}</div>);
    if (section.type === "p") {
      paragraphCount += 1;
    }
    // Insert ONE CTA at midpoint only
    if (!midpointCtaInserted && paragraphCount >= midpoint && midpoint > 2) {
      sectionsWithCTAs.push(
        <InlineCTA key="cta-mid" text="Review Your Solar Contract" subtext="Request a review. Options depend on your agreement, facts, and jurisdiction." />
      );
      midpointCtaInserted = true;
    }
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <SchemaInjector schemas={schemas} />
      <StickyMobileBar />
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
              Case Review
            </span>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <div className="relative pt-16 h-[50vh] min-h-[360px] max-h-[520px] overflow-hidden">
        <img
          src={post.heroImage}
          alt={post.heroAlt}
          className="w-full h-full object-cover"
          loading="eager" fetchPriority="high" decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                {post.category}
              </span>
              <span className="text-zinc-400 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" /> {post.readTime}
              </span>
              <span className="text-zinc-500 text-xs">{post.publishDate}</span>
            </div>
            <h1 className="font-black text-white leading-tight" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
              {post.title}
            </h1>
          </div>
        </div>
      </div>

      {/* BREADCRUMB */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/"><span className="hover:text-zinc-300 cursor-pointer transition-colors">Home</span></Link>
          <span>/</span>
          <Link href="/blog"><span className="hover:text-zinc-300 cursor-pointer transition-colors">Blog</span></Link>
          <span>/</span>
          <span className="text-zinc-400 truncate max-w-xs">{post.title}</span>
        </div>
      </div>

      {/* ARTICLE BODY */}
      <div className="px-6 py-12">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[minmax(0,1fr)_320px] gap-10 items-start">
          <div>
          {/* Excerpt / lead paragraph */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-zinc-200 text-xl leading-relaxed mb-8 border-l-4 border-amber-500 pl-6 italic"
          >
            {suppressUnverifiedFirstPartyClaims(post.excerpt)}
          </motion.p>

          {/* QUIZ — placed immediately after lead paragraph for maximum conversion */}
          <DoIQualifyQuiz />

          {/* Article content */}
          <div className="article-content prose-invert max-w-none">
            {sectionsWithCTAs}
          </div>

          <SourceList citations={staticCitations} />
          <VisibleFaq items={post.faq ?? []} />

          {/* Final CTA */}
          <div className="mt-16 rounded-2xl bg-amber-500 p-10 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }} />
            <div className="relative">
              <div className="text-black/60 text-xs font-mono uppercase tracking-widest mb-3">-- Individual review</div>
              <h2 className="font-black text-black uppercase mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>
                Review the Documents That Matter.
              </h2>
              <p className="text-black/70 mb-6 max-w-lg text-sm">Submit the agreement and supporting records for a fact-specific review. No representation, result, or timeline is guaranteed.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/#form">
                  <span className="inline-flex items-center justify-center gap-2 bg-black text-white font-black uppercase tracking-widest px-8 py-4 rounded-lg text-sm hover:bg-zinc-900 transition-colors cursor-pointer">
                    Request My Case Review →
                  </span>
                </Link>
                <a
                  href={phoneHref}
                  className="inline-flex items-center justify-center gap-2 border-2 border-black/30 hover:border-black text-black font-bold px-8 py-4 rounded-lg text-sm transition-colors"
                  onClick={() => trackPhoneClick('blog_final_cta', phoneDigits)}
                >
                  📞 Call {phoneDisplay}
                </a>
              </div>
              <p className="text-black/50 text-xs mt-4 font-mono">Request a review. No result or timeline is guaranteed.</p>
            </div>
          </div>

          {/* Share + back */}
          <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-8">
            <Link href="/blog">
              <span className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-bold transition-colors cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> Back to Blog
              </span>
            </Link>
            <button
              onClick={() => navigator.share?.({ title: post.title, url: window.location.href })}
              className="flex items-center gap-2 text-zinc-400 hover:text-amber-400 text-sm font-bold transition-colors"
            >
              <Share2 className="w-4 h-4" /> Share Article
            </button>
          </div>
          </div>

          <aside className="hidden lg:block lg:sticky lg:top-24">
            <QuickCallbackForm
              formName="sticky_blog_sidebar"
              title="Case Review"
              subtitle="Skip the long form — leave your name and phone and we’ll call you back."
              buttonLabel="Request Callback"
              showSchedule
            />
          </aside>
        </div>
      </div>

      <EditorialMethod />

      {/* TOPIC CLUSTER INTERNAL LINKS */}
      <section className="px-6 pb-0">
        <div className="max-w-4xl mx-auto">
          <TopicClusterWidget currentUrl={`/blog/${params.slug}`} />
        </div>
      </section>

      {/* RELATED ARTICLES */}
      {related.length > 0 && (
        <section className="px-6 pb-24 border-t border-white/10 pt-16">
          <div className="max-w-7xl mx-auto">
            <div className="text-zinc-500 text-xs uppercase tracking-widest mb-8 font-mono">-- Related Articles</div>
            <div className="grid md:grid-cols-3 gap-6">
              {related.map((rp) => (
                <Link key={rp.slug} href={`/blog/${rp.slug}`}>
                  <div className="group rounded-xl overflow-hidden border border-white/10 hover:border-amber-500/40 transition-all cursor-pointer bg-zinc-900/50">
                    <div className="relative h-40 overflow-hidden">
                      <img src={rp.heroImage} alt={rp.heroAlt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
                    </div>
                    <div className="p-5">
                      <div className="text-zinc-500 text-xs mb-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {rp.readTime}
                      </div>
                      <h4 className="text-white font-black text-base leading-tight group-hover:text-amber-400 transition-colors mb-3" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                        {rp.title}
                      </h4>
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold uppercase tracking-wider">
                        Read <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-zinc-600 text-sm">&copy; 2026 Solar Freedom. All rights reserved.</div>
          <div className="flex gap-6">
            <Link href="/"><span className="text-zinc-500 hover:text-white text-sm transition-colors cursor-pointer">Home</span></Link>
            <Link href="/blog"><span className="text-zinc-500 hover:text-white text-sm transition-colors cursor-pointer">Blog</span></Link>
            <Link href="/#form"><span className="text-zinc-500 hover:text-white text-sm transition-colors cursor-pointer">Case Review</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
