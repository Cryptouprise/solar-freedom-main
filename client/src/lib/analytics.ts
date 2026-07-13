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
  if (typeof window === "undefined" || lastPagePath === path) return;
  lastPagePath = path;
  trackEvent("page_view", {
    page_path: path,
    page_location: window.location.href,
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
