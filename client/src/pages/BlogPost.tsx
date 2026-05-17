// Solar Freedom — Individual Blog Post Page
// Design: Dark Industrial | Long-form reading experience | Inline CTAs every ~500 words
// Psychology: Loss aversion, social proof, urgency, authority signals throughout
import { Link, useParams } from 'wouter';
import { getBlogPost, getRelatedPosts, BlogSection } from '@/data/blog';
import { trpc } from '@/lib/trpc';
import TopicClusterWidget from '@/components/TopicClusterWidget';
import DoIQualifyQuiz from '@/components/DoIQualifyQuiz';
import QuickCallbackForm from '@/components/QuickCallbackForm';
import { Clock, ArrowLeft, ArrowRight, AlertTriangle, CheckCircle, Quote, Share2, Shield, Scale } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, ReactElement } from 'react';
import { useSeoMeta } from '@/hooks/useSeoMeta';
import { SchemaInjector } from '@/components/SchemaInjector';
function renderSection(section: BlogSection, index: number) {
  switch (section.type) {
    case 'h2':
      return (
        <h2 key={index} className="font-black text-white mt-12 mb-4 leading-tight" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>
          {section.content}
        </h2>
      );
    case 'h3':
      return (
        <h3 key={index} className="font-black text-amber-400 mt-8 mb-3 text-xl leading-tight">
          {section.content}
        </h3>
      );
    case 'p':
      return (
        <p key={index} className="text-zinc-300 leading-relaxed text-[1.05rem] mb-5">
          {section.content}
        </p>
      );
    case 'callout':
      return (
        <div key={index} className="my-8 rounded-xl bg-amber-500/10 border border-amber-500/30 p-6">
          <p className="text-amber-200 leading-relaxed font-medium">{section.content}</p>
        </div>
      );
    case 'warning':
      return (
        <div key={index} className="my-8 rounded-xl bg-red-500/10 border border-red-500/30 p-6 flex gap-4">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-200 leading-relaxed font-medium">{section.content}</p>
        </div>
      );
    case 'quote':
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
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case 'stat-block':
      return (
        <div key={index} className="my-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {section.stats?.map((stat, i) => (
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

// Inline CTA component — appears every ~4 sections
function InlineCTA({ text, subtext }: { text: string; subtext: string }) {
  return (
    <div className="my-12 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-800 border border-amber-500/30 p-8 text-center">
      <div className="text-amber-500 text-xs font-mono uppercase tracking-widest mb-3">-- Free Consultation</div>
      <h3 className="font-black text-white text-2xl mb-3" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
        {text}
      </h3>
      <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">{subtext}</p>
      <Link href="/#form">
        <span className="inline-block bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest px-8 py-3 rounded-lg text-sm transition-colors cursor-pointer">
          Get Free Case Review
        </span>
      </Link>
    </div>
  );
}

const BLOG_INLINE_CTA_INTERVAL = 4;

function renderDbContentWithInlineCtas(content: string, ctaText: string, ctaSubtext: string): ReactElement[] {
  const sections: ReactElement[] = [];
  const paragraphRegex = /<p\b[\s\S]*?<\/p>/gi;
  let paragraphCount = 0;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;

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
    if (paragraphCount % BLOG_INLINE_CTA_INTERVAL === 0) {
      sections.push(<InlineCTA key={`db-cta-${key++}`} text={ctaText} subtext={ctaSubtext} />);
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

// Author/Attorney Bio Section — E-E-A-T signal for Google
function AuthorBio() {
  return (
    <div className="my-10 rounded-xl bg-zinc-900/80 border border-white/10 p-6 md:p-8">
      <div className="flex items-start gap-4 md:gap-6">
        <div className="shrink-0">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center">
            <Scale className="w-7 h-7 text-amber-400" />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-bold text-sm">Solar Freedom Legal Team</span>
            <Shield className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
            Reviewed by Licensed Consumer Protection Attorneys
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed">
            This article was researched and reviewed by our legal team specializing in solar contract disputes, 
            consumer fraud, and UDAP violations. Our attorneys have handled 3,000+ solar contract cancellations 
            across all 50 states. All legal information is current as of 2026 and based on actual case outcomes.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-full">
              Licensed in 50 States
            </span>
            <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full">
              3,000+ Cases Handled
            </span>
            <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full">
              Updated May 2026
            </span>
          </div>
        </div>
      </div>
    </div>
  );
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
    metaDescription: dbPost.metaDescription ? String(dbPost.metaDescription) : undefined,
    excerpt: String(dbPost.excerpt || ''),
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
      ? (dbPost.faqItems as Array<{question:string;answer:string}>).map(f => ({ q: f.question, a: f.answer }))
      : undefined,
    ctaText: undefined as string | undefined,
    ctaSubtext: undefined as string | undefined,
    heroAlt: dbPost.title ? String(dbPost.title) : undefined,
  };
}

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || '';
  const staticPost = getBlogPost(slug);
  const related = getRelatedPosts(slug, 3);

  // Only fetch from DB if static post not found
  const { data: dbPostRaw, isLoading: dbLoading } = trpc.content.getPost.useQuery(
    { slug },
    { enabled: !staticPost && !!slug }
  );

  const dbPost = dbPostRaw ? dbPostToBlogPost(dbPostRaw as Record<string, unknown>) : null;
  const post = staticPost || dbPost;

  useSeoMeta({
    title: post ? `${post.metaTitle ?? post.title} | Solar Freedom` : 'Article Not Found | Solar Freedom',
    description: post?.metaDescription ?? post?.excerpt ?? 'Expert legal help to cancel your solar contract.',
    canonical: (post as { canonicalUrl?: string | null } | undefined)?.canonicalUrl ?? `https://breakyoursolarcontract.com/blog/${slug}`,
    ogType: 'article',
    ogImage: post?.heroImage ?? undefined,
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
  if (!staticPost && dbPost) {
    const rawFaqItems = (dbPostRaw as Record<string,unknown>)?.faqItems;
    const faq: { q: string; a: string }[] = Array.isArray(rawFaqItems)
      ? (rawFaqItems as Array<{question?: string; answer?: string; q?: string; a?: string}>).map(f => ({
          q: f.q ?? f.question ?? '',
          a: f.a ?? f.answer ?? ''
        }))
      : [];
    const rawPublishedAt = (dbPostRaw as Record<string,unknown>)?.publishedAt;
    const publishDate = rawPublishedAt
      ? new Date(String(rawPublishedAt)).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : '2026';

    const dbSchemas: object[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: dbPost.title,
        description: dbPost.metaDescription ?? dbPost.excerpt,
        datePublished: (dbPostRaw as Record<string,unknown>)?.publishedAt ? String((dbPostRaw as Record<string,unknown>).publishedAt) : '2026-01-01',
        dateModified: (dbPostRaw as Record<string,unknown>)?.updatedAt ? String((dbPostRaw as Record<string,unknown>).updatedAt) : '2026-01-01',
        author: {
          '@type': 'Organization',
          name: 'Solar Freedom Legal Team',
          url: 'https://breakyoursolarcontract.com',
          description: 'Licensed consumer protection attorneys specializing in solar contract disputes and cancellations.',
        },
        publisher: { '@type': 'Organization', name: 'Solar Freedom', logo: { '@type': 'ImageObject', url: 'https://breakyoursolarcontract.com/favicon.ico' } },
        mainEntityOfPage: { '@type': 'WebPage', '@id': `https://breakyoursolarcontract.com/blog/${slug}` },
        image: dbPost.heroImage ?? '',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://breakyoursolarcontract.com' },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://breakyoursolarcontract.com/blog' },
          { '@type': 'ListItem', position: 3, name: dbPost.title, item: `https://breakyoursolarcontract.com/blog/${slug}` },
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
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      });
    }

    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <SchemaInjector schemas={dbSchemas} />
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
                  {dbPost.excerpt}
                </motion.p>
              )}

              <DoIQualifyQuiz />
              <AuthorBio />

              {/* HTML content from database with inline CTA cadence */}
              <div className="space-y-0">
                {renderDbContentWithInlineCtas(
                  Array.isArray(dbPost.content) ? (dbPost.content[0]?.content ?? '') : String(dbPost.content ?? ''),
                  "Still Paying on a Solar Contract?",
                  "Get a free legal review and find out if you can cancel."
                )}
              </div>

              {/* Final CTA */}
              <div className="mt-16 rounded-2xl bg-amber-500 p-10 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }} />
                <h2 className="font-black text-black uppercase mb-3 relative" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>
                  Ready to Escape Your Solar Contract?
                </h2>
                <p className="text-black/70 mb-6 relative max-w-lg mx-auto">Our attorneys review your contract for free. No obligation. Results in 48 hours.</p>
                <Link href="/#form">
                  <span className="inline-block bg-black text-white font-black uppercase tracking-widest px-10 py-4 rounded-lg text-sm hover:bg-zinc-900 transition-colors cursor-pointer relative">
                    Start My Free Review
                  </span>
                </Link>
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
                title="Free Case Review"
                subtitle="Skip the long form — leave your name and phone and we’ll call you back."
                buttonLabel="Request Callback"
                showSchedule
              />
            </aside>
          </div>
        </div>

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
              <Link href="/#form"><span className="text-zinc-500 hover:text-white text-sm transition-colors cursor-pointer">Free Review</span></Link>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // ─── Static post render path (existing logic) ────────────────────────────────

  // Build Article + BreadcrumbList + FAQPage schemas for schema stacking
  const schemas: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.metaDescription ?? post.excerpt,
      datePublished: post.publishDate ?? '2026-01-01',
      dateModified: post.publishDate ?? '2026-01-01',
      author: {
        '@type': 'Organization',
        name: 'Solar Freedom Legal Team',
        url: 'https://breakyoursolarcontract.com',
        description: 'Licensed consumer protection attorneys specializing in solar contract disputes and cancellations.',
      },
      publisher: { '@type': 'Organization', name: 'Solar Freedom', logo: { '@type': 'ImageObject', url: 'https://breakyoursolarcontract.com/favicon.ico' } },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `https://breakyoursolarcontract.com/blog/${params.slug}` },
      image: post.heroImage ?? '',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://breakyoursolarcontract.com' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://breakyoursolarcontract.com/blog' },
        { '@type': 'ListItem', position: 3, name: post.title, item: `https://breakyoursolarcontract.com/blog/${params.slug}` },
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
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    });

    // Add Speakable schema for AEO — point to FAQ Q&A for voice/AI answer engines
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['article h2', 'article h3', '.faq-section'],
        xpath: [
          "/html/head/title",
          "/html/head/meta[@name='description']/@content",
        ],
      },
      url: `https://breakyoursolarcontract.com/blog/${params.slug}`,
    });
  }

  // Add VideoObject schema placeholder — future YouTube embeds will populate this
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: `${post.title} — Solar Freedom Video`,
    description: post.metaDescription ?? post.excerpt,
    thumbnailUrl: post.heroImage ?? 'https://breakyoursolarcontract.com/favicon.ico',
    uploadDate: post.publishDate ?? '2026-01-01',
    publisher: {
      '@type': 'Organization',
      name: 'Solar Freedom',
      logo: { '@type': 'ImageObject', url: 'https://breakyoursolarcontract.com/favicon.ico' },
    },
    url: `https://breakyoursolarcontract.com/blog/${params.slug}`,
  });

  // Insert inline CTAs every 4 paragraph sections
  const sectionsWithCTAs: ReactElement[] = [];
  let paragraphCount = 0;
  post.content.forEach((section, i) => {
    sectionsWithCTAs.push(<div key={`s-${i}`}>{renderSection(section, i)}</div>);
    if (section.type === "p") {
      paragraphCount += 1;
    }
    if (paragraphCount > 0 && paragraphCount % BLOG_INLINE_CTA_INTERVAL === 0 && i < post.content.length - 2) {
      sectionsWithCTAs.push(
        <InlineCTA key={`cta-${i}`} text={post.ctaText ?? 'Trapped in a Solar Contract? Get Out.'} subtext={post.ctaSubtext ?? 'Our attorneys have helped 3,000+ homeowners cancel. Free case review.'} />
      );
    }
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
            {post.excerpt}
          </motion.p>

          {/* QUIZ — placed immediately after lead paragraph for maximum conversion */}
          <DoIQualifyQuiz />

          {/* Author Bio — E-E-A-T signal */}
          <AuthorBio />

          {/* Article content */}
          <div className="prose-invert max-w-none">
            {sectionsWithCTAs}
          </div>

          {/* Final CTA */}
          <div className="mt-16 rounded-2xl bg-amber-500 p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }} />
            <h2 className="font-black text-black uppercase mb-3 relative" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>
              {post.ctaText}
            </h2>
            <p className="text-black/70 mb-6 relative max-w-lg mx-auto">{post.ctaSubtext}</p>
            <Link href="/#form">
              <span className="inline-block bg-black text-white font-black uppercase tracking-widest px-10 py-4 rounded-lg text-sm hover:bg-zinc-900 transition-colors cursor-pointer relative">
                Start My Free Review
              </span>
            </Link>
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
              title="Free Case Review"
              subtitle="Skip the long form — leave your name and phone and we’ll call you back."
              buttonLabel="Request Callback"
              showSchedule
            />
          </aside>
        </div>
      </div>

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
            <Link href="/#form"><span className="text-zinc-500 hover:text-white text-sm transition-colors cursor-pointer">Free Review</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
