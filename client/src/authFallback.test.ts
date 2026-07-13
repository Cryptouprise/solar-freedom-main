import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("admin authentication fallback", () => {
  const loginUrl = fs.readFileSync(new URL("./const.ts", import.meta.url), "utf8");
  const loginPage = fs.readFileSync(new URL("./pages/Login.tsx", import.meta.url), "utf8");
  const authHook = fs.readFileSync(new URL("./_core/hooks/useAuth.ts", import.meta.url), "utf8");

  it("fails closed without throwing when client OAuth configuration is missing or unsafe", () => {
    expect(loginUrl).toContain('return "/login?unavailable=1"');
    expect(loginUrl).toContain('portal.protocol !== "https:"');
    expect(loginUrl).toContain("portal.username || portal.password");
    expect(loginPage).toContain("Admin login is not configured for this release.");
    expect(loginPage).toContain("if (loginUnavailable) return");
  });

  it("does not persist authenticated user details in browser storage", () => {
    expect(authHook).not.toContain("manus-runtime-user-info");
    expect(authHook).not.toContain("localStorage.setItem");
  });
});
