import { describe, expect, it } from "vitest";
import { resolveGa4DateWindow } from "./analyticsWindow";

describe("resolveGa4DateWindow", () => {
  it("uses the actual returned GA4 daily rows instead of relative request labels", () => {
    expect(resolveGa4DateWindow([{ date: "20260902" }, { date: "20260908" }])).toEqual({
      start: "2026-09-02",
      end: "2026-09-08",
    });
  });

  it("does not fabricate a window when GA4 returns no usable rows", () => {
    expect(resolveGa4DateWindow([])).toEqual({ start: null, end: null });
    expect(resolveGa4DateWindow([{ date: "invalid" }])).toEqual({ start: null, end: null });
  });
});
