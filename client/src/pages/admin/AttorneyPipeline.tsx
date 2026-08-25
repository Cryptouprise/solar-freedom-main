import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MapPinned,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

type OutreachStatus =
  | "not_contacted"
  | "researching"
  | "ready_to_pitch"
  | "pitched"
  | "in_conversation"
  | "signed"
  | "rejected"
  | "not_interested";

type Prospect = {
  id: number;
  firmName: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  state: string | null;
  practiceAreas: string | null;
  overallScore: number;
  outreachStatus: OutreachStatus;
  outreachNotes: string | null;
  pitchAngle: string | null;
  sourceUrl: string | null;
  discoveredVia: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const COLUMNS: Array<{ id: OutreachStatus; label: string; description: string; color: string }> = [
  { id: "researching", label: "Research", description: "Verified source found; review fit", color: "border-sky-500/30" },
  { id: "ready_to_pitch", label: "Ready to pitch", description: "Contact angle is prepared", color: "border-violet-500/30" },
  { id: "pitched", label: "Contacted", description: "Outreach sent or call made", color: "border-amber-500/30" },
  { id: "in_conversation", label: "In conversation", description: "Commercial terms in progress", color: "border-orange-500/30" },
  { id: "signed", label: "Signed", description: "Set up as active partner in Lead Distribution", color: "border-emerald-500/30" },
];

function displayedStatus(status: OutreachStatus) {
  return status === "not_contacted" ? "researching" : status;
}

function parseAreas(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch {
    return [value];
  }
}

function scoreClass(score: number) {
  if (score >= 70) return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (score >= 45) return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  return "bg-white/5 text-gray-300 border-white/10";
}

export default function AttorneyPipeline() {
  const utils = trpc.useUtils();
  const { data: prospects = [], isLoading } = trpc.agents.listAttorneyProspects.useQuery();
  const research = trpc.agents.researchAttorneyProspects.useMutation({
    onSuccess: (result) => {
      void utils.agents.listAttorneyProspects.invalidate();
      void utils.agents.getChatThreads.invalidate({ agentSlug: "money_maker", limit: 50 });
      toast.success("Attorney research completed", { description: result.summary });
    },
    onError: error => toast.error("Research did not complete", { description: error.message }),
  });
  const updateProspect = trpc.agents.updateAttorneyProspect.useMutation({
    onSuccess: () => {
      void utils.agents.listAttorneyProspects.invalidate();
      toast.success("Pipeline updated");
    },
    onError: error => toast.error("Could not update prospect", { description: error.message }),
  });

  const [statesInput, setStatesInput] = useState("California, Texas, Florida");
  const [noteProspect, setNoteProspect] = useState<Prospect | null>(null);
  const [note, setNote] = useState("");

  const allProspects = prospects as Prospect[];
  const grouped = useMemo(() => {
    const groups = Object.fromEntries(COLUMNS.map(column => [column.id, [] as Prospect[]])) as Record<OutreachStatus, Prospect[]>;
    for (const prospect of allProspects) {
      const target = displayedStatus(prospect.outreachStatus);
      if (groups[target]) groups[target].push(prospect);
    }
    return groups;
  }, [allProspects]);

  const move = (prospect: Prospect, nextStatus: OutreachStatus) => {
    updateProspect.mutate({
      id: prospect.id,
      outreachStatus: nextStatus,
      outreachNotes: prospect.outreachNotes || undefined,
      pitchAngle: prospect.pitchAngle || undefined,
    });
  };

  const runResearch = () => {
    const states = statesInput.split(",").map(value => value.trim()).filter(Boolean).slice(0, 3);
    if (!states.length) {
      toast.error("Enter at least one state to research.");
      return;
    }
    research.mutate({ states });
  };

  const saveNote = () => {
    if (!noteProspect) return;
    const timestamp = new Date().toLocaleString();
    const prior = noteProspect.outreachNotes?.trim();
    const nextNotes = [prior, `[${timestamp}] ${note.trim()}`].filter(Boolean).join("\n\n");
    updateProspect.mutate({
      id: noteProspect.id,
      outreachStatus: noteProspect.outreachStatus,
      outreachNotes: nextNotes,
      pitchAngle: noteProspect.pitchAngle || undefined,
    }, { onSuccess: () => { setNoteProspect(null); setNote(""); } });
  };

  const stats = {
    total: allProspects.length,
    verified: allProspects.filter(prospect => prospect.sourceUrl).length,
    contacted: allProspects.filter(prospect => ["pitched", "in_conversation", "signed"].includes(prospect.outreachStatus)).length,
    signed: allProspects.filter(prospect => prospect.outreachStatus === "signed").length,
  };

  return (
    <AdminLayout title="Attorney Revenue Pipeline" subtitle="Evidence-backed attorney research, outreach progress, and next revenue actions">
      <div className="p-6 space-y-6 text-white">
        <Card className="border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-[#111318] to-[#111318]">
          <CardContent className="p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-amber-300 font-semibold">
                <Sparkles className="w-4 h-4" /> Money Maker execution board
              </div>
              <p className="text-sm text-gray-300 mt-2 leading-relaxed">
                The agent now researches real Google Maps listings, records the direct source link, and saves only source-backed prospects here. It does <strong className="text-white">not</strong> invent contacts or send outreach without your approval. Each card shows exactly what was found and what still needs to happen.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <input
                value={statesInput}
                onChange={event => setStatesInput(event.target.value)}
                aria-label="States to research"
                className="h-9 w-full sm:w-56 rounded-md border border-white/15 bg-black/20 px-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                placeholder="California, Texas, Florida"
              />
              <Button onClick={runResearch} disabled={research.isPending} className="bg-amber-500 hover:bg-amber-400 text-black font-semibold">
                {research.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                Research states
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Prospects", value: stats.total, icon: Building2, tone: "text-white" },
            { label: "Evidence verified", value: stats.verified, icon: ShieldCheck, tone: "text-sky-300" },
            { label: "Outreach started", value: stats.contacted, icon: MessageSquareText, tone: "text-amber-300" },
            { label: "Signed partners", value: stats.signed, icon: TrendingUp, tone: "text-emerald-300" },
          ].map(stat => (
            <Card key={stat.label} className="bg-white/5 border-white/10">
              <CardContent className="p-4 flex items-center gap-3">
                <stat.icon className={`w-5 h-5 ${stat.tone}`} />
                <div><div className="text-xl font-bold">{stat.value}</div><div className="text-xs text-gray-500">{stat.label}</div></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-gray-500"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading attorney pipeline…</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {COLUMNS.map((column, index) => (
              <section key={column.id} className={`min-w-0 rounded-xl border ${column.color} bg-white/[0.025] p-3`}>
                <header className="mb-3 pb-3 border-b border-white/10">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-semibold text-sm">{column.label}</h2>
                    <Badge className="border-white/10 bg-white/5 text-gray-300">{grouped[column.id].length}</Badge>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 leading-snug">{column.description}</p>
                </header>
                <div className="space-y-3">
                  {grouped[column.id].map(prospect => (
                    <ProspectCard
                      key={prospect.id}
                      prospect={prospect}
                      canMoveBack={index > 0}
                      canMoveForward={index < COLUMNS.length - 1}
                      onMoveBack={() => move(prospect, COLUMNS[index - 1].id)}
                      onMoveForward={() => move(prospect, COLUMNS[index + 1].id)}
                      onAddNote={() => { setNoteProspect(prospect); setNote(""); }}
                      isUpdating={updateProspect.isPending}
                    />
                  ))}
                  {grouped[column.id].length === 0 && <p className="rounded-lg border border-dashed border-white/10 py-6 px-3 text-center text-xs text-gray-600">No prospects here yet.</p>}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <Dialog open={Boolean(noteProspect)} onOpenChange={open => !open && setNoteProspect(null)}>
        <DialogContent className="bg-[#12151b] border-white/10 text-white max-w-lg">
          <DialogHeader><DialogTitle>Add pipeline note — {noteProspect?.firmName}</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-400">Record the actual outcome: attempted call, reply received, pricing discussion, or why this prospect is not a fit.</p>
          <Textarea value={note} onChange={event => setNote(event.target.value)} placeholder="Example: Called intake line; requested partnership details be emailed to managing attorney." className="min-h-28 bg-black/25 border-white/15" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteProspect(null)} className="border-white/15 text-gray-300">Cancel</Button>
            <Button onClick={saveNote} disabled={!note.trim() || updateProspect.isPending} className="bg-amber-500 hover:bg-amber-400 text-black">Save evidence note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function ProspectCard({ prospect, canMoveBack, canMoveForward, onMoveBack, onMoveForward, onAddNote, isUpdating }: {
  prospect: Prospect;
  canMoveBack: boolean;
  canMoveForward: boolean;
  onMoveBack: () => void;
  onMoveForward: () => void;
  onAddNote: () => void;
  isUpdating: boolean;
}) {
  const areas = parseAreas(prospect.practiceAreas);
  return (
    <Card className="border-white/10 bg-[#12151b] shadow-none">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm leading-snug text-white">{prospect.firmName}</p>
            <p className="flex items-center gap-1 text-xs text-gray-500 mt-1"><MapPinned className="w-3 h-3" />{prospect.state || "Location pending"}</p>
          </div>
          <Badge className={`font-mono text-xs ${scoreClass(Number(prospect.overallScore || 0))}`}>{prospect.overallScore}/100</Badge>
        </div>

        <div className="flex flex-wrap gap-1">
          {areas.slice(0, 2).map((area, index) => <span key={`${area}-${index}`} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-gray-400">{area}</span>)}
          {prospect.discoveredVia && <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-300">{prospect.discoveredVia.replace(/_/g, " ")}</span>}
        </div>

        {prospect.sourceUrl ? (
          <a href={prospect.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-sky-300 hover:text-sky-200">
            <ShieldCheck className="w-3.5 h-3.5" /> Evidence source <ExternalLink className="w-3 h-3" />
          </a>
        ) : <p className="text-xs text-amber-300">Needs source verification before outreach.</p>}

        {prospect.pitchAngle && <p className="rounded-md border border-amber-500/15 bg-amber-500/5 p-2 text-[11px] leading-relaxed text-amber-100/80">{prospect.pitchAngle}</p>}
        {prospect.outreachNotes && <p className="line-clamp-3 text-[11px] leading-relaxed text-gray-500 whitespace-pre-line">{prospect.outreachNotes}</p>}

        <div className="flex items-center gap-1 border-t border-white/5 pt-2">
          {canMoveBack && <Button variant="ghost" size="sm" onClick={onMoveBack} disabled={isUpdating} className="h-7 px-2 text-xs text-gray-400 hover:text-white"><ArrowLeft className="w-3 h-3 mr-1" />Back</Button>}
          <Button variant="ghost" size="sm" onClick={onAddNote} className="h-7 px-2 text-xs text-gray-400 hover:text-white"><MessageSquareText className="w-3 h-3 mr-1" />Note</Button>
          {canMoveForward && <Button variant="ghost" size="sm" onClick={onMoveForward} disabled={isUpdating} className="h-7 px-2 ml-auto text-xs text-amber-300 hover:text-amber-200">Advance<ArrowRight className="w-3 h-3 ml-1" /></Button>}
          {!canMoveForward && <Badge className="ml-auto border-emerald-500/25 bg-emerald-500/10 text-emerald-300 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" />Needs partner setup</Badge>}
        </div>
        <p className="flex items-center gap-1 text-[10px] text-gray-600"><Calendar className="w-3 h-3" />Updated {new Date(prospect.updatedAt).toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}
