import { type ReactNode, useMemo } from 'react';
import { normalizeArticleMarkup, readableArticleMarkup, articleTopLevelBlocks } from '@shared/articlePresentation';

export const articleProseClass = 'prose prose-invert max-w-none break-words text-[1.05rem] prose-headings:font-black prose-headings:leading-tight prose-headings:scroll-mt-24 prose-h2:text-white prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-3xl prose-h3:text-amber-400 prose-h3:mt-8 prose-h3:mb-3 prose-p:text-zinc-300 prose-p:leading-8 prose-p:my-5 prose-li:text-zinc-300 prose-li:leading-8 prose-li:my-2 prose-a:text-amber-400 prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-amber-300 prose-strong:text-white prose-blockquote:border-amber-500 prose-blockquote:text-zinc-200 prose-img:rounded-xl prose-img:my-8 prose-table:block prose-table:overflow-x-auto prose-th:text-white prose-td:text-zinc-300';

export function ArticleContent({ content, midpoint }: { content: string; midpoint?: ReactNode }) {
  const blocks = useMemo(() => articleTopLevelBlocks(readableArticleMarkup(normalizeArticleMarkup(content))), [content]);
  const midpointStart = Math.ceil(blocks.length / 2) - 1;
  const midpointIndex = blocks.length >= 6 ? blocks.findIndex((block, index) => index >= midpointStart && !/^<h[1-6]\b/i.test(block)) : -1;
  return <div className="article-rich-content" data-article-blocks={blocks.length}>
    {blocks.map((markup, index) => <div key={index}>
      <div className={`article-reading-content ${articleProseClass}`} dangerouslySetInnerHTML={{ __html: markup }} />
      {index === midpointIndex && midpoint}
    </div>)}
  </div>;
}

/** Short outline made from the article's existing headings; no new content claims. */
export function ArticleOutline({ headings }: { headings: string[] }) {
  if (headings.length < 3) return null;
  return <nav aria-label="In this guide" className="my-8 rounded-xl border border-white/10 bg-zinc-900/60 p-5 sm:p-6">
    <p className="mb-4 text-xs font-mono uppercase tracking-widest text-amber-400">In this guide</p>
    <ol className="grid gap-3 sm:grid-cols-2">
      {headings.map((heading, index) => <li key={`${heading}-${index}`} className="flex gap-3 text-sm leading-6 text-zinc-300"><span className="text-amber-400 font-mono" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{heading}</li>)}
    </ol>
  </nav>;
}
