import { describe, expect, it } from "vitest";
import {
  isAllowedPressReleaseSetting,
  isAllowedPublicConfigKey,
  normalizeSubstackPublicationUrl,
  validatePressReleaseSetting,
} from "./configPolicy";

describe("configuration allowlists", () => {
  it("allows public display fields and rejects arbitrary or secret-looking keys", () => {
    expect(isAllowedPublicConfigKey("phone_number")).toBe(true);
    expect(isAllowedPublicConfigKey("webhook_url")).toBe(false);
    expect(isAllowedPublicConfigKey("api_key")).toBe(false);
  });

  it("allows operational PR settings but rejects credential storage", () => {
    expect(isAllowedPressReleaseSetting("schedule_enabled")).toBe(true);
    expect(isAllowedPressReleaseSetting("image_model")).toBe(true);
    expect(isAllowedPressReleaseSetting("embedding_model")).toBe(true);
    expect(isAllowedPressReleaseSetting("prlog_password")).toBe(false);
    expect(isAllowedPressReleaseSetting("newsbywire_api_key")).toBe(false);
  });

  it("accepts only HTTPS Substack publication origins", () => {
    expect(normalizeSubstackPublicationUrl("https://example.substack.com/")).toBe(
      "https://example.substack.com"
    );
    for (const value of [
      "http://example.substack.com",
      "https://substack.com.evil.example",
      "https://127.0.0.1",
      "https://user:pass@example.substack.com",
      "https://example.substack.com:8443",
      "https://example.substack.com/#secret",
    ]) {
      expect(() => normalizeSubstackPublicationUrl(value)).toThrow();
    }
  });

  it("requires boolean operational flags", () => {
    expect(() => validatePressReleaseSetting("schedule_enabled", "true")).not.toThrow();
    expect(() => validatePressReleaseSetting("schedule_enabled", "yes")).toThrow(/true or false/);
  });
});
