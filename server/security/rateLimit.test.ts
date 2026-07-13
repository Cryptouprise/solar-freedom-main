import { beforeEach, describe, expect, it } from "vitest";
import type { Request } from "express";
import { clearRateLimitsForTests, enforcePublicMutationLimit } from "./rateLimit";

function request(ip: string): Request {
  return { headers: { "x-forwarded-for": ip }, socket: {} } as Request;
}

describe("public mutation rate limit", () => {
  beforeEach(clearRateLimitsForTests);

  it("rejects requests after the action/address budget is exhausted", () => {
    const req = request("203.0.113.10");
    enforcePublicMutationLimit(req, "lead", 2, 60_000);
    enforcePublicMutationLimit(req, "lead", 2, 60_000);
    expect(() => enforcePublicMutationLimit(req, "lead", 2, 60_000)).toThrow(/Too many requests/i);
  });

  it("keeps actions and addresses in separate buckets", () => {
    enforcePublicMutationLimit(request("203.0.113.11"), "lead", 1, 60_000);
    expect(() => enforcePublicMutationLimit(request("203.0.113.11"), "exit", 1, 60_000)).not.toThrow();
    expect(() => enforcePublicMutationLimit(request("203.0.113.12"), "lead", 1, 60_000)).not.toThrow();
  });
});

