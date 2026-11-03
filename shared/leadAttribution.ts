/**
 * Lead attribution derived from the landing URL.
 *
 * The door team, paid campaigns and organic search all reach the same forms, so
 * attribution has to be recorded at submission time or it is lost forever. This
 * module parses the visit URL on the server, which means every existing form is
 * covered without trusting the client to send extra fields.
 *
 * Only known campaign keys are read, values are sanitised, and the result is
 * safe to store or display. Nothing here sends or publishes anything.
 */

export const ATTRIBUTION_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;
export type AttributionKey = (typeof ATTRIBUTION_KEYS)[number];

export type LeadAttribution = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  /** Doubles as the door representative identifier for field-team links. */
  utmContent: string | null;
  citySlug: string | null;
  /** Human-readable channel label for reporting; never a guessed fact. */
  channel: string;
};

const MAX_VALUE = 100;
const SAFE_VALUE = /^[A-Za-z0-9._~-]+$/;
const CITY_PATH = /^\/cancel-solar-contract\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/i;

/** Keep only short, benign campaign values; drop anything that could be markup. */
export function sanitizeAttributionValue(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim().slice(0, MAX_VALUE);
  if (!value || !SAFE_VALUE.test(value)) return null;
  return value.toLowerCase();
}

/** Extract the city slug from a city landing path such as /cancel-solar-contract/houston-tx. */
export function citySlugFromPath(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;
  let path = pathOrUrl;
  try {
    if (/^https?:\/\//i.test(pathOrUrl)) path = new URL(pathOrUrl).pathname;
  } catch {
    return null;
  }
  const match = path.split(/[?#]/)[0].match(CITY_PATH);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Classify a visit into a reporting channel. Only combinations we can actually
 * observe are named; anything unrecognised is reported as "other" rather than
 * being silently attributed to the wrong source.
 */
export function classifyChannel(source: string | null, medium: string | null): string {
  if (source === "door_knocking" || medium === "offline") return "door_team";
  if (source === "google" && medium === "organic") return "organic_google";
  if (source === "google" && /cpc|paid/.test(medium ?? "")) return "paid_google";
  if (source === "bing" && medium === "organic") return "organic_bing";
  if (medium === "email") return "email";
  if (medium === "social") return "social";
  if (!source && !medium) return "direct_or_unattributed";
  return "other";
}

/** Build the full attribution record from the URL a lead submitted from. */
export function deriveLeadAttribution(sourceUrl?: string | null, sourcePage?: string | null): LeadAttribution {
  const values: Record<AttributionKey, string | null> = {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
  };
  if (sourceUrl) {
    try {
      const params = new URL(sourceUrl).searchParams;
      for (const key of ATTRIBUTION_KEYS) {
        values[key] = sanitizeAttributionValue(params.get(key));
      }
    } catch {
      // A malformed URL must never break lead capture; fall through to nulls.
    }
  }
  return {
    utmSource: values.utm_source,
    utmMedium: values.utm_medium,
    utmCampaign: values.utm_campaign,
    utmContent: values.utm_content,
    citySlug: citySlugFromPath(sourcePage) ?? citySlugFromPath(sourceUrl),
    channel: classifyChannel(values.utm_source, values.utm_medium),
  };
}
