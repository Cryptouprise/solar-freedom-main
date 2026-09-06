import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeGhlLifecyclePayload, registerGhlLifecycleWebhook } from "./ghlLifecycleWebhook";
import * as attribution from "./homeExperimentReport";
import { getGhlPipelineEventByExternalId, insertGhlPipelineEvent } from "./journeyDb";

vi.mock("./journeyDb", () => ({
  getGhlPipelineEventByExternalId: vi.fn(),
  insertGhlPipelineEvent: vi.fn(),
}));

describe("GoHighLevel lifecycle event normalization", () => {
  it("normalizes an appointment-created workflow payload into a booked appointment", () => {
    const event = normalizeGhlLifecyclePayload({
      event_id: "evt-123",
      event_type: "appointment_created",
      contact_id: "contact-123",
      appointment_id: "appointment-123",
      start_time: "2026-08-20T18:00:00Z",
      pipeline_id: "pipeline-1",
      stage_id: "stage-booked",
      stage_name: "Booked",
    });

    expect(event.externalEventId).toBe("ghl:evt-123");
    expect(event.ghlContactId).toBe("contact-123");
    expect(event.ghlOpportunityId).toBe("appointment-123");
    expect(event.eventType).toBe("appointment_booked");
    expect(event.stageName).toBe("Booked");
    expect(event.occurredAt.toISOString()).toBe("2026-08-20T18:00:00.000Z");
  });

    describe("authenticated lifecycle endpoint persistence failures", () => {
      const payload = {
        website_lead_id: "42", contactId: "contact-42", eventId: "evt-42",
        eventType: "qualified", occurredAt: "2026-09-01T12:00:00Z",
      };
      beforeEach(() => {
        vi.stubEnv("GHL_EVENT_WEBHOOK_SECRET", "test-secret");
        vi.mocked(getGhlPipelineEventByExternalId).mockResolvedValue(null);
        vi.mocked(insertGhlPipelineEvent).mockResolvedValue(99);
        vi.spyOn(attribution, "recordCrmContactLink").mockResolvedValue(undefined);
      });
      afterEach(() => { vi.restoreAllMocks(); vi.clearAllMocks(); vi.unstubAllEnvs(); });

      async function request(body: unknown) {
        const app = { post: vi.fn() };
        registerGhlLifecycleWebhook(app as any);
        const handler = app.post.mock.calls[0].at(-1);
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
        await handler({ body, header: () => "test-secret" }, res);
        return res;
      }

      it("returns retryable 503 without storage details when attribution persistence throws", async () => {
        vi.mocked(attribution.recordCrmContactLink).mockRejectedValueOnce(new Error("SQL connection failure with private data"));
        const res = await request(payload);
        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({ error: "CRM event storage is unavailable" });
        expect(insertGhlPipelineEvent).not.toHaveBeenCalled();
      });
      it("persists a valid contact link and lifecycle event normally", async () => {
        const res = await request(payload);
        expect(attribution.recordCrmContactLink).toHaveBeenCalledWith(42, "contact-42");
        expect(insertGhlPipelineEvent).toHaveBeenCalledWith(expect.objectContaining({
          externalEventId: "ghl:evt-42", ghlContactId: "contact-42", eventType: "qualified",
        }));
        expect(vi.mocked(insertGhlPipelineEvent).mock.calls[0][0]).not.toHaveProperty("websiteLeadId");
        expect(res.status).toHaveBeenCalledWith(202);
        expect(res.json).toHaveBeenCalledWith({ ok: true, deduplicated: false, eventId: 99 });
      });
      it("rejects malformed payloads with 400 before any database operation", async () => {
        const res = await request({ ...payload, website_lead_id: "-1" });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(attribution.recordCrmContactLink).not.toHaveBeenCalled();
        expect(getGhlPipelineEventByExternalId).not.toHaveBeenCalled();
        expect(insertGhlPipelineEvent).not.toHaveBeenCalled();
      });
      it("keeps an unknown website lead a non-retryable 400 validation failure", async () => {
        vi.mocked(attribution.recordCrmContactLink).mockRejectedValueOnce(new attribution.UnknownWebsiteLeadError());
        const res = await request(payload);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Unknown website lead ID" });
        expect(insertGhlPipelineEvent).not.toHaveBeenCalled();
      });
      it("preserves event deduplication after resolving attribution", async () => {
        vi.mocked(getGhlPipelineEventByExternalId).mockResolvedValueOnce({ id: 99 } as any);
        const res = await request(payload);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ ok: true, deduplicated: true, eventId: 99 });
        expect(insertGhlPipelineEvent).not.toHaveBeenCalled();
      });
      it("returns retryable 503 when event storage throws", async () => {
        vi.mocked(insertGhlPipelineEvent).mockRejectedValueOnce(new Error("database unavailable"));
        const res = await request(payload);
        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({ error: "CRM event storage is unavailable" });
      });
    });

  it("derives a stable retry-safe event identifier when GoHighLevel omits one", () => {
    const payload = {
      type: "appointment_completed",
      contact: { id: "contact-234" },
      appointment: { id: "appointment-234", startTime: "2026-08-20T18:00:00Z" },
    };
    const first = normalizeGhlLifecyclePayload(payload);
    const second = normalizeGhlLifecyclePayload(payload);

    expect(first.externalEventId).toBe(second.externalEventId);
    expect(first.eventType).toBe("appointment_completed");
  });

  it("rejects a payload without a contact identifier", () => {
    expect(() => normalizeGhlLifecyclePayload({ event_type: "appointment_created" })).toThrow("Missing GoHighLevel contact ID");
  });

  it("rejects an unsupported lifecycle event", () => {
    expect(() => normalizeGhlLifecyclePayload({ event_type: "new_unknown_event", contact_id: "contact-345" })).toThrow("Unsupported lifecycle event type");
  });
});
