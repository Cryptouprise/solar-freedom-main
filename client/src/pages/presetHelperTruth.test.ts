import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = fs.readFileSync(
  path.resolve(import.meta.dirname, "Home.tsx"),
  "utf8",
);

describe("preset information-helper truth", () => {
  it("does not present keyword-matched copy as live AI or a human response", () => {
    expect(homeSource).toContain("Guided information helper");
    expect(homeSource).toContain("Preset educational responses");
    expect(homeSource).toContain("It is not an AI or human review");
    expect(homeSource).not.toContain("Solar Freedom AI");
    expect(homeSource).not.toContain("typically replies instantly");
    expect(homeSource).not.toContain("1200 + Math.random()");
  });
});
