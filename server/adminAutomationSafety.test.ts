import { describe, expect, it } from "vitest";
import fs from "node:fs";

describe("admin automation execution boundary", () => {
  const source = fs.readFileSync(new URL("./adminRouter.ts", import.meta.url), "utf8");
  const route = source.slice(
    source.indexOf('router.post("/automation/apply"'),
    source.indexOf("// GET /api/admin/keys")
  );

  it("is plan-only and contains no filesystem or SQL execution", () => {
    expect(route).toContain("evaluateAdminAutomationRequest");
    expect(route).toContain("executionEnabled: false");
    expect(route).toContain("applied: 0");
    expect(route).not.toMatch(/\bwriteFile\s*\(/);
    expect(route).not.toMatch(/\bdb\.execute\s*\(/);
  });

  it("does not return raw exception details from admin routes", () => {
    expect(source).not.toContain("details: String(err)");
  });
});
