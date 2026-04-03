// Solar Freedom — Individual Blog Post Page
// Design: Dark Industrial | Long-form reading experience | Inline CTAs every ~500 words
// Psychology: Loss aversion, social proof, urgency, authority signals throughout

import { Link, useParams } from 'wouter';
import { getBlogPost, getRelatedPosts, BlogSection } from '@/data/blog';
import TopicClusterWidget from '@/components/TopicClusterWidget';
import DoIQualifyQuiz from '@/components/DoIQualifyQuiz';
import { Clock, ArrowLeft, ArrowRight, AlertTriangle, CheckCircle, Quote, Share2 } from 'lucide-react';
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
              <span className="text-amber-500 font-black mt-0.5 shrink-0">→</span>
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
    default:
      return null;
  }
}

// Inline CTA component — appears every ~4 sections
function InlineCTA({ text, subtext }: { text: string; subtext: string }) {
  return (
    <div className="my-12 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-800 border border-amber-500/30 p-8 text-center">
      <div className="text-amber-500 text-xs font-mono uppercase tracking-widest mb-3">— Free Consultation</div>
      <h3 className="font-black text-white text-2xl mb-3" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
        {text}
      </h3>
      <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">{subtext}</p>
      <Link href="/#form">
        <span className="inline-block bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest px-8 py-3 rounded-lg text-sm transition-colors cursor-pointer">
          Get Free Case Review →
        </span>
      </Link>
    </div>
  );
}

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const post = getBlogPost(params.slug || '');
  const related = getRelatedPosts(params.slug || '', 3);

  useSeoMeta({
    title: post ? `${post.metaTitle ?? post.title} | Solar Freedom` : 'Article Not Found | Solar Freedom',
    description: post?.metaDescription ?? post?.excerpt ?? 'Expert legal help to cancel your solar contract.',
    canonical: post?.canonicalUrl ?? `https://breakyoursolarcontract.com/blog/${params.slug ?? ''}`,
    ogType: 'article',
    ogImage: post?.heroImage,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params.slug]);

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-amber-500 font-black text-6xl mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>404</div>
          <p className="text-zinc-400 mb-6">Article not found.</p>
          <Link href="/blog">
            <span className="text-amber-500 hover:text-amber-400 font-bold cursor-pointer">← Back to Blog</span>
          </Link>
        </div>
      </div>
    );
  }

  // Build Article + BreadcrumbList + FAQPage schemas for schema stacking
  const schemas: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.metaDescription ?? post.excerpt,
      datePublished: post.publishDate ?? '2026-01-01',
      dateModified: post.publishDate ?? '2026-01-01',
      author: { '@type': 'Organization', name: 'Solar Freedom', url: 'https://breakyoursolarcontract.com' },
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

  // Insert inline CTAs every 4 sections
  const sectionsWithCTAs: ReactElement[] = [];
  post.content.forEach((section, i) => {
    sectionsWithCTAs.push(<div key={`s-${i}`}>{renderSection(section, i)}</div>);
    if ((i + 1) % 6 === 0 && i < post.content.length - 2) {
      sectionsWithCTAs.push(
        <InlineCTA key={`cta-${i}`} text={post.ctaText} subtext={post.ctaSubtext} />
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
        <div className="max-w-4xl mx-auto">
          {/* Excerpt / lead paragraph */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-zinc-200 text-xl leading-relaxed mb-10 border-l-4 border-amber-500 pl-6 italic"
          >
            {post.excerpt}
          </motion.p>

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
                Start My Free Review →
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
      </div>

      {/* TOPIC CLUSTER INTERNAL LINKS */}
      <section className="px-6 pb-0">
        <div className="max-w-4xl mx-auto">
          {/* Do I Qualify Quiz — high-intent lead capture mid-article */}
          <DoIQualifyQuiz />
          <TopicClusterWidget currentUrl={`/blog/${params.slug}`} />
        </div>
      </section>

      {/* RELATED ARTICLES */}
      {related.length > 0 && (
        <section className="px-6 pb-24 border-t border-white/10 pt-16">
          <div className="max-w-7xl mx-auto">
            <div className="text-zinc-500 text-xs uppercase tracking-widest mb-8 font-mono">— Related Articles</div>
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
          <div className="text-zinc-600 text-sm">© 2026 Solar Freedom. All rights reserved.</div>
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
