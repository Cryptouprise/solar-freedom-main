import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

function ReviewControl() {
  const auth = trpc.auth.me.useQuery();
  const review = trpc.autopilot.reviewAppearance.useMutation();
  const [capturing, setCapturing] = useState(false), [error, setError] = useState<string | null>(null), [expanded, setExpanded] = useState(true);
  if (auth.data?.role !== "admin") return null;
  const run = async () => {
    setCapturing(true); setError(null);
    try { const { capturePageAppearance } = await import("@/lib/pageAppearanceCapture"); const input = await capturePageAppearance(); setCapturing(false); await review.mutateAsync(input); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Capture/review unavailable; no fix claimed."); }
    finally { setCapturing(false); }
  };
  return <aside data-owner-visual-review className="fixed right-3 top-20 z-[90] w-[min(360px,calc(100vw-24px))] rounded-xl border border-cyan-300/50 bg-zinc-950 p-4 text-sm text-white shadow-2xl">
    <div className="flex justify-between gap-3"><strong>Owner-only Argon page review</strong><button onClick={() => setExpanded(value => !value)} className="text-cyan-200 underline">{expanded ? "Minimize" : "Open"}</button></div>
    {expanded && <><p className="mt-2 text-xs text-zinc-300">Capture this view's top, middle and bottom. Argon checks readability, imagery and buttons. Uses OpenRouter; saving a review does not publish a change.</p>
      <button disabled={capturing || review.isPending} onClick={run} className="mt-3 w-full rounded-lg bg-cyan-300 px-3 py-3 font-bold text-black disabled:opacity-50">{capturing ? "Capturing page…" : review.isPending ? "Argon is inspecting captures…" : "Review this page with Argon"}</button>
      {(error || review.error) && <p role="alert" className="mt-2 text-xs text-red-200">{error || review.error?.message}</p>}
      {review.data && <div className="mt-3 max-h-[45vh] overflow-y-auto text-xs"><p className="font-semibold text-cyan-200">{review.data.assessment.verdict === "pass" ? "No repair observed in captures" : "Specific repairs identified"} · receipt #{review.data.actionId}</p><p className="mt-2">{review.data.assessment.summary}</p>{review.data.assessment.issues.map((issue, i) => <div key={i} className="mt-2 border-t border-white/10 pt-2"><strong>{issue.area}: {issue.severity}</strong><p>{issue.evidence}</p><p className="mt-1 text-cyan-100">Repair: {issue.repair}</p></div>)}<p className="mt-3 text-zinc-400">{review.data.nextStep}</p><p className="mt-2 text-zinc-400">Cost: {review.data.costUsd === null ? "not reported" : `$${review.data.costUsd.toFixed(4)}`} · {review.data.costSource}. No public edit performed.</p></div>}
      <a className="mt-3 block text-xs text-cyan-200 underline" href="/admin/outcomes">Saved reviews and measured results</a>
    </>}
  </aside>;
}
export default function OwnerVisualReview() {
  const [location] = useLocation();
  const requested = new URLSearchParams(window.location.search).get("appearanceReview") === "1";
  return requested && /^\/(?:blog|cancel-solar-contract)\/[a-z0-9-]+$/.test(location) ? <ReviewControl key={location} /> : null;
}
