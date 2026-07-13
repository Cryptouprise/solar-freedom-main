import { describe, expect, it } from "vitest";
import {
  CONTACT_CONSENT_VERSION,
  isBotSubmission,
  normalizeUsPhone,
  validateContactConsent,
} from "./leadConsent";

describe("lead contact policy", () => {
  it("normalizes only valid US phone numbers", () => {
    expect(normalizeUsPhone("(904) 921-4971")).toBe("+19049214971");
    expect(normalizeUsPhone("1-904-921-4971")).toBe("+19049214971");
    expect(() => normalizeUsPhone("12345")).toThrow(/valid 10-digit/);
  });

  it("binds contact permission to the current disclosure and keeps SMS separate", () => {
    expect(() => validateContactConsent({
      contactConsent: true,
      smsConsent: false,
      consentVersion: CONTACT_CONSENT_VERSION,
    })).not.toThrow();
    expect(() => validateContactConsent({
      contactConsent: true,
      smsConsent: false,
      consentVersion: "old-copy",
    })).toThrow(/out of date/);
    expect(() => validateContactConsent({
      contactConsent: false,
      smsConsent: true,
    })).toThrow(/requires contact consent/);
  });

  it("treats a filled hidden website field as a bot signal", () => {
    expect(isBotSubmission("https://spam.example")).toBe(true);
    expect(isBotSubmission("")).toBe(false);
  });
});
