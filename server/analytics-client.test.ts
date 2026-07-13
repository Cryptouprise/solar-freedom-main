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

  beforeEach(() => {
    gtag.mockClear();
    resetAnalyticsStateForTests();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        gtag,
        location: { href: "https://breakyoursolarcontract.com/" },
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  });

  it("deduplicates the same SPA route and emits the next route once", () => {
    trackPageView("/");
    trackPageView("/");
    trackPageView("/blog");

    const pageViews = gtag.mock.calls.filter((call) => call[1] === "page_view");
    expect(pageViews).toHaveLength(2);
    expect(pageViews.map((call) => call[2].page_path)).toEqual(["/", "/blog"]);
  });

  it("does not generate a lead when persistence failed", () => {
    expect(recordLeadSubmission(null, "test_form", "/test")).toBe(false);

    expect(gtag.mock.calls.some((call) => call[1] === "generate_lead")).toBe(false);
    expect(gtag.mock.calls.some((call) => call[1] === "form_error")).toBe(true);
  });

  it("records a persisted lead while measuring pending CRM separately", () => {
    expect(
      recordLeadSubmission({ persisted: true, crmSent: false }, "test_form", "/test")
    ).toBe(true);

    expect(gtag.mock.calls.some((call) => call[1] === "generate_lead")).toBe(true);
    const crmEvent = gtag.mock.calls.find((call) => call[1] === "crm_delivery");
    expect(crmEvent?.[2]).toMatchObject({ delivery_status: "pending" });
    expect(JSON.stringify(gtag.mock.calls)).not.toContain("email");
    expect(JSON.stringify(gtag.mock.calls)).not.toContain("phone_number");
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
