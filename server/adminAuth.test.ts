import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Response } from "express";

const { authenticateRequest } = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
}));

vi.mock("./_core/sdk", () => ({
  sdk: { authenticateRequest },
}));

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { adminAuthMiddleware, type AdminRequest } from "./adminAuth";

function request(method: string, origin?: string): AdminRequest {
  return {
    method,
    headers: {
      cookie: "session=test",
      host: "breakyoursolarcontract.com",
      ...(origin ? { origin } : {}),
    },
  } as AdminRequest;
}

function response() {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  return { response: { status } as unknown as Response, status, json };
}

describe("adminAuthMiddleware session authentication", () => {
  beforeEach(() => {
    authenticateRequest.mockReset();
  });

  it("allows a same-origin mutation for an authenticated admin", async () => {
    authenticateRequest.mockResolvedValue({ id: 7, openId: "owner", role: "admin" });
    const req = request("PUT", "https://breakyoursolarcontract.com");
    const { response: res, status } = response();
    const next = vi.fn() as NextFunction;

    await adminAuthMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(status).not.toHaveBeenCalled();
    expect(req.apiKey?.permissions).toEqual(["*"]);
  });

  it("blocks a cross-origin mutation before session authentication", async () => {
    const req = request("POST", "https://attacker.example");
    const { response: res, status } = response();
    const next = vi.fn() as NextFunction;

    await adminAuthMiddleware(req, res, next);

    expect(authenticateRequest).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(401);
  });

  it("does not grant admin API permissions to a non-admin session", async () => {
    authenticateRequest.mockResolvedValue({ id: 9, openId: "member", role: "user" });
    const req = request("GET");
    const { response: res, status } = response();
    const next = vi.fn() as NextFunction;

    await adminAuthMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(401);
  });
});
