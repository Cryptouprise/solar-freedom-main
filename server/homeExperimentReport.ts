import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "./db";
import { ghlPipelineEvents, leadJourneyEvents, leads } from "../drizzle/schema";
import { HOME_EXPERIMENT, HOME_FORM_VARIANTS, isHomeFormVariant } from "../shared/homeExperiment";

type ExperimentLead = { id: number; formName: string | null; createdAt: Date };
type Exposure = { sessionId: string; detail: string | null; createdAt: Date };
type ContactLink = { leadId: number | null; detail: string | null };
type Lifecycle = { ghlContactId: string; eventType: string; stageName: string | null; occurredAt: Date };

function parseDetail(value: string | null): Record<string, unknown> {
  try { return JSON.parse(value ?? "{}") ?? {}; } catch { return {}; }
}

export function calculateHomeExperiment(
  leadRows: ExperimentLead[], exposures: Exposure[], links: ContactLink[], events: Lifecycle[],
) {
  const rows = HOME_FORM_VARIANTS.map(formName => ({
    formName, exposedSessions: 0, leads: 0, linkedLeads: 0, qualified: 0, booked: 0, closedWon: 0, closedLost: 0,
  }));
  const byVariant = new Map(rows.map(row => [row.formName, row]));
  const seenSessions = new Set<string>();
  for (const exposure of [...exposures].sort((a, b) => +a.createdAt - +b.createdAt)) {
    const detail = parseDetail(exposure.detail);
    if (detail.experimentId !== HOME_EXPERIMENT || !isHomeFormVariant(detail.formName) || seenSessions.has(exposure.sessionId)) continue;
    seenSessions.add(exposure.sessionId);
    byVariant.get(detail.formName)!.exposedSessions++;
  }
  const leadById = new Map(leadRows.filter(lead => isHomeFormVariant(lead.formName)).map(lead => [lead.id, lead]));
  for (const lead of Array.from(leadById.values())) byVariant.get(lead.formName as typeof HOME_FORM_VARIANTS[number])!.leads++;
  const contactByLead = new Map<number, string>();
  const conflictingLeads = new Set<number>();
  for (const link of links) {
    const contactId = parseDetail(link.detail).ghlContactId;
    if (!link.leadId || !leadById.has(link.leadId) || typeof contactId !== "string" || !contactId) continue;
    const previous = contactByLead.get(link.leadId);
    if (previous && previous !== contactId) conflictingLeads.add(link.leadId);
    contactByLead.set(link.leadId, contactId);
  }
  // Credit each CRM contact only to its earliest linked experiment lead.
  const originalByContact = new Map<string, ExperimentLead>();
  for (const lead of Array.from(leadById.values()).sort((a, b) => +a.createdAt - +b.createdAt || a.id - b.id)) {
    const contactId = contactByLead.get(lead.id);
    if (!contactId || conflictingLeads.has(lead.id)) continue;
    byVariant.get(lead.formName as typeof HOME_FORM_VARIANTS[number])!.linkedLeads++;
    if (!originalByContact.has(contactId)) originalByContact.set(contactId, lead);
  }
  const counted = new Set<string>();
  for (const event of events) {
    const lead = originalByContact.get(event.ghlContactId);
    if (!lead || +event.occurredAt < +lead.createdAt) continue;
    const metric = event.eventType === "qualified" || (event.eventType === "stage_change" && event.stageName?.trim().toLowerCase() === "qualified")
      ? "qualified" : event.eventType === "appointment_booked" ? "booked"
      : event.eventType === "won" ? "closedWon" : event.eventType === "lost" ? "closedLost" : null;
    if (!metric || counted.has(`${event.ghlContactId}:${metric}`)) continue;
    counted.add(`${event.ghlContactId}:${metric}`);
    byVariant.get(lead.formName as typeof HOME_FORM_VARIANTS[number])![metric]++;
  }
  return {
    experimentId: HOME_EXPERIMENT,
    winner: null,
    rows: rows.map(row => ({
      ...row,
      qualifiedRate: row.leads ? row.qualified / row.leads : null,
      bookedRate: row.leads ? row.booked / row.leads : null,
      closedWonRate: row.leads ? row.closedWon / row.leads : null,
    })),
  };
}

export async function getHomeExperimentReport() {
  const db = await getDb();
  if (!db) return null;
  const leadRows = await db.select({ id: leads.id, formName: leads.formName, createdAt: leads.createdAt })
    .from(leads).where(inArray(leads.formName, [...HOME_FORM_VARIANTS]));
  const exposures = await db.select({ sessionId: leadJourneyEvents.sessionId, detail: leadJourneyEvents.detail, createdAt: leadJourneyEvents.createdAt })
    .from(leadJourneyEvents).where(eq(leadJourneyEvents.eventType, "experiment_exposure"));
  const links = leadRows.length ? await db.select({ leadId: leadJourneyEvents.leadId, detail: leadJourneyEvents.detail })
    .from(leadJourneyEvents).where(and(eq(leadJourneyEvents.eventType, "crm_contact_link"), inArray(leadJourneyEvents.leadId, leadRows.map(lead => lead.id)))) : [];
  const contactIds = Array.from(new Set(links.map(link => parseDetail(link.detail).ghlContactId).filter((id): id is string => typeof id === "string")));
  const events = contactIds.length ? await db.select({
    ghlContactId: ghlPipelineEvents.ghlContactId, eventType: ghlPipelineEvents.eventType,
    stageName: ghlPipelineEvents.stageName, occurredAt: ghlPipelineEvents.occurredAt,
  }).from(ghlPipelineEvents).where(inArray(ghlPipelineEvents.ghlContactId, contactIds)) : [];
  return calculateHomeExperiment(leadRows, exposures, links, events);
}

export class UnknownWebsiteLeadError extends Error {
  constructor() {
    super("Unknown website lead ID");
    this.name = "UnknownWebsiteLeadError";
  }
}

/** An authenticated CRM receipt is independent of mutable browser session-to-lead links. */
export async function recordCrmContactLink(leadId: number, ghlContactId: string) {
  const db = await getDb();
  if (!db) throw new Error("CRM attribution storage unavailable");
  const [lead] = await db.select({ id: leads.id }).from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!lead) throw new UnknownWebsiteLeadError();
  const detail = JSON.stringify({ ghlContactId });
  const [existing] = await db.select({ id: leadJourneyEvents.id }).from(leadJourneyEvents)
    .where(and(eq(leadJourneyEvents.leadId, leadId), eq(leadJourneyEvents.eventType, "crm_contact_link"), eq(leadJourneyEvents.detail, detail))).limit(1);
  if (!existing) await db.insert(leadJourneyEvents).values({
    leadId, sessionId: `sf_lead_${leadId}`, eventType: "crm_contact_link", page: "/api/ghl/lifecycle", detail,
  });
}

export async function getCrmDeliveryHealth() {
  const db = await getDb();
  if (!db) return null;
  const [summary] = await db.select({ pending: sql<number>`count(*)`, oldestAt: sql<Date | null>`min(${leads.createdAt})` })
    .from(leads).where(eq(leads.ghlWebhookSent, 0));
  const pending = await db.select({ id: leads.id, formName: leads.formName, createdAt: leads.createdAt })
    .from(leads).where(eq(leads.ghlWebhookSent, 0)).orderBy(asc(leads.createdAt)).limit(25);
  return { pendingCount: Number(summary.pending), oldestAt: summary.oldestAt, pending, webhookConfigured: Boolean(process.env.GHL_WEBHOOK_URL) };
}
