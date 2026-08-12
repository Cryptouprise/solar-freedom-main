/**
 * Agent Command Center
 * FB Command Center-style dashboard for the 6-agent autonomous system.
 * Dark theme, gold accents, Owner/Team mode toggle.
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  DollarSign,
  Search,
  FileText,
  Shield,
  Crown,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Zap,
  MessageSquare,
  Activity,
  RefreshCw,
  Loader2,
  Server,
  Link,
  TrendingUp,
  History,
  ArrowUpDown,
  Filter,
  Settings,
  BarChart3,
  ChevronDown,
  Trash2,
  CheckCheck,
  Calendar,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fullCycleRunError } from "./agentCommandState";

// ─── Agent Metadata ───────────────────────────────────────────────────────────

const AGENT_META: Record<string, { name: string; icon: typeof Brain; color: string; role: string }> = {
  money_maker: { name: "Money Maker", icon: DollarSign, color: "text-green-400", role: "Revenue & Attorney Discovery" },
  seo_intel: { name: "SEO Intel", icon: Search, color: "text-blue-400", role: "Search Performance & Opportunities" },
  content: { name: "Content", icon: FileText, color: "text-purple-400", role: "Article Generation & Pipeline" },
  editor: { name: "Editor", icon: Shield, color: "text-orange-400", role: "Quality Gate & Compliance" },
  manager: { name: "Manager", icon: Crown, color: "text-amber-400", role: "Oversight & Final Approval" },
  infra: { name: "Infrastructure", icon: Server, color: "text-cyan-400", role: "System Health, Costs & Backlinks" },
  revenue_intel: { name: "Revenue Intel", icon: BarChart3, color: "text-emerald-400", role: "GSC Analysis, Lead Prediction, ROI Ranking" },
};

// ─── Priority Badge ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    p1: "bg-red-500/20 text-red-400 border-red-500/30",
    p2: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    p3: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    p4: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    p5: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-mono font-bold border", colors[priority] || colors.p3)}>
      {priority.toUpperCase()}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
    active: { color: "text-green-400", icon: CheckCircle2 },
    running: { color: "text-blue-400", icon: Activity },
    idle: { color: "text-gray-400", icon: Clock },
    error: { color: "text-red-400", icon: XCircle },
    paused: { color: "text-amber-400", icon: AlertTriangle },
    queued: { color: "text-amber-400", icon: Clock },
    completed: { color: "text-green-400", icon: CheckCircle2 },
    failed: { color: "text-red-400", icon: XCircle },
    approved: { color: "text-green-400", icon: CheckCircle2 },
    rejected: { color: "text-red-400", icon: XCircle },
    blocked: { color: "text-amber-400", icon: AlertTriangle },
  };
  const c = config[status] || config.idle;
  const Icon = c.icon;
  return (
    <span className={cn("flex items-center gap-1 text-xs font-mono", c.color)}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

// ─── Owner View (Executive Summary) ──────────────────────────────────────────

function OwnerView() {
  const { data: overview, isLoading, refetch } = trpc.agents.overview.useQuery();
  const { data: dailyQuality, refetch: refetchDailyQuality } = trpc.agents.dailyQuality.useQuery();
  const triggerAll = trpc.agents.triggerAll.useMutation({
    onSuccess: () => { refetch(); refetchDailyQuality(); },
  });
  const reconcileSchedule = trpc.agents.reconcileDailySchedule.useMutation({
    onSuccess: () => {
      refetchDailyQuality();
      window.alert("Daily Manager schedule reconciled. The system will start at 8:00 AM America/Denver and only the Manager has a timer.");
    },
    onError: error => window.alert(`Schedule update failed: ${error.message}`),
  });
  const [runError, setRunError] = useState<string | null>(null);

  const handleRunAll = async () => {
    setRunError(null);
    try {
      await triggerAll.mutateAsync();
      await refetch();
    } catch (error) {
      setRunError(fullCycleRunError(error));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  const agents = overview?.agents || [];
  const recentRuns = overview?.recentRuns || [];
  const actions = overview?.recentActions || [];
  const scheduleHealth = overview?.scheduleHealth || [];
  const seoMeasurementHealth = overview?.seoMeasurementHealth;

  return (
    <div className="space-y-6">
      {/* Top Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {agents.map((agent: any) => {
          const meta = AGENT_META[agent.slug] || AGENT_META.manager;
          const Icon = meta.icon;
          return (
            <Card key={agent.slug} className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn("w-4 h-4", meta.color)} />
                  <span className="text-xs font-mono text-gray-400">{meta.name}</span>
                </div>
                <StatusBadge status={agent.status} />
                <div className="mt-2 text-xs text-gray-500">
                  {agent.totalRuns} runs | Last: {agent.lastRunAt ? new Date(agent.lastRunAt).toLocaleTimeString() : "never"}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Run All Button + Live Progress */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRunAll}
            disabled={triggerAll.isPending}
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
          >
            {triggerAll.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running All Agents...</>
            ) : (
              <><Zap className="w-4 h-4 mr-2" /> Run Full System Cycle</>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => reconcileSchedule.mutate()} disabled={reconcileSchedule.isPending} className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10">
            {reconcileSchedule.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Clock className="w-4 h-4 mr-1" />}8 AM MT Schedule
          </Button>
        </div>
        {runError ? <p className="text-sm text-red-400" role="alert">{runError}</p> : null}
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono text-gray-300 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" /> SCHEDULER TRUTH
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {scheduleHealth.map((schedule: any) => {
            const meta = AGENT_META[schedule.slug] || AGENT_META.manager;
            const isAwaitingFirstRun = schedule.state === "awaiting_first_run";
            const issue = ["missing", "paused", "stale"].includes(schedule.state);
            return (
              <div key={schedule.slug} className="rounded-lg bg-black/20 border border-white/10 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-gray-200">{meta.name}</span>
                  <StatusBadge status={issue ? "error" : isAwaitingFirstRun ? "queued" : "completed"} />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {isAwaitingFirstRun ? "awaiting first run" : issue ? schedule.state.replaceAll("_", " ") : "scheduled"}
                </p>
                <p className="mt-1 text-[11px] text-gray-600">
                  {isAwaitingFirstRun
                    ? `Next scheduler event: ${schedule.nextScheduledExecutionAt ? new Date(schedule.nextScheduledExecutionAt).toLocaleString() : "pending"}`
                    : `Last scheduler event: ${schedule.lastScheduledExecutionAt ? new Date(schedule.lastScheduledExecutionAt).toLocaleString() : "never"}`}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {seoMeasurementHealth ? (
        <div className={cn(
          "rounded-lg border px-4 py-3 text-sm",
          seoMeasurementHealth.state === "current"
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : "border-red-500/30 bg-red-500/10 text-red-300",
        )}>
          <strong>SEO measurement:</strong> {seoMeasurementHealth.state}. {seoMeasurementHealth.trackedPageCount} tracked pages with GSC data. Last checked: {seoMeasurementHealth.lastCheckedAt ? new Date(seoMeasurementHealth.lastCheckedAt).toLocaleString() : "never"}.
        </div>
      ) : null}

      {/* Manager quality matrix */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono text-gray-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" /> MANAGER DAILY QUALITY MATRIX
          </CardTitle>
          <p className="text-xs text-gray-500">Every worker must produce evidence against a daily checklist. The Manager passes, requests one rework, blocks external dependencies, or records failure.</p>
        </CardHeader>
        <CardContent>
          {dailyQuality?.checklists?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {dailyQuality.checklists.map((checklist: any) => (
                <div key={checklist.id} className="rounded-lg border border-white/8 bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white">{AGENT_META[checklist.agentSlug]?.name || checklist.agentSlug}</span>
                    <StatusBadge status={checklist.status} />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">{checklist.objective}</p>
                  <p className="text-[10px] text-gray-600 mt-2">Success: {checklist.successCriteria}</p>
                  {checklist.qaScore != null && <p className="text-xs text-cyan-300 mt-2">QA score: {checklist.qaScore}/100 · {checklist.retryCount || 0} rework attempt(s)</p>}
                  {checklist.qaFeedback && <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{checklist.qaFeedback}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No checklist has been created for {dailyQuality?.date || "today"} yet. The Manager creates the day’s matrix at the 8:00 AM Mountain cycle.</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Runs */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono text-gray-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" /> RECENT RUNS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentRuns.length === 0 ? (
              <p className="text-gray-500 text-sm">No runs yet. Click "Run Full System Cycle" to start.</p>
            ) : (
              recentRuns.slice(0, 6).map((run: any) => (
                <div key={run.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={run.status} />
                    <span className="text-xs text-gray-300">{AGENT_META[run.agentSlug]?.name || run.agentSlug}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {run.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : "—"}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Action Queue */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono text-gray-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> ACTION QUEUE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {actions.length === 0 ? (
              <p className="text-gray-500 text-sm">No actions queued. Agents will populate this after running.</p>
            ) : (
              actions.slice(0, 6).map((action: any) => (
                <div key={action.id} className="py-1.5 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={action.priority} />
                    <span className="text-xs text-gray-300 truncate flex-1">{action.title}</span>
                    <StatusBadge status={action.status} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Action Queue Component ─────────────────────────────────────────────────

function ActionQueue({ agentSlug, actions }: { agentSlug: string; actions: any[] }) {
  const utils = trpc.useUtils();
  const dismiss = trpc.agents.dismissAction.useMutation({
    onSuccess: () => utils.agents.actions.invalidate(),
  });
  const markDone = trpc.agents.markActionDone.useMutation({
    onSuccess: () => utils.agents.actions.invalidate(),
  });
  const execute = trpc.agents.executeAction.useMutation({
    onSuccess: (response) => {
      utils.agents.actions.invalidate();
      utils.agents.chatThreads.invalidate();
      if (response.blocked) {
        window.alert("This task is blocked pending its evidence-based research integration. The action card now contains the reason; no unverified prospects were created.");
      }
    },
    onError: (error) => window.alert(`Action could not run: ${error.message}`),
  });

  const ACTION_EXPLANATIONS: Record<string, string> = {
    fix_gsc_data_parsing: "Google Search Console data had parsing errors — agent wants to fix how GSC data is read",
    optimize_existing: "Rewrite an existing blog post to improve its SEO score",
    write_article: "Write a new blog post targeting a specific keyword",
    research_firm: "Research a new attorney firm to add to the referral network",
    check_ranking: "Check where a specific page ranks on Google for its target keyword",
    update_meta: "Update the title/meta description of a page to improve click-through rate",
    build_backlink: "Reach out to a site to get a backlink pointing to breakyoursolarcontract.com",
    fix_error: "Fix a technical error the agent detected in the system",
    analyze_competitor: "Analyze a competitor site to find keyword gaps we can target",
    track_revenue: "Update revenue tracking with new lead/conversion data",
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono text-gray-300 flex items-center justify-between">
          <span>ACTIONS CREATED</span>
          <span className="text-[10px] text-gray-600 font-normal">Run supported work, then review its evidence before marking done</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.length === 0 && (
          <p className="text-gray-500 text-sm">No actions yet. Run this agent to generate actions.</p>
        )}
        {actions.map((action: any) => (
          <div key={action.id} className="p-3 rounded-lg bg-black/20 border border-white/5 space-y-2">
            {/* Title row */}
            <div className="flex items-start gap-2">
              <PriorityBadge priority={action.priority} />
              <span className="text-xs text-gray-200 font-medium flex-1 leading-relaxed">{action.title}</span>
              <StatusBadge status={action.status} />
            </div>
            {/* Plain English explanation */}
            {(action.description || ACTION_EXPLANATIONS[action.actionType]) && (
              <p className="text-xs text-gray-500 leading-relaxed">
                {action.description || ACTION_EXPLANATIONS[action.actionType]}
              </p>
            )}
            {(action.result || action.errorMessage) && (
              <div className={`rounded-md px-2 py-1.5 text-[11px] leading-relaxed whitespace-pre-wrap ${action.errorMessage ? "bg-red-500/5 text-red-200 border border-red-500/15" : "bg-emerald-500/5 text-emerald-100 border border-emerald-500/15"}`}>
                <span className="font-semibold">{action.errorMessage ? "Execution issue: " : "Execution evidence: "}</span>
                {action.errorMessage || action.result}
              </div>
            )}
            {/* Date + action type */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] text-gray-600">
                <Calendar className="w-3 h-3" />
                {action.createdAt ? new Date(action.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : ""}
                {action.actionType && (
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-white/5 text-gray-600 font-mono">{action.actionType}</span>
                )}
              </div>
              {/* A Run control appears only for action types with a safe execution adapter. */}
              {["queued", "blocked", "failed"].includes(action.status) && (
                <div className="flex items-center gap-1">
                  {action.actionType === "research_firm" && !action.requiresApproval && (
                    <button
                      onClick={() => execute.mutate({ actionId: action.id })}
                      disabled={execute.isPending}
                      title="Run evidence-backed attorney research"
                      className="flex items-center gap-1 px-1.5 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-[10px] border border-blue-500/20 transition-colors"
                    >
                      {execute.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}Run
                    </button>
                  )}
                  <button
                    onClick={() => markDone.mutate({ actionId: action.id })}
                    disabled={markDone.isPending}
                    title="Mark as done"
                    className="p-1 rounded hover:bg-green-500/20 text-gray-600 hover:text-green-400 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => dismiss.mutate({ actionId: action.id })}
                    disabled={dismiss.isPending}
                    title="Dismiss"
                    className="p-1 rounded hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Agent Detail View ────────────────────────────────────────────────────────

const AGENT_SUGGESTED_PROMPTS: Record<string, string[]> = {
  content: [
    "Write an article about Sunrun complaints in California",
    "What's the best topic to write about this week?",
    "Write a blog post targeting 'solar contract cancellation Texas'",
    "What keywords are our competitors ranking for that we're missing?",
  ],
  seo_intel: [
    "What are the top 5 keywords we should target next?",
    "Which solar companies are getting the most complaints right now?",
    "Analyze our competitor solarcomplaints.co — what are they ranking for?",
    "What states have the most solar contract disputes?",
  ],
  money_maker: [
    "Which leads from this week have the highest case value?",
    "What's our estimated revenue if we convert 10% of this month's leads?",
    "Which solar companies should we target for maximum attorney referral fees?",
    "What's the average case value by state?",
  ],
  editor: [
    "Review our latest blog post and give it a score",
    "What's the weakest part of our content strategy right now?",
    "Score this article on SEO, readability, conversion, and compliance",
    "What CTAs are we missing from our top articles?",
  ],
  manager: [
    "What should the agents focus on this week?",
    "Give me a status report on all 6 agents",
    "What's the biggest bottleneck in our content pipeline?",
    "What actions need my approval right now?",
  ],
  infra: [
    "Are all agents healthy? Any errors?",
    "What's our AI cost this week?",
    "Which agent has the highest error rate?",
    "What system improvements should we make?",
  ],
};

function AgentDetailView({ slug }: { slug: string }) {
  const { data: agent } = trpc.agents.get.useQuery({ slug: slug as any });
  const { data: runs } = trpc.agents.runs.useQuery({ agentSlug: slug as any, limit: 10 });
  const { data: actions } = trpc.agents.actions.useQuery({ agentSlug: slug as any, limit: 20 });
  const { data: threadEntries = [] } = trpc.agents.chatThreads.useQuery({ agentSlug: slug as any, limit: 30 });
  const trigger = trpc.agents.trigger.useMutation();
  const chatMutation = trpc.agents.chat.useMutation();
  const [chatMessages, setChatMessages] = useState<Message[]>([]);

  const handleSendMessage = (content: string) => {
    const newMessages: Message[] = [...chatMessages, { role: "user", content }];
    setChatMessages(newMessages);
    chatMutation.mutate(
      { slug: slug as any, messages: newMessages },
      {
        onSuccess: (data) => {
          setChatMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
        },
        onError: () => {
          setChatMessages(prev => [...prev, { role: "assistant", content: "Sorry, I ran into an error. Please try again." }]);
        },
      }
    );
  };

  const meta = AGENT_META[slug] || AGENT_META.manager;
  const Icon = meta.icon;

  return (
    <div className="space-y-4">
      {/* Agent Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center")}>
            <Icon className={cn("w-5 h-5", meta.color)} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{meta.name}</h3>
            <p className="text-xs text-gray-400">{meta.role}</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => trigger.mutate({ slug: slug as any })}
          disabled={trigger.isPending}
          className="bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30"
        >
          {trigger.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 mr-1" />}
          Run Now
        </Button>
      </div>

      {/* Stats */}
      {agent && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="text-xs text-gray-400 font-mono">STATUS</div>
            <StatusBadge status={agent.status} />
          </div>
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="text-xs text-gray-400 font-mono">TOTAL RUNS</div>
            <div className="text-lg font-bold text-white">{agent.totalRuns}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="text-xs text-gray-400 font-mono">LAST RUN</div>
            <div className="text-xs text-gray-300">{agent.lastRunAt ? new Date(agent.lastRunAt).toLocaleString() : "Never"}</div>
          </div>
        </div>
      )}

      {/* Run History */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-gray-300">RUN HISTORY</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {(runs || []).map((run: any) => (
            <div key={run.id} className="py-2 border-b border-white/5 last:border-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <StatusBadge status={run.status} />
                  <span className="text-xs text-gray-400 truncate">{run.summary || "No summary"}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
                  <span>{run.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : "—"}</span>
                  <span>${run.costUsd ? parseFloat(String(run.costUsd)).toFixed(4) : "0"}</span>
                </div>
              </div>
              {run.startedAt && (
                <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-600">
                  <Calendar className="w-3 h-3" />
                  {new Date(run.startedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  {run.triggerType && <span className="ml-1 px-1.5 py-0.5 rounded bg-white/5 text-gray-500">{run.triggerType}</span>}
                </div>
              )}
            </div>
          ))}
          {(!runs || runs.length === 0) && (
            <p className="text-gray-500 text-sm">No runs yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <ActionQueue agentSlug={slug} actions={actions || []} />

      {/* Persistent execution / chat evidence */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-gray-300 flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" /> SAVED THREAD & EXECUTION EVIDENCE
          </CardTitle>
          <p className="text-xs text-gray-500">Run summaries, errors, and conversations are retained for 30 days. Permanent run history remains above.</p>
        </CardHeader>
        <CardContent className="space-y-2 max-h-80 overflow-y-auto">
          {threadEntries.map((entry: any) => (
            <div key={entry.id} className="rounded-lg border border-white/5 bg-black/10 px-3 py-2">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider mb-1">
                <span className={entry.role === "user" ? "text-blue-300" : entry.messageType === "error" ? "text-red-300" : "text-cyan-300"}>{entry.role === "user" ? "You" : meta.name}</span>
                <span className="text-gray-600">{entry.messageType}</span>
                <span className="ml-auto text-gray-600 normal-case tracking-normal">{new Date(entry.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{entry.message}</p>
            </div>
          ))}
          {!threadEntries.length && <p className="text-sm text-gray-500">No saved activity yet. The next run or chat will create an evidence entry here.</p>}
        </CardContent>
      </Card>

      {/* Live Chat */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-gray-300 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            TALK TO {meta.name.toUpperCase()}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <AIChatBox
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            isLoading={chatMutation.isPending}
            height={420}
            placeholder={`Ask ${meta.name} anything...`}
            emptyStateMessage={`${meta.name} is ready. Ask a question or give a directive.`}
            suggestedPrompts={AGENT_SUGGESTED_PROMPTS[slug] || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Messages View ────────────────────────────────────────────────────────────

function MessagesView() {
  const { data: messages } = trpc.agents.messages.useQuery({ limit: 30 });

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono text-gray-300 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" /> INTER-AGENT MESSAGES
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {(messages || []).map((msg: any) => (
          <div key={msg.id} className="py-2 border-b border-white/5 last:border-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-amber-400">{msg.fromAgent}</span>
              <span className="text-xs text-gray-500">→</span>
              <span className="text-xs font-mono text-blue-400">{msg.toAgent}</span>
              <Badge variant="outline" className="text-[10px] h-4">{msg.type}</Badge>
              {!msg.actedOn && <span className="w-2 h-2 rounded-full bg-amber-400" />}
            </div>
            <div className="text-xs text-gray-300 font-medium">{msg.subject}</div>
            {msg.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{msg.body}</p>}
          </div>
        ))}
        {(!messages || messages.length === 0) && (
          <p className="text-gray-500 text-sm">No messages yet. Agents communicate here during execution.</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Pipeline View ────────────────────────────────────────────────────────────

function PipelineView() {
  const { data: pipeline } = trpc.agents.pipeline.useQuery({ limit: 20 });

  const stages = ["idea", "researching", "outlined", "drafting", "draft_complete", "in_review", "approved", "published"];

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono text-gray-300 flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-400" /> CONTENT PIPELINE
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stage counts */}
        <div className="flex gap-1 mb-4 overflow-x-auto">
          {stages.map(stage => {
            const count = (pipeline || []).filter((p: any) => p.stage === stage).length;
            return (
              <div key={stage} className="flex-shrink-0 bg-white/5 rounded px-2 py-1 border border-white/10">
                <div className="text-[10px] text-gray-500 font-mono">{stage.replace("_", " ")}</div>
                <div className="text-sm font-bold text-white">{count}</div>
              </div>
            );
          })}
        </div>

        {/* Items */}
        <div className="space-y-1.5">
          {(pipeline || []).map((item: any) => (
            <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Badge variant="outline" className="text-[10px] h-4 shrink-0">{item.stage}</Badge>
                <span className="text-xs text-gray-300 truncate">{item.title}</span>
              </div>
              <span className="text-xs text-gray-500 shrink-0">{item.contentType}</span>
            </div>
          ))}
          {(!pipeline || pipeline.length === 0) && (
            <p className="text-gray-500 text-sm">Pipeline empty. Content Agent will populate this.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Infrastructure View ─────────────────────────────────────────────────────

function InfrastructureView() {
  const { data: infra, isLoading, refetch } = trpc.agents.infraStatus.useQuery();
  const trigger = trpc.agents.trigger.useMutation({ onSuccess: () => refetch() });

  // Filter & sort state
  const [changeLogActorFilter, setChangeLogActorFilter] = useState<string>("all");
  const [changeLogCategoryFilter, setChangeLogCategoryFilter] = useState<string>("all");
  const [backlinkSortOrder, setBacklinkSortOrder] = useState<"newest" | "oldest">("newest");
  const [mediumStatusFilter, setMediumStatusFilter] = useState<string>("all");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const healthLogs = infra?.healthLogs || [];
  const changeLogs = infra?.changeLogs || [];
  const mediumArticleList = infra?.mediumArticles || [];
  const backlinks = infra?.backlinks || [];

  const crawledCount = mediumArticleList.filter((a: any) => a.crawlStatus === "crawled").length;
  const pendingCount = mediumArticleList.filter((a: any) => a.crawlStatus === "pending").length;
  const errorCount = mediumArticleList.filter((a: any) => a.crawlStatus === "error").length;
  const totalBacklinks = backlinks.length;
  const activeBacklinks = backlinks.filter((b: any) => b.isActive).length;

  // Derive unique actors and categories from change logs
  const uniqueActors = Array.from(new Set(changeLogs.map((l: any) => l.actor)));
  const uniqueCategories = Array.from(new Set(changeLogs.map((l: any) => l.category)));

  // Filtered change logs
  const filteredChangeLogs = changeLogs.filter((log: any) => {
    if (changeLogActorFilter !== "all" && log.actor !== changeLogActorFilter) return false;
    if (changeLogCategoryFilter !== "all" && log.category !== changeLogCategoryFilter) return false;
    return true;
  });

  // Sorted backlinks
  const sortedBacklinks = [...backlinks].sort((a: any, b: any) => {
    const dateA = new Date(a.firstDiscoveredAt).getTime();
    const dateB = new Date(b.firstDiscoveredAt).getTime();
    return backlinkSortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  // Filtered medium articles
  const filteredMediumArticles = mediumArticleList.filter((a: any) => {
    if (mediumStatusFilter === "all") return true;
    return a.crawlStatus === mediumStatusFilter;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <Server className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Infrastructure Agent</h3>
            <p className="text-xs text-gray-400">System Health, Costs & Backlink Tracking</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-white/10 text-gray-400">
            <RefreshCw className="w-3 h-3 mr-1" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => trigger.mutate({ slug: "infra" })}
            disabled={trigger.isPending}
            className="bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30"
          >
            {trigger.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 mr-1" />}
            Run Now
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-xs text-gray-400 font-mono mb-1">MEDIUM ARTICLES</div>
          <div className="text-2xl font-bold text-white">{mediumArticleList.length}</div>
          <div className="text-xs text-gray-500">{crawledCount} crawled, {pendingCount} pending</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-xs text-gray-400 font-mono mb-1">BACKLINKS FOUND</div>
          <div className="text-2xl font-bold text-cyan-400">{totalBacklinks}</div>
          <div className="text-xs text-gray-500">{activeBacklinks} active, DA 95</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-xs text-gray-400 font-mono mb-1">HEALTH LOGS</div>
          <div className="text-2xl font-bold text-white">{healthLogs.length}</div>
          <div className="text-xs text-gray-500">Last 7 days</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-xs text-gray-400 font-mono mb-1">CHANGE LOG</div>
          <div className="text-2xl font-bold text-white">{changeLogs.length}</div>
          <div className="text-xs text-gray-500">System events</div>
        </div>
      </div>

      {/* Medium Articles + Backlinks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Medium Articles */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-mono text-gray-300 flex items-center gap-2">
                <Link className="w-4 h-4 text-cyan-400" /> MEDIUM ARTICLES (DA 95)
              </CardTitle>
              <select
                value={mediumStatusFilter}
                onChange={(e) => setMediumStatusFilter(e.target.value)}
                className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-cyan-500/50"
              >
                <option value="all">All Status</option>
                <option value="crawled">Crawled</option>
                <option value="pending">Pending</option>
                <option value="error">Error</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5 max-h-64 overflow-y-auto">
            {filteredMediumArticles.length === 0 ? (
              <p className="text-gray-500 text-sm">
                {mediumStatusFilter === "all" ? "No Medium articles tracked yet." : `No articles with status "${mediumStatusFilter}".`}
              </p>
            ) : (
              filteredMediumArticles.map((article: any) => (
                <div key={article.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300 truncate">{article.title}</p>
                    <p className="text-xs text-gray-500">{article.outboundLinkCount || 0} backlinks</p>
                  </div>
                  <span className={cn(
                    "text-xs font-mono px-2 py-0.5 rounded border",
                    article.crawlStatus === "crawled" ? "text-green-400 bg-green-500/10 border-green-500/20" :
                    article.crawlStatus === "error" ? "text-red-400 bg-red-500/10 border-red-500/20" :
                    "text-amber-400 bg-amber-500/10 border-amber-500/20"
                  )}>
                    {article.crawlStatus}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Discovered Backlinks */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-mono text-gray-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" /> DISCOVERED BACKLINKS
              </CardTitle>
              <button
                onClick={() => setBacklinkSortOrder(prev => prev === "newest" ? "oldest" : "newest")}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-cyan-300 transition-colors bg-white/5 border border-white/10 rounded px-2 py-1"
              >
                <ArrowUpDown className="w-3 h-3" />
                {backlinkSortOrder === "newest" ? "Newest" : "Oldest"}
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5 max-h-64 overflow-y-auto">
            {sortedBacklinks.length === 0 ? (
              <p className="text-gray-500 text-sm">No backlinks discovered yet. Publish Medium articles and run the tracker.</p>
            ) : (
              sortedBacklinks.map((bl: any) => (
                <div key={bl.id} className="py-1.5 border-b border-white/5 last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-300 truncate flex-1">{bl.targetUrl}</p>
                    <span className={cn(
                      "text-xs font-mono px-1.5 py-0.5 rounded ml-2",
                      bl.doFollow ? "text-green-400 bg-green-500/10" : "text-gray-400 bg-white/5"
                    )}>
                      {bl.doFollow ? "dofollow" : "nofollow"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-gray-500 truncate">{bl.anchorText || "(no anchor)"}</p>
                    <span className="text-xs text-gray-600 shrink-0 ml-2">{new Date(bl.firstDiscoveredAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Change Log */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm font-mono text-gray-300 flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" /> SYSTEM CHANGE LOG
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Filter className="w-3 h-3 text-gray-500" />
                <select
                  value={changeLogActorFilter}
                  onChange={(e) => setChangeLogActorFilter(e.target.value)}
                  className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="all">All Agents</option>
                  {uniqueActors.map((actor: string) => (
                    <option key={actor} value={actor}>{actor}</option>
                  ))}
                </select>
              </div>
              <select
                value={changeLogCategoryFilter}
                onChange={(e) => setChangeLogCategoryFilter(e.target.value)}
                className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-cyan-500/50"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map((cat: string) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {(changeLogActorFilter !== "all" || changeLogCategoryFilter !== "all") && (
                <button
                  onClick={() => { setChangeLogActorFilter("all"); setChangeLogCategoryFilter("all"); }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5 max-h-64 overflow-y-auto">
          {filteredChangeLogs.length === 0 ? (
            <p className="text-gray-500 text-sm">
              {changeLogs.length === 0 ? "No system changes logged yet." : "No changes match the current filters."}
            </p>
          ) : (
            filteredChangeLogs.map((log: any) => (
              <div key={log.id} className="py-1.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">{log.category}</span>
                  <span className="text-xs text-gray-400">{log.actor}</span>
                  {log.impactScore != null && (
                    <span className={cn(
                      "text-xs font-mono px-1.5 py-0.5 rounded",
                      log.impactScore > 0 ? "text-green-400 bg-green-500/10" :
                      log.impactScore < 0 ? "text-red-400 bg-red-500/10" :
                      "text-gray-400 bg-white/5"
                    )}>
                      {log.impactScore > 0 ? "+" : ""}{log.impactScore}
                    </span>
                  )}
                  <span className="text-xs text-gray-600 ml-auto">{new Date(log.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-gray-300 mt-0.5 truncate">{log.description}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Agent Health Log */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-gray-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" /> AGENT HEALTH LOG
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 max-h-48 overflow-y-auto">
          {healthLogs.length === 0 ? (
            <p className="text-gray-500 text-sm">No health logs yet. Infrastructure Agent will populate this after its first run.</p>
          ) : (
            healthLogs.map((log: any) => (
              <div key={log.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={cn(
                    "text-xs font-mono px-1.5 py-0.5 rounded",
                    log.status === "success" ? "text-green-400 bg-green-500/10" :
                    log.status === "failed" ? "text-red-400 bg-red-500/10" :
                    "text-amber-400 bg-amber-500/10"
                  )}>{log.status}</span>
                  <span className="text-xs text-gray-300">{AGENT_META[log.agentSlug]?.name || log.agentSlug}</span>
                  {log.qualityScore && (
                    <span className="text-xs text-gray-500">Q:{log.qualityScore}</span>
                  )}
                </div>
                <span className="text-xs text-gray-600">{new Date(log.createdAt).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Model Selector View ─────────────────────────────────────────────────────

function ModelSelectorView() {
  const { data: configs, isLoading, refetch } = trpc.agents.getModelConfigs.useQuery();
  const { data: catalog } = trpc.agents.getModelCatalog.useQuery();
  const updateModel = trpc.agents.updateModelConfig.useMutation({ onSuccess: () => refetch() });
  const seedModels = trpc.agents.seedModelConfigs.useMutation({ onSuccess: () => refetch() });

  if (isLoading) return <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-amber-400" /></div>;

  const agentOrder = ["manager", "revenue_intel", "content", "seo_intel", "editor", "money_maker", "infra"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">Agent LLM Model Configuration</h3>
          <p className="text-gray-400 text-sm mt-0.5">Choose which AI model powers each agent. Changes take effect on the next run.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => seedModels.mutate()} disabled={seedModels.isPending} className="text-xs border-white/10">
          {seedModels.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Settings className="w-3 h-3 mr-1" />}
          Reset to Defaults
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {agentOrder.map(slug => {
          const meta = AGENT_META[slug];
          const Icon = meta?.icon || Brain;
          const current = configs?.find((c: any) => c.agentSlug === slug) as { agentSlug: string; modelId: string; modelLabel: string; isDefault: boolean } | undefined;
          return (
            <Card key={slug} className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={cn("w-4 h-4", meta?.color || "text-gray-400")} />
                  <div>
                    <div className="text-white text-sm font-semibold">{meta?.name || slug}</div>
                    <div className="text-gray-500 text-xs">{meta?.role}</div>
                  </div>
                  {current?.isDefault && <span className="ml-auto text-xs text-gray-500 font-mono">default</span>}
                </div>
                <Select
                  value={current?.modelId || ""}
                  onValueChange={(modelId) => updateModel.mutate({ agentSlug: slug, modelId })}
                >
                  <SelectTrigger className="bg-black/30 border-white/10 text-white text-xs h-8">
                    <SelectValue placeholder="Select model..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/10">
                    {(catalog as any[] || []).map((model: any) => (
                      <SelectItem key={model.id} value={model.id} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full flex-shrink-0",
                            model.provider === "qwen" ? "bg-purple-400" :
                            model.provider === "deepseek" ? "bg-blue-400" :
                            model.provider === "openai" ? "bg-green-400" :
                            model.provider === "anthropic" ? "bg-orange-400" : "bg-gray-400"
                          )} />
                          <span className="text-white">{model.label}</span>
                          <span className="text-gray-500 ml-auto">${model.costPer1MIn != null ? parseFloat(String(model.costPer1MIn)).toFixed(2) : "?"}/1M in</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {current?.modelId && typeof current.modelId === "string" && (
                  <div className="mt-2 text-xs text-gray-500 font-mono">{current.modelId}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AgentCommand() {
  const [activeTab, setActiveTab] = useState("overview");
  const seed = trpc.agents.seed.useMutation();

  return (
    <AdminLayout title="Agent Command Center" subtitle="6-Agent Autonomous System">
      <div className="space-y-4">
        {/* Seed button (only needed once) */}
        <div className="flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-white/5 border border-white/10 flex-wrap">
              <TabsTrigger value="overview" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
                Overview
              </TabsTrigger>
              <TabsTrigger value="money_maker" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300">
                Money
              </TabsTrigger>
              <TabsTrigger value="seo_intel" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300">
                SEO
              </TabsTrigger>
              <TabsTrigger value="content" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
                Content
              </TabsTrigger>
              <TabsTrigger value="editor" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-300">
                Editor
              </TabsTrigger>
              <TabsTrigger value="manager" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
                Manager
              </TabsTrigger>
              <TabsTrigger value="infra" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
                Infra
              </TabsTrigger>
              <TabsTrigger value="messages" className="data-[state=active]:bg-white/20 data-[state=active]:text-white">
                Messages
              </TabsTrigger>
              <TabsTrigger value="pipeline" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
                Pipeline
              </TabsTrigger>
              <TabsTrigger value="revenue_intel" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">
                Revenue Intel
              </TabsTrigger>
              <TabsTrigger value="models" className="data-[state=active]:bg-white/20 data-[state=active]:text-white">
                <Settings className="w-3 h-3 mr-1" /> Models
              </TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <TabsContent value="overview"><OwnerView /></TabsContent>
              <TabsContent value="money_maker"><AgentDetailView slug="money_maker" /></TabsContent>
              <TabsContent value="seo_intel"><AgentDetailView slug="seo_intel" /></TabsContent>
              <TabsContent value="content"><AgentDetailView slug="content" /></TabsContent>
              <TabsContent value="editor"><AgentDetailView slug="editor" /></TabsContent>
              <TabsContent value="manager"><AgentDetailView slug="manager" /></TabsContent>
              <TabsContent value="infra"><InfrastructureView /></TabsContent>
              <TabsContent value="messages"><MessagesView /></TabsContent>
              <TabsContent value="pipeline"><PipelineView /></TabsContent>
              <TabsContent value="revenue_intel"><AgentDetailView slug="revenue_intel" /></TabsContent>
              <TabsContent value="models"><ModelSelectorView /></TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Seed agents button (first-time setup) */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => seed.mutate()}
            disabled={seed.isPending}
            className="text-xs text-gray-400 border-white/10"
          >
            {seed.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
            Initialize Agents
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
