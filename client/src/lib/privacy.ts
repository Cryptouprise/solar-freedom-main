export const PRIVACY_PREFERENCE_VERSION = 1 as const;
export const PRIVACY_STORAGE_KEY = `solar-freedom:privacy:v${PRIVACY_PREFERENCE_VERSION}`;
export const PRIVACY_PREFERENCE_EVENT = "solar-freedom:privacy-preference";
export const PRIVACY_RESET_EVENT = "solar-freedom:privacy-reset";

export type AnalyticsPreference = "granted" | "denied";

export type PrivacyPreference = {
  version: typeof PRIVACY_PREFERENCE_VERSION;
  analytics: AnalyticsPreference;
  updatedAt: number;
};

const PRIVATE_ROUTE_ROOTS = [
  "/admin",
  "/login",
  "/seo-command-center",
] as const;

const NON_MARKETING_ROUTE_ROOTS = ["/privacy-policy", "/terms"] as const;

function canonicalizeLocalPathname(pathname: string): string {
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    // Malformed encodings cannot match a real private route; keep them literal.
  }

  const segments: string[] = [];
  for (const segment of decoded.replace(/\\/g, "/").split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      segments.pop();
      continue;
    }
    segments.push(segment);
  }
  return `/${segments.join("/")}`.toLowerCase();
}

export function normalizePrivacyPath(path: string): string {
  try {
    // Treat every leading slash as a local path, never as a protocol-relative
    // URL whose hostname could hide a private route from classification.
    const pathname = path.startsWith("/")
      ? path.split(/[?#]/, 1)[0]
      : new URL(path, "https://privacy.local").pathname;
    return canonicalizeLocalPathname(pathname);
  } catch {
    const pathname = path.split(/[?#]/, 1)[0] || "/";
    return canonicalizeLocalPathname(pathname);
  }
}

/** Private workspaces never receive analytics or public conversion widgets. */
export function isPrivateRoute(path: string): boolean {
  const pathname = normalizePrivacyPath(path);
  return PRIVATE_ROUTE_ROOTS.some(
    root => pathname === root || pathname.startsWith(`${root}/`)
  );
}

export function shouldRenderMarketingWidgets(path: string): boolean {
  const pathname = normalizePrivacyPath(path);
  return !isPrivateRoute(path) && !NON_MARKETING_ROUTE_ROOTS.some(
    root => pathname === root || pathname.startsWith(`${root}/`)
  );
}

function getPreferenceStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isPrivacyPreference(value: unknown): value is PrivacyPreference {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PrivacyPreference>;
  return (
    candidate.version === PRIVACY_PREFERENCE_VERSION &&
    (candidate.analytics === "granted" || candidate.analytics === "denied") &&
    typeof candidate.updatedAt === "number" &&
    Number.isFinite(candidate.updatedAt)
  );
}

/** Missing, unreadable, invalid, or old preferences always mean default denial. */
export function readPrivacyPreference(): PrivacyPreference | null {
  const storage = getPreferenceStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(PRIVACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isPrivacyPreference(parsed)) {
      storage.removeItem(PRIVACY_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(): boolean {
  return readPrivacyPreference()?.analytics === "granted";
}

function dispatchPrivacyEvent(
  name: typeof PRIVACY_PREFERENCE_EVENT | typeof PRIVACY_RESET_EVENT,
  detail: PrivacyPreference | null
): void {
  if (typeof window === "undefined") return;
  const event =
    typeof CustomEvent === "function"
      ? new CustomEvent(name, { detail })
      : new Event(name);
  window.dispatchEvent(event);
}

export function savePrivacyPreference(
  analytics: AnalyticsPreference
): PrivacyPreference | null {
  const preference: PrivacyPreference = {
    version: PRIVACY_PREFERENCE_VERSION,
    analytics,
    updatedAt: Date.now(),
  };

  const storage = getPreferenceStorage();
  if (!storage) {
    dispatchPrivacyEvent(PRIVACY_PREFERENCE_EVENT, null);
    return null;
  }

  try {
    storage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify(preference));
  } catch {
    // Storage denial remains fail-closed; never grant for only this page load.
    dispatchPrivacyEvent(PRIVACY_PREFERENCE_EVENT, null);
    return null;
  }

  dispatchPrivacyEvent(PRIVACY_PREFERENCE_EVENT, preference);
  return preference;
}

/**
 * Clear only this app's non-sensitive preference. Authentication cookies are
 * HttpOnly and are never read or modified by this privacy control.
 */
export function resetPrivacyPreference(): void {
  try {
    getPreferenceStorage()?.removeItem(PRIVACY_STORAGE_KEY);
  } catch {
    // A blocked storage API already behaves as no consent.
  }
  dispatchPrivacyEvent(PRIVACY_RESET_EVENT, null);
  dispatchPrivacyEvent(PRIVACY_PREFERENCE_EVENT, null);
}
