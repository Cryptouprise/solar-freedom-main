export const VEGAS_BOOKING_URL = 'https://link.myinfinite.ai/widget/booking/Glvb9OZtDFHDMiwvHpli';

/**
 * The Las Vegas metro the door team covers.
 *
 * `bookingControls` marks the two pages that already carry the direct GHL booking
 * CTA. The remaining metro cities are real, populated places where a door team
 * knocks; they are listed separately so field links and reporting stay accurate
 * without claiming those pages have the same conversion treatment.
 */
export const VEGAS_CITY_SLUGS = ['las-vegas-nv','north-las-vegas-nv'] as const;

/**
 * Metro cities that have a real, resolving page.
 *
 * Every slug here must exist in client/src/data/cities.ts, because a slug that
 * does not renders as a 404 — and a printed QR code pointing at a 404 sends a
 * homeowner to a dead end at the most expensive moment in the funnel.
 *
 * Verified against live routes on 3 Nov 2026: spring-valley-nv, enterprise-nv,
 * summerlin-nv, boulder-city-nv and mesquite-nv returned 404 and were removed
 * from the field kit until their pages exist. Re-add a slug only after its route
 * returns 200 and a test enforces it.
 *
 * summerlin-nv was re-added on 3 Nov 2026 after its page was built and verified
 * (HTTP 200, source-backed guide, own hero). The other four remain removed.
 */
export const VEGAS_METRO_CITIES = [
  { slug: 'las-vegas-nv', name: 'Las Vegas', bookingControls: true },
  { slug: 'north-las-vegas-nv', name: 'North Las Vegas', bookingControls: true },
  { slug: 'henderson-nv', name: 'Henderson', bookingControls: false },
  { slug: 'summerlin-nv', name: 'Summerlin', bookingControls: false },
  { slug: 'paradise-nv', name: 'Paradise', bookingControls: false },
  { slug: 'sunrise-manor-nv', name: 'Sunrise Manor', bookingControls: false },
] as const;

export type VegasMetroSlug = (typeof VEGAS_METRO_CITIES)[number]['slug'];

export function isVegasCityPath(path:string):boolean {
  const clean=path.split(/[?#]/)[0].replace(/\/+$/,'');
  // Deliberately limited to the two pages that actually render the booking
  // layout. The call-button components hide themselves on these paths, so
  // widening this before a metro page has its own visible booking CTA would
  // silently remove the visitor's only way to call.
  return VEGAS_CITY_SLUGS.some(slug=>clean===`/cancel-solar-contract/${slug}`);
}

/** True for any Las Vegas metro city path, including cities without booking CTAs. */
export function isVegasMetroPath(path:string):boolean {
  const clean=path.split(/[?#]/)[0].replace(/\/+$/,'');
  return VEGAS_METRO_CITIES.some(city=>clean===`/cancel-solar-contract/${city.slug}`);
}

/**
 * Field-team link for a specific representative and city.
 *
 * The representative lands in `utm_content`, which the server stores as a durable
 * attribution column, so a booked appointment can be traced back to the person
 * who knocked the door. Slugs are restricted to the known metro list so a bad
 * value cannot generate a link to a nonexistent page.
 */
export function vegasFieldTeamUrl(slug:VegasMetroSlug, representative?:string):string {
  if (!VEGAS_METRO_CITIES.some(city=>city.slug===slug)) throw new Error(`Unknown Las Vegas metro city: ${slug}`);
  const params=new URLSearchParams({utm_source:'door_knocking',utm_medium:'offline',utm_campaign:'las_vegas_field_team'});
  if(representative && /^[a-z0-9_-]{1,40}$/i.test(representative)) params.set('utm_content',representative);
  return `https://breakyoursolarcontract.com/cancel-solar-contract/${slug}?${params}#city-form`;
}

export function vegasCampaignParams(search:string):Record<string,string> {
  const input=new URLSearchParams(search);const values:Record<string,string>={};
  for(const key of ['utm_source','utm_medium','utm_campaign','utm_content']) {
    const value=input.get(key);
    if(value && /^[a-z0-9_-]{1,100}$/i.test(value)) values[key]=value;
  }
  return values;
}
