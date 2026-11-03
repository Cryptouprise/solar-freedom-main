import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
const date = (value: Date | string | null) => value ? new Date(value).toLocaleString() : "Not observed yet";
export default function AutonomousWorkStatus({ enabled }: { enabled: boolean }) {
  const [reviewId, setReviewId] = useState<number | null>(null);
  const state = trpc.autopilot.status.useQuery(undefined, { enabled, staleTime: 30_000, refetchInterval: 30_000 });
  const attempted = useRef(false);
  const activation = trpc.autopilot.activate.useMutation({ onSuccess: () => state.refetch() });
  const data = state.data?.autonomy;
  const preview = typeof window !== "undefined" && /\.manus\.computer$|localhost|127\.0\.0\.1/.test(window.location.hostname);
  useEffect(() => {
    if (!enabled || preview || !data || data.configured || attempted.current) return;
    attempted.current = true;
    activation.mutate();
  }, [enabled, preview, data?.configured]);
  if (!data) return null;
  const fresh = data.lastTickAt && Date.now() - new Date(data.lastTickAt).getTime() < 15 * 60_000;
  return <div className="mt-4 rounded-xl border border-cyan-300/30 bg-cyan-300/[0.04] p-4" data-autonomous-work-status>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-white">Daily execution loop</h3>
      <p className={`mt-1 text-sm ${fresh ? "text-cyan-200" : "text-amber-200"}`}>{fresh ? "Worker recently checked in" : data.configured ? "Configured—awaiting a recent worker delivery" : preview ? "Ready for Publish—production activation has not happened" : "Starting the deployed worker"}</p>
      <p className="mt-2 text-xs text-gray-400">Last real tick: {date(data.lastTickAt)} · {data.usedStepsToday}/{data.dailyStepLimit} bounded steps used today (UTC). Empty checks do not call a model.</p></div>
      {!preview && <button onClick={() => activation.mutate()} disabled={activation.isPending} className="rounded-lg border border-cyan-200/40 px-3 py-2 text-xs text-cyan-100 disabled:opacity-50">{activation.isPending ? "Checking deployed schedules…" : data.configured ? "Check / repair schedule bindings" : "Start daily loop"}</button>}
    </div>
    {preview && !data.configured && <p className="mt-3 text-xs text-amber-100">Publish this release. The first trusted agent/executor schedule starts the worker automatically; opening production Outcomes can start it sooner. No chat request is needed.</p>}
    {activation.error && <p className="mt-3 text-xs text-red-200">{activation.error.message}</p>}
    <p className="mt-3 text-xs text-gray-400">Automatic: saved work → short execution step → persisted result → next step or bounded retry. Content stays on its exact draft through Editor revisions. New article publication and external outreach still need approval.</p>
    <div className="mt-3 grid gap-2 lg:grid-cols-2">{data.jobs.map(job => <article key={job.id} className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs">
      <div className="flex justify-between gap-3"><span className="font-medium text-white">#{job.id} · {(job.role || job.kind).replace(/_/g, " ")}{job.pipelineId ? ` · draft #${job.pipelineId}` : ""}</span><span className={job.status === "failed" || job.status === "blocked" ? "text-red-200" : "text-cyan-200"}>{job.status === "completed" ? "Step finished" : job.status === "leased" ? "Working" : job.status}</span></div>
      <p className="mt-2 text-gray-300">{job.summary || "Saved for the next due worker tick. Not yet executed."}</p>
      {job.error && <p className="mt-2 break-words text-red-200">{job.error}</p>}
      <p className="mt-2 text-gray-500">{job.steps} saved steps · {job.failures} consecutive failures · updated {date(job.updatedAt)}{job.status === "queued" ? ` · eligible ${date(job.nextRunAt)}` : ""}</p>
      {job.pipelineId && <button className="mt-2 inline-block text-amber-200 underline" onClick={() => setReviewId(job.pipelineId)}>View exact saved draft #{job.pipelineId}</button>}
    </article>)}</div>
    {reviewId && <SavedDraftReview id={reviewId} close={() => setReviewId(null)} />}
    {!data.jobs.length && <p className="mt-3 text-xs text-gray-400">No work has been dispatched through this new loop yet. No completed delivery is claimed.</p>}
  </div>;
}

function SavedDraftReview({ id, close }: { id: number; close: () => void }) {
  const state = trpc.autopilot.pipelineDraft.useQuery({ id });
  return <div className="mt-4 rounded-xl border border-amber-200/30 bg-black/30 p-4" data-saved-draft-review>
    <div className="flex justify-between gap-4"><h4 className="font-semibold text-white">Saved draft #{id}</h4><button className="text-xs text-gray-300 underline" onClick={close}>Close review</button></div>
    {state.isLoading && <p className="mt-3 text-sm text-gray-400">Loading this exact draft…</p>}
    {state.error && <p className="mt-3 text-sm text-red-200">{state.error.message}</p>}
    {state.data && <><p className="mt-2 text-sm text-white">{state.data.title} · {state.data.stage}</p>
      {state.data.feedback && <p className="mt-3 whitespace-pre-wrap text-xs text-amber-200">Editor: {state.data.feedback}</p>}
      {state.data.partialDraft && <><p className="mt-3 text-xs text-cyan-200">New draft/revision progress: {state.data.sectionsSaved}/6 sections. Not yet a complete approved article.</p><div className="prose prose-invert mt-3 max-h-96 overflow-auto text-sm"><Streamdown>{state.data.partialDraft}</Streamdown></div></>}
      {state.data.draft && <details className="mt-3"><summary className="cursor-pointer text-xs text-gray-200">Current saved full draft—stage {state.data.stage}</summary><div className="prose prose-invert mt-3 max-h-96 overflow-auto text-sm"><Streamdown>{state.data.draft}</Streamdown></div></details>}
      {!state.data.draft && !state.data.partialDraft && <p className="mt-3 text-xs text-gray-400">No draft text saved yet; no article completion or publication is claimed.</p>}
      <p className="mt-3 text-xs text-gray-500">This is a read-only evidence view. Nothing is published by opening it.</p></>}
  </div>;
}
