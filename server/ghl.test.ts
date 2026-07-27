/**
 * GHL Router Tests
 * Validates that GHL tRPC procedures enforce admin-only access and return correct shapes.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock GHL client ──────────────────────────────────────────────────────────
vi.mock("./ghlClient", () => ({
  getContacts: vi.fn().mockResolvedValue({
    contacts: [
      {
        id: "c1",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "555-1234",
        tags: ["fb en", "website"],
        dateAdded: "2026-01-15T00:00:00Z",
      },
    ],
    count: 1,
    total: 2987,
  }),
  getContact: vi.fn().mockResolvedValue({
    contact: { id: "c1", firstName: "John", lastName: "Doe", email: "john@example.com" },
  }),
  updateContact: vi.fn().mockResolvedValue({
    contact: { id: "c1", firstName: "John", lastName: "Doe", tags: ["new-tag"] },
  }),
  getOpportunities: vi.fn().mockResolvedValue({
    opportunities: [
      {
        id: "o1",
        name: "John Doe - Solar Exit",
        monetaryValue: 5098.5,
        pipelineId: "p1",
        pipelineStageId: "s1",
        status: "open",
        createdAt: "2026-01-15T00:00:00Z",
      },
    ],
    meta: { total: 2643, currentPage: 1, nextPage: null, prevPage: null },
  }),
  updateOpportunity: vi.fn().mockResolvedValue({
    opportunity: { id: "o1", name: "John Doe - Solar Exit", status: "won" },
  }),
  getPipelines: vi.fn().mockResolvedValue({
    pipelines: [
      {
        id: "p1",
        name: "🌞 Inbound Solar Exit Transfers",
        stages: [
          { id: "s1", name: "New Lead", position: 0 },
          { id: "s2", name: "Appointment Set", position: 1 },
          { id: "s3", name: "Closed", position: 2 },
        ],
      },
    ],
  }),
  getConversations: vi.fn().mockResolvedValue({
    conversations: [
      {
        id: "cv1",
        contactId: "c1",
        locationId: "WBEbDUNxKL5GyxIUjjdZ",
        lastMessageBody: "Hi, I need help with my solar contract",
        lastMessageDate: "2026-07-27T10:00:00Z",
        unreadCount: 2,
      },
    ],
    total: 1,
  }),
  sendMessage: vi.fn().mockResolvedValue({ conversationId: "cv1", messageId: "m1" }),
  getInvoices: vi.fn().mockResolvedValue({
    invoices: [
      {
        id: "inv1",
        number: "000185",
        name: "Elite Solar Recovery - John Doe",
        status: "sent",
        total: 8950,
        amountPaid: 0,
        dueDate: "2026-07-31T05:59:59.999Z",
        contact: { id: "c1", name: "John Doe" },
      },
    ],
    total: 90,
  }),
  getAppointments: vi.fn().mockResolvedValue({
    appointments: [
      {
        id: "a1",
        title: "Solar Contract Review",
        startTime: "2026-07-28T14:00:00Z",
        status: "confirmed",
        contactId: "c1",
      },
    ],
  }),
  getLocationInfo: vi.fn().mockResolvedValue({
    location: { id: "WBEbDUNxKL5GyxIUjjdZ", name: "Solar Freedom" },
  }),
  GHL_LOCATION_ID: "WBEbDUNxKL5GyxIUjjdZ",
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeAdminCtx() {
  return {
    user: { id: "u1", role: "admin", name: "Admin User", email: "admin@test.com" },
    req: {} as any,
    res: {} as any,
  };
}

function makeUserCtx() {
  return {
    user: { id: "u2", role: "user", name: "Regular User", email: "user@test.com" },
    req: {} as any,
    res: {} as any,
  };
}

// ─── Import router after mocks ────────────────────────────────────────────────
const { ghlRouter } = await import("./ghlRouter");

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ghlRouter", () => {
  describe("locationInfo", () => {
    it("returns location info for admin", async () => {
      const caller = ghlRouter.createCaller(makeAdminCtx());
      const result = await caller.locationInfo();
      expect(result.location.id).toBe("WBEbDUNxKL5GyxIUjjdZ");
      expect(result.location.name).toBe("Solar Freedom");
    });

    it("throws Forbidden for non-admin", async () => {
      const caller = ghlRouter.createCaller(makeUserCtx());
      await expect(caller.locationInfo()).rejects.toThrow("Forbidden");
    });
  });

  describe("contacts", () => {
    it("returns contacts list for admin", async () => {
      const caller = ghlRouter.createCaller(makeAdminCtx());
      const result = await caller.contacts({ limit: 25 });
      expect(result.contacts).toHaveLength(1);
      expect(result.contacts[0].firstName).toBe("John");
      expect(result.total).toBe(2987);
    });

    it("throws Forbidden for non-admin", async () => {
      const caller = ghlRouter.createCaller(makeUserCtx());
      await expect(caller.contacts({ limit: 25 })).rejects.toThrow("Forbidden");
    });

    it("accepts search query", async () => {
      const caller = ghlRouter.createCaller(makeAdminCtx());
      const result = await caller.contacts({ limit: 10, query: "John" });
      expect(result.contacts).toBeDefined();
    });
  });

  describe("opportunities", () => {
    it("returns opportunities for admin", async () => {
      const caller = ghlRouter.createCaller(makeAdminCtx());
      const result = await caller.opportunities({ limit: 25 });
      expect(result.opportunities).toHaveLength(1);
      expect(result.opportunities[0].monetaryValue).toBe(5098.5);
      expect(result.meta.total).toBe(2643);
    });

    it("throws Forbidden for non-admin", async () => {
      const caller = ghlRouter.createCaller(makeUserCtx());
      await expect(caller.opportunities({ limit: 25 })).rejects.toThrow("Forbidden");
    });
  });

  describe("updateOpportunity", () => {
    it("updates opportunity for admin", async () => {
      const caller = ghlRouter.createCaller(makeAdminCtx());
      const result = await caller.updateOpportunity({ opportunityId: "o1", status: "won" });
      expect(result.opportunity.status).toBe("won");
    });

    it("throws Forbidden for non-admin", async () => {
      const caller = ghlRouter.createCaller(makeUserCtx());
      await expect(caller.updateOpportunity({ opportunityId: "o1", status: "won" })).rejects.toThrow("Forbidden");
    });
  });

  describe("pipelines", () => {
    it("returns pipelines for admin", async () => {
      const caller = ghlRouter.createCaller(makeAdminCtx());
      const result = await caller.pipelines();
      expect(result.pipelines).toHaveLength(1);
      expect(result.pipelines[0].name).toBe("🌞 Inbound Solar Exit Transfers");
      expect(result.pipelines[0].stages).toHaveLength(3);
    });
  });

  describe("conversations", () => {
    it("returns conversations for admin", async () => {
      const caller = ghlRouter.createCaller(makeAdminCtx());
      const result = await caller.conversations({ limit: 25 });
      expect(result.conversations).toHaveLength(1);
      expect(result.conversations[0].unreadCount).toBe(2);
    });

    it("throws Forbidden for non-admin", async () => {
      const caller = ghlRouter.createCaller(makeUserCtx());
      await expect(caller.conversations({ limit: 25 })).rejects.toThrow("Forbidden");
    });
  });

  describe("sendMessage", () => {
    it("sends SMS message for admin", async () => {
      const caller = ghlRouter.createCaller(makeAdminCtx());
      const result = await caller.sendMessage({
        contactId: "c1",
        type: "SMS",
        message: "Hello, following up on your solar case review.",
      });
      expect(result.conversationId).toBe("cv1");
      expect(result.messageId).toBe("m1");
    });

    it("throws Forbidden for non-admin", async () => {
      const caller = ghlRouter.createCaller(makeUserCtx());
      await expect(
        caller.sendMessage({ contactId: "c1", type: "SMS", message: "test" })
      ).rejects.toThrow("Forbidden");
    });
  });

  describe("invoices", () => {
    it("returns invoices for admin", async () => {
      const caller = ghlRouter.createCaller(makeAdminCtx());
      const result = await caller.invoices({ limit: 25 });
      expect(result.invoices).toHaveLength(1);
      expect(result.invoices[0].total).toBe(8950);
      expect(result.invoices[0].status).toBe("sent");
    });

    it("throws Forbidden for non-admin", async () => {
      const caller = ghlRouter.createCaller(makeUserCtx());
      await expect(caller.invoices({ limit: 25 })).rejects.toThrow("Forbidden");
    });
  });

  describe("dashboardSummary", () => {
    it("returns aggregated summary for admin", async () => {
      const caller = ghlRouter.createCaller(makeAdminCtx());
      const result = await caller.dashboardSummary();
      expect(result.contactTotal).toBeGreaterThanOrEqual(0);
      expect(result.oppTotal).toBeGreaterThanOrEqual(0);
      expect(result.unpaidInvoiceCount).toBeGreaterThanOrEqual(0);
      expect(result.unpaidInvoiceValue).toBeGreaterThanOrEqual(0);
      expect(result.unreadConvoCount).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.recentInvoices)).toBe(true);
      expect(Array.isArray(result.recentConvos)).toBe(true);
    });

    it("throws Forbidden for non-admin", async () => {
      const caller = ghlRouter.createCaller(makeUserCtx());
      await expect(caller.dashboardSummary()).rejects.toThrow("Forbidden");
    });
  });
});
