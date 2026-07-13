import { z } from "zod";
import {
  CONTACT_CONSENT_VERSION,
  MARKETING_CONSENT_VERSION,
} from "../../shared/leadConsent";

export {
  CONTACT_CONSENT_VERSION,
  MARKETING_CONSENT_VERSION,
} from "../../shared/leadConsent";

export function normalizeUsPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  throw new Error("Enter a valid 10-digit US phone number");
}

export const consentFields = {
  contactConsent: z.boolean().default(false),
  smsConsent: z.boolean().default(false),
  consentVersion: z.string().max(64).optional(),
  website: z.string().max(200).optional(),
};

export function validateContactConsent(input: {
  contactConsent: boolean;
  smsConsent: boolean;
  consentVersion?: string;
}): void {
  if (!input.contactConsent) {
    throw new Error("Contact consent is required before submitting personal information");
  }
  if (input.consentVersion !== CONTACT_CONSENT_VERSION) {
    throw new Error("The contact consent disclosure is out of date");
  }
}

export function validateMarketingConsent(input: {
  marketingConsent: boolean;
  consentVersion?: string;
}): void {
  if (!input.marketingConsent) {
    throw new Error("Marketing consent is required before submitting an email address");
  }
  if (input.consentVersion !== MARKETING_CONSENT_VERSION) {
    throw new Error("The guide consent disclosure is out of date");
  }
}

export function isBotSubmission(website?: string): boolean {
  return Boolean(website?.trim());
}
