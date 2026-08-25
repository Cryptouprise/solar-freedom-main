/** Solar Freedom GA4 analytics helpers. Contact PII must never enter events. */
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA_ID = "G-WVL7BKD68V";
let lastPagePath: string | null = null;

export function trackEvent(
  eventName: string,
  params: Record<string, string | number | boolean> = {}
) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", eventName, { ...params, send_to: GA_ID });
  }
}

export function trackPhoneClick(source: string, _phoneNumber?: string) {
  trackEvent("phone_click", {
    event_category: "engagement",
    event_label: source,
  });
}

/** Emit one explicit page_view for each distinct Wouter location. */
export function trackPageView(path: string) {
  if (typeof window === "undefined") return;
  const currentUrl = new URL(window.location.href);
  const pathname = new URL(path, currentUrl.origin).pathname || "/";
  if (lastPagePath === pathname) return;
  lastPagePath = pathname;
  trackEvent("page_view", {
    page_path: pathname,
    page_location: `${currentUrl.origin}${pathname}`,
  });
}

export function trackCTAClick(label: string, page: string) {
  trackEvent("cta_click", {
    event_category: "engagement",
    event_label: label,
    page_path: page,
  });
}

export function trackFormStep(formName: string, step: number, stepLabel: string) {
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
export function trackCrmDelivery(formName: string, page: string, crmSent: boolean) {
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
  leadId?: number | null;
};

const JOURNEY_SESSION_KEY = "sf_session_id";

function recordFirstPartyLeadSubmit(formName: string, page: string, leadId?: number) {
  if (typeof window === "undefined" || typeof fetch !== "function") return;

  let sessionId = "";
  try {
    sessionId = window.localStorage?.getItem(JOURNEY_SESSION_KEY) ?? "";
  } catch {
    return;
  }
  if (!sessionId) return;

  const pagePath = new URL(page, window.location.origin).pathname;
  void fetch("/api/journey/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "form_submit",
      sessionId,
      page: pagePath,
      leadId,
      detail: JSON.stringify({ formName }),
    }),
    keepalive: true,
  }).catch(() => {
    // Attribution must never block a confirmed lead submission.
  });
}

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
  recordFirstPartyLeadSubmit(formName, page, result.leadId ?? undefined);
  return true;
}

export function resetAnalyticsStateForTests() {
  lastPagePath = null;
}

export function initScrollTracking(pageName: string) {
  if (typeof window === "undefined") return;
  const milestones = [25, 50, 75, 100];
  const fired = new Set<number>();

  const handler = () => {
    const scrolled =
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    milestones.forEach((milestone) => {
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
