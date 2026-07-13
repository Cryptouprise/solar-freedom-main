export const PUBLIC_SITE_CONFIG_KEYS = new Set([
  "phone_number",
  "phone_number_e164",
  "assistant_name",
  "assistant_title",
]);

export const PRESS_RELEASE_OPERATIONAL_KEYS = new Set([
  "model",
  "image_model",
  "embedding_model",
  "schedule_enabled",
  "playwright_enabled",
  "medium_enabled",
  "linkedin_enabled",
  "substack_enabled",
  "substack_url",
]);

export function isAllowedPublicConfigKey(key: string): boolean {
  return PUBLIC_SITE_CONFIG_KEYS.has(key);
}

export function isAllowedPressReleaseSetting(key: string): boolean {
  return PRESS_RELEASE_OPERATIONAL_KEYS.has(key);
}

export function normalizeSubstackPublicationUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Substack URL must be a valid HTTPS URL");
  }
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (
    url.protocol !== "https:" ||
    Boolean(url.username || url.password || url.port || url.hash) ||
    !(hostname === "substack.com" || hostname.endsWith(".substack.com"))
  ) {
    throw new Error("Substack URL must use an HTTPS subdomain of substack.com");
  }
  url.pathname = url.pathname.replace(/\/+$/, "");
  url.search = "";
  return url.toString().replace(/\/$/, "");
}

export function validatePressReleaseSetting(key: string, value: string): void {
  if (key === "substack_url" && value.trim()) normalizeSubstackPublicationUrl(value.trim());
  if (key.endsWith("_enabled") && !["true", "false"].includes(value)) {
    throw new Error(`${key} must be true or false`);
  }
}
