export const CANONICAL_LEAD_ORIGIN = "https://breakyoursolarcontract.com";

const ACCEPTED_SOURCE_HOSTS = new Set([
  "breakyoursolarcontract.com",
  "www.breakyoursolarcontract.com",
  "localhost",
  "127.0.0.1",
]);

const ALLOWED_UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
] as const;

const CONTACT_LIKE_VALUE = /(?:@|\b(?:\+?\d[\d\s().-]{5,}\d)\b)/;
const SAFE_CAMPAIGN_VALUE = /^[a-z0-9][a-z0-9._~ +,-]{0,79}$/i;

function sanitizeCampaignValue(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.normalize("NFKC").trim();
  if (
    !normalized
    || !SAFE_CAMPAIGN_VALUE.test(normalized)
    || CONTACT_LIKE_VALUE.test(normalized)
  ) {
    return null;
  }
  return normalized;
}

function hasContactLikePath(pathname: string): boolean {
  try {
    return CONTACT_LIKE_VALUE.test(decodeURIComponent(pathname));
  } catch {
    return true;
  }
}

/**
 * Reduces a browser-supplied lead source to a canonical first-party URL.
 * Credentials, fragments, non-UTM query data, foreign origins, and contact-like
 * campaign/path values are discarded before the value reaches storage.
 */
export function normalizeLeadSourceUrl(
  candidate: string | null | undefined,
): string | null {
  if (typeof candidate !== "string" || !candidate.trim()) return null;

  let source: URL;
  const trimmed = candidate.trim();
  if (!trimmed.startsWith("/") && !/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return null;
  }
  try {
    source = new URL(trimmed, `${CANONICAL_LEAD_ORIGIN}/`);
  } catch {
    return null;
  }

  if (
    (source.protocol !== "https:" && source.protocol !== "http:")
    || !ACCEPTED_SOURCE_HOSTS.has(source.hostname.toLowerCase())
    || source.pathname.length > 1_000
    || hasContactLikePath(source.pathname)
  ) {
    return null;
  }

  const normalized = new URL(source.pathname || "/", `${CANONICAL_LEAD_ORIGIN}/`);
  for (const key of ALLOWED_UTM_KEYS) {
    const value = sanitizeCampaignValue(source.searchParams.get(key));
    if (value) normalized.searchParams.set(key, value);
  }

  return normalized.toString();
}
