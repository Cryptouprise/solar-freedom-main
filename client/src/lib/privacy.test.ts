import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  disableOptionalAnalytics,
  resetAnalyticsStateForTests,
  syncOptionalAnalytics,
  trackEvent,
  trackPageView,
} from "./analytics";
import {
  PRIVACY_PREFERENCE_EVENT,
  PRIVACY_PREFERENCE_VERSION,
  PRIVACY_RESET_EVENT,
  PRIVACY_STORAGE_KEY,
  hasAnalyticsConsent,
  isPrivateRoute,
  readPrivacyPreference,
  resetPrivacyPreference,
  savePrivacyPreference,
  shouldRenderMarketingWidgets,
} from "./privacy";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

type FakeScript = {
  id: string;
  async: boolean;
  src: string;
  attributes: Map<string, string>;
  setAttribute: (name: string, value: string) => void;
  remove: () => void;
};

class FakeWindow extends EventTarget {
  localStorage = new MemoryStorage();
  location = new URL("https://breakyoursolarcontract.com/");
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  innerHeight = 900;
  scrollY = 0;
}

function installBrowser(path = "/") {
  const fakeWindow = new FakeWindow();
  fakeWindow.location = new URL(path, "https://breakyoursolarcontract.com");
  const scripts = new Map<string, FakeScript>();
  const cookieWrites: string[] = [];

  const fakeDocument = {
    head: {
      appendChild(script: FakeScript) {
        scripts.set(script.id, script);
        return script;
      },
    },
    body: { scrollHeight: 1_800 },
    createElement(tagName: string) {
      if (tagName !== "script")
        throw new Error("Only script elements are expected");
      const script: FakeScript = {
        id: "",
        async: false,
        src: "",
        attributes: new Map(),
        setAttribute(name, value) {
          script.attributes.set(name, value);
        },
        remove() {
          scripts.delete(script.id);
        },
      };
      return script;
    },
    getElementById(id: string) {
      return scripts.get(id) ?? null;
    },
  };
  Object.defineProperty(fakeDocument, "cookie", {
    configurable: true,
    get() {
      throw new Error("Privacy cleanup must not read browser cookies");
    },
    set(value: string) {
      cookieWrites.push(value);
    },
  });

  vi.stubGlobal("window", fakeWindow as unknown as Window & typeof globalThis);
  vi.stubGlobal("document", fakeDocument as unknown as Document);
  return { fakeWindow, scripts, cookieWrites };
}

beforeEach(() => {
  resetAnalyticsStateForTests();
});

