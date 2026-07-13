/**
 * Press Release & Backlink Admin Panel
 * Route: /admin/press-releases
 * Access: Admin only
 *
 * Tabs:
 *   1. Topic Queue — add/remove/reorder press release topics
 *   2. Run Now — generate a draft preview for human review
 *   3. Logs — draft and historical adapter evidence
 *   4. Backlinks — unverified research candidates + review queue
 *   5. Settings — draft model and inactive legacy-adapter inventory
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Trash2,
  Play,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Link2,
  Newspaper,
  Settings,
  Search,
  ChevronRight,
  RotateCcw,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

// ─── Status badge helpers ─────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: React.ReactNode }> = {
    pending: { color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", icon: <Clock className="w-3 h-3" /> },
    running: { color: "bg-blue-500/20 text-blue-300 border-blue-500/30 animate-pulse", icon: <RefreshCw className="w-3 h-3 animate-spin" /> },
    published: { color: "bg-green-500/20 text-green-300 border-green-500/30", icon: <CheckCircle className="w-3 h-3" /> },
    failed: { color: "bg-red-500/20 text-red-300 border-red-500/30", icon: <XCircle className="w-3 h-3" /> },
    success: { color: "bg-green-500/20 text-green-300 border-green-500/30", icon: <CheckCircle className="w-3 h-3" /> },
    skipped: { color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: <AlertCircle className="w-3 h-3" /> },
    needs_login: { color: "bg-orange-500/20 text-orange-300 border-orange-500/30", icon: <AlertCircle className="w-3 h-3" /> },
    new: { color: "bg-blue-500/20 text-blue-300 border-blue-500/30", icon: <Clock className="w-3 h-3" /> },
    approved: { color: "bg-green-500/20 text-green-300 border-green-500/30", icon: <CheckCircle className="w-3 h-3" /> },
    rejected: { color: "bg-red-500/20 text-red-300 border-red-500/30", icon: <XCircle className="w-3 h-3" /> },
    promoted: { color: "bg-purple-500/20 text-purple-300 border-purple-500/30", icon: <ChevronRight className="w-3 h-3" /> },
  };
  const cfg = map[status] ?? map.pending;
  const label = status === "new"
    ? "unverified"
    : status === "approved"
      ? "reviewed candidate"
      : status === "promoted"
        ? "promoted to queue"
        : status === "success"
          ? "adapter-reported success"
          : status === "published"
            ? "legacy published status"
        : status;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cfg.color}`}>
      {cfg.icon}
      {label}
    </span>
  );
}

// ─── Add Topic Dialog ─────────────────────────────────────────────────────────

function AddTopicDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    angle: "",
    targetKeywords: "",
    targetUrl: "https://breakyoursolarcontract.com",
    sortOrder: 50,
  });
  
  const utils = trpc.useUtils();

  const addTopic = trpc.pressRelease.addTopic.useMutation({
    onSuccess: () => {
      toast.success('Topic added to queue');
      setOpen(false);
      setForm({ title: "", angle: "", targetKeywords: "", targetUrl: "https://breakyoursolarcontract.com", sortOrder: 50 });
      utils.pressRelease.getTopics.invalidate();
      onAdded();
    },
    onError: () => toast.error('Topic was not added', { description: 'Review sanitized server diagnostics.' }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
          <Plus className="w-4 h-4 mr-1" /> Add Topic
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1a1d24] border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Add Press Release Topic</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="rounded border border-amber-500/30 bg-amber-500/10 p-3 text-sm leading-relaxed text-amber-200">
            This creates an unverified draft prompt only. Provide current primary-source URLs and facts you have
            independently verified; generation does not validate a claim or authorize publication.
          </p>
          <div>
            <Label className="text-gray-400 text-xs uppercase tracking-wider">Topic / Headline Angle *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Proposed consumer-education update on reviewing solar agreement terms"
              className="mt-1 bg-white/5 border-white/10 text-white placeholder-gray-600"
            />
          </div>
          <div>
            <Label className="text-gray-400 text-xs uppercase tracking-wider">Verified Context / Primary Sources</Label>
            <Textarea
              value={form.angle}
              onChange={(e) => setForm((f) => ({ ...f, angle: e.target.value }))}
              placeholder="Current primary-source URLs and precisely supported facts only. Do not add unverified statistics, outcomes, allegations, or legal conclusions."
              className="mt-1 bg-white/5 border-white/10 text-white placeholder-gray-600 h-24"
            />
          </div>
          <div>
            <Label className="text-gray-400 text-xs uppercase tracking-wider">Optional Search Phrases (comma-separated; no stuffing)</Label>
            <Input
              value={form.targetKeywords}
              onChange={(e) => setForm((f) => ({ ...f, targetKeywords: e.target.value }))}
              placeholder="solar contract cancellation, solar lease exit, solar contract rights"
              className="mt-1 bg-white/5 border-white/10 text-white placeholder-gray-600"
            />
          </div>
          <div>
            <Label className="text-gray-400 text-xs uppercase tracking-wider">Target URL to Link To</Label>
            <Input
              value={form.targetUrl}
              onChange={(e) => setForm((f) => ({ ...f, targetUrl: e.target.value }))}
              className="mt-1 bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-gray-400 text-xs uppercase tracking-wider">Priority (lower = runs first)</Label>
            <Input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 50 }))}
              className="mt-1 bg-white/5 border-white/10 text-white w-24"
            />
          </div>
          <Button
            onClick={() => addTopic.mutate(form)}
            disabled={!form.title || addTopic.isPending}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          >
            {addTopic.isPending ? "Adding..." : "Add to Queue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Topic Queue Tab ──────────────────────────────────────────────────────────

function TopicQueueTab() {
  const { data: topics = [], refetch } = trpc.pressRelease.getTopics.useQuery();
  
  const utils = trpc.useUtils();

  const deleteTopic = trpc.pressRelease.deleteTopic.useMutation({
    onSuccess: () => { toast.success('Topic deleted'); utils.pressRelease.getTopics.invalidate(); },
    onError: () => toast.error('Topic was not deleted', { description: 'Review sanitized server diagnostics.' }),
  });

  const updateStatus = trpc.pressRelease.updateTopicStatus.useMutation({
    onSuccess: () => utils.pressRelease.getTopics.invalidate(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{topics.filter((t) => t.status === "pending").length} pending · {topics.filter((t) => t.status === "published").length} published</p>
        </div>
        <AddTopicDialog onAdded={() => refetch()} />
      </div>

      {topics.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No topics yet. Add your first press release topic above.</p>
        </div>
      )}

      <div className="space-y-2">
        {topics.map((topic) => (
          <div key={topic.id} className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <StatusBadge status={topic.status} />
                <span className="text-gray-500 text-xs font-mono">#{topic.id} · priority {topic.sortOrder}</span>
              </div>
              <p className="text-white font-medium text-sm leading-snug">{topic.title}</p>
              {topic.angle && <p className="text-gray-400 text-xs mt-1 line-clamp-2">{topic.angle}</p>}
              {topic.targetKeywords && (
                <p className="text-amber-400/70 text-xs mt-1">🔑 {topic.targetKeywords}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {topic.status === "failed" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-yellow-400 hover:text-yellow-300 h-7 px-2"
                  onClick={() => updateStatus.mutate({ id: topic.id, status: "pending" })}
                  title="Reset to pending"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="text-red-400 hover:text-red-300 h-7 px-2"
                onClick={() => deleteTopic.mutate({ id: topic.id })}
                title="Delete topic"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Run Now Tab ──────────────────────────────────────────────────────────────

function RunNowTab() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const dryRun = true as const;
  const { data: topics = [] } = trpc.pressRelease.getTopics.useQuery();
  const [selectedTopicId, setSelectedTopicId] = useState<string>("next");
  
  const utils = trpc.useUtils();

  const runNow = trpc.pressRelease.runNow.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setRunning(false);
      utils.pressRelease.getTopics.invalidate();
      utils.pressRelease.getLogs.invalidate();
      toast.success("Draft preview complete", { description: `"${data.headline}"` });
    },
    onError: () => {
      setRunning(false);
      toast.error('Draft generation failed', { description: 'Review sanitized server diagnostics.' });
    },
  });

  const handleRun = () => {
    setRunning(true);
    setResult(null);
    runNow.mutate({
      topicId: selectedTopicId !== "next" ? parseInt(selectedTopicId) : undefined,
      dryRun,
    });
  };

  const pendingTopics = topics.filter((t) => t.status === "pending");

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base">Manual Trigger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-400 text-xs uppercase tracking-wider">Topic to Run</Label>
            <Select value={selectedTopicId} onValueChange={setSelectedTopicId}>
              <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1d24] border-white/10 text-white">
                <SelectItem value="next">Next pending topic</SelectItem>
                {pendingTopics.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    #{t.id}: {t.title.substring(0, 60)}...
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="rounded border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
            Approval-first mode is enforced: this action generates a draft preview only and never publishes externally.
          </p>

          <Button
            onClick={handleRun}
            disabled={running || pendingTopics.length === 0}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-3"
          >
            {running ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Running... (this takes 30–60 seconds)</>
            ) : (
              <><Play className="w-4 h-4 mr-2" /> Generate Draft Preview</>
            )}
          </Button>

          {pendingTopics.length === 0 && (
            <p className="text-yellow-400 text-sm text-center">No pending topics. Add topics in the Queue tab first.</p>
          )}
        </CardContent>
      </Card>

      {/* Live result */}
      {result && (
        <Card className="bg-white/5 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-400 text-base flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Preview Generated
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Generated Headline</p>
              <p className="text-white font-semibold text-lg leading-snug">"{result.headline}"</p>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-gray-400">Model: <span className="text-white font-mono">{result.model}</span></span>
              <span className="text-gray-400">Topic ID: <span className="text-white">#{result.topicId}</span></span>
            </div>

            {result.submissions && result.submissions.length > 0 && (
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Historical Adapter Evidence (Unverified)</p>
                <div className="space-y-2">
                  {result.submissions.map((s: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 rounded p-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={s.status} />
                        <span className="text-white text-sm">{s.siteLabel}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.publishedUrl && safeBacklinkHref(s.publishedUrl) && (
                          <a href={safeBacklinkHref(s.publishedUrl)!} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        {s.errorMessage && (
                          <span className="text-red-400 text-xs max-w-64">Adapter reported an error; use sanitized server diagnostics.</span>
                        )}
                        {s.durationMs && (
                          <span className="text-gray-500 text-xs">{(s.durationMs / 1000).toFixed(1)}s</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-3 text-sm">
                  <span className="text-amber-300">{result.successCount} adapter-reported successes (unverified)</span>
                  <span className="text-red-400">{result.failedCount} adapter-reported failures</span>
                  <span className="text-gray-400">{result.skippedCount} skipped</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Logs Tab ─────────────────────────────────────────────────────────────────

function LogsTab() {
  const { data: logs = [] } = trpc.pressRelease.getLogs.useQuery({ limit: 100, offset: 0 });

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No draft or distribution evidence yet. Generate a draft preview in the "Run Now" tab.</p>
      </div>
    );
  }

  // Group by topicId + headline
  const grouped = logs.reduce((acc: Record<string, typeof logs>, log) => {
    const key = `${log.topicId}-${log.headline}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <p className="text-gray-400 text-sm">
        {Object.keys(grouped).length} historical draft/adapter records · {logs.filter((l) => l.status === "success").length} adapter-reported successes, unverified until current URL and destination evidence is reviewed
      </p>

      {Object.entries(grouped).map(([key, entries]) => (
        <Card key={key} className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-white text-sm font-semibold leading-snug">{entries[0].headline}</CardTitle>
              <span className="text-gray-500 text-xs whitespace-nowrap">
                {entries[0].submittedAt ? new Date(entries[0].submittedAt).toLocaleDateString() : "—"}
              </span>
            </div>
            <p className="text-gray-500 text-xs">Model: {entries[0].modelUsed} · Topic #{entries[0].topicId}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {entries.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={log.status} />
                    <span className="text-gray-300">{log.siteLabel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {log.publishedUrl && safeBacklinkHref(log.publishedUrl) && (
                      <a href={safeBacklinkHref(log.publishedUrl)!} target="_blank" rel="noopener noreferrer"
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-xs">
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {log.errorMessage && (
                      <span className="text-red-400 text-xs max-w-64">Adapter reported an error; use sanitized server diagnostics.</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Backlinks Tab ────────────────────────────────────────────────────────────

function safeBacklinkHref(value: string): string | null {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    const isIpAddress = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.includes(":");
    const isFirstParty = host === "breakyoursolarcontract.com"
      || host.endsWith(".breakyoursolarcontract.com");
    const isLocal = host === "localhost"
      || host.endsWith(".localhost")
      || host.endsWith(".local")
      || host.endsWith(".internal");

    if (
      parsed.protocol !== "https:"
      || parsed.username
      || parsed.password
      || (parsed.port && parsed.port !== "443")
      || !host.includes(".")
      || isIpAddress
      || isFirstParty
      || isLocal
    ) return null;

    parsed.hash = "";
    return parsed.href;
  } catch {
    return null;
  }
}

function BacklinksTab() {
  const [statusFilter, setStatusFilter] = useState<"new" | "approved" | "rejected" | "promoted" | undefined>("new");
  const { data: opportunities = [] } = trpc.backlinks.getOpportunities.useQuery({
    status: statusFilter,
    limit: 100,
    offset: 0,
  });
  
  const utils = trpc.useUtils();

  const updateOpp = trpc.backlinks.updateOpportunity.useMutation({
    onSuccess: () => { utils.backlinks.getOpportunities.invalidate(); },
    onError: () => toast.error('Candidate was not updated', { description: 'Review sanitized server diagnostics.' }),
  });

  const seedSites = trpc.backlinks.seedKnownSites.useMutation({
    onSuccess: (result) => {
      toast.success(`Queued ${result.queued} historical candidates for verification`);
      utils.backlinks.getOpportunities.invalidate();
    },
    onError: () => toast.error('Unable to queue research candidates'),
  });

  const runDiscovery = trpc.pressRelease.runDiscovery.useMutation({
    onSuccess: (r) => {
      if (r.errors.length > 0) {
        toast.warning('Research queue completed with limited results', {
          description: `${r.newOpportunities} unverified candidate(s) added; review sanitized server diagnostics.`,
        });
      } else {
        toast.success(`Research queue updated: ${r.newOpportunities} unverified candidates added`);
      }
      utils.backlinks.getOpportunities.invalidate();
    },
    onError: () => toast.error('Unable to generate the research queue'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {(["new", "approved", "rejected", "promoted"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s === statusFilter ? undefined : s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                statusFilter === s
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                  : "border-white/10 text-gray-400 hover:border-white/30"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-white/10 text-gray-300 hover:text-white"
            onClick={() => seedSites.mutate()}
            disabled={seedSites.isPending}
          >
            <Link2 className="w-3.5 h-3.5 mr-1" />
            {seedSites.isPending ? "Queuing..." : "Queue Historical Candidates"}
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => runDiscovery.mutate()}
            disabled={runDiscovery.isPending}
          >
            <Search className="w-3.5 h-3.5 mr-1" />
            {runDiscovery.isPending ? "Generating..." : "Generate Research Queue"}
          </Button>
        </div>
      </div>

      {opportunities.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Link2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="mb-3">No research candidates yet.</p>
          <p className="text-sm max-w-2xl mx-auto">
            Queue historical candidates or generate model suggestions. Every result is unverified and must be checked for current availability, editorial fit, submission policy, pricing, and link attributes before approval.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {opportunities.map((opp) => {
          const safeHref = safeBacklinkHref(opp.url);
          return (
          <div key={opp.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <StatusBadge status={opp.status} />
                  <span className="text-xs text-gray-500 font-mono">{opp.type}</span>
                  {opp.status === "new" && (
                    <span className="text-xs text-amber-300">unverified research</span>
                  )}
                  {opp.relevanceScore !== null && opp.relevanceScore !== undefined && (
                    <span className="text-xs text-gray-500" title="Model-generated topical-fit sorting aid; not authority or expected SEO impact">
                      modeled topical fit {opp.relevanceScore}/100
                    </span>
                  )}
                </div>
                <p className="text-white font-medium text-sm">{opp.name ?? opp.url}</p>
                {safeHref ? (
                  <a href={safeHref} target="_blank" rel="noopener noreferrer"
                    className="text-amber-400/70 text-xs hover:text-amber-400 flex items-center gap-1 mt-0.5">
                    {safeHref} <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <p className="text-red-300/80 text-xs mt-0.5">Unsafe or invalid external URL hidden</p>
                )}
                {opp.relevanceReason && (
                  <p className="text-gray-400 text-xs mt-1">{opp.relevanceReason}</p>
                )}
                {opp.discoveredVia && (
                  <p className="text-gray-600 text-xs mt-0.5">via: {opp.discoveredVia}</p>
                )}
              </div>
              {opp.status === "new" && (
                <div className="flex gap-1.5 flex-shrink-0">
                  <Button
                    size="sm"
                    className="bg-green-600/20 hover:bg-green-600/40 text-green-300 border border-green-500/30 h-7 px-2 text-xs"
                    onClick={() => updateOpp.mutate({ id: opp.id, status: "approved" })}
                  >
                    Approve after verification
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 h-7 px-2 text-xs"
                    onClick={() => updateOpp.mutate({ id: opp.id, status: "rejected" })}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab() {
  const { data: settings = {} } = trpc.pressRelease.getSettings.useQuery();
  const utils = trpc.useUtils();

  const updateSetting = trpc.pressRelease.updateSetting.useMutation({
    onSuccess: () => { toast.success('Setting saved'); utils.pressRelease.getSettings.invalidate(); },
    onError: () => toast.error('Setting was not saved', { description: 'Review sanitized server diagnostics.' }),
  });

  const MODELS = [
    { value: "openrouter/free", label: "OpenRouter Free Models Router — variable availability" },
    { value: "openrouter/owl-alpha", label: "Owl Alpha — verify provider availability" },
    { value: "qwen/qwen3-8b:free", label: "Qwen 3 8B — verify provider availability" },
    { value: "google/gemini-flash-1.5:free", label: "Gemini Flash 1.5 — verify provider availability" },
    { value: "meta-llama/llama-3.1-8b-instruct:free", label: "Llama 3.1 8B — verify provider availability" },
    { value: "tencent/hunyuan-a13b-instruct:free", label: "Tencent HunyuanT1 Preview — verify provider availability" },
    { value: "deepseek/deepseek-chat-v3-0324:free", label: "DeepSeek V4 Flash — verify provider availability" },
    { value: "google/gemini-2.5-flash-preview", label: "Gemini 2.5 Flash Preview — verify provider availability" },
    { value: "qwen/qwen3-14b", label: "Qwen 3 14B — verify provider availability" },
    { value: "google/gemini-flash-2.0", label: "Gemini Flash 2.0 — verify provider availability" },
    { value: "anthropic/claude-3-haiku", label: "Claude 3 Haiku — verify provider availability" },
  ];

  const IMAGE_MODELS = [
    { value: "none", label: "Disabled — no image generation" },
    { value: "bytedance-seed/seedream-4.5", label: "Seedream 4.5 — verify provider availability" },
    { value: "google/gemini-3.1-flash-image-preview", label: "Gemini 3.1 Flash Image — verify provider availability" },
    { value: "google/gemini-2.5-flash-image", label: "Gemini 2.5 Flash Image — verify provider availability" },
  ];

  const EMBEDDING_MODELS = [
    { value: "none", label: "Disabled — no embeddings" },
    { value: "qwen/qwen3-embedding-8b:nitro", label: "Qwen3 Embedding 8B Nitro — verify provider availability" },
    { value: "qwen/qwen3-embedding-8b:exacto", label: "Qwen3 Embedding 8B Exacto — verify provider availability" },
  ];

  const currentModel = (settings as any)["model"] ?? "openrouter/free";
  const currentImageModel = (settings as any)["image_model"] ?? "none";
  const currentEmbeddingModel = (settings as any)["embedding_model"] ?? "none";
  const storedScheduleEnabled = (settings as any)["schedule_enabled"] === "true";

  return (
    <div className="space-y-6 max-w-lg">
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base">AI Writing Model</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-gray-400 text-sm">Legacy provider options are listed for compatibility. Verify current availability, policy, and price in the provider account before an approved dry run.</p>
          <Select
            value={currentModel}
            onValueChange={(v) => updateSetting.mutate({ key: "model", value: v })}
          >
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1d24] border-white/10 text-white">
              {MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base">Legacy Image Model Setting (Inactive)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-gray-400 text-sm">This retained setting is not connected to the approval-first press-release draft flow and does not generate or store an image.</p>
          <Select
            value={currentImageModel}
            disabled
          >
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1d24] border-white/10 text-white">
              {IMAGE_MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base">Legacy Embedding Model Setting (Inactive)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-gray-400 text-sm">This retained setting is not connected to a production semantic-search or deduplication workflow. No quality claim is made for the listed legacy models.</p>
          <Select
            value={currentEmbeddingModel}
            disabled
          >
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1d24] border-white/10 text-white">
              {EMBEDDING_MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base">External Schedule (Disabled)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-gray-400 text-sm">The runtime scheduler is fail-closed. It cannot generate or submit external content, regardless of any retained legacy preference.</p>
          <div className="flex items-center gap-3">
            <Switch
              id="schedule"
              checked={false}
              disabled
            />
            <Label htmlFor="schedule" className="text-gray-300">
              Runtime execution disabled
            </Label>
          </div>
          {storedScheduleEnabled && (
            <p className="text-amber-300 text-xs">A legacy enabled preference is stored, but it has no execution authority.</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base">Legacy Distribution Adapters (Inactive)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-400 text-sm">These adapters are retained as migration inventory only. The current runtime cannot authenticate, submit, or publish through them, and no destination metric or acceptance claim is current.</p>

          {/* Playwright master toggle */}
          {[{ key: "playwright_enabled", label: "Playwright Browser Automation", desc: "Inactive legacy browser-submission adapter inventory (1888, OpenPR, PRFree, PRBuzz)" }].map((toggle) => (
              <div key={toggle.key} className="flex items-start gap-3 py-2 border-b border-white/5">
                <Switch
                  id={toggle.key}
                  checked={false}
                  disabled
                  className="mt-0.5"
                />
                <div>
                  <Label htmlFor={toggle.key} className="text-gray-200 text-sm">{toggle.label}</Label>
                  <p className="text-gray-500 text-xs mt-0.5">{toggle.desc}</p>
                </div>
              </div>
          ))}

          {/* Inactive legacy publication destinations */}
          {([
            { key: "medium_enabled", label: "Medium.com", desc: "Legacy adapter only; account state, policy, and publication acceptance are unverified." },
            { key: "linkedin_enabled", label: "LinkedIn Articles", desc: "Legacy adapter only; account state, policy, and publication acceptance are unverified." },
            { key: "substack_enabled", label: "Substack", desc: "Legacy adapter only; account state, policy, and publication acceptance are unverified." },
          ] as const).map((item) => {
            return (
              <div key={item.key} className="py-3 border-b border-white/5 last:border-0">
                <div className="flex items-start gap-3">
                  <Switch
                    id={item.key}
                    checked={false}
                    disabled
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={item.key} className="text-gray-200 text-sm">{item.label}</Label>
                      <span className="text-xs text-amber-300">inactive</span>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base">Distribution Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm">
            No third-party distribution credentials are accepted, stored, or used by this release. A future
            approved adapter must define a new least-privilege secret contract outside the browser bundle.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Cost Dashboard Tab ─────────────────────────────────────────────────────

function CostDashboardTab() {
  const [days, setDays] = useState(30);
  const { data: summary, isLoading } = trpc.aiCost.getSummary.useQuery({ days });
  const { data: byModel = [] } = trpc.aiCost.getByModel.useQuery({ days });
  const { data: byFeature = [] } = trpc.aiCost.getByFeature.useQuery({ days });
  const { data: recentLogs = [] } = trpc.aiCost.getRecentLogs.useQuery({ limit: 20 });

  const totalUsd = summary?.totalUsd ?? 0;
  const totalCalls = summary?.totalCalls ?? 0;

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold text-lg">Provider-Reported AI Cost</h2>
          <p className="text-gray-400 text-sm">Shows only calls routed through the cost tracker for which the provider returned billed cost. Direct or legacy calls can be absent; provider billing remains authoritative.</p>
        </div>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1d24] border-white/10 text-white">
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last 365 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Reported Cost", value: `$${totalUsd.toFixed(4)}`, sub: `last ${days} days` },
          { label: "Priced Calls", value: totalCalls.toLocaleString(), sub: "provider-reported" },
          { label: "Avg Reported/Call", value: totalCalls > 0 ? `$${(totalUsd / totalCalls).toFixed(6)}` : "—", sub: "priced calls only" },
          { label: "30-Day Run Rate", value: totalCalls > 0 ? `$${((totalUsd / days) * 30).toFixed(4)}` : "—", sub: "not a forecast or invoice" },
        ].map((card) => (
          <Card key={card.label} className="bg-white/5 border-white/10">
            <CardContent className="pt-4 pb-3">
              <p className="text-gray-400 text-xs mb-1">{card.label}</p>
              <p className="text-white text-xl font-mono font-bold">{card.value}</p>
              <p className="text-gray-600 text-xs mt-0.5">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* By Model */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-500" /> Cost by Model</CardTitle>
          </CardHeader>
          <CardContent>
            {byModel.length === 0 ? (
              <p className="text-gray-500 text-sm">No tracked priced calls in this period.</p>
            ) : (
              <div className="space-y-2">
                {byModel.map((row) => (
                  <div key={row.model} className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-200 text-xs font-mono truncate">{row.model}</p>
                      <p className="text-gray-500 text-xs">{row.calls} calls · {((row.tokensIn + row.tokensOut) / 1000).toFixed(1)}K tokens</p>
                    </div>
                    <span className="text-amber-400 font-mono text-sm flex-shrink-0">${row.usd.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Feature */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2"><DollarSign className="w-4 h-4 text-amber-500" /> Cost by Feature</CardTitle>
          </CardHeader>
          <CardContent>
            {byFeature.length === 0 ? (
              <p className="text-gray-500 text-sm">No tracked priced calls in this period.</p>
            ) : (
              <div className="space-y-2">
                {byFeature.map((row) => (
                  <div key={row.feature} className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-200 text-sm capitalize">{row.feature.replace(/_/g, " ")}</p>
                      <p className="text-gray-500 text-xs">{row.calls} calls</p>
                    </div>
                    <span className="text-amber-400 font-mono text-sm flex-shrink-0">${row.usd.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent log */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm">Recent Tracked Priced Calls</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-gray-500 text-sm">No API calls logged yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-white/10">
                    <th className="text-left py-2 pr-4">Time</th>
                    <th className="text-left py-2 pr-4">Feature</th>
                    <th className="text-left py-2 pr-4">Model</th>
                    <th className="text-left py-2 pr-4">Type</th>
                    <th className="text-right py-2">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-1.5 pr-4 text-gray-500 font-mono whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="py-1.5 pr-4 text-gray-300 capitalize">{log.feature.replace(/_/g, " ")}</td>
                      <td className="py-1.5 pr-4 text-gray-400 font-mono truncate max-w-[160px]">{log.model}</td>
                      <td className="py-1.5 pr-4">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                          log.callType === "image" ? "bg-purple-500/20 text-purple-300" :
                          log.callType === "embedding" ? "bg-blue-500/20 text-blue-300" :
                          "bg-green-500/20 text-green-300"
                        }`}>{log.callType}</span>
                      </td>
                      <td className="py-1.5 text-right text-amber-400 font-mono">${parseFloat(log.costUsd ?? "0").toFixed(6)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PressReleaseAdmin() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  // Auth is handled by AdminLayout

  return (
    <AdminLayout title="Press Release & Backlink Engine" subtitle="Approval-first review engine · breakyoursolarcontract.com">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Tabs defaultValue="queue">
          <TabsList className="bg-white/5 border border-white/10 mb-6">
            <TabsTrigger value="queue" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
              <Newspaper className="w-3.5 h-3.5 mr-1.5" /> Queue
            </TabsTrigger>
            <TabsTrigger value="run" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
              <Play className="w-3.5 h-3.5 mr-1.5" /> Run Now
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
              <Clock className="w-3.5 h-3.5 mr-1.5" /> Logs
            </TabsTrigger>
            <TabsTrigger value="backlinks" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
              <Link2 className="w-3.5 h-3.5 mr-1.5" /> Backlinks
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
              <Settings className="w-3.5 h-3.5 mr-1.5" /> Settings
            </TabsTrigger>
            <TabsTrigger value="costs" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
              <DollarSign className="w-3.5 h-3.5 mr-1.5" /> Costs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queue"><TopicQueueTab /></TabsContent>
          <TabsContent value="run"><RunNowTab /></TabsContent>
          <TabsContent value="logs"><LogsTab /></TabsContent>
          <TabsContent value="backlinks"><BacklinksTab /></TabsContent>
          <TabsContent value="settings"><SettingsTab /></TabsContent>
          <TabsContent value="costs"><CostDashboardTab /></TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
