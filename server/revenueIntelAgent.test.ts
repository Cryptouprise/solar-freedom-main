import { describe, expect, it } from "vitest";
import { getMysqlInsertId, modelPageMetrics, predictActions } from "./agents/revenueIntelAgent";

describe("Revenue Intelligence evidence model", () => {
  it("reads MySQL insert IDs from the mysql2 result tuple", () => {
    expect(getMysqlInsertId([{ insertId: 42 }, {}])).toBe(42);
    expect(getMysqlInsertId({ insertId: 9 })).toBe(9);
    expect(getMysqlInsertId({})).toBe(0);
  });

  it("treats refreshed Search Console values as a 28-day monthly baseline", () => {
    const metrics = modelPageMetrics({
      slug: "/blog/test-page",
      title: "Test page",
      pageType: "blog",
      gscClicks: 10,
      gscImpressions: 20,
      gscAvgPosition: "15.0",
    } as any);

    expect(metrics.currentLeadsPerMonth).toBe(0.28);
  });

  it("creates ranked evidence-backed opportunities for early low-volume pages", () => {
    const actions = predictActions({
      slug: "/blog/test-page",
      title: "Test page",
      pageType: "blog",
      clicks: 1,
      impressions: 12,
      position: 19.8,
      currentLeadsPerMonth: 0.03,
      currentRevenuePerMonth: 3.33,
    });

    expect(actions.some((action) => action.actionType === "title_optimization")).toBe(true);
    expect(actions.some((action) => action.actionType === "position_push")).toBe(true);
  });
});