afterEach(() => {
  disableOptionalAnalytics();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("privacy route policy", () => {
  it.each([
    "/admin",
    "/admin/leads",
    "/ADMIN/content?tab=drafts",
    "//admin/press-releases",
    "/admin\\automations",
    "/public/../admin/content",
    "/%61dmin/leads",
    "/login",
    "/login/",
    "/seo-command-center",
    "/seo-command-center/history",
  ])("classifies %s as private", path => {
    expect(isPrivateRoute(path)).toBe(true);
    expect(shouldRenderMarketingWidgets(path)).toBe(false);
  });

  it.each(["/", "/blog", "/administrator", "/blog/login-help"])(
    "keeps %s public",
    path => {
      expect(isPrivateRoute(path)).toBe(false);
      expect(shouldRenderMarketingWidgets(path)).toBe(true);
    }
  );

  it.each(["/privacy-policy", "/terms", "/terms/"])(
    "keeps conversion widgets off the policy route %s",
    path => {
      expect(isPrivateRoute(path)).toBe(false);
      expect(shouldRenderMarketingWidgets(path)).toBe(false);
    }
  );
});

describe("versioned durable preference", () => {
  it("defaults to denial when no decision exists", () => {
    installBrowser();
    expect(readPrivacyPreference()).toBeNull();
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("persists an explicit decision with the current version", () => {
    installBrowser();
    const saved = savePrivacyPreference("granted");

    expect(saved).toMatchObject({
      version: PRIVACY_PREFERENCE_VERSION,
      analytics: "granted",
    });
    expect(readPrivacyPreference()).toEqual(saved);
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it("fails closed for an obsolete or malformed stored grant", () => {
    const { fakeWindow } = installBrowser();
    fakeWindow.localStorage.setItem(
      PRIVACY_STORAGE_KEY,
      JSON.stringify({
        version: PRIVACY_PREFERENCE_VERSION - 1,
        analytics: "granted",
        updatedAt: Date.now(),
      })
    );

    expect(readPrivacyPreference()).toBeNull();
    expect(hasAnalyticsConsent()).toBe(false);
    expect(fakeWindow.localStorage.getItem(PRIVACY_STORAGE_KEY)).toBeNull();
  });

  it("emits reset and preference events and removes only its own key", () => {
    const { fakeWindow } = installBrowser();
    const preferenceChanged = vi.fn();
    const reset = vi.fn();
    fakeWindow.addEventListener(PRIVACY_PREFERENCE_EVENT, preferenceChanged);
    fakeWindow.addEventListener(PRIVACY_RESET_EVENT, reset);
    fakeWindow.localStorage.setItem("unrelated", "keep-me");
    savePrivacyPreference("denied");

    resetPrivacyPreference();

    expect(reset).toHaveBeenCalledOnce();
    expect(preferenceChanged).toHaveBeenCalledTimes(2);
    expect(readPrivacyPreference()).toBeNull();
    expect(fakeWindow.localStorage.getItem("unrelated")).toBe("keep-me");
  });
});

describe("optional analytics boundary", () => {
  it("does not create GA or emit an event before explicit opt-in", () => {
    const { fakeWindow, scripts } = installBrowser("/");

    expect(syncOptionalAnalytics("/")).toBe(false);
    trackPageView("/");
    trackEvent("cta_click", { event_label: "hero" });

    expect(scripts.size).toBe(0);
    expect(fakeWindow.gtag).toBeUndefined();
    expect(fakeWindow.dataLayer).toEqual([]);
  });

  it("loads only GA4 and emits a manual public page view after opt-in", () => {
    const { fakeWindow, scripts } = installBrowser("/blog");
    savePrivacyPreference("granted");

    expect(syncOptionalAnalytics("/blog")).toBe(true);
    trackPageView("/blog");

    expect(scripts.size).toBe(1);
    const [script] = Array.from(scripts.values());
    expect(script.src).toBe(
      "https://www.googletagmanager.com/gtag/js?id=G-WVL7BKD68V"
    );
    expect(script.attributes.get("data-solar-optional-analytics")).toBe("ga4");
    const calls = fakeWindow.dataLayer as unknown[][];
    expect(calls).toContainEqual([
      "event",
      "page_view",
      expect.objectContaining({ page_path: "/blog" }),
    ]);
    expect(calls).toContainEqual([
      "config",
      "G-WVL7BKD68V",
      expect.objectContaining({
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      }),
    ]);
  });

  it("will not load on a private route even with a stored opt-in", () => {
    const { scripts } = installBrowser("/login");
    savePrivacyPreference("granted");

    expect(syncOptionalAnalytics("/login")).toBe(false);
    expect(scripts.size).toBe(0);
  });

  it("clears and disables an already-loaded tracker before private work", () => {
    const { fakeWindow, scripts, cookieWrites } = installBrowser("/");
    savePrivacyPreference("granted");
    expect(syncOptionalAnalytics("/")).toBe(true);
    expect(scripts.size).toBe(1);

    fakeWindow.location = new URL(
      "/admin/leads",
      "https://breakyoursolarcontract.com"
    );
    expect(syncOptionalAnalytics("/admin/leads")).toBe(false);
    trackEvent("private_workspace_view");

    expect(scripts.size).toBe(0);
    expect(fakeWindow.gtag).toBeUndefined();
    expect(fakeWindow.dataLayer).toEqual([]);
    expect(
      (fakeWindow as unknown as Record<string, unknown>)[
        "ga-disable-G-WVL7BKD68V"
      ]
    ).toBe(true);
    expect(cookieWrites.some(value => value.startsWith("_ga="))).toBe(true);
    expect(cookieWrites.join(" ")).not.toContain("app_session_id");
  });
});

describe("static tracker and widget guardrails", () => {
  it("keeps identity, advertising, replay, and GHL tracker scripts out of HTML", () => {
    const html = readFileSync(
      new URL("../../index.html", import.meta.url),
      "utf8"
    );
    for (const forbidden of [
      "connect.facebook.net",
      "clarity.ms/tag",
      "cdn.idpixel.app",
      "assets.apollo.io/micro/website-tracker",
      "widgets.leadconnectorhq.com/loader.js",
    ]) {
      expect(html).not.toContain(forbidden);
    }
    expect(html).not.toContain("googletagmanager.com/gtag/js");
  });

  it("mounts global conversion widgets only behind the route privacy boundary", () => {
    const appSource = readFileSync(
      new URL("../App.tsx", import.meta.url),
      "utf8"
    );
    expect(appSource).toContain(
      "if (privateRoute || !shouldRenderMarketingWidgets(location)) return null"
    );
    for (const widget of [
      "<ExitIntentPopup />",
      "<StickyMobileBar />",
      "<DesktopCallButton />",
      "<CallbackWidget />",
    ]) {
      expect(appSource).toContain(widget);
    }
  });
});
