/**
 * GHL (GoHighLevel) API Client
 * Solar Freedom sub-account — Location ID: WBEbDUNxKL5GyxIUjjdZ
 * Uses the private integration token (pit-*) stored in the ghlapi env var.
 */

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";
export const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID ?? "WBEbDUNxKL5GyxIUjjdZ";

function getGhlHeaders() {
  const apiKey = process.env.ghlapi;
  if (!apiKey) throw new Error("GHL API key (ghlapi) not configured");
  return {
    Authorization: `Bearer ${apiKey}`,
    Version: GHL_VERSION,
    "Content-Type": "application/json",
  };
}

async function ghlFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${GHL_API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...getGhlHeaders(), ...(options.headers ?? {}) },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GHL API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GhlContact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  source?: string;
  dateAdded?: string;
  lastActivity?: string;
  address1?: string;
  city?: string;
  state?: string;
  country?: string;
  companyName?: string;
  customFields?: Array<{ id: string; value: string }>;
  opportunities?: Array<{ id: string; name: string; status: string; pipelineId: string; pipelineStageId: string }>;
}

export interface GhlContactsResponse {
  contacts: GhlContact[];
  count: number;
  total: number;
}

export interface GhlOpportunity {
  id: string;
  name: string;
  monetaryValue?: number;
  pipelineId: string;
  pipelineStageId: string;
  status: string;
  assignedTo?: string;
  contact?: { id: string; name: string; email?: string; phone?: string };
  source?: string;
  createdAt?: string;
  updatedAt?: string;
  customFields?: Array<{ id: string; value: string }>;
}

export interface GhlOpportunitiesResponse {
  opportunities: GhlOpportunity[];
  meta: { total: number; currentPage: number; nextPage: number | null; prevPage: number | null };
}

export interface GhlPipeline {
  id: string;
  name: string;
  stages: Array<{ id: string; name: string; position: number }>;
}

export interface GhlConversation {
  id: string;
  contactId: string;
  locationId: string;
  lastMessageBody?: string;
  lastMessageDate?: string;
  lastMessageType?: string;
  lastMessageDirection?: string;
  unreadCount?: number;
  type?: string;
  contact?: { id: string; name: string; email?: string; phone?: string };
}

export interface GhlConversationsResponse {
  conversations: GhlConversation[];
  total: number;
}

export interface GhlInvoice {
  id: string;
  number?: string;
  name?: string;
  status: string;
  total: number;
  amountPaid?: number;
  dueDate?: string;
  issueDate?: string;
  contact?: { id: string; name: string; email?: string };
}

export interface GhlInvoicesResponse {
  invoices: GhlInvoice[];
  total: number;
}

export interface GhlAppointment {
  id: string;
  title?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  contactId?: string;
  contact?: { id: string; name: string; email?: string; phone?: string };
  notes?: string;
  calendarId?: string;
  assignedUserId?: string;
}

// ─── API Methods ──────────────────────────────────────────────────────────────

/**
 * Fetch contacts with optional search and pagination.
 */
export async function getContacts(opts: {
  limit?: number;
  startAfter?: string;
  query?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
} = {}): Promise<GhlContactsResponse> {
  const params = new URLSearchParams({
    locationId: GHL_LOCATION_ID,
    limit: String(opts.limit ?? 25),
    ...(opts.startAfter ? { startAfter: opts.startAfter } : {}),
    ...(opts.query ? { query: opts.query } : {}),
    ...(opts.sortBy ? { sortBy: opts.sortBy } : {}),
    ...(opts.sortOrder ? { sortOrder: opts.sortOrder } : {}),
  });
  return ghlFetch<GhlContactsResponse>(`/contacts/?${params}`);
}

/**
 * Get a single contact by ID.
 */
export async function getContact(contactId: string): Promise<{ contact: GhlContact }> {
  return ghlFetch<{ contact: GhlContact }>(`/contacts/${contactId}`);
}

/**
 * Update a contact (tags, custom fields, etc.).
 */
