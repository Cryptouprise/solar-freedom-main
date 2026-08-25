import { describe, expect, it } from "vitest";
import { normalizeGhlLifecyclePayload } from "./ghlLifecycleWebhook";

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
