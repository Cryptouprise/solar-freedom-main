/**
 * useJourneyTracker — Client-side session and page-visit tracking.
 *
 * Assigns a persistent sessionId (localStorage), captures page views with
 * time-on-page and scroll depth, and exposes a `submitJourneyEvent` helper
 * that the multi-step form calls on submission to link the session to a lead.
 *
 * All data is sent to /api/journey/event (fire-and-forget, never blocks UX).
 */

import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";

const SESSION_KEY = "sf_session_id";
const SESSION_CREATED_KEY = "sf_session_created";

function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `sf_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, id);
    localStorage.setItem(SESSION_CREATED_KEY, new Date().toISOString());
  }
  return id;
}

function getDeviceType(): "mobile" | "tablet" | "desktop" {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function getUtmParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
  };
}

async function sendEvent(payload: Record<string, unknown>) {
  try {
    await fetch("/api/journey/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Fire-and-forget — never surface errors to the user
  }
}

export function useJourneyTracker() {
  const [location] = useLocation();
  const pageEnterTime = useRef<number>(Date.now());
  const maxScrollDepth = useRef<number>(0);
  const sessionId = useRef<string>("");

  // Initialize session on mount
  useEffect(() => {
    sessionId.current = getOrCreateSessionId();
    const utms = getUtmParams();

    // Send session start event
    sendEvent({
      type: "session_start",
      sessionId: sessionId.current,
      firstPage: location,
      referrer: document.referrer || undefined,
      userAgent: navigator.userAgent,
      deviceType: getDeviceType(),
      ...utms,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      const pct = total > 0 ? Math.round((scrolled / total) * 100) : 0;
      if (pct > maxScrollDepth.current) {
        maxScrollDepth.current = Math.min(pct, 100);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location]);

  // Track page views — fires when location changes
  useEffect(() => {
    const prevPage = pageEnterTime.current;
    const enterTime = Date.now();
    const prevScrollDepth = maxScrollDepth.current;

    // Send the previous page's exit event (except on first load)
    if (prevPage !== enterTime) {
      // Already handled by the cleanup below
    }

    pageEnterTime.current = enterTime;
    maxScrollDepth.current = 0;

    // Skip admin pages
    if (location.startsWith("/admin") || location.startsWith("/login")) return;

    sendEvent({
      type: "pageview",
      sessionId: sessionId.current,
      page: location,
      pageTitle: document.title,
    });

    return () => {
      const timeOnPageMs = Date.now() - pageEnterTime.current;
      sendEvent({
        type: "page_exit",
        sessionId: sessionId.current,
        page: location,
        timeOnPageMs,
        scrollDepthPct: prevScrollDepth,
      });
    };
  }, [location]);

  /**
   * Call this when the user starts filling out a form.
   */
  const trackFormStart = useCallback((formName: string) => {
    sendEvent({
      type: "form_start",
      sessionId: sessionId.current,
      page: location,
      detail: JSON.stringify({ formName }),
    });
  }, [location]);

  /**
   * Call this on successful form submission, passing the leadId returned by the server.
   */
  const trackFormSubmit = useCallback((formName: string, leadId?: number) => {
    sendEvent({
      type: "form_submit",
      sessionId: sessionId.current,
      page: location,
      leadId,
      detail: JSON.stringify({ formName }),
    });
  }, [location]);

  /**
   * Call this when a CTA button is clicked (phone number, chat, etc.).
   */
  const trackCtaClick = useCallback((ctaLabel: string) => {
    sendEvent({
      type: "click_cta",
      sessionId: sessionId.current,
      page: location,
      detail: JSON.stringify({ ctaLabel }),
    });
  }, [location]);

  return {
    sessionId: sessionId.current,
    trackFormStart,
    trackFormSubmit,
    trackCtaClick,
  };
}

/**
 * Standalone helper — get the current session ID without mounting the hook.
 * Safe to call from form submit handlers.
 */
export function getSessionId(): string {
  return localStorage.getItem(SESSION_KEY) ?? "";
}
