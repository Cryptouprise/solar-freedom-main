import { INDEXABLE_CITY_SLUGS } from "@/data/indexEligibility";

/**
 * Public asset URLs for approved city landing-page heroes. These are deliberately
 * separate from the generic fallback used by noindexed city routes.
 */
export const CITY_HEROES: Readonly<Record<string, string>> = {
  "hartford-ct": "/manus-storage/city-hero-hartford-ct-v2_65f25957.png",
  "phoenix-az": "/manus-storage/city-hero-phoenix-az-v2_b3f1cf97.png",
  "cincinnati-oh": "/manus-storage/city-hero-cincinnati-oh-v2_7c6ef17b.png",
  "north-las-vegas-nv": "/manus-storage/city-hero-north-las-vegas-nv-v2_82965605.png",
  "houston-tx": "/manus-storage/city-hero-houston-tx_1e5eeaa1.png",
  "greenville-sc": "/manus-storage/city-hero-greenville-sc-v2_36a07c75.png",
  "denver-co": "/manus-storage/city-hero-denver-co-v2_fdf50397.png",
  "san-antonio-tx": "/manus-storage/city-hero-san-antonio-tx-v2_b483a0ee.png",
  "little-rock-ar": "/manus-storage/city-hero-little-rock-ar-v2_3c65c499.png",
  "las-vegas-nv": "/manus-storage/city-hero-las-vegas-nv-v2_8b9d281a.png",
  "youngstown-oh": "/manus-storage/city-hero-youngstown-oh-v2_cf33f084.png",
  "west-valley-city-ut": "/manus-storage/city-hero-west-valley-city-ut-v2_188e4bb8.png",
  "shreveport-la": "/manus-storage/city-hero-shreveport-la-v2_9658760f.png",
  "santa-ana-ca": "/manus-storage/city-hero-santa-ana-ca-v2_891c013d.png",
  "new-haven-ct": "/manus-storage/city-hero-new-haven-ct-v2_ee73162c.png",
  "los-angeles-ca": "/manus-storage/city-hero-los-angeles-ca-v2_9d198179.png",
  "dallas-tx": "/manus-storage/city-hero-dallas-tx-v2_e2edf22c.png",
  "san-diego-ca": "/manus-storage/city-hero-san-diego-ca-v2_29b20c88.png",
  "murfreesboro-tn": "/manus-storage/city-hero-murfreesboro-tn-v2_0a269414.png",
  "san-francisco-ca": "/manus-storage/city-hero-san-francisco-ca-v2_14a4405d.png",
  "miami-fl": "/manus-storage/city-hero-miami-fl-v2_f1e18e7b.png",
  "san-jose-ca": "/manus-storage/city-hero-san-jose-ca-v2_fbf6d9c9.png",
  "savannah-ga": "/manus-storage/city-hero-savannah-ga-v2_086d9f1d.png",
  "nashville-tn": "/manus-storage/city-hero-nashville-tn-v2_7f5c8e43.png",
  "austin-tx": "/manus-storage/city-hero-austin-tx-v2_823430d2.png",
};

export const GENERIC_CITY_HERO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663287718525/46qo2AwgwNWJ4wJwr8EnH8/hero-bg-FmKRyibRwC4JGhU5naV2R2.webp";

/** Use the generic hero only for noneligible city routes held out of the index. */
export function getCityHero(slug: string): string {
  return CITY_HEROES[slug] ?? GENERIC_CITY_HERO;
}

/** Allows tests and startup checks to catch an eligible city silently falling back. */
export function getMissingIndexableCityHeroes(): string[] {
  return Array.from(INDEXABLE_CITY_SLUGS).filter((slug) => !CITY_HEROES[slug]);
}
