import { describe, expect, it } from "vitest";
import { formatResearchReceipt } from "./attorneyResearch";

describe("formatResearchReceipt", () => {
  it("explains the research outcome with found, saved, and duplicate counts", () => {
    expect(formatResearchReceipt([
      { state: "California", searched: 12, saved: 5, duplicates: 2, sourceUrls: ["https://example.com/a"] },
      { state: "Texas", searched: 8, saved: 3, duplicates: 1, sourceUrls: [] },
    ])).toBe(
      "California: searched 12 source-backed listings; saved 5 new prospects; skipped 2 duplicates. Texas: searched 8 source-backed listings; saved 3 new prospects; skipped 1 duplicates."
    );
  });

  it("states clearly when no research was requested", () => {
    expect(formatResearchReceipt([])).toBe("No attorney research was requested.");
  });
});
