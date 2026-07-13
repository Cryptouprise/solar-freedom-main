import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus, Play, Pause, Trash2, ChevronDown, ChevronUp,
  Clock, CheckCircle2, XCircle, Loader2, Bot, Calendar,
  Edit3, History, Zap
} from "lucide-react";

// ─── Cron presets ─────────────────────────────────────────────────────────────
const CRON_PRESETS = [
  { label: "Every day at 9 AM UTC", value: "0 0 9 * * *" },
  { label: "Every day at 6 AM UTC", value: "0 0 6 * * *" },
  { label: "Every day at midnight UTC", value: "0 0 0 * * *" },
  { label: "Every Monday at 9 AM UTC", value: "0 0 9 * * 1" },
  { label: "Every hour", value: "0 0 * * * *" },
  { label: "Every 6 hours", value: "0 0 */6 * * *" },
  { label: "Custom", value: "custom" },
];

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="outline" className="text-gray-400 border-gray-600">Never run</Badge>;
  if (status === "success") return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Success</Badge>;
  if (status === "blocked") return <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30">Blocked safely</Badge>;
  if (status === "error") return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Error</Badge>;
  if (status === "running") return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse">Running</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

// ─── Automation form ──────────────────────────────────────────────────────────
function AutomationForm({
  initial,
  onSave,
  onCancel,
  loading,
}: {
  initial?: { name: string; description: string; spec: string; cronExpression: string; cronLabel: string };
  onSave: (data: { name: string; description: string; spec: string; cronExpression: string; cronLabel: string }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [spec, setSpec] = useState(initial?.spec ?? "");
  const [cronPreset, setCronPreset] = useState(() => {
    if (!initial?.cronExpression) return "0 0 9 * * *";
    const preset = CRON_PRESETS.find(p => p.value === initial.cronExpression && p.value !== "custom");
    return preset ? preset.value : "custom";
  });
  const [cronCustom, setCronCustom] = useState(initial?.cronExpression ?? "");
  const [cronLabel, setCronLabel] = useState(initial?.cronLabel ?? "");

  const effectiveCron = cronPreset === "custom" ? cronCustom : cronPreset;
  const effectiveLabel = cronLabel || CRON_PRESETS.find(p => p.value === cronPreset)?.label || cronPreset;

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label className="text-gray-300">Automation Name *</Label>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. SEO GitHub Heartbeat"
          className="bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-amber-500"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-gray-300">Description</Label>
        <Input
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What does this automation do?"
          className="bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-amber-500"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-gray-300">Schedule</Label>
        <Select value={cronPreset} onValueChange={v => { setCronPreset(v); if (v !== "custom") setCronLabel(""); }}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1d24] border-white/10">
            {CRON_PRESETS.map(p => (
              <SelectItem key={p.value} value={p.value} className="text-gray-200 focus:bg-white/10">
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {cronPreset === "custom" && (
          <div className="space-y-1">
            <Input
              value={cronCustom}
              onChange={e => setCronCustom(e.target.value)}
              placeholder="6-field cron: 0 0 9 * * * (sec min hour dom mon dow)"
              className="bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-amber-500 font-mono text-sm"
            />
            <Input
              value={cronLabel}
              onChange={e => setCronLabel(e.target.value)}
              placeholder="Human-readable label (e.g. Daily at 9 AM UTC)"
              className="bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-amber-500 text-sm"
            />
          </div>
        )}
        <p className="text-gray-500 text-xs font-mono">Cron: {effectiveCron}</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-gray-300">Scheduled request / prompt *</Label>
        <p className="text-gray-500 text-xs">
          Prompt-only schedules create a blocked evidence receipt. They cannot touch GitHub, GSC, Manus, or production until a typed, allowlisted tool runner is connected.
        </p>
        <Textarea
          value={spec}
          onChange={e => setSpec(e.target.value)}
          placeholder={`Example:\nOnce per day, sync the GitHub repo MyOrg/my-repo from the main branch.\nCheck for the GitHub issue titled "Daily Heartbeat".\nIf open: read the latest body, summarize required actions, and create a follow-up issue with the action plan.\nIf closed: report that everything is clean.`}
          rows={12}
          className="bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-amber-500 font-mono text-sm resize-y"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          onClick={() => onSave({ name, description, spec, cronExpression: effectiveCron, cronLabel: effectiveLabel })}
          disabled={loading || !name.trim() || !spec.trim() || !effectiveCron}
          className="bg-amber-500 hover:bg-amber-400 text-black font-bold"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
          Save Automation
        </Button>
        <Button variant="outline" onClick={onCancel} className="border-white/10 text-gray-300 hover:bg-white/5">
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ─── Run history row ──────────────────────────────────────────────────────────
function RunRow({ run }: { run: { id: number; status: string; summary: string | null; startedAt: Date; completedAt: Date | null; durationMs: number | null } }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-white/5 rounded bg-white/3 text-sm">
      <button
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <StatusBadge status={run.status} />
        <span className="text-gray-400 font-mono text-xs">{new Date(run.startedAt).toLocaleString()}</span>
        {run.durationMs && <span className="text-gray-500 text-xs ml-auto">{(run.durationMs / 1000).toFixed(1)}s</span>}
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-500 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500 ml-1" />}
      </button>
      {expanded && run.summary && (
        <div className="px-4 pb-3 text-gray-300 text-xs leading-relaxed whitespace-pre-wrap border-t border-white/5 pt-2">
          {run.summary}
        </div>
      )}
    </div>
  );
}

// ─── Automation card ──────────────────────────────────────────────────────────
function AutomationCard({ automation, onRefresh }: {
  automation: {
    id: number; name: string; description: string | null; spec: string;
    cronExpression: string; cronLabel: string | null; scheduleCronTaskUid: string | null;
    isEnabled: number; lastRunAt: Date | null; lastRunStatus: string | null;
    lastRunSummary: string | null; runCount: number; createdAt: Date;
  };
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const utils = trpc.useUtils();
  const updateMut = trpc.automations.update.useMutation({ onSuccess: () => { onRefresh(); setEditing(false); } });
  const deleteMut = trpc.automations.delete.useMutation({
    onSuccess: () => { onRefresh(); toast.success("Automation deleted"); }
  });
  const activateMut = trpc.automations.activateSchedule.useMutation({
    onSuccess: (data) => {
      onRefresh();
      toast.success("Schedule activated", { description: `Next run: ${data.nextExecutionAt ? new Date(data.nextExecutionAt).toLocaleString() : "soon"}` });
    },
    onError: () => toast.error("Failed to activate", { description: "Review sanitized server diagnostics." }),
  });
  const deactivateMut = trpc.automations.deactivateSchedule.useMutation({
    onSuccess: () => { onRefresh(); toast.success("Schedule paused"); },
    onError: () => toast.error("Failed to pause", { description: "Review sanitized server diagnostics." }),
  });
  const runsQuery = trpc.automations.runs.useQuery(
    { id: automation.id, limit: 10 },
    { enabled: showHistory }
  );

  const handleActivate = () => {
    // The server authenticates this protected mutation from the HttpOnly cookie
    // and forwards credentials itself. Browser code must never read the token.
    activateMut.mutate({ id: automation.id });
  };

  const handleDeactivate = () => {
    deactivateMut.mutate({ id: automation.id });
  };

  const isActive = !!automation.scheduleCronTaskUid && automation.isEnabled === 1;

  return (
    <Card className="bg-[#12151c] border-white/8">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Bot className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <CardTitle className="text-white text-base">{automation.name}</CardTitle>
              {isActive
                ? <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Active</Badge>
                : <Badge variant="outline" className="text-gray-500 border-gray-600 text-xs">Paused</Badge>
              }
            </div>
            {automation.description && (
              <p className="text-gray-400 text-sm mt-1">{automation.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {automation.cronLabel || automation.cronExpression}
              </span>
              <span className="flex items-center gap-1">
                <History className="w-3 h-3" />
                {automation.runCount} runs
              </span>
              {automation.lastRunAt && (
                <span>Last: {new Date(automation.lastRunAt).toLocaleDateString()}</span>
              )}
              <StatusBadge status={automation.lastRunStatus} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isActive ? (
              <Button
                size="sm" variant="outline"
                onClick={handleDeactivate}
                disabled={deactivateMut.isPending}
                className="border-white/10 text-gray-300 hover:bg-white/5 h-8 px-2.5"
              >
                {deactivateMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pause className="w-3.5 h-3.5" />}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleActivate}
                disabled={activateMut.isPending}
                className="bg-amber-500 hover:bg-amber-400 text-black h-8 px-2.5"
              >
                {activateMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              </Button>
            )}
            <Button
              size="sm" variant="outline"
              onClick={() => setEditing(true)}
              className="border-white/10 text-gray-300 hover:bg-white/5 h-8 px-2.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm" variant="outline"
              onClick={() => deleteMut.mutate({ id: automation.id })}
              disabled={deleteMut.isPending}
              className="border-red-500/20 text-red-400 hover:bg-red-500/10 h-8 px-2.5"
            >
              {deleteMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Spec preview */}
        <button
          className="w-full text-left"
          onClick={() => setExpanded(e => !e)}
        >
          <div className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>View spec</span>
          </div>
        </button>
        {expanded && (
          <pre className="bg-black/30 rounded p-3 text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed border border-white/5">
            {automation.spec}
          </pre>
        )}

        {/* Last run summary */}
        {automation.lastRunSummary && (
          <div className="bg-white/3 rounded p-3 border border-white/5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Last run summary</p>
            <p className="text-sm text-gray-300 leading-relaxed">{automation.lastRunSummary}</p>
          </div>
        )}

        {/* Run history */}
        <button
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          onClick={() => setShowHistory(h => !h)}
        >
          <History className="w-3.5 h-3.5" />
          {showHistory ? "Hide" : "Show"} run history
        </button>
        {showHistory && (
          <div className="space-y-1.5">
            {runsQuery.isLoading && <p className="text-gray-500 text-xs">Loading...</p>}
            {runsQuery.data?.length === 0 && <p className="text-gray-500 text-xs">No runs yet.</p>}
            {runsQuery.data?.map(run => <RunRow key={run.id} run={run as any} />)}
          </div>
        )}
      </CardContent>

      {/* Edit dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="bg-[#0d0f14] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Automation</DialogTitle>
          </DialogHeader>
          <AutomationForm
            initial={{
              name: automation.name,
              description: automation.description ?? "",
              spec: automation.spec,
              cronExpression: automation.cronExpression,
              cronLabel: automation.cronLabel ?? "",
            }}
            onSave={(data) => updateMut.mutate({ id: automation.id, ...data })}
            onCancel={() => setEditing(false)}
            loading={updateMut.isPending}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AutomationBuilder() {
  const [creating, setCreating] = useState(false);
  const utils = trpc.useUtils();

  const listQuery = trpc.automations.list.useQuery();
  const createMut = trpc.automations.create.useMutation({
    onSuccess: () => {
      utils.automations.list.invalidate();
      setCreating(false);
      toast.success("Automation created", { description: "Click the play button to activate the schedule after deploying." });
    },
    onError: () => toast.error("Failed to create", { description: "Review sanitized server diagnostics." }),
  });

  const SEO_HEARTBEAT_SPEC = `Planning request only. Do not claim that any external action ran.

The typed GitHub Actions workflow owns the real daily heartbeat for:
Repo: Cryptouprise/solar-freedom-main
Branch: main
Issue: SEO Agent Daily Heartbeat

When typed GitHub and GSC tools are added to this scheduler, it may read the latest evidence and propose an approval-gated plan. Until then, record a blocked receipt with zero tool calls and zero state changes.`;

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Bot className="w-6 h-6 text-amber-400" />
              Automation Builder
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Schedule requests and inspect their evidence receipts. Prompt text alone is never treated as executed work.
            </p>
          </div>
          <Button
            onClick={() => setCreating(true)}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Automation
          </Button>
        </div>

        {/* Info banner */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-sm text-amber-200">
          <p className="font-semibold mb-1">Safety mode</p>
          <p className="text-amber-300/80 leading-relaxed">
            A schedule authenticates the trigger and records an evidence receipt. Because this builder does not yet have typed tool adapters, every prompt-only run is marked <strong>Blocked safely</strong> with zero tool calls and zero state changes. The GitHub SEO heartbeat uses a separate, typed workflow.
          </p>
        </div>

        {/* Create form */}
        {creating && (
          <Card className="bg-[#12151c] border-amber-500/30">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                New Automation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AutomationForm
                onSave={(data) => createMut.mutate(data)}
                onCancel={() => setCreating(false)}
                loading={createMut.isPending}
              />
            </CardContent>
          </Card>
        )}

        {/* Quick-add SEO heartbeat */}
        {!creating && listQuery.data?.length === 0 && (
          <Card className="bg-[#12151c] border-white/8">
            <CardContent className="py-8 text-center space-y-4">
              <Bot className="w-12 h-12 text-amber-400/40 mx-auto" />
              <div>
                <p className="text-white font-medium">No automations yet</p>
                <p className="text-gray-500 text-sm mt-1">Create your first automation or use the SEO heartbeat template below.</p>
              </div>
              <Button
                variant="outline"
                onClick={() => createMut.mutate({
                  name: "SEO GitHub Heartbeat",
                  description: "Planning request only. The typed GitHub Actions heartbeat performs the real read-only measurement work.",
                  spec: SEO_HEARTBEAT_SPEC,
                  cronExpression: "0 0 9 * * *",
                  cronLabel: "Every day at 9 AM UTC",
                })}
                disabled={createMut.isPending}
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                Add SEO Heartbeat Template
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Automation list */}
        {listQuery.isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          </div>
        )}
        {listQuery.data?.map(automation => (
          <AutomationCard
            key={automation.id}
            automation={automation as any}
            onRefresh={() => utils.automations.list.invalidate()}
          />
        ))}

        {/* Quick-add template when list is non-empty but no SEO heartbeat */}
        {!creating && (listQuery.data?.length ?? 0) > 0 && !listQuery.data?.find(a => a.name.toLowerCase().includes("seo")) && (
          <Card className="bg-[#12151c] border-dashed border-white/10">
            <CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm font-medium">SEO GitHub Heartbeat template</p>
                <p className="text-gray-500 text-xs">Planning-only schedule; no GitHub or indexing action is implied.</p>
              </div>
              <Button
                size="sm" variant="outline"
                onClick={() => createMut.mutate({
                  name: "SEO GitHub Heartbeat",
                  description: "Planning request only. The typed GitHub Actions heartbeat performs the real read-only measurement work.",
                  spec: SEO_HEARTBEAT_SPEC,
                  cronExpression: "0 0 9 * * *",
                  cronLabel: "Every day at 9 AM UTC",
                })}
                disabled={createMut.isPending}
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                {createMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                Add
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
