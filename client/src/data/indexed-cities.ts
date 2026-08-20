import indexEligibility from '@shared/index-eligibility.json';

/**
 * Evidence-backed city index eligibility.
 *
 * The shared ledger is the single source of truth for page-level robots,
 * sitemap inclusion, and internal-link filtering. Update it only after a fresh
 * Search Console review and a unique-content quality check.
 */
export const INDEXED_CITY_SLUGS: ReadonlySet<string> = new Set(indexEligibility.citySlugs);

export function isCityIndexed(slug: string): boolean {
  return INDEXED_CITY_SLUGS.has(slug);
}
