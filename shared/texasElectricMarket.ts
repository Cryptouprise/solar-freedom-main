/**
 * Which Texas cities are actually in the competitive retail electric market.
 *
 * Why this file exists
 * -------------------
 * `client/src/pages/CityPage.tsx` told every one of its 302 city pages, "In
 * ${city.state}'s deregulated energy market, the TDU (Transmission and
 * Distribution Utility) charges $40-55/month that solar cannot eliminate," and
 * placed a CenterPoint Energy Texas rate card on all of them. Neither claim is
 * true outside competitive Texas, and the CenterPoint figure is not even true
 * for most of competitive Texas.
 *
 * The assertion began life in `docs/city-seo-verification-2026-11-02.json` as
 * the correct, bounded sentence "In deregulated Texas markets, the Transmission
 * and Distribution Utility (TDU) charges a delivery fee of $40-55/month ...".
 * Commit 68b64aa (26 Jul 2026, "Complete CityPage template redesign") turned
 * "Texas" into the `${city.state}` template variable, which promoted a Texas
 * market fact into a claim about every state's electricity market.
 *
 * The verified position (sources recorded in
 * `docs/sources-verified-2026-11-26.md`):
 *
 * - California suspended residential Direct Access on 20 September 2001, so a
 *   California household cannot choose its electricity supplier. (CPUC)
 * - Ohio does have retail electric choice (PUCO "Energy Choice Ohio"), so a
 *   blanket "no retail choice outside Texas" claim would be wrong in the other
 *   direction.
 * - Ohio has no TDU and no CenterPoint Energy. The TDU delivery concept is
 *   specific to Texas's ERCOT market structure.
 * - Within Texas the competitive market does NOT cover the whole state. Austin
 *   (Austin Energy) and San Antonio (CPS Energy) are municipally owned utilities
 *   that never opted into retail competition. El Paso (El Paso Electric) is on
 *   the Western Interconnection and is not in ERCOT. Amarillo (Xcel Energy /
 *   Southwestern Public Service) is also outside ERCOT and its customers cannot
 *   shop for competitive plans.
 * - Lubbock is competitive: Lubbock Power & Light opted into retail competition
 *   and began competitive retail service on 4 March 2024. (ERCOT market notice
 *   M-B022724-01)
 *
 * So "competitive Texas" is a per-city property, not a per-state one, which is
 * why this is a slug list and not a `stateCode === "TX"` check.
 *
 * Only the cities this repository actually builds are listed. A slug that is
 * absent is treated as not competitive, so an unknown city withholds the claim
 * rather than publishing it. Withholding is the safe direction: the section is
 * decorative, and a missing section cannot mislead a reader.
 */

/** Texas cities built by this repository that sit outside the competitive market. */
export const NON_COMPETITIVE_TEXAS_CITIES = [
  // Municipal utilities that never opted into retail competition.
  "austin-tx",
  "san-antonio-tx",
  // Outside ERCOT: El Paso Electric serves on the Western Interconnection.
  "el-paso-tx",
  // Outside ERCOT: Xcel Energy / Southwestern Public Service territory.
  "amarillo-tx",
] as const;

/**
 * Texas cities built by this repository that ARE in the competitive retail
 * market. Enumerated rather than inferred so that adding a Texas city forces a
 * deliberate decision here instead of silently inheriting a TDU claim.
 */
export const COMPETITIVE_TEXAS_CITIES = [
  "corpus-christi-tx",
  "dallas-tx",
  "fort-worth-tx",
  "houston-tx",
  "lubbock-tx",
] as const;

const COMPETITIVE = new Set<string>(COMPETITIVE_TEXAS_CITIES);
const NON_COMPETITIVE = new Set<string>(NON_COMPETITIVE_TEXAS_CITIES);

/**
 * True only for a city slug known to be inside the competitive Texas retail
 * electric market. Unknown slugs return false so the Texas-only claim is
 * withheld rather than asserted.
 */
export function isCompetitiveTexasCity(slug: string | undefined | null): boolean {
  if (!slug) return false;
  if (NON_COMPETITIVE.has(slug)) return false;
  return COMPETITIVE.has(slug);
}
