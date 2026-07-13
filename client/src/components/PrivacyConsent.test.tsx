import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PrivacyConsent from "./PrivacyConsent";

describe("PrivacyConsent", () => {
  it("renders an accessible equal-choice banner when no preference exists", () => {
    const html = renderToStaticMarkup(<PrivacyConsent />);

    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Privacy choices"');
    expect(html).toContain("Decline optional analytics");
    expect(html).toContain("Accept analytics");
    expect(html).toContain("It stays off unless you accept");
    expect(html).toContain("identity-resolution");
    expect(html).toContain("session-replay");
  });
});
