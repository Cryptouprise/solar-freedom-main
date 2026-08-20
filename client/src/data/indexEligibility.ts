import indexEligibility from '@shared/index-eligibility.json';
import seoRedirects from '@shared/seo-redirects.json';

export const INDEXABLE_STATE_SLUGS: ReadonlySet<string> = new Set(indexEligibility.stateSlugs);
export const INDEXABLE_COMPANY_SLUGS: ReadonlySet<string> = new Set(indexEligibility.companySlugs);
export const INDEXABLE_BLOG_SLUGS: ReadonlySet<string> = new Set(indexEligibility.blogSlugs);
export const RETIRED_PUBLIC_PATHS: ReadonlySet<string> = new Set(indexEligibility.retiredPublicPaths);
export const REDIRECTED_BLOG_SLUGS: ReadonlySet<string> = new Set(
  Object.keys(seoRedirects.blog).map((pagePath) => pagePath.replace(/^\/blog\//, ''))
);

export function isStateIndexed(slug: string): boolean {
  return INDEXABLE_STATE_SLUGS.has(slug);
}

export function isCompanyIndexed(slug: string): boolean {
  return INDEXABLE_COMPANY_SLUGS.has(slug);
}

export function isBlogIndexed(slug: string): boolean {
  return INDEXABLE_BLOG_SLUGS.has(slug);
}

export function isCanonicalBlogIndexed(slug: string): boolean {
  return isBlogIndexed(slug) && !REDIRECTED_BLOG_SLUGS.has(slug);
}
