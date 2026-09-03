import { describe, expect, it } from "vitest";
import { assessDraftReadiness } from "./contentAgent";

const completeDraft = `${"A homeowner-facing paragraph with useful, factual guidance. ".repeat(320)}

## Frequently Asked Questions

### Can I get help?
Yes. Request a no-obligation 15-minute case review to discuss your situation.`;

describe("Content draft self-QA", () => {
  it("passes a complete draft with an FAQ and required case-review CTA", () => {
    expect(assessDraftReadiness(completeDraft)).toEqual({ passed: true, issues: [] });
  });

  it("holds a truncated draft without an FAQ or conversion CTA out of Editor review", () => {
    const result = assessDraftReadiness("Short draft that ends without a complete sentence");
    expect(result.passed).toBe(false);
    expect(result.issues).toContain("Draft appears truncated because it does not end with a complete sentence.");
    expect(result.issues).toContain("Draft is missing a visible FAQ section.");
    expect(result.issues).toContain("Draft is missing the required no-obligation case-review CTA.");
  });
});
