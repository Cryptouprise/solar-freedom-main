/**
 * Unit tests for the leads and exitIntent tRPC routers.
 * These tests mock the database helpers so no real DB connection is required.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DB helpers ───────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  insertLead: vi.fn().mockResolvedValue(42),
  getLeads: vi.fn().mockResolvedValue([]),
  updateLeadStatus: vi.fn().mockResolvedValue(undefined),
  markLeadGhlSent: vi.fn().mockResolvedValue(undefined),
  insertExitIntentCapture: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  getDb: vi.fn().mockResolvedValue(null),
}));

// ─── Mock fetch for GHL webhook ────────────────────────────────────────────────
global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);
process.env.GHL_WEBHOOK_URL = "https://example.invalid/test-hook";

import { insertLead, insertExitIntentCapture, markLeadGhlSent } from "./db";

// ─── Helpers to create a minimal tRPC caller ──────────────────────────────────
import { appRouter } from "./routers";

const createCaller = appRouter.createCaller;

function makePublicCtx() {
  return {
    user: null,
    req: {} as any,
    res: {} as any,
  };
}

function makeAdminCtx() {
  return {
    user: { id: 1, openId: "admin-open-id", role: "admin" as const, name: "Admin", email: "admin@test.com", loginMethod: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as any,
    res: {} as any,
  };
}

function makeUserCtx() {
  return {
    user: { id: 2, openId: "user-open-id", role: "user" as const, name: "User", email: "user@test.com", loginMethod: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as any,
    res: {} as any,
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────────
describe("leads.submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true } as Response);
  });

  it("persists a lead to the database and returns success", async () => {
    const caller = createCaller(makePublicCtx());

    const result = await caller.leads.submit({
      firstName: "John",
      lastName: "Smith",
      email: "john@example.com",
      phone: "9049214971",
      solarCompany: "Sunrun",
      problemType: "Monthly payment too high",
      contractType: "Solar Loan",
      monthlyPayment: "$150–$200",
      intent: "Yes — I want out ASAP",
      formName: "Solar Freedom Contact Form",
      sourcePage: "/",
      sourceUrl: "https://example.com/",
    });

    expect(result.success).toBe(true);
    expect(result.leadId).toBe(42);
    expect(insertLead).toHaveBeenCalledOnce();
    expect(insertLead).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "John",
        lastName: "Smith",
        email: "john@example.com",
        status: "new",
        ghlWebhookSent: 0,
      })
    );
  });

  it("marks lead as GHL sent when webhook succeeds", async () => {
    const caller = createCaller(makePublicCtx());

    await caller.leads.submit({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      phone: "5551234567",
    });

    expect(markLeadGhlSent).toHaveBeenCalledWith(42);
  });

  it("still returns success even if GHL webhook fails", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("network error"));

    const caller = createCaller(makePublicCtx());

    const result = await caller.leads.submit({
      firstName: "Bob",
      lastName: "Builder",
      email: "bob@example.com",
      phone: "5559876543",
    });

    expect(result.success).toBe(true);
    expect(insertLead).toHaveBeenCalledOnce();
  });

  it("rejects invalid email", async () => {
    const caller = createCaller(makePublicCtx());

    await expect(
      caller.leads.submit({
        firstName: "Bad",
        lastName: "Email",
        email: "not-an-email",
        phone: "5551234567",
      })
    ).rejects.toThrow();
  });
});

describe("leads.list", () => {
  it("allows admin to list leads", async () => {
    const caller = createCaller(makeAdminCtx());
    const result = await caller.leads.list({ limit: 10, offset: 0 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects non-admin users", async () => {
    const caller = createCaller(makeUserCtx());
    await expect(caller.leads.list({ limit: 10, offset: 0 })).rejects.toThrow("Forbidden");
  });
});

describe("leads.quickCallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true } as Response);
  });

  it("persists a phone-first callback lead and returns success", async () => {
    const caller = createCaller(makePublicCtx());

    const result = await caller.leads.quickCallback({
      phone: "9049214971",
      name: "Grace Hopper",
      sourcePage: "/blog/example",
      sourceUrl: "https://example.com/blog/example",
      formName: "sticky_blog_sidebar",
    });

    expect(result.success).toBe(true);
    expect(result.leadId).toBe(42);
    expect(insertLead).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "Grace",
        lastName: "Hopper",
        phone: "9049214971",
        formName: "sticky_blog_sidebar",
        status: "new",
      })
    );
    expect(markLeadGhlSent).toHaveBeenCalledWith(42);
  });

  it("accepts callback requests with only phone number", async () => {
    const caller = createCaller(makePublicCtx());

    await expect(
      caller.leads.quickCallback({
        phone: "5551234567",
      })
    ).resolves.toEqual({ success: true, leadId: 42 });
  });
});

describe("leads.updateStatus", () => {
  it("allows admin to update lead status", async () => {
    const caller = createCaller(makeAdminCtx());
    const result = await caller.leads.updateStatus({ id: 1, status: "contacted" });
    expect(result.success).toBe(true);
  });

  it("rejects non-admin users", async () => {
    const caller = createCaller(makeUserCtx());
    await expect(
      caller.leads.updateStatus({ id: 1, status: "contacted" })
    ).rejects.toThrow("Forbidden");
  });
});

describe("exitIntent.capture", () => {
  it("persists an exit intent capture", async () => {
    const caller = createCaller(makePublicCtx());

    const result = await caller.exitIntent.capture({
      email: "visitor@example.com",
      sourcePage: "/",
    });

    expect(result.success).toBe(true);
    expect(insertExitIntentCapture).toHaveBeenCalledWith({
      email: "visitor@example.com",
      sourcePage: "/",
    });
  });

  it("rejects invalid email", async () => {
    const caller = createCaller(makePublicCtx());

    await expect(
      caller.exitIntent.capture({ email: "bad-email" })
    ).rejects.toThrow();
  });
});
