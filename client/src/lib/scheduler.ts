const DEFAULT_CALENDAR_ID = "Glvb9OZtDFHDMiwvHpli";

export const DEFAULT_SCHEDULER_URL =
  `https://link.myinfinite.ai/widget/booking/${DEFAULT_CALENDAR_ID}`;

const TRUSTED_SCHEDULER_ORIGINS = new Set(["https://link.myinfinite.ai"]);

export interface SchedulerContext {
  source?: string;
  campaign?: string;
  location?: string;
}

const CONTEXT_QUERY_KEYS: Record<keyof SchedulerContext, string> = {
  source: "utm_source",
  campaign: "utm_campaign",
  location: "sf_location",
};

/**
 * Scheduler URLs are intentionally limited to a trusted HTTPS booking endpoint
 * plus non-contact campaign context. Query strings supplied by callers are
 * discarded so a name, email address, or phone number cannot be forwarded in a
 * GET URL, browser history, referrer, or third-party access log.
 */
export function buildSchedulerUrl(
  candidateUrl: string | undefined,
  context: SchedulerContext = {},
): string {
  let url: URL;

  try {
    url = new URL(candidateUrl || DEFAULT_SCHEDULER_URL);
  } catch {
    url = new URL(DEFAULT_SCHEDULER_URL);
  }

  if (
    url.protocol !== "https:"
    || !TRUSTED_SCHEDULER_ORIGINS.has(url.origin)
    || !url.pathname.startsWith("/widget/booking/")
  ) {
    url = new URL(DEFAULT_SCHEDULER_URL);
  }

  url.username = "";
  url.password = "";
  url.search = "";
  url.hash = "";

  for (const [field, queryKey] of Object.entries(CONTEXT_QUERY_KEYS) as Array<
    [keyof SchedulerContext, string]
  >) {
    const value = sanitizeContextValue(context[field]);
    if (value) url.searchParams.set(queryKey, value);
  }

  return url.toString();
}

function sanitizeContextValue(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = value.normalize("NFKC").trim();

  // Context is never allowed to resemble an email address or telephone number.
  if (
    !normalized
    || normalized.length > 80
    || normalized.includes("@")
    || /(?:\+?\d[\d\s().-]{5,}\d)/.test(normalized)
    || !/^[a-z0-9 _,-]+$/i.test(normalized)
  ) {
    return null;
  }

  return normalized;
}
