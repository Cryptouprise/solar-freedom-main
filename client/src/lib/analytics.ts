/**
 * Solar Freedom — GA4 Analytics Utility
 * Measurement ID: G-WVL7BKD68V
 *
 * Usage:
 *   import { trackEvent, trackPhoneClick, trackFormStep, trackFormSubmit, trackCTAClick } from "@/lib/analytics";
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA_ID = "G-WVL7BKD68V";

/** Fire a raw GA4 event */
export function trackEvent(
  eventName: string,
  params: Record<string, string | number | boolean> = {}
) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", eventName, { ...params, send_to: GA_ID });
  }
}

/** Track a phone number click */
export function trackPhoneClick(source: string, phoneNumber = "9049214971") {
  trackEvent("phone_click", {
    event_category: "engagement",
    event_label: source,
    phone_number: phoneNumber,
  });
}

/** Track a CTA button click */
export function trackCTAClick(label: string, page: string) {
  trackEvent("cta_click", {
    event_category: "engagement",
    event_label: label,
    page_location: page,
  });
}

/** Track a form step completion (multi-step forms) */
export function trackFormStep(formName: string, step: number, stepLabel: string) {
  trackEvent("form_step", {
    event_category: "form",
    form_name: formName,
    step_number: step,
    step_label: stepLabel,
  });
}

/** Track a successful form/webhook submission */
export function trackFormSubmit(formName: string, page: string) {
  trackEvent("form_submit", {
    event_category: "conversion",
    form_name: formName,
    page_location: page,
  });
  // Also fire GA4 recommended conversion event
  trackEvent("generate_lead", {
    event_category: "conversion",
    form_name: formName,
  });
}

/** Track scroll depth milestones (25%, 50%, 75%, 100%) */
export function initScrollTracking(pageName: string) {
  if (typeof window === "undefined") return;
  const milestones = [25, 50, 75, 100];
  const fired = new Set<number>();

  const handler = () => {
    const scrolled =
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    milestones.forEach((m) => {
      if (scrolled >= m && !fired.has(m)) {
        fired.add(m);
        trackEvent("scroll_depth", {
          event_category: "engagement",
          page_name: pageName,
          depth_percent: m,
        });
      }
    });
  };

  window.addEventListener("scroll", handler, { passive: true });
  return () => window.removeEventListener("scroll", handler);
}

/** Track outbound link clicks */
export function trackOutboundLink(url: string, label: string) {
  trackEvent("click", {
    event_category: "outbound",
    event_label: label,
    link_url: url,
  });
}
