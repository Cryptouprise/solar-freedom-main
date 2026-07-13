import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ContactConsentFields } from "./ContactConsentFields";

describe("ContactConsentFields", () => {
  it("renders unchecked, accessible, separate contact and SMS choices", () => {
    const html = renderToStaticMarkup(
      <ContactConsentFields
        idPrefix="test-lead"
        contactConsent={false}
        smsConsent={false}
        website=""
        onContactConsentChange={vi.fn()}
        onSmsConsentChange={vi.fn()}
        onWebsiteChange={vi.fn()}
      />
    );

    expect(html.match(/type="checkbox"/g)).toHaveLength(2);
    expect(html).not.toContain("checked");
    expect(html).toContain('id="test-lead-contact-consent"');
    expect(html).toContain('name="contactConsent"');
    expect(html).toContain('aria-required="true"');
    expect(html.match(/required=""/g)).toHaveLength(1);
    expect(html).toContain('id="test-lead-sms-consent"');
    expect(html).toContain('name="smsConsent"');
  });

  it("discloses the contact limits, SMS terms, and honeypot", () => {
    const html = renderToStaticMarkup(
      <ContactConsentFields
        idPrefix="test-lead"
        contactConsent={false}
        smsConsent={false}
        website=""
        onContactConsentChange={vi.fn()}
        onSmsConsentChange={vi.fn()}
        onWebsiteChange={vi.fn()}
      />
    );

    expect(html).toContain("does not create an attorney-client relationship");
    expect(html).toContain("guarantee representation or results");
    expect(html).toContain("not a condition of purchase");
    expect(html).toContain("Message and data rates may apply");
    expect(html).toContain("Reply STOP to opt out or HELP for help");
    expect(html).toContain('href="/privacy-policy"');
    expect(html).toContain('href="/terms"');
    expect(html).toContain('name="website"');
    expect(html).toContain('tabindex="-1"');
  });
});
