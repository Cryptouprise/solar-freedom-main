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
