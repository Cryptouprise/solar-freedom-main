/**
 * GHL (GoHighLevel) tRPC Router
 * Admin-only procedures for reading and writing CRM data.
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  getContacts,
  getContact,
  updateContact,
  getOpportunities,
  updateOpportunity,
  getPipelines,
  getConversations,
  sendMessage,
  getInvoices,
  getAppointments,
  getLocationInfo,
  markConversationRead,
} from "./ghlClient";

function requireAdmin(role: string) {
  if (role !== "admin") throw new Error("Forbidden");
}

export const ghlRouter = router({
  /**
   * Get location info (sub-account details).
   */
  locationInfo: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    return getLocationInfo();
  }),

  /**
   * Get contacts with optional search and pagination.
   */
  contacts: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(25),
        startAfter: z.string().optional(),
        query: z.string().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(["asc", "desc"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      return getContacts(input);
    }),

  /**
   * Get a single contact by ID.
   */
  contact: protectedProcedure
    .input(z.object({ contactId: z.string() }))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      return getContact(input.contactId);
    }),

  /**
   * Update a contact's tags or fields.
   */
  updateContact: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        tags: z.array(z.string()).optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const { contactId, ...data } = input;
      return updateContact(contactId, data);
    }),

  /**
   * Get opportunities with optional pipeline/stage filter.
   */
  opportunities: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(25),
        startAfter: z.string().optional(),
        pipelineId: z.string().optional(),
        stageId: z.string().optional(),
        status: z.string().optional(),
        query: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      return getOpportunities(input);
    }),

  /**
   * Update an opportunity's pipeline stage or status.
   */
  updateOpportunity: protectedProcedure
    .input(
      z.object({
        opportunityId: z.string(),
        pipelineStageId: z.string().optional(),
        status: z.string().optional(),
        monetaryValue: z.number().optional(),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const { opportunityId, ...data } = input;
      return updateOpportunity(opportunityId, data);
    }),

  /**
   * Get all pipelines with their stages.
   */
  pipelines: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    return getPipelines();
  }),

  /**
   * Mark a conversation as read.
   */
  markConversationRead: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      return markConversationRead(input.conversationId);
    }),

  /**
   * Get conversations with optional filter.
   */
  conversations: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(25),
        startAfterDate: z.string().optional(),
        status: z.string().optional(),
        unreadOnly: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      return getConversations(input);
    }),

  /**
   * Send a message to a contact.
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        type: z.enum(["SMS", "Email"]),
        message: z.string().min(1).max(1600),
        subject: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      return sendMessage(input);
    }),

  /**
   * Get invoices with optional status filter.
   */
  invoices: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(25),
        offset: z.number().default(0),
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      return getInvoices(input);
    }),

  /**
   * Get upcoming appointments.
   */
  appointments: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().min(1).max(100).default(25),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      return getAppointments(input);
    }),

  /**
   * Dashboard summary — contacts count, open opps, unpaid invoices, unread convos.
   */
  dashboardSummary: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const [contacts, opps, invoices, convos] = await Promise.allSettled([
      getContacts({ limit: 1 }),
      getOpportunities({ limit: 1, status: "open" }),
      getInvoices({ limit: 100, status: "sent" }),
      getConversations({ limit: 100 }),
    ]);

    const contactTotal = contacts.status === "fulfilled" ? contacts.value.total ?? contacts.value.count ?? 0 : 0;
    const oppTotal = opps.status === "fulfilled" ? opps.value.meta?.total ?? 0 : 0;

    let unpaidInvoiceCount = 0;
    let unpaidInvoiceValue = 0;
    let recentInvoices: Array<{ id: string; name?: string; contact?: { id: string; name: string }; total: number; status: string; dueDate?: string }> = [];
    if (invoices.status === "fulfilled") {
      const all = invoices.value.invoices ?? [];
      const unpaid = all.filter((inv) => inv.status === "sent" || inv.status === "pending");
      unpaidInvoiceCount = unpaid.length;
      unpaidInvoiceValue = unpaid.reduce((sum, inv) => sum + (inv.total ?? 0), 0);
      recentInvoices = all.slice(0, 10).map((inv) => ({
        id: inv.id,
        name: inv.name,
        contact: inv.contact,
        total: inv.total,
        status: inv.status,
        dueDate: inv.dueDate,
      }));
    }

    let unreadConvoCount = 0;
    let recentConvos: Array<{ id: string; contact?: { id: string; name: string }; lastMessageBody?: string; lastMessageDate?: string; unreadCount?: number }> = [];
    if (convos.status === "fulfilled") {
      const all = convos.value.conversations ?? [];
      unreadConvoCount = all.filter((c) => (c.unreadCount ?? 0) > 0).length;
      recentConvos = all.slice(0, 10).map((c) => ({
        id: c.id,
        contact: c.contact,
        lastMessageBody: c.lastMessageBody,
        lastMessageDate: c.lastMessageDate,
        unreadCount: c.unreadCount,
      }));
    }

    return {
      contactTotal,
      oppTotal,
      unpaidInvoiceCount,
      unpaidInvoiceValue,
      unreadConvoCount,
      recentInvoices,
      recentConvos,
    };
  }),
});
