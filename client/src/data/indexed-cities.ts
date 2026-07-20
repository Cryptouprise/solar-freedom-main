/**
 * INDEXED CITY WHITELIST
 *
 * Compatibility export for city-page rendering. The authoritative recovery
 * policy lives in shared/seo-policy.json and is consumed by every delivery path.
 *
 * WHY: Google's June 2026 Spam Update flagged our 300 near-identical city pages
 * as "doorway pages" / "scaled content abuse". This whitelist keeps only the
 * cities with proven search demand (clicks or significant impressions in GSC).
 *
 * RULE: Never add more than 5 new cities at a time. Each new city page MUST have
 * at least 1,500 words of genuinely unique content before being added here.
 *
 * Data source: Google Search Console 90-day performance report (July 2026)
 */

import { RETAINED_CITY_SLUGS } from "@shared/seoPolicy";

export const INDEXED_CITY_SLUGS = RETAINED_CITY_SLUGS;

/**
 * Check if a city slug should be indexed by search engines.
 * Returns true only for cities in the whitelist above.
 */
export function isCityIndexed(slug: string): boolean {
  return INDEXED_CITY_SLUGS.has(slug);
}
