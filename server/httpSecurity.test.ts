import { describe, expect, it, vi } from "vitest";
import { applyHttpSecurityHeaders, getReleaseIdentity } from "./_core/httpSecurity";

function responseRecorder() {
  const headers = new Map<string, string>();
  return {
    headers,
    response: {
      setHeader: vi.fn((name: string, value: string) => headers.set(name, value)),
    },
  };
}

describe("HTTP security policy", () => {
  it("sets production browser protections and disables caching for private routes", () => {
    const { headers, response } = responseRecorder();
    const next = vi.fn();
    applyHttpSecurityHeaders(
      { path: "/admin/content", secure: true } as never,
      response as never,
      next,
      true,
    );

    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Cache-Control")).toBe("no-store");
    expect(headers.get("Strict-Transport-Security")).toContain("max-age=31536000");
    expect(headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(headers.get("Content-Security-Policy")).toContain("https://link.myinfinite.ai");
    expect(headers.get("Content-Security-Policy")).toContain("upgrade-insecure-requests");
    expect(next).toHaveBeenCalledOnce();
  });

  it("does not force HTTPS subresources when the transport is not trusted as secure", () => {
    const { headers, response } = responseRecorder();
    applyHttpSecurityHeaders(
      { path: "/", secure: false, headers: { "x-forwarded-proto": "https" } } as never,
      response as never,
      vi.fn(),
      true,
    );

    expect(headers.get("Strict-Transport-Security")).toBeUndefined();
    expect(headers.get("Content-Security-Policy")).toContain("default-src 'self'");
    expect(headers.get("Content-Security-Policy")).not.toContain("upgrade-insecure-requests");
  });

  it("never reflects an invalid release identifier", () => {
    expect(getReleaseIdentity({ RELEASE_SHA: "secret value with spaces" })).toEqual({
      version: "1.0.0",
      releaseSha: "unknown",
    });
    expect(getReleaseIdentity({ GITHUB_SHA: "abc1234" }).releaseSha).toBe("abc1234");
  });
});
