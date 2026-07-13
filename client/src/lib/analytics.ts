/** Consent-gated, public-route-only GA4 helpers. Contact PII must never enter events. */
import {
  hasAnalyticsConsent,
  isPrivateRoute,
  normalizePrivacyPath,
} from "./privacy";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA_ID = "G-WVL7BKD68V";
const GA_DISABLE_KEY = `ga-disable-${GA_ID}`;
const GA_SCRIPT_ID = "solar-freedom-optional-ga4";
const GA_SCRIPT_ATTRIBUTE = "data-solar-optional-analytics";
const GA_COOKIE_NAMES = ["_ga", "_gid", "_gat", `_ga_${GA_ID.slice(2)}`];

const DENIED_CONSENT = {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
} as const;

let lastPagePath: string | null = null;
let analyticsInitialized = false;

function setGaDisabled(disabled: boolean): void {
  if (typeof window === "undefined") return;
  (window as unknown as Record<string, unknown>)[GA_DISABLE_KEY] = disabled;
}

function isGaDisabled(): boolean {
  if (typeof window === "undefined") return true;
  return (
    (window as unknown as Record<string, unknown>)[GA_DISABLE_KEY] === true
  );
}

function actualBrowserPath(): string {
  if (typeof window === "undefined") return "/";
  return window.location.pathname || "/";
}

function mayTrack(path = actualBrowserPath()): boolean {
  return (
    typeof window !== "undefined" &&
    !isPrivateRoute(actualBrowserPath()) &&
    !isPrivateRoute(path) &&
    hasAnalyticsConsent() &&
    !isGaDisabled()
  );
}

function ensureGtagQueue(): void {
  window.dataLayer = window.dataLayer ?? [];
  window.gtag =
    window.gtag ??
    ((...args: unknown[]) => {
      window.dataLayer?.push(args);
    });
}

function appendGaScript(): boolean {
  if (typeof document === "undefined" || !document.head) return false;
  if (document.getElementById(GA_SCRIPT_ID)) return true;

  try {
    const script = document.createElement("script");
    script.id = GA_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
    script.setAttribute(GA_SCRIPT_ATTRIBUTE, "ga4");
    document.head.appendChild(script);
    return true;
  } catch {
    return false;
  }
}

function analyticsCookieDomains(): Array<string | null> {
  if (typeof window === "undefined") return [null];
  const hostname = window.location.hostname;
  if (!hostname || hostname === "localhost" || hostname.includes(":")) {
    return [null];
  }

  const labels = hostname.split(".").filter(Boolean);
  const siteDomain = labels.length >= 2 ? labels.slice(-2).join(".") : hostname;
  return Array.from(
    new Set([null, hostname, `.${hostname}`, `.${siteDomain}`])
  );
}

function clearAnalyticsCookies(): void {
  if (typeof document === "undefined") return;
  const expires = "Thu, 01 Jan 1970 00:00:00 GMT";
  for (const name of GA_COOKIE_NAMES) {
    for (const domain of analyticsCookieDomains()) {
      const domainAttribute = domain ? `; Domain=${domain}` : "";
      // Only known GA cookie names are expired; auth cookies are never read.
      try {
        document.cookie = `${name}=; Expires=${expires}; Max-Age=0; Path=/${domainAttribute}; SameSite=Lax`;
      } catch {
        // Cookie access may be blocked; the GA disable flag still fails closed.
      }
    }
  }
}

/**
 * Disable and clear the optional tracker. This is safe to call repeatedly and
 * is always called when consent is absent or the current route is private.
 */
export function disableOptionalAnalytics(): void {
  if (typeof window === "undefined") {
    lastPagePath = null;
    analyticsInitialized = false;
    return;
  }

  try {
    window.gtag?.("consent", "update", DENIED_CONSENT);
  } catch {
    // A hostile or partially loaded tracker must not block the disable path.
  }
  setGaDisabled(true);

  if (typeof document !== "undefined") {
    document.getElementById(GA_SCRIPT_ID)?.remove();
  }
  clearAnalyticsCookies();
  window.dataLayer = [];
  window.gtag = undefined;
  analyticsInitialized = false;
  lastPagePath = null;
}

