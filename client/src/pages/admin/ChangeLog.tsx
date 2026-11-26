import { useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CHANGE_LOG,
  changeLogByClass,
  pendingMeasurements,
  recurringClasses,
  type ChangeClass,
  type ChangeConfidence,
  type ChangeEntry,
} from "@shared/changeLog";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Clock, Shield } from "lucide-react";

/**
 * The owner asked to always be able to see what changed, why, and how the conclusion
 * was reached. This page answers those three questions per change, in that order, and
 * refuses to show a result before its measurement window has closed.
 */

const CLASS_LABEL: Record<ChangeClass, string> = {
  content: "Content",
  SEO: "SEO",
  defect: "Defect",
  accuracy: "Accuracy",
  infrastructure: "Infrastructure",
  conversion: "Conversion",
};

const CLASS_STYLE: Record<ChangeClass, string> = {
  content: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  SEO: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  defect: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  accuracy: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  infrastructure: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  conversion: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

const CONFIDENCE: Record<ChangeConfidence, { label: string; hint: string; style: string }> = {
  measured: {
    label: "Measured",
    hint: "Backed by a number pulled from a data source.",
    style: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  verified: {
    label: "Verified",
    hint: "Read from a primary source on a stated date.",
    style: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  reasoned: {
    label: "Reasoned",
    hint: "A judgement call. No measurement yet.",
    style: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  unverified: {
    label: "Unverified",
    hint: "Must not ship to customers in this state.",
    style: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  },
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function EntryCard({ entry }: { entry: ChangeEntry }) {
  const [open, setOpen] = useState(false);
  const conf = CONFIDENCE[entry.confidence];
  const pending = entry.measureAfter && entry.measureAfter > todayIso();

  return (
    <Card className="bg-slate-900/60 border-white/10">
      <CardHeader className="pb-3">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-start gap-3 text-left w-full group"
        >
          <span className="mt-0.5 text-gray-500 group-hover:text-amber-400 transition-colors">
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </span>
          <span className="flex-1 min-w-0">
            <span className="flex flex-wrap items-center gap-2 mb-1.5">
              <Badge variant="outline" className={CLASS_STYLE[entry.class]}>
                {CLASS_LABEL[entry.class]}
              </Badge>
              <Badge variant="outline" className={conf.style} title={conf.hint}>
                {conf.label}
              </Badge>
              <span className="text-xs text-gray-500 font-mono">{entry.date}</span>
            </span>
            <CardTitle className="text-white text-base leading-snug">{entry.title}</CardTitle>
          </span>
        </button>
      </CardHeader>

      {open && (
        <CardContent className="pt-0 space-y-4 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1.5 font-mono">What changed</div>
            <ul className="space-y-1">
              {entry.changed.map(line => (
                <li key={line} className="text-gray-300 flex gap-2">
                  <span className="text-gray-600 shrink-0">—</span>
                  <span className="font-mono text-xs leading-relaxed break-all">{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1.5 font-mono">
              Why — the evidence
            </div>
            <p className="text-gray-300 leading-relaxed">{entry.evidence}</p>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1.5 font-mono">
              How the conclusion was reached
            </div>
            <p className="text-gray-400 leading-relaxed">{entry.reasoning}</p>
          </div>

          <div className="rounded border border-white/10 bg-black/20 p-3">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1.5 font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Verified by
            </div>
            <code className="text-xs text-emerald-300/90 break-all leading-relaxed">
              {entry.verifiedBy}
            </code>
          </div>

          {entry.preventsRecurrence && (
            <div className="rounded border border-violet-500/25 bg-violet-500/5 p-3">
              <div className="text-xs uppercase tracking-wider text-violet-300/80 mb-1.5 font-mono flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Stops it coming back
              </div>
              <p className="text-violet-100/80 leading-relaxed">{entry.preventsRecurrence}</p>
            </div>
          )}

          {entry.measureAfter && (
            <div
              className={`rounded border p-3 ${
                pending
                  ? "border-amber-500/25 bg-amber-500/5"
                  : "border-emerald-500/25 bg-emerald-500/5"
              }`}
            >
              <div className="text-xs uppercase tracking-wider mb-1.5 font-mono flex items-center gap-1.5 text-amber-300/80">
                <Clock className="w-3.5 h-3.5" />
                {pending ? "Too early to judge" : "Ready to measure"}
              </div>
              <p className="text-gray-300 leading-relaxed">
                {pending
                  ? `No result will be reported before ${entry.measureAfter}. Reporting one earlier would be noise, not progress.`
                  : `The window has closed. This can now be measured against the ${entry.measureAfter} baseline.`}
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function ChangeLog() {
  const [filter, setFilter] = useState<ChangeClass | "all">("all");

  const grouped = useMemo(() => changeLogByClass(), []);
  const recurring = useMemo(() => recurringClasses(), []);
  const pending = useMemo(() => pendingMeasurements(todayIso()), []);

  const visible = useMemo(
    () =>
      [...CHANGE_LOG]
        .filter(e => filter === "all" || e.class === filter)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [filter],
  );

  const classes = Object.keys(CLASS_LABEL) as ChangeClass[];

  return (
    <AdminLayout
      title="Change Log"
      subtitle="Every change, why it was made, and how the conclusion was reached"
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="bg-slate-900/60 border-white/10">
            <CardContent className="p-4">
              <div className="text-2xl font-semibold text-white">{CHANGE_LOG.length}</div>
              <div className="text-xs text-gray-400 mt-0.5">Changes recorded</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/60 border-white/10">
            <CardContent className="p-4">
              <div className="text-2xl font-semibold text-white">
                {CHANGE_LOG.filter(e => e.preventsRecurrence).length}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">With a guard against repeat</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/60 border-white/10">
            <CardContent className="p-4">
              <div className="text-2xl font-semibold text-amber-400">{pending.length}</div>
              <div className="text-xs text-gray-400 mt-0.5">Awaiting a fair measurement</div>
            </CardContent>
          </Card>
        </div>

        {recurring.length > 0 && (
          <Card className="bg-amber-500/5 border-amber-500/25">
            <CardContent className="p-4 flex gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="text-amber-200 font-medium mb-1">
                  Recurring class{recurring.length > 1 ? "es" : ""}: {recurring.map(c => CLASS_LABEL[c]).join(", ")}
                </div>
                <p className="text-amber-100/70 leading-relaxed">
                  These categories have failed more than once. Each recurrence now carries a test or
                  script that fails the build if it happens again, because a correction alone clearly
                  was not enough.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            All ({CHANGE_LOG.length})
          </Button>
          {classes.map(c => {
            const n = grouped[c]?.length ?? 0;
            if (!n) return null;
            return (
              <Button
                key={c}
                size="sm"
                variant={filter === c ? "default" : "outline"}
                onClick={() => setFilter(c)}
              >
                {CLASS_LABEL[c]} ({n})
              </Button>
            );
          })}
        </div>

        <div className="space-y-3">
          {visible.map(entry => (
            <EntryCard key={`${entry.date}-${entry.title}`} entry={entry} />
          ))}
        </div>

        <Card className="bg-slate-900/40 border-white/10">
          <CardContent className="p-4 text-xs text-gray-400 leading-relaxed space-y-2">
            <p>
              <span className="text-gray-300 font-medium">How to read the confidence badge.</span>{" "}
              <span className="text-emerald-300">Measured</span> means a number from a data source.{" "}
              <span className="text-sky-300">Verified</span> means read from a primary source on a
              stated date. <span className="text-amber-300">Reasoned</span> means a judgement call with
              no measurement yet — treat it as a hypothesis.
            </p>
            <p>
              <span className="text-gray-300 font-medium">Why some changes show no result.</span> A
              change targeting rankings or traffic cannot be judged until a like-for-like window
              closes. Reporting a move before then would be measuring noise, so the entry stays marked
              "too early to judge" until the date passes.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
