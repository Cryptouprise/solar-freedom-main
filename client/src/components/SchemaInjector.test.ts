import { describe, expect, it } from 'vitest';
import { extractSchemaNodes, prepareSchemas } from './SchemaInjector';

const page = (name = 'Records guide') => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name,
  url: 'https://breakyoursolarcontract.com/guide',
});

describe('SchemaInjector governance', () => {
  it('rejects placeholders and strips empty properties', () => {
    expect(prepareSchemas([{ ...page(), description: '[VERIFY: description]' }])).toEqual([]);
    expect(prepareSchemas([{ ...page(), description: ' ', image: [], score: Number.NaN }])).toEqual([page()]);
  });

  it('deduplicates semantic schemas already present in arrays and @graph', () => {
    const breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [],
    };
    const faq = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [{ '@type': 'Question', name: 'What records?', acceptedAnswer: { '@type': 'Answer', text: 'The signed agreement.' } }],
    };
    const existing = [
      [page()],
      { '@context': 'https://schema.org', '@graph': [breadcrumb, { ...faq, '@context': undefined }] },
    ];

    expect(extractSchemaNodes(existing)).toHaveLength(3);
    expect(prepareSchemas([page('Conflicting page name'), breadcrumb, faq], existing)).toEqual([]);
  });

  it('keeps distinct valid schema types', () => {
    const article = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Source-reviewed guide',
      mainEntityOfPage: 'https://breakyoursolarcontract.com/blog/source-reviewed-guide',
    };
    expect(prepareSchemas([page(), article])).toEqual([page(), article]);
  });
});
