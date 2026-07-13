import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { cities } from '../client/src/data/cities';
import { companies } from '../client/src/data/companies';
import { hasPublishableStateLawEvidence, stateLaws } from '../client/src/data/state-laws';
import {
  hasPublishableEditorialReview,
  hasUnsupportedFirstPartyClaims,
  isBlogPostPublishable,
} from '../client/src/data/publication-governance';

const validEditorialReview = {
  reviewerName: 'Casey Morgan',
  reviewerRole: 'Senior Consumer Content Editor',
  reviewedAt: '2026-06-15',
  primarySources: [{
    title: 'Federal Cooling-Off Rule',
    url: 'https://www.ecfr.gov/current/title-16/part-429',
    accessedAt: '2026-06-14',
  }],
  uniqueValueSummary: 'This reviewed guide compares a specific document workflow with current primary sources and adds substantive questions that are not repeated on another intake page.',
  funnelOnlyDuplicate: false as const,
};

describe('public content publication gates', () => {
  it('requires evidence metadata in addition to passing the claim patterns', () => {
    expect(hasUnsupportedFirstPartyClaims('Our attorneys have helped thousands of homeowners cancel.')).toBe(true);
    expect(hasUnsupportedFirstPartyClaims('Get a free case review; we work on contingency.')).toBe(true);
    expect(hasUnsupportedFirstPartyClaims('The process typically takes 30 to 90 days.')).toBe(true);
    expect(isBlogPostPublishable({ title: 'Records checklist', content: 'Gather the signed agreement and written communications.' })).toBe(false);
    expect(isBlogPostPublishable({
      title: 'Records checklist',
      content: 'Gather the signed agreement and written communications.',
      editorialReview: validEditorialReview,
    })).toBe(true);
    expect(isBlogPostPublishable({
      title: 'Records checklist',
      content: 'Our attorneys get results in 30 days.',
      editorialReview: validEditorialReview,
    })).toBe(false);
    expect(hasPublishableEditorialReview({
      editorialReview: { ...validEditorialReview, funnelOnlyDuplicate: true },
    })).toBe(false);
  });

  it('keeps every legacy city, company, and state record unpublished until evidence exists', () => {
    expect(cities.length).toBeGreaterThan(250);
    expect(companies.length).toBeGreaterThan(10);
    expect(stateLaws.length).toBeGreaterThan(40);
    expect(cities.every((city) => !hasPublishableEditorialReview(city))).toBe(true);
    expect(companies.every((company) => !hasPublishableEditorialReview(company))).toBe(true);
    expect(stateLaws.every((law) => !hasPublishableStateLawEvidence(law))).toBe(true);
  });

  it('does not render legacy local metrics or promotional clusters without evidence', () => {
    const cityPage = readFileSync(new URL('../client/src/pages/CityPage.tsx', import.meta.url), 'utf8');
    const companyPage = readFileSync(new URL('../client/src/pages/CompanyPage.tsx', import.meta.url), 'utf8');
    const blogPage = readFileSync(new URL('../client/src/pages/BlogPost.tsx', import.meta.url), 'utf8');

    expect(cityPage).toContain('const marketStats = cityEvidenceAvailable');
    expect(cityPage).not.toContain('TopicClusterWidget');
    expect(companyPage).not.toContain('TopicClusterWidget');
    expect(blogPage).not.toContain('TopicClusterWidget');
    expect(blogPage).toContain('getRelatedPosts(slug, 3).filter(isBlogPostPublishable)');
    expect(cityPage).not.toContain('SOLAR CONTRACT TRAP');
  });

  it('does not create public crawl paths into evidence-withheld detail backlogs', () => {
    const readPage = (name: string) => readFileSync(new URL(`../client/src/pages/${name}`, import.meta.url), 'utf8');
    const cityPage = readPage('CityPage.tsx');
    const companyPage = readPage('CompanyPage.tsx');
    const companyHub = readPage('SolarCompanyHub.tsx');
    const mediaHub = readPage('MediaHub.tsx');
    const sitemapPage = readPage('SitemapPage.tsx');
    const stateIndex = readPage('StateLawsIndex.tsx');
    const statePage = readPage('StateLawPage.tsx');
    const sunrunPage = readPage('SunrunPage.tsx');

    expect(cityPage).toContain('.filter((candidate) => hasPublishableEditorialReview(candidate))');
    expect(cityPage).toContain('hasPublishableStateLawEvidence(stateLaw)');
    expect(cityPage).toContain('relatedCities.length > 0');

    expect(companyPage).toContain('getRelatedCompanies(slug, 4).filter((candidate) => hasPublishableEditorialReview(candidate))');
    expect(companyPage).toContain('COMPANIES.filter((candidate) => hasPublishableEditorialReview(candidate))');
    expect(companyPage).not.toContain('{COMPANIES.map((c)');

    expect(companyHub).toContain('companies.filter((candidate) => hasPublishableEditorialReview(candidate))');
    expect(companyHub).toContain('itemListElement: publishableCompanies.map');
    expect(companyHub).not.toContain('itemListElement: companies.map');

    expect(mediaHub).toContain('company && hasPublishableEditorialReview(company)');
    expect(mediaHub).toContain('post && isBlogPostPublishable(post)');
    expect(mediaHub).toContain('stateLaw && hasPublishableStateLawEvidence(stateLaw)');

    expect(sitemapPage).toContain('stateLaws.filter(hasPublishableStateLawEvidence)');
    expect(sitemapPage).toContain('blogPosts.filter(isBlogPostPublishable)');
    expect(sitemapPage).not.toContain('/cancel-solar-contract/');
    expect(sitemapPage).not.toContain('/cancel-${');

    expect(stateIndex).toContain('const states = allStates.filter(hasPublishableStateLawEvidence)');
    expect(statePage).toContain('.filter((city) => hasPublishableEditorialReview(city))');

    for (const withheldPath of [
      '/blog/sunrun-solar-contract-cancellation-2026',
      '/blog/how-to-cancel-sunrun-solar-contract',
      '/cancel-sunrun-solar-contract',
    ]) expect(sunrunPage).not.toContain(`href="${withheldPath}"`);
  });

  it('keeps high-risk static landing pages evidence-led and removes unsupported legal or statistical claims', () => {
    const readPage = (name: string) => readFileSync(new URL(`../client/src/pages/${name}`, import.meta.url), 'utf8');
    const home = readPage('Home.tsx');
    const contract = readPage('SolarContractHelp.tsx');
    const exitOptions = readPage('SolarExitOptions.tsx');
    const scam = readPage('SolarPanelScam.tsx');
    const loan = readPage('SolarLoanHelp.tsx');
    const lien = readPage('SolarLienRemoval.tsx');
    const combined = [home, contract, exitOptions, scam, loan, lien].join('\n');

    for (const unsupported of [
      'You have 3 business days to cancel any contract',
      'regardless of how long ago you signed',
      'Most homeowners who want out',
      'Many solar lenders bury dealer fees',
      'sometimes 20–30% of the loan amount',
      'they\'re paid BEFORE your mortgage',
      'solar deed liens, and UCC fixture filings are all removable',
      'In most cases, if you pay off the loan, you keep the panels',
      '$180/month',
      '$185/month',
      '$43,200 over 20 years',
      '$2,220 every year',
      '4M+',
    ]) expect(combined).not.toContain(unsupported);

    expect(contract).toContain('https://www.ftc.gov/legal-library/browse/rules/cooling-period-sales-made-home-or-other-locations');
    expect(contract).toContain('https://www.consumerfinance.gov/rules-policy/regulations/1026/23/');
    expect(loan).toContain('https://www.consumerfinance.gov/data-research/research-reports/issue-spotlight-solar-financing/');
    expect(lien).toContain('https://www.consumerfinance.gov/ask-cfpb/i-am-considering-a-pace-loan');
    expect(home).not.toMatch(/href=["']\/cancel-solar-contract\//);
    expect(home).not.toMatch(/href=["']\/cancel-[^"']+-solar-contract/);
    expect(home).not.toContain('href={`/blog/${');
    expect(exitOptions).not.toContain('/blog/');
  });
});