/** Load GA4 only for a public route with a durable explicit opt-in. */
export function enableOptionalAnalytics(path: string): boolean {
  if (
    typeof window === "undefined" ||
    isPrivateRoute(path) ||
    isPrivateRoute(actualBrowserPath()) ||
    !hasAnalyticsConsent()
  ) {
    disableOptionalAnalytics();
    return false;
  }

  setGaDisabled(false);
  ensureGtagQueue();

  if (!analyticsInitialized) {
    window.gtag?.("consent", "default", DENIED_CONSENT);
    window.gtag?.("consent", "update", {
      ...DENIED_CONSENT,
      analytics_storage: "granted",
    });
    window.gtag?.("js", new Date());
    window.gtag?.("config", GA_ID, {
      send_page_view: false,
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      ads_data_redaction: true,
      cookie_flags: "SameSite=Lax;Secure",
    });
    analyticsInitialized = appendGaScript();
  }

  return analyticsInitialized;
}

/** Synchronize tracker state at every SPA navigation and consent change. */
export function syncOptionalAnalytics(path: string): boolean {
  return enableOptionalAnalytics(path);
}

export function trackEvent(
  eventName: string,
  params: Record<string, string | number | boolean> = {}
) {
  if (mayTrack() && typeof window.gtag === "function") {
    window.gtag("event", eventName, { ...params, send_to: GA_ID });
  }
}

export function trackPhoneClick(source: string, _phoneNumber?: string) {
  trackEvent("phone_click", {
    event_category: "engagement",
    event_label: source,
  });
}

/** Emit one explicit page_view for each distinct public Wouter location. */
export function trackPageView(path: string) {
  if (typeof window === "undefined") return;
  const pathname = normalizePrivacyPath(path);
  if (!mayTrack(pathname) || lastPagePath === pathname) return;
  lastPagePath = pathname;
  trackEvent("page_view", {
    page_path: pathname,
    page_location: `${window.location.origin}${pathname}`,
  });
}

export function trackCTAClick(label: string, page: string) {
  trackEvent("cta_click", {
    event_category: "engagement",
    event_label: label,
    page_path: page,
  });
}

export function trackFormStep(
  formName: string,
  step: number,
  stepLabel: string
) {
  trackEvent("form_step", {
    event_category: "form",
    form_name: formName,
    step_number: step,
    step_label: stepLabel,
  });
}

/** Called only after the API confirms durable lead persistence. */
export function trackFormSubmit(formName: string, page: string) {
  trackEvent("form_submit", {
    event_category: "form",
    form_name: formName,
    page_path: page,
  });
  trackEvent("generate_lead", {
    event_category: "conversion",
    form_name: formName,
    page_path: page,
  });
}

export function trackFormError(formName: string, page: string) {
  trackEvent("form_error", {
    event_category: "form",
    form_name: formName,
    page_path: page,
    error_type: "submission_failed",
  });
}

/** CRM delivery is operational evidence, separate from lead conversion. */
export function trackCrmDelivery(
  formName: string,
  page: string,
  crmSent: boolean
) {
  trackEvent("crm_delivery", {
    event_category: "operations",
    form_name: formName,
    page_path: page,
    delivery_status: crmSent ? "sent" : "pending",
  });
}

export type LeadSubmissionStatus = {
  persisted: boolean;
  crmSent: boolean;
};

export function recordLeadSubmission(
  result: LeadSubmissionStatus | null | undefined,
  formName: string,
  page: string
) {
  if (!result?.persisted) {
    trackFormError(formName, page);
    return false;
  }
  trackFormSubmit(formName, page);
  trackCrmDelivery(formName, page, result.crmSent);
  return true;
}

export function resetAnalyticsStateForTests() {
  lastPagePath = null;
  analyticsInitialized = false;
}

export function initScrollTracking(pageName: string) {
  if (typeof window === "undefined") return;
  const milestones = [25, 50, 75, 100];
  const fired = new Set<number>();

  const handler = () => {
    const scrollableDistance = document.body.scrollHeight - window.innerHeight;
    if (scrollableDistance <= 0) return;
    const scrolled = (window.scrollY / scrollableDistance) * 100;
    milestones.forEach(milestone => {
      if (scrolled >= milestone && !fired.has(milestone)) {
        fired.add(milestone);
        trackEvent("scroll_depth", {
          event_category: "engagement",
          page_name: pageName,
          depth_percent: milestone,
        });
      }
    });
  };

  window.addEventListener("scroll", handler, { passive: true });
  return () => window.removeEventListener("scroll", handler);
}

export function trackOutboundLink(url: string, label: string) {
  trackEvent("click", {
    event_category: "outbound",
    event_label: label,
    link_url: url,
  });
}
