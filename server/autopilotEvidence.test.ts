import { describe, expect, it } from "vitest";
import { autopilotRouter, competitorEvidenceSchema } from "./autopilotRouter";

const topic = { key: "goodleap", query: "GoodLeap loan cancellation", checkedAt: "2026-11-02T00:00:00Z", searchSource: "Public web search; no exact Google rank verified", rankingVerified: false, competitors: [{ url: "https://www.goodleap.com/complaints", title: "Official complaint channel", evidence: "A complaint does not automatically cancel a loan." }], targetGap: "Official contact route needs review", recommendedChange: "Review the official route and add a source-backed draft callout.", limitations: "No current Google position or AI answer citation verified." };
describe("owner autopilot evidence contract", () => {
  it("allows no more than three bounded, dated competitor topics", () => {
    expect(competitorEvidenceSchema.parse({ capturedAt: "2026-11-02T00:00:00Z", topics: [topic] }).topics).toHaveLength(1);
    expect(() => competitorEvidenceSchema.parse({ capturedAt: "2026-11-02T00:00:00Z", topics: Array.from({ length: 4 }, () => topic) })).toThrow();
    expect(() => competitorEvidenceSchema.parse({ capturedAt: "2026-11-02T00:00:00Z", topics: [] })).toThrow();
  });
  it("rejects invalid dates and future-dated research", () => {
    expect(() => competitorEvidenceSchema.parse({ capturedAt: "tomorrow", topics: [topic] })).toThrow();
    expect(() => competitorEvidenceSchema.parse({ capturedAt: "2099-11-02T00:00:00Z", topics: [topic] })).toThrow();
  });
  it("does not expose internal evidence to signed-out or ordinary users", async () => {
    const ordinary = autopilotRouter.createCaller({ user: { id: 1, role: "user" }, req: {}, res: {} } as any);
    const anonymous = autopilotRouter.createCaller({ user: null, req: {}, res: {} } as any);
    await expect(ordinary.status()).rejects.toThrow("Forbidden");
    await expect(anonymous.status()).rejects.toThrow();
    await expect(ordinary.recordCompetitorEvidence({ capturedAt: "2026-11-02T00:00:00Z", topics: [topic] })).rejects.toThrow("Forbidden");
  });
});
