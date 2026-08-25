import { describe, expect, it } from "vitest";
import { buildPriorityDraft, parseMoneyMakerResponse } from "./moneyMaker";

describe("Money Maker priority execution drafts", () => {
  it("creates a personalized review-only introduction from public prospect evidence", () => {
    const draft = buildPriorityDraft({
      contactPerson: "Ms. Jordan Shaw",
      firmName: "Shaw Lewenz",
      practiceAreas: JSON.stringify(["Solar Panel Fraud", "Consumer Protection"]),
      state: "Florida",
    });
    expect(draft).toContain("Hi Jordan,");
    expect(draft).toContain("Shaw Lewenz");
    expect(draft).toContain("solar panel fraud");
    expect(draft).toContain("Florida");
    expect(draft).toContain("I’m not assuming this is a fit");
  });

  it("uses a safe generic salutation when no public contact is known", () => {
    const draft = buildPriorityDraft({ firmName: "Example Firm", practiceAreas: "not JSON", state: null });
    expect(draft).toContain("Hi there,");
    expect(draft).toContain("consumer-protection work");
    expect(draft).toContain("your market");
  });

  it("recovers structured actions when a provider inserts a raw line break inside JSON text", () => {
    const parsed = parseMoneyMakerResponse(`{
      "analysis": "Collection gap is $
      130K and needs a firm-by-firm reconciliation.",
      "actions": [{"priority":"p1","title":"Reconcile invoices","description":"Review the invoice roster","actionType":"revenue_optimization","estimatedRevenue":"$130K","requiresApproval":true}]
    }`);
    expect(parsed.analysis).toContain("130K");
    expect(parsed.actions).toHaveLength(1);
    expect(parsed.actions?.[0].title).toBe("Reconcile invoices");
  });
});
