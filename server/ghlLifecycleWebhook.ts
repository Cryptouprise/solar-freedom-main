import { createHash, timingSafeEqual } from "crypto";
import type { Express } from "express";
import { rateLimit } from "express-rate-limit";
import { getGhlPipelineEventByExternalId, insertGhlPipelineEvent } from "./journeyDb";

const ALLOWED_EVENT_TYPES = new Set([
  "appointment_booked",
  "appointment_cancelled",
  "appointment_completed",
  "stage_change",
  "status_change",
  "assigned",
  "won",
  "lost",
  "payment_received",
]);

export type GhlLifecycleEvent = {
  externalEventId: string;
  ghlContactId: string;
  ghlOpportunityId?: string;
  pipelineId?: string;
  pipelineName?: string;
  stageId?: string;
  stageName?: string;
  eventType: string;
  assignedTo?: string;
  performedBy?: string;
  monetaryValue?: string;
  paymentStatus?: string;
  occurredAt: Date;
};

function stringValue(value: unknown, max = 200): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function nestedString(payload: Record<string, unknown>, names: string[], max = 200): string | undefined {
  for (const name of names) {
    const direct = stringValue(payload[name], max);
    if (direct) return direct;
  }
  return undefined;
}

function parseOccurredAt(value: unknown): Date {
  if (typeof value === "number") {
    const date = new Date(value < 10_000_000_000 ? value * 1000 : value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return new Date();
}

function normalizeEventType(value: unknown): string {
  const raw = typeof value === "string" ? value.trim().toLowerCase().replace(/[\s-]+/g, "_") : "";
  const aliases: Record<string, string> = {
    appointment_created: "appointment_booked",
    appointment_confirmed: "appointment_booked",
    calendar_event_created: "appointment_booked",
    appointment_deleted: "appointment_cancelled",
    appointment_no_show: "appointment_cancelled",
    opportunity_stage_update: "stage_change",
    opportunity_status_update: "status_change",
    opportunity_won: "won",
    opportunity_lost: "lost",
  };
  const eventType = aliases[raw] ?? raw;
  if (!ALLOWED_EVENT_TYPES.has(eventType)) {
    throw new Error("Unsupported lifecycle event type");
  }
  return eventType;
}

/**
 * Normalizes a GoHighLevel workflow webhook without relying on a specific
 * workflow-field naming style. The contact ID and event type are required; all
 * other fields are optional and retained only for funnel attribution.
 */
export function normalizeGhlLifecyclePayload(payload: unknown): GhlLifecycleEvent {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Lifecycle payload must be an object");
  }
  const record = payload as Record<string, unknown>;
  const contact = record.contact && typeof record.contact === "object" && !Array.isArray(record.contact)
    ? record.contact as Record<string, unknown>
    : {};
  const opportunity = record.opportunity && typeof record.opportunity === "object" && !Array.isArray(record.opportunity)
    ? record.opportunity as Record<string, unknown>
    : {};
  const appointment = record.appointment && typeof record.appointment === "object" && !Array.isArray(record.appointment)
    ? record.appointment as Record<string, unknown>
    : {};

  const ghlContactId = nestedString(record, ["contactId", "contact_id", "contact.id"], 64)
    ?? nestedString(contact, ["id", "contactId", "contact_id"], 64);
  if (!ghlContactId) throw new Error("Missing GoHighLevel contact ID");

  const eventType = normalizeEventType(
    nestedString(record, ["eventType", "event_type", "type"], 80)
      ?? nestedString(appointment, ["eventType", "event_type", "status", "type"], 80)
      ?? nestedString(opportunity, ["eventType", "event_type", "status"], 80)
  );
  const occurredAt = parseOccurredAt(
    record.occurredAt ?? record.occurred_at ?? record.timestamp ?? record.createdAt
      ?? record.startTime ?? record.start_time ?? appointment.startTime ?? appointment.start_time ?? opportunity.updatedAt
  );
  const ghlOpportunityId = nestedString(record, ["opportunityId", "opportunity_id"], 64)
    ?? nestedString(opportunity, ["id", "opportunityId", "opportunity_id"], 64);
  const appointmentId = nestedString(record, ["appointmentId", "appointment_id", "calendarEventId", "calendar_event_id"], 64)
    ?? nestedString(appointment, ["id", "appointmentId", "appointment_id"], 64);
  const nativeId = nestedString(record, ["eventId", "event_id", "id"], 128) ?? appointmentId;
  const externalEventId = nativeId
    ? `ghl:${nativeId}`
    : `ghl:${createHash("sha256").update(`${ghlContactId}|${ghlOpportunityId ?? ""}|${appointmentId ?? ""}|${eventType}|${occurredAt.toISOString()}`).digest("hex")}`;

  const amount = record.monetaryValue ?? record.monetary_value ?? opportunity.monetaryValue ?? opportunity.monetary_value;
  const monetaryValue = typeof amount === "number" || typeof amount === "string" ? String(amount).slice(0, 20) : undefined;

  return {
    externalEventId,
    ghlContactId,
    ghlOpportunityId: ghlOpportunityId ?? appointmentId,
    pipelineId: nestedString(record, ["pipelineId", "pipeline_id"], 64) ?? nestedString(opportunity, ["pipelineId", "pipeline_id"], 64),
    pipelineName: nestedString(record, ["pipelineName", "pipeline_name"], 200) ?? nestedString(opportunity, ["pipelineName", "pipeline_name"], 200),
    stageId: nestedString(record, ["stageId", "stage_id", "pipelineStageId", "pipeline_stage_id"], 64) ?? nestedString(opportunity, ["pipelineStageId", "pipeline_stage_id", "stageId", "stage_id"], 64),
    stageName: nestedString(record, ["stageName", "stage_name", "pipelineStageName", "pipeline_stage_name"], 200) ?? nestedString(opportunity, ["pipelineStageName", "pipeline_stage_name", "stageName", "stage_name"], 200),
    eventType,
    assignedTo: nestedString(record, ["assignedTo", "assigned_to"], 200) ?? nestedString(opportunity, ["assignedTo", "assigned_to"], 200),
    performedBy: nestedString(record, ["performedBy", "performed_by", "userName", "user_name"], 200),
    monetaryValue,
    paymentStatus: nestedString(record, ["paymentStatus", "payment_status"], 50),
    occurredAt,
  };
}

function hasValidSecret(received: unknown, expected: string): boolean {
  if (typeof received !== "string" || !received) return false;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

/**
 * Receives GoHighLevel workflow callbacks for booked/cancelled/completed
 * appointments and opportunity lifecycle events. Configure the GHL workflow to
 * POST to this endpoint with the `x-ghl-webhook-secret` header and an event type.
 */
export function registerGhlLifecycleWebhook(app: Express) {
  app.post(
    "/api/ghl/lifecycle",
    rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }),
    async (req, res) => {
      const expectedSecret = process.env.GHL_EVENT_WEBHOOK_SECRET;
      if (!expectedSecret) {
        res.status(503).json({ error: "CRM lifecycle webhook is not configured" });
        return;
      }
      if (!hasValidSecret(req.header("x-ghl-webhook-secret"), expectedSecret)) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      try {
        const event = normalizeGhlLifecyclePayload(req.body);
        const existing = await getGhlPipelineEventByExternalId(event.externalEventId);
        if (existing) {
          res.status(200).json({ ok: true, deduplicated: true, eventId: existing.id });
          return;
        }

        const eventId = await insertGhlPipelineEvent(event);
        if (!eventId) {
          res.status(503).json({ error: "CRM event storage is unavailable" });
          return;
        }
        res.status(202).json({ ok: true, deduplicated: false, eventId });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid lifecycle event";
        res.status(400).json({ error: message });
      }
    }
  );
}
