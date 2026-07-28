/**
 * Journey Router Tests
 * Validates admin-only enforcement, data shapes, and journey query procedures.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock journey DB helpers ──────────────────────────────────────────────────
vi.mock("./journeyDb", () => ({
  getJourneyMetrics: vi.fn().mockResolvedValue({
    totalSessions: 150,
    convertedSessions: 42,
    conversionRate: 28,
  }),
  getWebsiteLeadSessions: vi.fn().mockResolvedValue([
    {
      id: 1,
      sessionId: "sf_1234_abc",
      leadId: 10,
      ghlContactId: "ghl_c1",
      firstPage: "/",
      lastPage: "/cancel-solar-contract/houston-tx",
      totalPages: 4,
      totalTimeMs: 185000,
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "solar-exit-2026",
      referrer: null,
      deviceType: "mobile",
      userAgent: "Mozilla/5.0",
      submittedAt: new Date("2026-07-01T14:00:00Z"),
      createdAt: new Date("2026-07-01T13:55:00Z"),
      updatedAt: new Date("2026-07-01T14:00:00Z"),
    },
  ]),
  getFullLeadJourney: vi.fn().mockResolvedValue({
    session: {
      id: 1,
      sessionId: "sf_1234_abc",
      leadId: 10,
      ghlContactId: "ghl_c1",
      firstPage: "/",
      lastPage: "/cancel-solar-contract/houston-tx",
      totalPages: 4,
      totalTimeMs: 185000,
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "solar-exit-2026",
      deviceType: "mobile",
      submittedAt: new Date("2026-07-01T14:00:00Z"),
      createdAt: new Date("2026-07-01T13:55:00Z"),
      updatedAt: new Date("2026-07-01T14:00:00Z"),
    },
    journeyEvents: [
      {
        id: 1,
        sessionId: "sf_1234_abc",
        leadId: 10,
        eventType: "pageview",
        page: "/",
        pageTitle: "Solar Freedom",
        timeOnPageMs: 0,
        scrollDepthPct: 0,
        detail: null,
        createdAt: new Date("2026-07-01T13:55:00Z"),
      },
      {
        id: 2,
        sessionId: "sf_1234_abc",
        leadId: 10,
        eventType: "page_exit",
        page: "/",
        pageTitle: "Solar Freedom",
        timeOnPageMs: 45000,
        scrollDepthPct: 72,
        detail: null,
        createdAt: new Date("2026-07-01T13:55:45Z"),
      },
      {
        id: 3,
        sessionId: "sf_1234_abc",
        leadId: 10,
        eventType: "form_submit",
        page: "/",
        pageTitle: "Solar Freedom",
        timeOnPageMs: 0,
        scrollDepthPct: 0,
        detail: JSON.stringify({ formName: "Solar Freedom Contact Form" }),
        createdAt: new Date("2026-07-01T14:00:00Z"),
      },
    ],
    pipelineEvents: [
      {
        id: 1,
        ghlContactId: "ghl_c1",
        ghlOpportunityId: "opp_1",
        pipelineId: "p1",
        pipelineName: "🌞 Inbound Solar Exit Transfers",
        stageId: "s1",
        stageName: "New Lead",
        eventType: "stage_change",
        assignedTo: "John Smith",
        performedBy: "System",
        monetaryValue: "5098.50",
        paymentStatus: null,
        occurredAt: new Date("2026-07-01T14:05:00Z"),
        createdAt: new Date("2026-07-01T14:05:00Z"),
      },
      {
        id: 2,
        ghlContactId: "ghl_c1",
        ghlOpportunityId: "opp_1",
        pipelineId: "p1",
        pipelineName: "🌞 Inbound Solar Exit Transfers",
        stageId: "s3",
        stageName: "Closed Won",
        eventType: "won",
        assignedTo: "John Smith",
        performedBy: "John Smith",
        monetaryValue: "5098.50",
        paymentStatus: null,
        occurredAt: new Date("2026-07-05T10:00:00Z"),
        createdAt: new Date("2026-07-05T10:00:00Z"),
      },
    ],
  }),
  linkSessionToGhlContact: vi.fn().mockResolvedValue(undefined),
}));

// ─── Mock DB for lead lookup ──────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([{
            id: 10,
            firstName: "Jane",
            lastName: "Doe",
            email: "jane@example.com",
            phone: "555-9876",
            solarCompany: "Sunrun",
            problemType: "Monthly payment too high",
            monthlyPayment: "$200-$250",
            intent: "Yes — I want out ASAP",
            sourcePage: "/",
            status: "new",
            ghlWebhookSent: 1,
            createdAt: new Date("2026-07-01T14:00:00Z"),
            updatedAt: new Date("2026-07-01T14:00:00Z"),
          }]),
        }),
      }),
    }),
  }),
}));

// ─── Import router after mocks ────────────────────────────────────────────────
const { journeyRouter } = await import("./journeyRouter");

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeAdminCtx() {
  return {
    user: { id: "u1", role: "admin", name: "Admin", email: "admin@test.com" },
    req: {} as any,
    res: {} as any,
  };
}

function makeUserCtx() {
  return {
    user: { id: "u2", role: "user", name: "User", email: "user@test.com" },
    req: {} as any,
    res: {} as any,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("journeyRouter", () => {
  describe("metrics", () => {
    it("returns journey metrics for admin", async () => {
      const caller = journeyRouter.createCaller(makeAdminCtx());
      const result = await caller.metrics();
      expect(result.totalSessions).toBe(150);
      expect(result.convertedSessions).toBe(42);
      expect(result.conversionRate).toBe(28);
    });

    it("throws Forbidden for non-admin", async () => {
      const caller = journeyRouter.createCaller(makeUserCtx());
      await expect(caller.metrics()).rejects.toThrow("Forbidden");
    });
  });

  describe("websiteLeads", () => {
    it("returns website leads list for admin", async () => {
      const caller = journeyRouter.createCaller(makeAdminCtx());
      const result = await caller.websiteLeads({ limit: 25, offset: 0 });
      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].sessionId).toBe("sf_1234_abc");
      expect(result.sessions[0].totalPages).toBe(4);
      expect(result.sessions[0].utmSource).toBe("google");
    });

    it("throws Forbidden for non-admin", async () => {
      const caller = journeyRouter.createCaller(makeUserCtx());
      await expect(caller.websiteLeads({ limit: 25, offset: 0 })).rejects.toThrow("Forbidden");
    });
  });

  describe("leadJourney", () => {
    it("returns full journey for a lead for admin", async () => {
      const caller = journeyRouter.createCaller(makeAdminCtx());
      const result = await caller.leadJourney({ leadId: 10 });
      expect(result.session?.sessionId).toBe("sf_1234_abc");
      expect(result.journeyEvents).toHaveLength(3);
      expect(result.pipelineEvents).toHaveLength(2);
      // Verify event types
      const eventTypes = result.journeyEvents.map(e => e.eventType);
      expect(eventTypes).toContain("pageview");
      expect(eventTypes).toContain("form_submit");
      // Verify pipeline progression
      const stageNames = result.pipelineEvents.map(e => e.stageName);
      expect(stageNames).toContain("New Lead");
      expect(stageNames).toContain("Closed Won");
    });

    it("throws Forbidden for non-admin", async () => {
      const caller = journeyRouter.createCaller(makeUserCtx());
      await expect(caller.leadJourney({ leadId: 10 })).rejects.toThrow("Forbidden");
    });
  });

  describe("linkGhlContact", () => {
    it("links a GHL contact to a session for admin", async () => {
      const caller = journeyRouter.createCaller(makeAdminCtx());
      const result = await caller.linkGhlContact({
        sessionId: "sf_1234_abc",
        ghlContactId: "ghl_c1",
      });
      expect(result.ok).toBe(true);
    });

    it("throws Forbidden for non-admin", async () => {
      const caller = journeyRouter.createCaller(makeUserCtx());
      await expect(
        caller.linkGhlContact({ sessionId: "sf_1234_abc", ghlContactId: "ghl_c1" })
      ).rejects.toThrow("Forbidden");
    });
  });
});
