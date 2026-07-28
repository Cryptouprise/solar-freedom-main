/**
 * Website Leads Journey — Full customer journey view for website-sourced leads.
 *
 * Shows every lead that came through breakyoursolarcontract.com with:
 * - Pages visited before submitting
 * - Time on site, scroll depth, device type, UTM source
 * - Form submission details
 * - GHL pipeline progression (stage changes, who closed, time to close)
 * - Invoice / payment status and time to payment
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Monitor, Smartphone, Tablet,
  Globe, Clock, MousePointer, FileText,
  TrendingUp, CheckCircle2, DollarSign, AlertCircle,
  ChevronRight, Eye, ArrowRight, Phone, Mail,
  BarChart3, Users, Zap, Flame,
} from "lucide-react";

// ─── High Intent Detection ───────────────────────────────────────────────────

const HIGH_INTENT_TIME_MS = 5 * 60 * 1000; // 5 minutes
const HIGH_INTENT_CTA_CLICKS = 2;           // 2+ CTA clicks

function isHighIntent(session: { totalTimeMs?: number | null; ctaClickCount?: number | null }): boolean {
  return (
    (session.totalTimeMs ?? 0) >= HIGH_INTENT_TIME_MS ||
    (session.ctaClickCount ?? 0) >= HIGH_INTENT_CTA_CLICKS
  );
}

function HighIntentBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border bg-amber-500/20 text-amber-300 border-amber-500/40">
      <Flame className="w-3 h-3" />
      High Intent
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMs(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  const mins = Math.floor(ms / 60_000);
  const secs = Math.round((ms % 60_000) / 1000);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function daysBetween(a: string | Date | null | undefined, b: string | Date | null | undefined): number | null {
  if (!a || !b) return null;
  const diff = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(diff / 86_400_000);
}

function DeviceIcon({ type }: { type: string | null | undefined }) {
  if (type === "mobile") return <Smartphone className="w-3.5 h-3.5" />;
  if (type === "tablet") return <Tablet className="w-3.5 h-3.5" />;
  return <Monitor className="w-3.5 h-3.5" />;
}

function EventIcon({ type }: { type: string }) {
  switch (type) {
    case "pageview": return <Eye className="w-3.5 h-3.5 text-blue-400" />;
    case "page_exit": return <ArrowRight className="w-3.5 h-3.5 text-gray-400" />;
    case "form_start": return <FileText className="w-3.5 h-3.5 text-amber-400" />;
    case "form_submit": return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />;
    case "click_cta": return <MousePointer className="w-3.5 h-3.5 text-purple-400" />;
    case "exit_intent": return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
    default: return <Zap className="w-3.5 h-3.5 text-gray-400" />;
  }
}

function StageBadge({ stage }: { stage: string }) {
  const colors: Record<string, string> = {
    "New Lead": "bg-blue-500/20 text-blue-300 border-blue-500/30",
    "Appointment Set": "bg-amber-500/20 text-amber-300 border-amber-500/30",
    "Qualified": "bg-purple-500/20 text-purple-300 border-purple-500/30",
    "Proposal Sent": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    "Closed Won": "bg-green-500/20 text-green-300 border-green-500/30",
    "Closed Lost": "bg-red-500/20 text-red-300 border-red-500/30",
  };
  const cls = colors[stage] ?? "bg-gray-500/20 text-gray-300 border-gray-500/30";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {stage}
    </span>
  );
}

// ─── Journey Detail Modal ─────────────────────────────────────────────────────

function JourneyModal({ leadId, onClose }: { leadId: number; onClose: () => void }) {
  const { data, isLoading } = trpc.journey.leadJourney.useQuery({ leadId });

  if (isLoading) {
    return (
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-[#0D0F14] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Loading journey...</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DialogContent>
    );
  }

  if (!data) return null;

  const { session, journeyEvents, pipelineEvents, lead } = data;

  // Build unified timeline
  type TimelineItem = {
    time: Date;
    type: "web" | "pipeline" | "payment";
    label: string;
    detail?: string;
    icon: React.ReactNode;
  };

  const timeline: TimelineItem[] = [];

  // Web events
  for (const ev of journeyEvents) {
    const label = ev.eventType === "pageview"
      ? `Viewed ${ev.page}`
      : ev.eventType === "page_exit"
      ? `Left ${ev.page} after ${formatMs(ev.timeOnPageMs ?? 0)} (${ev.scrollDepthPct ?? 0}% scroll)`
      : ev.eventType === "form_start"
      ? "Started filling out form"
      : ev.eventType === "form_submit"
      ? "Submitted case review form"
      : ev.eventType === "click_cta"
      ? `Clicked CTA${ev.detail ? ` — ${JSON.parse(ev.detail).ctaLabel}` : ""}`
      : ev.eventType === "exit_intent"
      ? "Triggered exit intent popup"
      : ev.eventType;

    timeline.push({
      time: new Date(ev.createdAt),
      type: "web",
      label,
      icon: <EventIcon type={ev.eventType} />,
    });
  }

  // Pipeline events
  for (const ev of pipelineEvents) {
    const label = ev.eventType === "stage_change"
      ? `Pipeline: moved to "${ev.stageName}"`
      : ev.eventType === "won"
      ? `Deal WON — ${ev.stageName}`
      : ev.eventType === "lost"
      ? `Deal LOST`
      : ev.eventType === "assigned"
      ? `Assigned to ${ev.assignedTo ?? "team member"}`
      : ev.eventType === "payment_received"
      ? `Payment received — $${Number(ev.monetaryValue ?? 0).toLocaleString()}`
      : `${ev.eventType}: ${ev.stageName ?? ""}`;

    timeline.push({
      time: new Date(ev.occurredAt),
      type: ev.eventType === "payment_received" ? "payment" : "pipeline",
      label,
      detail: ev.performedBy ? `by ${ev.performedBy}` : undefined,
      icon: ev.eventType === "payment_received"
        ? <DollarSign className="w-3.5 h-3.5 text-green-400" />
        : ev.eventType === "won"
        ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
        : <TrendingUp className="w-3.5 h-3.5 text-amber-400" />,
    });
  }

  // Sort by time
  timeline.sort((a, b) => a.time.getTime() - b.time.getTime());

  // Metrics
  const submitEvent = journeyEvents.find(e => e.eventType === "form_submit");
  const wonEvent = pipelineEvents.find(e => e.eventType === "won");
  const paymentEvent = pipelineEvents.find(e => e.eventType === "payment_received");
  const daysToClose = daysBetween(submitEvent?.createdAt, wonEvent?.occurredAt);
  const daysToPayment = daysBetween(wonEvent?.occurredAt ?? submitEvent?.createdAt, paymentEvent?.occurredAt);
  const pageViews = journeyEvents.filter(e => e.eventType === "pageview");
  const uniquePages = new Set(pageViews.map(e => e.page)).size;

  return (
    <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-[#0D0F14] border-white/10 text-white">
      <DialogHeader>
        <DialogTitle className="text-white font-display text-2xl">
          {lead ? `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim() || "Unknown Lead" : "Lead Journey"}
        </DialogTitle>
        {lead && (
          <div className="flex items-center gap-3 mt-1">
            {lead.phone && (
              <span className="flex items-center gap-1 text-gray-400 text-sm">
                <Phone className="w-3.5 h-3.5" /> {lead.phone}
              </span>
            )}
            {lead.email && (
              <span className="flex items-center gap-1 text-gray-400 text-sm">
                <Mail className="w-3.5 h-3.5" /> {lead.email}
              </span>
            )}
          </div>
        )}
      </DialogHeader>

      {/* Metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-gray-400 text-xs mb-1">Time on Site</div>
          <div className="text-white font-bold">{formatMs(session?.totalTimeMs ?? 0)}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-gray-400 text-xs mb-1">Pages Visited</div>
          <div className="text-white font-bold">{uniquePages}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-gray-400 text-xs mb-1">Days to Close</div>
          <div className={`font-bold ${daysToClose != null ? "text-amber-400" : "text-gray-500"}`}>
            {daysToClose != null ? `${daysToClose}d` : "—"}
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-gray-400 text-xs mb-1">Days to Payment</div>
          <div className={`font-bold ${daysToPayment != null ? "text-green-400" : "text-gray-500"}`}>
            {daysToPayment != null ? `${daysToPayment}d` : "—"}
          </div>
        </div>
      </div>

      {/* Session metadata */}
      {session && (
        <div className="flex flex-wrap gap-2 mt-3">
          {session.utmSource && (
            <Badge variant="outline" className="border-blue-500/30 text-blue-300 bg-blue-500/10 text-xs">
              Source: {session.utmSource}
            </Badge>
          )}
          {session.utmMedium && (
            <Badge variant="outline" className="border-purple-500/30 text-purple-300 bg-purple-500/10 text-xs">
              Medium: {session.utmMedium}
            </Badge>
          )}
          {session.utmCampaign && (
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-300 bg-cyan-500/10 text-xs">
              Campaign: {session.utmCampaign}
            </Badge>
          )}
          {session.referrer && (
            <Badge variant="outline" className="border-gray-500/30 text-gray-300 bg-gray-500/10 text-xs">
              Ref: {new URL(session.referrer).hostname}
            </Badge>
          )}
          <Badge variant="outline" className="border-white/20 text-gray-300 bg-white/5 text-xs">
            <DeviceIcon type={session.deviceType} />
            <span className="ml-1 capitalize">{session.deviceType ?? "desktop"}</span>
          </Badge>
        </div>
      )}

      {/* Timeline */}
      <div className="mt-4">
        <h3 className="text-gray-400 text-xs font-mono uppercase tracking-wider mb-3">Full Journey Timeline</h3>
        {timeline.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No journey events recorded yet. Events will appear as the lead browses the site.
          </div>
        ) : (
          <div className="space-y-1">
            {timeline.map((item, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm truncate">{item.label}</div>
                  {item.detail && <div className="text-gray-500 text-xs">{item.detail}</div>}
                </div>
                <div className="flex-shrink-0 text-gray-500 text-xs whitespace-nowrap">
                  {formatDateTime(item.time)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lead form data */}
      {lead && (
        <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
          <h3 className="text-gray-400 text-xs font-mono uppercase tracking-wider mb-2">Form Submission Data</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {lead.solarCompany && <><span className="text-gray-400">Company</span><span className="text-white">{lead.solarCompany}</span></>}
            {lead.problemType && <><span className="text-gray-400">Issue</span><span className="text-white">{lead.problemType}</span></>}
            {lead.monthlyPayment && <><span className="text-gray-400">Monthly Payment</span><span className="text-white">{lead.monthlyPayment}</span></>}
            {lead.intent && <><span className="text-gray-400">Intent</span><span className="text-white">{lead.intent}</span></>}
            {lead.sourcePage && <><span className="text-gray-400">Source Page</span><span className="text-white truncate">{lead.sourcePage}</span></>}
          </div>
        </div>
      )}
    </DialogContent>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WebsiteLeadsJourney() {
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const { data: metrics } = trpc.journey.metrics.useQuery();
  const { data, isLoading } = trpc.journey.websiteLeads.useQuery({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  // Sort high-intent leads to the top
  const sessions = [...(data?.sessions ?? [])].sort((a, b) => {
    const aHigh = isHighIntent(a) ? 1 : 0;
    const bHigh = isHighIntent(b) ? 1 : 0;
    return bHigh - aHigh;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-white font-display text-2xl">Website Lead Journeys</h2>
        <p className="text-gray-400 text-sm mt-1">
          Every lead that researched us before converting — full journey from first click to closed deal.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-blue-400" />
              <span className="text-gray-400 text-xs uppercase tracking-wider">Total Sessions</span>
            </div>
            <div className="text-2xl font-bold text-white">{metrics?.totalSessions ?? "—"}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-amber-400" />
              <span className="text-gray-400 text-xs uppercase tracking-wider">Converted</span>
            </div>
            <div className="text-2xl font-bold text-white">{metrics?.convertedSessions ?? "—"}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-green-400" />
              <span className="text-gray-400 text-xs uppercase tracking-wider">Conversion Rate</span>
            </div>
            <div className="text-2xl font-bold text-white">{metrics?.conversionRate ?? 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Leads table */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base">Website-Sourced Leads</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No website lead sessions recorded yet.</p>
              <p className="text-xs mt-1 text-gray-600">
                Sessions are captured automatically when visitors browse breakyoursolarcontract.com.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-gray-400 text-xs uppercase tracking-wider px-4 py-3 font-medium">Lead</th>
                    <th className="text-left text-gray-400 text-xs uppercase tracking-wider px-4 py-3 font-medium">Source</th>
                    <th className="text-left text-gray-400 text-xs uppercase tracking-wider px-4 py-3 font-medium">Pages</th>
                    <th className="text-left text-gray-400 text-xs uppercase tracking-wider px-4 py-3 font-medium">Time on Site</th>
                    <th className="text-left text-gray-400 text-xs uppercase tracking-wider px-4 py-3 font-medium">Device</th>
                    <th className="text-left text-gray-400 text-xs uppercase tracking-wider px-4 py-3 font-medium">Submitted</th>
                    <th className="text-left text-gray-400 text-xs uppercase tracking-wider px-4 py-3 font-medium">GHL Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => {
                    const lead = (session as any).lead;
                    const name = lead
                      ? `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim() || "Unknown"
                      : "Unknown";

                    const highIntent = isHighIntent(session);

                    return (
                      <tr
                        key={session.id}
                        className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${
                          highIntent ? "bg-amber-500/5" : ""
                        }`}
                        onClick={() => setSelectedLeadId(session.leadId ?? null)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-white">{name}</span>
                            {highIntent && <HighIntentBadge />}
                          </div>
                          {lead?.phone && (
                            <div className="text-gray-500 text-xs mt-0.5">{lead.phone}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-300 text-xs">{session.utmSource ?? "organic"}</div>
                          {session.utmCampaign && (
                            <div className="text-gray-500 text-xs truncate max-w-[120px]">{session.utmCampaign}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-white">{session.totalPages}</td>
                        <td className="px-4 py-3 text-white">{formatMs(session.totalTimeMs ?? 0)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-gray-300">
                            <DeviceIcon type={session.deviceType} />
                            <span className="text-xs capitalize">{session.deviceType ?? "desktop"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-300 text-xs">
                          {formatDate(session.submittedAt)}
                        </td>
                        <td className="px-4 py-3">
                          {session.ghlContactId ? (
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                              In GHL
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">
                              Pending
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 h-7 px-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLeadId(session.leadId ?? null);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Journey
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {sessions.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
              <span className="text-gray-500 text-xs">
                Showing {page * PAGE_SIZE + 1}–{page * PAGE_SIZE + sessions.length}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="h-7 text-xs border-white/20 text-gray-300 hover:bg-white/10"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={sessions.length < PAGE_SIZE}
                  onClick={() => setPage(p => p + 1)}
                  className="h-7 text-xs border-white/20 text-gray-300 hover:bg-white/10"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Journey modal */}
      {selectedLeadId != null && (
        <Dialog open={true} onOpenChange={() => setSelectedLeadId(null)}>
          <JourneyModal leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} />
        </Dialog>
      )}
    </div>
  );
}
