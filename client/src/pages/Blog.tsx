// Solar Freedom — Blog Index Page
// Design: Dark Industrial | Bebas Neue headlines | Amber accents
// Purpose: SEO hub for all solar contract cancellation articles

import { Link } from 'wouter';
import { blogPosts as staticBlogPosts } from '@/data/blog';
import { trpc } from '@/lib/trpc';
import { Clock, ArrowRight, BookOpen, TrendingUp, Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';

const categoryColors: Record<string, string> = {
  'Legal Guide': 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  'Company Guide': 'bg-red-500/20 text-red-400 border border-red-500/30',
  'Consumer Alert': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  'Home Sale Guide': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  'Legal Rights': 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  'Solar Fraud': 'bg-red-600/20 text-red-400 border border-red-600/30',
  'Cost & Finance': 'bg-green-500/20 text-green-400 border border-green-500/30',
  'Contract Types': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  'Home Sale': 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
};

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Fetch DB-managed posts (Claude-published articles) and merge with static posts
  const { data: dbData } = trpc.content.listPosts.useQuery({ limit: 200, offset: 0 });
  const dbPosts = dbData ?? [];

  // Normalize DB posts to the shape Blog.tsx expects
  const staticSlugs = new Set(staticBlogPosts.map(p => p.slug));
  const dbOnlyPosts = useMemo(() => {
    if (!dbPosts.length) return [];
    return dbPosts
      .filter(p => !staticSlugs.has(p.slug))
      .map(p => ({
        slug: p.slug,
        title: p.title,
        metaTitle: p.metaTitle ?? p.title,
        metaDescription: p.metaDescription ?? '',
        category: p.category ?? 'Article',
        readTime: p.readTime ?? '7 min read',
        publishDate: p.publishedAt
          ? new Date(p.publishedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          : '2026',
        excerpt: p.excerpt ?? '',
        heroImage: p.heroImage ?? 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&q=80',
        heroAlt: p.title,
        ctaText: 'Get a Free Solar Contract Review',
        ctaSubtext: 'Request an individual review. Options depend on your agreement, facts, and jurisdiction.',
        content: [],
        faq: [],
        relatedSlugs: (p.relatedSlugs as string[]) ?? [],
      }));
  }, [dbPosts]);

  // Combined list: DB-only posts first (newest), then all static posts
  const allPosts = useMemo(
    () => [...dbOnlyPosts, ...staticBlogPosts],
    [dbOnlyPosts]
  );

  const categories = useMemo(() => {
    const cats = Array.from(new Set(allPosts.map(p => p.category)));
    return ['All', ...cats];
  }, [allPosts]);

  const filteredPosts = useMemo(() => {
    return allPosts.filter(post => {
      const matchesSearch = searchQuery === '' ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory, allPosts]);

  const featured = filteredPosts[0];
  const rest = filteredPosts.slice(1);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
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

      {/* HERO BANNER */}
      <section className="pt-32 pb-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <span className="text-amber-500 font-mono text-sm uppercase tracking-widest">Solar Freedom Legal Blog</span>
          </div>
          <h1 className="font-black uppercase text-white leading-none mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
            KNOW YOUR RIGHTS.<br />
            <span className="text-amber-500">ESCAPE YOUR CONTRACT.</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed">
            Real legal intelligence for homeowners trapped in solar contracts. Written by attorneys. Optimized for action. No fluff.
          </p>

          {/* Stats bar */}
          <div className="flex flex-wrap gap-8 mt-10 pt-10 border-t border-white/10">
            {[
              { icon: <TrendingUp className="w-4 h-4" />, value: `${allPosts.length} Articles`, label: 'Published' },
              { icon: <BookOpen className="w-4 h-4" />, value: '118+ Cities', label: 'Covered' },
              { icon: <Clock className="w-4 h-4" />, value: '7–11 min', label: 'Average Read' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="text-amber-500">{s.icon}</div>
                <div>
                  <div className="text-white font-black text-lg">{s.value}</div>
                  <div className="text-zinc-500 text-xs uppercase tracking-wider">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEARCH + FILTER BAR */}
      <section className="px-6 pb-10">
        <div className="max-w-7xl mx-auto">
          {/* Search input */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search articles — e.g. 'cancel solar lease', 'Sunrun', 'Texas'..."
              className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-12 pr-12 py-4 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full border transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-amber-500 text-black border-amber-500'
                    : 'bg-transparent text-zinc-400 border-white/10 hover:border-amber-500/40 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Results count */}
          {(searchQuery || activeCategory !== 'All') && (
            <p className="text-zinc-500 text-sm mt-4 font-mono">
              {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''} found
              {searchQuery && <span> for "<span className="text-amber-400">{searchQuery}</span>"</span>}
              {activeCategory !== 'All' && <span> in <span className="text-amber-400">{activeCategory}</span></span>}
            </p>
          )}
        </div>
      </section>

      {/* FEATURED ARTICLE */}
      {featured && (
        <section className="px-6 pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-zinc-500 text-xs uppercase tracking-widest mb-6 font-mono">— Featured Article</div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link href={`/blog/${featured.slug}`}>
                <div className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-amber-500/40 transition-all duration-300 cursor-pointer bg-zinc-900/50">
                  <div className="grid md:grid-cols-2 gap-0">
                    {/* Image */}
                    <div className="relative h-64 md:h-auto overflow-hidden">
                      <img
                        src={featured.heroImage}
                        alt={(featured as { heroAlt?: string }).heroAlt ?? featured.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy" decoding="async"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-900/60 md:block hidden" />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent md:hidden" />
                    </div>
                    {/* Content */}
                    <div className="p-8 md:p-10 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${categoryColors[featured.category] || 'bg-zinc-700 text-zinc-300'}`}>
                          {featured.category}
                        </span>
                        <span className="text-zinc-500 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {featured.readTime}
                        </span>
                      </div>
                      <h2 className="text-white font-black text-2xl md:text-3xl leading-tight mb-4 group-hover:text-amber-400 transition-colors" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                        {featured.title}
                      </h2>
                      <p className="text-zinc-400 leading-relaxed mb-6 text-sm">
                        {featured.excerpt}
                      </p>
                      <div className="flex items-center gap-2 text-amber-500 font-bold text-sm uppercase tracking-wider">
                        Read Full Article <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* ARTICLE GRID */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          {rest.length > 0 && (
            <div className="text-zinc-500 text-xs uppercase tracking-widest mb-6 font-mono">— All Articles</div>
          )}
          {filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-zinc-600 text-6xl mb-4">🔍</div>
              <p className="text-zinc-400 text-lg mb-2">No articles found</p>
              <p className="text-zinc-600 text-sm">Try a different search term or category</p>
              <button onClick={() => { setSearchQuery(''); setActiveCategory('All'); }} className="mt-6 text-amber-500 font-bold text-sm uppercase tracking-wider hover:text-amber-400 transition-colors">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {rest.map((post, i) => (
                <motion.div
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <Link href={`/blog/${post.slug}`}>
                    <div className="group rounded-2xl overflow-hidden border border-white/10 hover:border-amber-500/40 transition-all duration-300 cursor-pointer bg-zinc-900/50 h-full flex flex-col">
                      {/* Image */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={post.heroImage}
                          alt={(post as { heroAlt?: string }).heroAlt ?? post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          loading="lazy" decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
                        <div className="absolute bottom-4 left-4">
                          <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${categoryColors[post.category] || 'bg-zinc-700 text-zinc-300'}`}>
                            {post.category}
                          </span>
                        </div>
                      </div>
                      {/* Content */}
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-2 text-zinc-500 text-xs mb-3">
                          <Clock className="w-3 h-3" /> {post.readTime}
                          <span className="mx-1">·</span>
                          {post.publishDate}
                        </div>
                        <h3 className="text-white font-black text-xl leading-tight mb-3 group-hover:text-amber-400 transition-colors flex-1" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                          {post.title}
                        </h3>
                        <p className="text-zinc-500 text-sm leading-relaxed mb-4 line-clamp-2">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider mt-auto">
                          Read Article <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl bg-amber-500 p-10 md:p-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }} />
            <h2 className="font-black text-black uppercase mb-4 relative" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
              Ready to Find Out If You Can Cancel?
            </h2>
            <p className="text-black/70 text-lg mb-8 max-w-xl mx-auto relative">
              Request an individual review. No result, timeline, or representation is guaranteed.
            </p>
            <Link href="/#form">
              <span className="inline-block bg-black text-white font-black uppercase tracking-widest px-10 py-4 rounded-lg text-sm hover:bg-zinc-900 transition-colors cursor-pointer relative">
                Get Your Free Case Review →
              </span>
            </Link>
          </div>
        </div>
      </section>

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
