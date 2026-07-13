import { describe, expect, it } from 'vitest';
// @ts-expect-error Build tooling intentionally remains plain ESM.
import { analyzeHtml, countVisibleWords, extractJsonLdNodes } from '../scripts/seo-agent-audit.mjs';

describe('SEO audit document analysis', () => {
  it('counts visible page words without scripts, styles, templates, or hidden runtime content', () => {
    const html = `<body><main>one two three four</main><script>${'runtime '.repeat(500)}</script><style>${'css '.repeat(500)}</style><div hidden>${'hidden '.repeat(500)}</div></body>`;
    expect(countVisibleWords(html)).toBe(4);
  });

  it('walks JSON-LD arrays and @graph nodes', () => {
    const nodes = extractJsonLdNodes({
      '@context': 'https://schema.org',
      '@graph': [{ '@type': 'WebPage' }, { '@type': ['Article', 'NewsArticle'] }],
    });
    expect(nodes).toHaveLength(2);
  });

  it('reports semantic duplicates and placeholders', () => {
    const schema = JSON.stringify([
      { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [] },
      { '@context': 'https://schema.org', '@type': 'FAQPage', name: '[VERIFY: FAQ]', mainEntity: [] },
    ]);
    const result = analyzeHtml({
      publicUrl: 'https://breakyoursolarcontract.com/guide',
      localUrl: 'http://localhost:3000/guide',
      fetchResult: {
        ok: true,
        status: 200,
        elapsedMs: 1,
        html: `<!doctype html><html><head><title>A sufficiently descriptive solar contract records guide</title><meta name="description" content="${'Description '.repeat(15)}"><link rel="canonical" href="https://breakyoursolarcontract.com/guide"><script type="application/ld+json">${schema}</script></head><body><h1>Records guide</h1><p>${'visible content '.repeat(200)}</p></body></html>`,
      },
    });
    expect(result.issues.map((issue: { code: string }) => issue.code)).toEqual(expect.arrayContaining(['duplicate_json_ld', 'placeholder_json_ld']));
  });
});
