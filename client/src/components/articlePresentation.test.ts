import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { normalizeArticleMarkup, splitReadableParagraph, articleTopLevelBlocks, readableArticleMarkup } from '@shared/articlePresentation';
import { resolveBlogHero, EXISTING_SOLAR_HERO } from './ArticleHero';
import PriorityCityGuide from './PriorityCityGuide';
import { getPriorityCityContent } from '@shared/priorityCityContent';

vi.mock('./SchemaInjector', () => ({ SchemaInjector: () => null }));
vi.mock('./VegasBookingCTA', () => ({ default: () => createElement('button', {}, 'Book a review') }));
vi.mock('wouter', () => ({ Link: ({ href, children, ...props }: any) => createElement('a', { href, ...props }, children) }));

describe('article presentation: lossless text and structure', () => {
  it('renders Markdown paragraphs, headings, ordered lists, emphasis, links and media', () => {
    const html = normalizeArticleMarkup('# Review your solar agreement\n\nFirst **complete** paragraph.\n\nSecond paragraph with [records](/records).\n\n1. Read the agreement\n2. Keep the evidence\n\n![Existing asset](/manus-storage/existing.webp)');
    expect(html).toContain('<h1>Review your solar agreement</h1>');
    expect(html).toContain('<p>First <strong>complete</strong> paragraph.</p>');
    expect(html).toContain('<p>Second paragraph with <a href="/records">records</a>.</p>');
    expect(html).toContain('<ol>');
    expect(html).toContain('src="/manus-storage/existing.webp"');
  });
  it('preserves adjacent HTML paragraphs and nested markup, tables and existing assets', () => {
    const input = '<section id="source"><h2>All records</h2><p>First <strong>claim</strong>.</p><p>Second claim.</p><ul><li><p>Nested detail.</p></li></ul><table><tr><td>Exact value: $45</td></tr></table><img src="/manus-storage/original.png" alt="Original"><video src="/manus-storage/original.mp4"></video></section>';
    const result = normalizeArticleMarkup(input);
    expect(result.trim()).toBe(input);
    expect(articleTopLevelBlocks(result)).toEqual([result]);
    expect(readableArticleMarkup(result)).toBe(result); // SSR preserves unchanged markup
  });
  it('renders Markdown embedded in HTML and preserves both destinations of malformed mixed links', () => {
    const html = normalizeArticleMarkup('<p>Read **every** record. Use [official guidance](https://example.com/source) and [<a href="/related">report</a>](https://example.com/report).</p>');
    expect(html).toContain('<strong>every</strong>');
    expect(html).toContain('<a href="https://example.com/source">official guidance</a>');
    expect(html).toContain('<a href="/related">report</a>');
    expect(html).toContain('<a href="https://example.com/report">source</a>');
    expect(html).not.toContain('](https://');
    expect(html).not.toMatch(/<a[^>]*>\s*<a/);
  });
  it('splits a long paragraph only between sentences and retains every character', () => {
    const input = 'Read the agreement and retain all records before contacting the company. '.repeat(12) + 'No result is guaranteed.';
    const blocks = splitReadableParagraph(input);
    expect(blocks.length).toBeGreaterThan(2);
    expect(blocks.join('')).toBe(input);
    expect(blocks.every(part => part.length <= 340)).toBe(true);
    const longSentence = 'one indivisible sentence '.repeat(30);
    expect(splitReadableParagraph(longSentence)).toEqual([longSentence]);
  });
});

describe('blog hero fallback relevance', () => {
  it('never replaces an existing image and uses only the checked site asset for solar topics', () => {
    expect(resolveBlogHero('/manus-storage/approved.webp', 'Solar guide')).toBe('/manus-storage/approved.webp');
    expect(resolveBlogHero(undefined, 'Review a solar agreement')).toBe(EXISTING_SOLAR_HERO);
    expect(resolveBlogHero('  ', 'A solar loan guide')).toBe(EXISTING_SOLAR_HERO);
    expect(resolveBlogHero(undefined, 'Unrelated topic')).toBeUndefined();
  });
});

describe('approved city reading and intake presentation', () => {
  it('keeps Houston text, documents and distinct hero while surfacing hero/mid/end review links', () => {
    const data = getPriorityCityContent('/cancel-solar-contract/houston-tx')!;
    const html = renderToStaticMarkup(createElement(PriorityCityGuide, { data, heroImage: '/manus-storage/city-hero-houston-tx_1e5eeaa1.png', form: createElement('input', { name: 'name', 'aria-label': 'Your name' }) }));
    expect(html).toContain('src="/manus-storage/city-hero-houston-tx_1e5eeaa1.png"');
    expect(html).toContain(data.answer);
    data.documents.forEach(text => expect(html).toContain(text));
    data.reviewSteps.forEach(step => { expect(html).toContain(step.heading); expect(html).toContain(step.body); });
    expect(html).toContain('data-city-mid-cta');
    expect(html).toContain('data-city-end-cta');
    expect(html).toContain('order-first');
    expect(html).toContain('lg:order-last');
    expect(html.match(/href="#city-form"/g)!.length).toBeGreaterThanOrEqual(4);
    expect(html).toContain('focus-visible:outline-amber-400');
  });
});
