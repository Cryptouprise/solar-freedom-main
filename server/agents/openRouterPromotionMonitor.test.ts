import { describe, expect, it } from "vitest";
import { pricingChanged, type QwenPricingSnapshot } from "./openRouterPromotionMonitor";

const baseline: QwenPricingSnapshot = {
  modelId: "qwen/qwen3.7-plus",
  inputPer1M: 0.32,
  outputPer1M: 1.28,
  checkedAt: "2026-08-25T00:00:00.000Z",
};

describe("Qwen3.7 Plus promotion monitor", () => {
  it("does not flag an unchanged live price", () => {
    expect(pricingChanged(baseline, { ...baseline, checkedAt: "2026-08-26T00:00:00.000Z" })).toBe(false);
  });

  it("flags a live pricing change for Manager review", () => {
    expect(pricingChanged(baseline, { ...baseline, outputPer1M: 2.56 })).toBe(true);
  });
});
