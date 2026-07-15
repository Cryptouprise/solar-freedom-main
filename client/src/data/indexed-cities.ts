/**
 * INDEXED CITY WHITELIST
 *
 * Only these city pages will be indexed by Google.
 * All other 275+ city pages will have <meta name="robots" content="noindex, follow">.
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

export const INDEXED_CITY_SLUGS: Set<string> = new Set([
  // Tier 1 — Had actual clicks in the last 90 days
  "hartford-ct",         // 11 clicks, 279 impressions
  "phoenix-az",          // 7 clicks, 398 impressions
  "cincinnati-oh",       // 6 clicks, 52 impressions
  "north-las-vegas-nv",  // 5 clicks, 117 impressions
  "houston-tx",          // 5 clicks, 136 impressions
  "greenville-sc",       // 5 clicks, 53 impressions
  "denver-co",           // 5 clicks, 110 impressions
  "san-antonio-tx",      // 4 clicks, 64 impressions
  "little-rock-ar",      // 4 clicks, 36 impressions
  "las-vegas-nv",        // 3 clicks, 166 impressions
  "youngstown-oh",       // 2 clicks, 12 impressions
  "west-valley-city-ut", // 2 clicks, 97 impressions
  "shreveport-la",       // 2 clicks, 26 impressions
  "santa-ana-ca",        // 2 clicks, 47 impressions
  "new-haven-ct",        // 2 clicks, 24 impressions
  "los-angeles-ca",      // 2 clicks, 484 impressions
  "dallas-tx",           // 1 click, 180 impressions
  "san-diego-ca",        // 1 click, 26 impressions
  "austin-tx",           // 1 click, 19 impressions
  "murfreesboro-tn",     // 1 click, 14 impressions

  // Tier 2 — Major markets with high impressions (strategic value)
  "miami-fl",            // 0 clicks, 43 impressions
  "nashville-tn",        // 0 clicks, 21 impressions
  "san-francisco-ca",    // 0 clicks, 79 impressions
  "san-jose-ca",         // 0 clicks, 32 impressions
  "savannah-ga",         // 0 clicks, 30 impressions
]);

/**
 * Check if a city slug should be indexed by search engines.
 * Returns true only for cities in the whitelist above.
 */
export function isCityIndexed(slug: string): boolean {
  return INDEXED_CITY_SLUGS.has(slug);
}
