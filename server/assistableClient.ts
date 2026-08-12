/**
 * Assistable AI v3 adapter.
 *
 * This client is deliberately read-only/dry-run until credentials are supplied
 * and the owner explicitly enables outbound automation. It never sends SMS,
 * email, WhatsApp, or voice calls outside 8:00 AM–5:00 PM America/Denver and
 * defaults to refusing all outbound traffic even inside that window.
 */
import { ENV } from "./_core/env";

const BASE_URL = "https://api.assistable.ai/v3";

type AssistableEnvelope<T> = { data: T | null; error: { code?: string; message?: string } | null; request_id?: string };

function getDenverParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Denver",
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value ?? "";
  return { weekday: get("weekday"), hour: Number(get("hour")) };
}

export function isWithinAssistableContactWindow(date = new Date()): boolean {
  const { weekday, hour } = getDenverParts(date);
  return !["Sat", "Sun"].includes(weekday) && hour >= 8 && hour < 17;
}

function assertConfigured() {
  if (!ENV.assistableApiKey) throw new Error("Assistable is not connected. Add ASSISTABLE_API_KEY before enabling the CRM adapter.");
}

function assertOutboundAllowed(channel: "SMS" | "EMAIL" | "VOICE" | "WHATSAPP") {
  if (!ENV.assistableOutboundEnabled) {
    throw new Error(`${channel} is disabled. Assistable outbound remains in safe mode until the owner explicitly enables it.`);
  }
  if (!isWithinAssistableContactWindow()) {
    throw new Error(`${channel} is blocked outside the 8:00 AM–5:00 PM America/Denver contact window.`);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<AssistableEnvelope<T>> {
  assertConfigured();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${ENV.assistableApiKey}`,
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
  };
  if (ENV.assistableSubaccountId) headers["X-Subaccount-Id"] = ENV.assistableSubaccountId;
  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  const payload = await response.json().catch(() => ({ data: null, error: { message: "Invalid JSON response" } })) as AssistableEnvelope<T>;
  if (!response.ok || payload.error) {
    throw new Error(`Assistable ${response.status}: ${payload.error?.message || "request failed"}${payload.request_id ? ` (request ${payload.request_id})` : ""}`);
  }
  return payload;
}

/** Safe non-mutating connection test. This is the first permitted call after credentials are provided. */
export async function testAssistableConnection() {
  const response = await request<unknown[]>("/assistants?limit=1");
  return {
    connected: true,
    subaccountConfigured: Boolean(ENV.assistableSubaccountId),
    requestId: response.request_id ?? null,
    assistantCountSampled: Array.isArray(response.data) ? response.data.length : null,
    outboundEnabled: ENV.assistableOutboundEnabled,
    withinContactWindow: isWithinAssistableContactWindow(),
  };
}

/** Contact payload preview only. No external contact is created without a separate, owner-approved activation path. */
export function buildAssistableContactDryRun(input: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
}) {
  return {
    endpoint: "POST /v3/contacts",
    mode: "dry_run",
    payload: {
      first_name: input.firstName ?? "Chase",
      last_name: input.lastName ?? "",
      email: input.email ?? "",
      phone: input.phone ?? "",
      company_name: input.companyName ?? "Solar Freedom",
      timezone: "America/Denver",
      dnd: true,
    },
    note: "DND=true is intentional for the first connection validation. This code does not call Assistable’s create-contact endpoint yet.",
  };
}

/** Future outbound message operation, guarded by explicit enablement and contact hours. */
export async function sendAssistableMessage(input: { conversationId: string; content: string; channel: "SMS" | "EMAIL" | "WHATSAPP" }) {
  assertOutboundAllowed(input.channel);
  return request<unknown>("/messages", {
    method: "POST",
    body: JSON.stringify({ conversation_id: input.conversationId, content: input.content, channel: input.channel, type: "TEXT" }),
  });
}

/** Future outbound voice operation, guarded by explicit enablement and contact hours. */
export async function placeAssistableCall(input: { assistantId: string; to: string; contactId?: string; from?: string }) {
  assertOutboundAllowed("VOICE");
  return request<unknown>("/calls", {
    method: "POST",
    body: JSON.stringify({ assistant_id: input.assistantId, to: input.to, contact_id: input.contactId, from: input.from }),
  });
}
