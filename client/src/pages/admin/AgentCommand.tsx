/**
 * Agent Command Center
 * FB Command Center-style dashboard for the 5-agent autonomous system.
 * Dark theme, gold accents, Owner/Team mode toggle.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Agent Metadata ───────────────────────────────────────────────────────────

const AGENT_META: Record<string, { name: string; icon: typeof Brain; color: string; role: string }> = {
  money_maker: { name: "Money Maker", icon: DollarSign, color: "text-green-400", role: "Revenue & Attorney Discovery" },
  seo_intel: { name: "SEO Intel", icon: Search, color: "text-blue-400", role: "Search Performance & Opportunities" },
  content: { name: "Content", icon: FileText, color: "text-purple-400", role: "Article Generation & Pipeline" },
  editor: { name: "Editor", icon: Shield, color: "text-orange-400", role: "Quality Gate & Compliance" },
  manager: { name: "Manager", icon: Crown, color: "text-amber-400", role: "Oversight & Final Approval" },
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
  const triggerAll = trpc.agents.triggerAll.useMutation({
    onSuccess: () => refetch(),
  });

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

      {/* Run All Button */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => triggerAll.mutate()}
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
      </div>

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

// ─── Agent Detail View ────────────────────────────────────────────────────────

function AgentDetailView({ slug }: { slug: string }) {
  const { data: agent } = trpc.agents.get.useQuery({ slug: slug as any });
  const { data: runs } = trpc.agents.runs.useQuery({ agentSlug: slug as any, limit: 10 });
  const { data: actions } = trpc.agents.actions.useQuery({ agentSlug: slug as any, limit: 20 });
  const trigger = trpc.agents.trigger.useMutation();

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
            <div key={run.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <StatusBadge status={run.status} />
                <span className="text-xs text-gray-400 truncate">{run.summary || "No summary"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
                <span>{run.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : "—"}</span>
                <span>${run.costUsd ? run.costUsd.toFixed(4) : "0"}</span>
              </div>
            </div>
          ))}
          {(!runs || runs.length === 0) && (
            <p className="text-gray-500 text-sm">No runs yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-gray-300">ACTIONS CREATED</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {(actions || []).map((action: any) => (
            <div key={action.id} className="py-1.5 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-2">
                <PriorityBadge priority={action.priority} />
                <span className="text-xs text-gray-300 truncate flex-1">{action.title}</span>
                <StatusBadge status={action.status} />
              </div>
              {action.description && (
                <p className="text-xs text-gray-500 mt-1 pl-12 truncate">{action.description}</p>
              )}
            </div>
          ))}
          {(!actions || actions.length === 0) && (
            <p className="text-gray-500 text-sm">No actions yet.</p>
          )}
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

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AgentCommand() {
  const [activeTab, setActiveTab] = useState("overview");
  const seed = trpc.agents.seed.useMutation();

  return (
    <AdminLayout title="Agent Command Center" subtitle="5-Agent Autonomous System">
      <div className="space-y-4">
        {/* Seed button (only needed once) */}
        <div className="flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-white/5 border border-white/10">
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
              <TabsTrigger value="messages" className="data-[state=active]:bg-white/20 data-[state=active]:text-white">
                Messages
              </TabsTrigger>
              <TabsTrigger value="pipeline" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
                Pipeline
              </TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <TabsContent value="overview"><OwnerView /></TabsContent>
              <TabsContent value="money_maker"><AgentDetailView slug="money_maker" /></TabsContent>
              <TabsContent value="seo_intel"><AgentDetailView slug="seo_intel" /></TabsContent>
              <TabsContent value="content"><AgentDetailView slug="content" /></TabsContent>
              <TabsContent value="editor"><AgentDetailView slug="editor" /></TabsContent>
              <TabsContent value="manager"><AgentDetailView slug="manager" /></TabsContent>
              <TabsContent value="messages"><MessagesView /></TabsContent>
              <TabsContent value="pipeline"><PipelineView /></TabsContent>
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
