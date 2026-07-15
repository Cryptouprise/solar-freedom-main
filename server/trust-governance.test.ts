import { execFileSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("trust governance regression audit", () => {
  it("keeps fabricated trust and unsupported structured-data surfaces suppressed", () => {
    const script = path.resolve(process.cwd(), "scripts/trust-governance-audit.mjs");
    expect(() => execFileSync(process.execPath, [script], { encoding: "utf8" })).not.toThrow();
  });
});
