import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function CityRecovery() {
  const utils = trpc.useUtils();
  const targets = trpc.cityRecovery.targets.useQuery();
  const [slug, setSlug] = useState("");
  const workspace = trpc.cityRecovery.workspace.useQuery(
    { slug },
    { enabled: Boolean(slug) },
  );
  const latest = workspace.data?.revisions[0];
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const payload = latest?.recovery?.payload;
    setDraft(payload ? JSON.stringify(payload, null, 2) : "");
  }, [latest?.id]);

  const parsedDraft = useMemo(() => {
    try {
      return draft ? { value: JSON.parse(draft), error: "" } : { value: null, error: "" };
    } catch (error) {
      return { value: null, error: error instanceof Error ? error.message : "Invalid JSON" };
    }
  }, [draft]);

  const refresh = async () => {
    await Promise.all([
      utils.cityRecovery.targets.invalidate(),
      slug ? utils.cityRecovery.workspace.invalidate({ slug }) : Promise.resolve(),
    ]);
  };
  const save = trpc.cityRecovery.saveDraft.useMutation({
    onSuccess: async result => {
      toast[result.qa.passed ? "success" : "warning"](`QA ${result.qa.score}/100`);
      await refresh();
    },
    onError: error => toast.error(error.message),
  });
  const review = trpc.cityRecovery.review.useMutation({
    onSuccess: async () => { toast.success("Editorial decision recorded"); await refresh(); },
    onError: error => toast.error(error.message),
  });
  const publish = trpc.cityRecovery.publish.useMutation({
    onSuccess: async () => { toast.success("City recovery published"); await refresh(); },
    onError: error => toast.error(error.message),
  });
  const rollback = trpc.cityRecovery.rollback.useMutation({
    onSuccess: async () => { toast.success("City recovery rolled back"); await refresh(); },
    onError: error => toast.error(error.message),
  });

  const latestQa = latest?.recovery?.qa;
  const busy = save.isPending || review.isPending || publish.isPending || rollback.isPending;

  return (
    <AdminLayout title="City Page Recovery" subtitle="Recover one allowlisted city at a time with deterministic QA and owner-only publishing.">
      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <section className="rounded-xl border border-white/10 bg-[#111318] p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Prioritized targets</h2>
          <div className="max-h-[75vh] space-y-2 overflow-y-auto">
            {targets.data?.map(target => (
              <button
                key={target.slug}
                type="button"
                onClick={() => setSlug(target.slug)}
                className={`w-full rounded-lg border p-3 text-left ${slug === target.slug ? "border-amber-500/60 bg-amber-500/10" : "border-white/5 bg-white/[0.02] hover:border-white/20"}`}
              >
                <div className="flex justify-between gap-3">
                  <span className="font-medium text-white">{target.name}, {target.stateCode}</span>
                  <span className="text-xs text-amber-400">{target.workflowStage}</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-500">
                  <span>{target.gscImpressions} imp.</span>
                  <span>{target.gscClicks} clicks</span>
                  <span>Pos. {target.gscAvgPosition ?? "—"}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-[#111318] p-5">
          {!slug ? (
            <p className="text-gray-400">Select a city to inspect its recovery workspace.</p>
          ) : workspace.isLoading ? (
            <p className="text-gray-400">Loading workspace…</p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">{workspace.data?.city.name}, {workspace.data?.city.state}</h2>
                  <p className="mt-1 text-sm text-gray-500">{latest ? `Revision #${latest.id} · ${latest.stage}` : "No recovery draft yet"}</p>
                </div>
                {latestQa && (
                  <div className={`rounded-lg border px-4 py-2 ${latestQa.passed ? "border-emerald-500/40 text-emerald-300" : "border-red-500/40 text-red-300"}`}>
                    QA {latestQa.score}/100 · {latestQa.passed ? "passed" : "blocked"}
                  </div>
                )}
              </div>

              {latestQa && (latestQa.blockers.length > 0 || latestQa.warnings.length > 0) && (
                <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4 text-sm">
                  {latestQa.blockers.map(item => <p key={item} className="text-red-300">Blocker: {item}</p>)}
                  {latestQa.warnings.map(item => <p key={item} className="text-amber-300">Warning: {item}</p>)}
                </div>
              )}

              <label className="mt-6 block text-sm font-medium text-white" htmlFor="city-recovery-json">Structured rewrite package</label>
              <p className="mt-1 text-xs text-gray-500">Edit the versioned payload. Saving reruns deterministic QA; it never publishes.</p>
              <textarea
                id="city-recovery-json"
                value={draft}
                onChange={event => setDraft(event.target.value)}
                className="mt-3 min-h-[480px] w-full rounded-lg border border-white/10 bg-black/30 p-4 font-mono text-xs leading-5 text-gray-200 outline-none focus:border-amber-500/60"
                spellCheck={false}
              />
              {parsedDraft.error && <p className="mt-2 text-sm text-red-400">{parsedDraft.error}</p>}

              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  disabled={busy || !parsedDraft.value}
                  onClick={() => save.mutate({ id: latest?.stage === "in_review" || latest?.stage === "revision_needed" ? latest.id : undefined, slug, payload: parsedDraft.value })}
                >
                  Save & run QA
                </Button>
                <Button variant="outline" disabled={busy || !latest?.id || !latestQa?.passed} onClick={() => review.mutate({ id: latest!.id, decision: "approve", feedback: "Editorial review completed in City Recovery workspace." })}>
                  Editorial approve
                </Button>
                <Button variant="outline" disabled={busy || !latest?.id} onClick={() => review.mutate({ id: latest!.id, decision: "revision_needed", feedback: "Revision requested in City Recovery workspace." })}>
                  Request revision
                </Button>
                <Button disabled={busy || latest?.stage !== "approved" || !latestQa?.passed} onClick={() => publish.mutate({ id: latest!.id })}>
                  Approve & publish
                </Button>
                <Button variant="destructive" disabled={busy || latest?.stage !== "published"} onClick={() => rollback.mutate({ id: latest!.id })}>
                  Roll back
                </Button>
                <a href={`/cancel-solar-contract/${slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 text-sm text-amber-400">
                  View current page ↗
                </a>
              </div>
            </>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