export async function updateContact(contactId: string, data: Partial<GhlContact>): Promise<{ contact: GhlContact }> {
  return ghlFetch<{ contact: GhlContact }>(`/contacts/${contactId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Fetch opportunities with optional pipeline/stage filter.
 */
export async function getOpportunities(opts: {
  limit?: number;
  startAfter?: string;
  pipelineId?: string;
  stageId?: string;
  status?: string;
  query?: string;
} = {}): Promise<GhlOpportunitiesResponse> {
  const params = new URLSearchParams({
    location_id: GHL_LOCATION_ID,
    limit: String(opts.limit ?? 25),
    ...(opts.startAfter ? { startAfterId: opts.startAfter } : {}),
    ...(opts.pipelineId ? { pipeline_id: opts.pipelineId } : {}),
    ...(opts.stageId ? { pipeline_stage_id: opts.stageId } : {}),
    ...(opts.status ? { status: opts.status } : {}),
    ...(opts.query ? { q: opts.query } : {}),
  });
  return ghlFetch<GhlOpportunitiesResponse>(`/opportunities/search?${params}`);
}

/**
 * Update an opportunity (pipeline stage, status, value, etc.).
 */
export async function updateOpportunity(
  opportunityId: string,
  data: { pipelineStageId?: string; status?: string; monetaryValue?: number; name?: string }
): Promise<{ opportunity: GhlOpportunity }> {
  return ghlFetch<{ opportunity: GhlOpportunity }>(`/opportunities/${opportunityId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Fetch all pipelines for the location.
 */
export async function getPipelines(): Promise<{ pipelines: GhlPipeline[] }> {
  return ghlFetch<{ pipelines: GhlPipeline[] }>(`/opportunities/pipelines?locationId=${GHL_LOCATION_ID}`);
}

/**
 * Fetch conversations with optional filter.
 */
export async function getConversations(opts: {
  limit?: number;
  startAfterDate?: string;
  status?: string;
  unreadOnly?: boolean;
} = {}): Promise<GhlConversationsResponse> {
  const params = new URLSearchParams({
    locationId: GHL_LOCATION_ID,
    limit: String(opts.limit ?? 25),
    ...(opts.startAfterDate ? { startAfterDate: opts.startAfterDate } : {}),
    ...(opts.status ? { status: opts.status } : {}),
  });
  return ghlFetch<GhlConversationsResponse>(`/conversations/search?${params}`);
}

/**
 * Send a message to a contact via SMS or Email.
 */
export async function sendMessage(opts: {
  contactId: string;
  type: "SMS" | "Email";
  message: string;
  subject?: string;
}): Promise<{ conversationId: string; messageId: string }> {
  return ghlFetch<{ conversationId: string; messageId: string }>(`/conversations/messages`, {
    method: "POST",
    body: JSON.stringify({
      type: opts.type,
      contactId: opts.contactId,
      locationId: GHL_LOCATION_ID,
      message: opts.message,
      ...(opts.subject ? { subject: opts.subject } : {}),
    }),
  });
}

/**
 * Fetch invoices for the location.
 */
export async function getInvoices(opts: {
  limit?: number;
  offset?: number;
  status?: string;
} = {}): Promise<GhlInvoicesResponse> {
  const params = new URLSearchParams({
    locationId: GHL_LOCATION_ID,
    limit: String(opts.limit ?? 25),
    offset: String(opts.offset ?? 0),
    ...(opts.status ? { status: opts.status } : {}),
  });
  return ghlFetch<GhlInvoicesResponse>(`/invoices/?${params}`);
}

/**
 * Fetch upcoming appointments.
 */
export async function getAppointments(opts: {
  startDate?: string;
  endDate?: string;
  limit?: number;
} = {}): Promise<{ appointments: GhlAppointment[] }> {
  const params = new URLSearchParams({
    locationId: GHL_LOCATION_ID,
    limit: String(opts.limit ?? 25),
    ...(opts.startDate ? { startDate: opts.startDate } : {}),
    ...(opts.endDate ? { endDate: opts.endDate } : {}),
  });
  return ghlFetch<{ appointments: GhlAppointment[] }>(`/calendars/events?${params}`);
}

/**
 * Get location info (sub-account details).
 */
export async function getLocationInfo(): Promise<{ location: { id: string; name: string; email?: string; phone?: string; address?: string } }> {
  return ghlFetch<{ location: { id: string; name: string; email?: string; phone?: string; address?: string } }>(`/locations/${GHL_LOCATION_ID}`);
}

/**
 * Mark a conversation as read (clear unread count).
 */
export async function markConversationRead(conversationId: string): Promise<{ success: boolean }> {
  try {
    await ghlFetch<unknown>(`/conversations/${conversationId}/read`, {
      method: "PUT",
      body: JSON.stringify({ markAsRead: true }),
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}
