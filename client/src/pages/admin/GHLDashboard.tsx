/**
 * GHL Dashboard — Solar Freedom CRM Command Center
 * Live view of GoHighLevel contacts, opportunities, conversations, invoices.
 */

import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  TrendingUp,
  MessageSquare,
  DollarSign,
  RefreshCw,
  Search,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ExternalLink,
  Tag,
  Globe,
} from "lucide-react";
import WebsiteLeadsJourney from "./WebsiteLeadsJourney";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function getContactInitials(firstName?: string, lastName?: string) {
  return `${(firstName ?? "?")[0]}${(lastName ?? "")[0] ?? ""}`.toUpperCase();
}

function getStatusColor(status: string) {
  const s = status.toLowerCase();
  if (s === "open" || s === "active" || s === "sent") return "bg-amber-500/20 text-amber-300 border-amber-500/30";
  if (s === "won" || s === "paid" || s === "succeeded") return "bg-green-500/20 text-green-300 border-green-500/30";
  if (s === "lost" || s === "failed" || s === "cancelled") return "bg-red-500/20 text-red-300 border-red-500/30";
  return "bg-gray-500/20 text-gray-300 border-gray-500/30";
}

// ─── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCards() {
  const { data, isLoading, refetch } = trpc.ghl.dashboardSummary.useQuery(undefined, {
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const cards = [
    {
      label: "Total Contacts",
      value: data?.contactTotal?.toLocaleString() ?? "—",
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Open Opportunities",
      value: data?.oppTotal?.toLocaleString() ?? "—",
      icon: TrendingUp,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Unpaid Invoices",
      value: data ? `${data.unpaidInvoiceCount} (${formatCurrency(data.unpaidInvoiceValue)})` : "—",
      icon: DollarSign,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      label: "Unread Conversations",
      value: data?.unreadConvoCount?.toLocaleString() ?? "—",
      icon: MessageSquare,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <Card key={card.label} className="bg-[#0d0f14] border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs font-mono uppercase tracking-wider">{card.label}</span>
              <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            {isLoading ? (
              <div className="h-7 w-24 bg-white/5 rounded animate-pulse" />
            ) : (
              <div className="text-xl font-bold text-white">{card.value}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Contacts Tab ─────────────────────────────────────────────────────────────

function ContactsTab() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { data, isLoading, refetch } = trpc.ghl.contacts.useQuery(
    { limit: 25, query: debouncedQuery || undefined },
    { staleTime: 2 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedQuery(query);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts by name, email, or phone..."
            className="bg-white/5 border-white/10 text-white placeholder-gray-500"
          />
          <Button type="submit" variant="outline" size="sm" className="border-white/10 text-gray-300">
            <Search className="w-4 h-4" />
          </Button>
        </form>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="border-white/10 text-gray-300">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {(data?.contacts ?? []).map((contact) => (
            <div
              key={contact.id}
              className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 text-sm font-bold flex-shrink-0">
                {getContactInitials(contact.firstName, contact.lastName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white text-sm">
                  {contact.firstName} {contact.lastName}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                  {contact.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {contact.email}
                    </span>
                  )}
                  {contact.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {contact.phone}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 max-w-[200px]">
                {(contact.tags ?? []).slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-gray-300 border border-white/10"
                  >
                    {tag}
                  </span>
                ))}
                {(contact.tags ?? []).length > 3 && (
                  <span className="text-xs text-gray-500">+{(contact.tags ?? []).length - 3}</span>
                )}
              </div>
              <div className="text-xs text-gray-500 flex-shrink-0">{formatDate(contact.dateAdded)}</div>
            </div>
          ))}
          {(data?.contacts ?? []).length === 0 && (
            <div className="text-center py-12 text-gray-500">No contacts found</div>
          )}
        </div>
      )}

      {data && (
        <div className="text-xs text-gray-500 text-center">
          Showing {data.contacts.length} of {data.total?.toLocaleString() ?? data.count?.toLocaleString() ?? "?"} contacts
        </div>
      )}
    </div>
  );
}

// ─── Opportunities Tab ────────────────────────────────────────────────────────

function OpportunitiesTab() {
  const { data: pipelinesData } = trpc.ghl.pipelines.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const [selectedPipeline, setSelectedPipeline] = useState<string>("");

  const { data, isLoading, refetch } = trpc.ghl.opportunities.useQuery(
    { limit: 25, pipelineId: selectedPipeline || undefined, status: "open" },
    { staleTime: 2 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const pipelines = pipelinesData?.pipelines ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={selectedPipeline}
          onChange={(e) => setSelectedPipeline(e.target.value)}
          className="bg-white/5 border border-white/10 text-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50"
        >
          <option value="">All Pipelines</option>
          {pipelines.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="border-white/10 text-gray-300">
          <RefreshCw className="w-4 h-4" />
        </Button>
        <span className="text-xs text-gray-500 ml-auto">
          {data?.meta?.total?.toLocaleString() ?? "?"} open opportunities
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {(data?.opportunities ?? []).map((opp) => {
            const pipeline = pipelines.find((p) => p.id === opp.pipelineId);
            const stage = pipeline?.stages.find((s) => s.id === opp.pipelineStageId);
            return (
              <div
                key={opp.id}
                className="p-4 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm">{opp.name}</div>
                    {opp.contact && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        {opp.contact.name}
                        {opp.contact.phone && ` · ${opp.contact.phone}`}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {pipeline && (
                        <span className="text-xs text-gray-500">{pipeline.name}</span>
                      )}
                      {stage && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {stage.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {opp.monetaryValue != null && opp.monetaryValue > 0 && (
                      <div className="text-green-400 font-bold text-sm">{formatCurrency(opp.monetaryValue)}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">{formatDate(opp.createdAt)}</div>
                  </div>
                </div>
              </div>
            );
          })}
          {(data?.opportunities ?? []).length === 0 && (
            <div className="text-center py-12 text-gray-500">No opportunities found</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Conversations Tab ────────────────────────────────────────────────────────

function ConversationsTab() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const utils = trpc.useUtils();

  const { data, isLoading, refetch } = trpc.ghl.conversations.useQuery(
    { limit: 25 },
    { staleTime: 2 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const markReadMutation = trpc.ghl.markConversationRead.useMutation({
    onSuccess: () => {
      refetch();
      utils.ghl.dashboardSummary.invalidate();
      toast.success("Marked as read");
    },
    onError: () => toast.error("Failed to mark as read"),
  });

  const conversations = (data?.conversations ?? []).filter(
    (c) => !unreadOnly || (c.unreadCount ?? 0) > 0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setUnreadOnly(!unreadOnly)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            unreadOnly
              ? "bg-amber-500/20 border-amber-500/30 text-amber-300"
              : "bg-white/5 border-white/10 text-gray-400"
          }`}
        >
          {unreadOnly ? "Unread Only" : "All Conversations"}
        </button>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="border-white/10 text-gray-300 ml-auto">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((convo) => (
            <div
              key={convo.id}
              className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                (convo.unreadCount ?? 0) > 0
                  ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/30"
                  : "bg-white/5 border-white/5 hover:border-white/10"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-gray-300 text-sm font-bold flex-shrink-0">
                {convo.contact
                  ? getContactInitials(convo.contact.name?.split(" ")[0], convo.contact.name?.split(" ")[1])
                  : "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white text-sm">{convo.contact?.name ?? "Unknown"}</span>
                  {(convo.unreadCount ?? 0) > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500 text-black font-bold">
                      {convo.unreadCount}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400 truncate mt-0.5">{convo.lastMessageBody ?? "No messages"}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-xs text-gray-500">{formatDateTime(convo.lastMessageDate)}</div>
                {(convo.unreadCount ?? 0) > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markReadMutation.mutate({ conversationId: convo.id });
                    }}
                    disabled={markReadMutation.isPending}
                    title="Mark as read"
                    className="text-xs px-2 py-1 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                  >
                    ✓ Read
                  </button>
                )}
              </div>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {unreadOnly ? "No unread conversations" : "No conversations found"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Invoices Tab ─────────────────────────────────────────────────────────────

function InvoicesTab() {
  const [statusFilter, setStatusFilter] = useState("sent");

  const { data, isLoading, refetch } = trpc.ghl.invoices.useQuery(
    { limit: 50, status: statusFilter || undefined },
    { staleTime: 2 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const invoices = data?.invoices ?? [];
  const totalValue = invoices.reduce((sum, inv) => sum + (inv.total ?? 0), 0);
  const unpaidValue = invoices
    .filter((inv) => inv.status === "sent" || inv.status === "pending")
    .reduce((sum, inv) => sum + (inv.total ?? 0) - (inv.amountPaid ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 text-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50"
        >
          <option value="">All Statuses</option>
          <option value="sent">Sent (Unpaid)</option>
          <option value="paid">Paid</option>
          <option value="draft">Draft</option>
        </select>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="border-white/10 text-gray-300">
          <RefreshCw className="w-4 h-4" />
        </Button>
        {invoices.length > 0 && (
          <div className="ml-auto text-right">
            <div className="text-xs text-gray-400">
              {invoices.length} invoices · Total: <span className="text-white font-medium">{formatCurrency(totalValue)}</span>
            </div>
            {unpaidValue > 0 && (
              <div className="text-xs text-amber-400">
                Unpaid: {formatCurrency(unpaidValue)}
              </div>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => {
            const isPastDue = inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status !== "paid";
            return (
              <div
                key={inv.id}
                className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                  isPastDue
                    ? "bg-red-500/5 border-red-500/20"
                    : "bg-white/5 border-white/5 hover:border-white/10"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{inv.name ?? `Invoice #${inv.number}`}</span>
                    {isPastDue && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                        PAST DUE
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {inv.contact?.name ?? "Unknown contact"}
                    {inv.dueDate && ` · Due ${formatDate(inv.dueDate)}`}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-white">{formatCurrency(inv.total)}</div>
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${getStatusColor(inv.status)}`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            );
          })}
          {invoices.length === 0 && (
            <div className="text-center py-12 text-gray-500">No invoices found</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Money Watch Panel ────────────────────────────────────────────────────────

function MoneyWatchPanel() {
  const { data, isLoading } = trpc.ghl.dashboardSummary.useQuery(undefined, {
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return (
    <Card className="bg-[#0d0f14] border-amber-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Money Watch
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-white/5 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <div>
                <div className="text-xs text-gray-400">Unpaid Invoices</div>
                <div className="text-lg font-bold text-amber-300">{formatCurrency(data?.unpaidInvoiceValue ?? 0)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">{data?.unpaidInvoiceCount ?? 0} invoices</div>
                <AlertCircle className="w-5 h-5 text-amber-400 ml-auto mt-1" />
              </div>
            </div>

            <div className="text-xs font-mono uppercase tracking-wider text-gray-500 pt-1">Recent Unpaid</div>
            {(data?.recentInvoices ?? []).slice(0, 5).map((inv) => (
              <div key={inv.id} className="flex items-center justify-between text-sm">
                <div className="text-gray-300 truncate flex-1">{inv.contact?.name ?? inv.name ?? "Unknown"}</div>
                <div className="text-amber-300 font-medium ml-2">{formatCurrency(inv.total)}</div>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Recent Conversations Panel ───────────────────────────────────────────────

function RecentConvosPanel() {
  const { data, isLoading } = trpc.ghl.dashboardSummary.useQuery(undefined, {
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return (
    <Card className="bg-[#0d0f14] border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono uppercase tracking-wider text-purple-400 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Recent Conversations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-white/5 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          (data?.recentConvos ?? []).slice(0, 6).map((convo) => (
            <div key={convo.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-gray-300 flex-shrink-0">
                {convo.contact ? getContactInitials(convo.contact.name?.split(" ")[0], convo.contact.name?.split(" ")[1]) : "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white flex items-center gap-1">
                  {convo.contact?.name ?? "Unknown"}
                  {(convo.unreadCount ?? 0) > 0 && (
                    <span className="text-xs px-1 rounded-full bg-amber-500 text-black font-bold">{convo.unreadCount}</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 truncate">{convo.lastMessageBody ?? "—"}</div>
              </div>
            </div>
          ))
        )}
        {!isLoading && (data?.recentConvos ?? []).length === 0 && (
          <div className="text-center py-6 text-gray-500 text-sm">No recent conversations</div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GHLDashboard() {
  const { data: locationData } = trpc.ghl.locationInfo.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return (
    <AdminLayout title="GHL Dashboard" subtitle="GoHighLevel CRM — Solar Freedom">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">CRM Command Center</h1>
            <p className="text-gray-400 text-sm mt-1">
              {locationData?.location?.name ?? "Solar Freedom"} · Live GoHighLevel data
            </p>
          </div>
          <a
            href="https://app.gohighlevel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-amber-400 transition-colors"
          >
            Open GHL <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Summary Cards */}
        <SummaryCards />

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Tabs */}
          <div className="xl:col-span-2">
            <Tabs defaultValue="contacts" className="w-full">
              <TabsList className="bg-white/5 border border-white/10 mb-4">
                <TabsTrigger value="contacts" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
                  <Users className="w-4 h-4 mr-1.5" /> Contacts
                </TabsTrigger>
                <TabsTrigger value="opportunities" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
                  <TrendingUp className="w-4 h-4 mr-1.5" /> Opportunities
                </TabsTrigger>
                <TabsTrigger value="conversations" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
                  <MessageSquare className="w-4 h-4 mr-1.5" /> Conversations
                </TabsTrigger>
                <TabsTrigger value="invoices" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
                  <DollarSign className="w-4 h-4 mr-1.5" /> Invoices
                </TabsTrigger>
                <TabsTrigger value="website-leads" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
                  <Globe className="w-4 h-4 mr-1.5" /> Website Leads
                </TabsTrigger>
              </TabsList>

              <TabsContent value="contacts">
                <ContactsTab />
              </TabsContent>
              <TabsContent value="opportunities">
                <OpportunitiesTab />
              </TabsContent>
              <TabsContent value="conversations">
                <ConversationsTab />
              </TabsContent>
              <TabsContent value="invoices">
                <InvoicesTab />
              </TabsContent>
              <TabsContent value="website-leads">
                <WebsiteLeadsJourney />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Panels */}
          <div className="space-y-4">
            <MoneyWatchPanel />
            <RecentConvosPanel />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
