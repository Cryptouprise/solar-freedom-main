import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  recordLeadSubmission,
  resetAnalyticsStateForTests,
  trackPageView,
} from "../client/src/lib/analytics";
import { clearLegacyContactStorage } from "../client/src/hooks/useContactInfo";

describe("truthful client analytics", () => {
  const gtag = vi.fn();
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const fetchMock = vi.fn().mockResolvedValue(new Response());

  beforeEach(() => {
    gtag.mockClear();
    resetAnalyticsStateForTests();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        gtag,
        location: { href: "https://breakyoursolarcontract.com/", origin: "https://breakyoursolarcontract.com" },
        localStorage: { getItem: () => "sf_test_session" },
      },
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
    vi.stubGlobal("fetch", originalFetch);
  });

  it("deduplicates the same SPA route and emits the next route once", () => {
    trackPageView("/");
    trackPageView("/");
    trackPageView("/blog");

    const pageViews = gtag.mock.calls.filter((call) => call[1] === "page_view");
    expect(pageViews).toHaveLength(2);
    expect(pageViews.map((call) => call[2].page_path)).toEqual(["/", "/blog"]);
  });

  it("strips query and fragment PII from SPA page-view parameters", () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        gtag,
        location: {
          href: "https://breakyoursolarcontract.com/thank-you?email=person%40example.com#token=secret-123",
        },
      },
    });

    trackPageView("/thank-you?email=person%40example.com#token=secret-123");

    const pageView = gtag.mock.calls.find((call) => call[1] === "page_view");
    expect(pageView?.[2]).toMatchObject({
      page_path: "/thank-you",
      page_location: "https://breakyoursolarcontract.com/thank-you",
    });
    expect(JSON.stringify(pageView)).not.toContain("person%40example.com");
    expect(JSON.stringify(pageView)).not.toContain("secret-123");
  });

  it("does not generate a lead when persistence failed", () => {
    expect(recordLeadSubmission(null, "test_form", "/test")).toBe(false);

    expect(gtag.mock.calls.some((call) => call[1] === "generate_lead")).toBe(false);
    expect(gtag.mock.calls.some((call) => call[1] === "form_error")).toBe(true);
  });

  it("records a persisted lead while measuring pending CRM separately", () => {
    expect(
      recordLeadSubmission({ persisted: true, crmSent: false, leadId: 42 }, "test_form", "/test")
    ).toBe(true);

    expect(gtag.mock.calls.some((call) => call[1] === "generate_lead")).toBe(true);
    const crmEvent = gtag.mock.calls.find((call) => call[1] === "crm_delivery");
    expect(crmEvent?.[2]).toMatchObject({ delivery_status: "pending" });
    expect(JSON.stringify(gtag.mock.calls)).not.toContain("email");
    expect(JSON.stringify(gtag.mock.calls)).not.toContain("phone_number");
    expect(fetchMock).toHaveBeenCalledWith("/api/journey/event", expect.objectContaining({
      method: "POST",
      keepalive: true,
    }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      type: "form_submit",
      sessionId: "sf_test_session",
      page: "/test",
      leadId: 42,
    });
  });
});

describe("legacy contact storage removal", () => {
  it("removes the legacy PII key without writing contact data", () => {
    const removeItem = vi.fn();
    clearLegacyContactStorage({ removeItem });
    expect(removeItem).toHaveBeenCalledWith("sf_contact_info");
  });

  it("does not throw when storage access is blocked", () => {
    expect(() =>
      clearLegacyContactStorage({
        removeItem() {
          throw new Error("blocked");
        },
      })
    ).not.toThrow();
  });
});
