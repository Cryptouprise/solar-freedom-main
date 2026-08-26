import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function MetricCard({ label, value, sub, tone = "default" }: { label: string; value: number | string; sub: string; tone?: "default" | "warning" | "success" }) {
  const tones = {
    default: "border-white/10 bg-white/5 text-white",
    warning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  };
  return (
    <section className={`rounded-xl border p-5 ${tones[tone]}`}>
      <p className="text-xs font-mono uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="mt-2 text-xs text-gray-400">{sub}</p>
    </section>
  );
}

export default function OutcomeScorecard() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = trpc.performance.dailyScorecard.useQuery(
    { limit: 30 },
    { enabled: !!user && user.role === "admin", staleTime: 60_000 }
  );
  const seoRuns = trpc.agents.runs.useQuery({ agentSlug: "seo_intel", limit: 5 }, { enabled: !!user && user.role === "admin", staleTime: 60_000 });
  const seoActions = trpc.agents.actions.useQuery({ agentSlug: "seo_intel", limit: 8 }, { enabled: !!user && user.role === "admin", staleTime: 60_000 });
  const runScorecard = trpc.performance.runDailyScorecard.useMutation({
    onSuccess: () => { void refetch(); },
  });
  const latest = data?.snapshots?.[0];

  return (
    <AdminLayout title="Outcome Scorecard" subtitle="Organic clicks → views → durable leads → booked appointments">
      <main className="p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-400">
            One view of recovery. A metric is shown only after its source system records it.
          </p>
          <div className="flex gap-2">
          <button
            disabled={runScorecard.isPending}
            onClick={() => runScorecard.mutate()}
            className="rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-2 text-xs font-mono text-amber-100 transition hover:bg-amber-400/20 disabled:opacity-50"
          >
            {runScorecard.isPending ? "Creating verified baseline…" : "Run verified scorecard"}
          </button>
          <button
            onClick={() => refetch()}
            className="rounded-lg border border-white/15 px-3 py-2 text-xs font-mono text-gray-300 transition hover:border-amber-400 hover:text-white"
          >
            Refresh
          </button>
          </div>
        </div>

        {isLoading && <p className="py-16 text-center font-mono text-sm text-gray-400">Loading scorecard…</p>}
        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">The scorecard could not be loaded. It will not substitute zeroes for unavailable data.</p>}

        {!isLoading && !error && !latest && (
          <>
            <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-100">
              No verified scorecard snapshot exists yet. The first scheduled recovery check will write the baseline after Search Console, durable lead, CRM-delivery, and appointment sources respond.
            </section>
            <section className="rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-5">
              <h2 className="text-sm font-semibold text-violet-100">SEO execution evidence while the baseline is pending</h2>
              <p className="mt-1 text-sm text-gray-400">The scorecard will not invent a ranking baseline. Recent SEO Intel work remains visible here with its date, model, actions, and review status.</p>
              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <div className="rounded-lg border border-white/8 bg-black/20 p-3"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Recent runs</h3><div className="mt-2 space-y-2">{seoRuns.data?.length ? seoRuns.data.map(run => <div key={run.id} className="rounded bg-white/[0.03] px-3 py-2 text-xs"><div className="flex justify-between gap-3"><span className={run.status === "completed" ? "text-emerald-300" : "text-amber-300"}>{run.status}</span><span className="text-gray-500">{formatDate(run.completedAt || run.startedAt)}</span></div><p className="mt-1 text-gray-300 line-clamp-2">{run.summary || run.errorMessage || "No summary recorded"}</p><p className="mt-1 text-gray-500">{run.model || "model unavailable"} · {run.actionsCreated || 0} actions</p></div>) : <p className="py-3 text-xs text-gray-500">No SEO runs recorded yet.</p>}</div></div>
                <div className="rounded-lg border border-white/8 bg-black/20 p-3"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Reviewable actions</h3><div className="mt-2 space-y-2">{seoActions.data?.length ? seoActions.data.map(action => <div key={action.id} className="rounded bg-white/[0.03] px-3 py-2 text-xs"><div className="flex justify-between gap-3"><span className="text-violet-200">{action.title}</span><span className="text-amber-300">{action.status}</span></div><p className="mt-1 text-gray-400 line-clamp-2">{action.description}</p></div>) : <p className="py-3 text-xs text-gray-500">No SEO actions recorded yet.</p>}</div></div>
              </div>
            </section>
          </>
        )}

        {latest && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <MetricCard label="Organic clicks" value={latest.clicks} sub={`${latest.periodStart} to ${latest.periodEnd} · Search Console`} tone={latest.clicks > 0 ? "success" : "warning"} />
              <MetricCard label="Organic views" value={latest.impressions} sub={`${latest.pageRows} ranking pages · Search Console impressions`} tone={latest.impressions > 0 ? "success" : "warning"} />
              <MetricCard label="Organic CTR" value={`${Number(latest.ctrPercent || 0).toFixed(2)}%`} sub="Clicks divided by Search Console impressions" tone={Number(latest.ctrPercent || 0) >= 2 ? "success" : "warning"} />
              <MetricCard label="Average position" value={Number(latest.avgPosition || 0).toFixed(2)} sub="Impression-weighted Search Console position; lower is better" tone={Number(latest.avgPosition || 0) > 10 ? "warning" : "success"} />
              <MetricCard label="Durable leads" value={latest.durableLeads} sub="Website form submissions persisted to first-party storage" tone={latest.durableLeads > 0 ? "success" : "warning"} />
              <MetricCard label="Booked appointments" value={latest.bookedAppointments} sub="GoHighLevel appointment-booked events only" tone={latest.bookedAppointments > 0 ? "success" : "warning"} />
            </div>

            <section className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-sm font-semibold text-white">What to act on</h2>
              <p className="mt-1 text-sm text-gray-400">Latest verified snapshot: {formatDate(latest.capturedAt)}. Zero is a recorded zero only after the source event feed is active; unavailable sources remain visibly blocked.</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm">
                <div className="rounded-lg bg-black/20 p-3"><span className="text-gray-400">CRM deliveries</span><p className="mt-1 text-lg font-semibold text-white">{latest.crmDeliveries.toLocaleString()}</p></div>
                <div className="rounded-lg bg-black/20 p-3"><span className="text-gray-400">Verified backlinks</span><p className="mt-1 text-lg font-semibold text-white">{latest.verifiedBacklinks.toLocaleString()}</p></div>
                <div className="rounded-lg bg-black/20 p-3"><span className="text-gray-400">Technical GEO readiness</span><p className="mt-1 text-lg font-semibold text-white">{latest.geoReadiness}%</p></div>
              </div>
            </section>

            <section className="rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div><h2 className="text-sm font-semibold text-violet-100">Daily SEO execution evidence</h2><p className="mt-1 text-sm text-gray-400">Rank movement is measured after Google updates Search Console; this records what SEO Intel actually completed or left for review today.</p></div>
                <span className="text-xs font-mono text-violet-200">GSC refresh runs before SEO Intel</span>
              </div>
              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <div className="rounded-lg border border-white/8 bg-black/20 p-3"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Recent SEO Intel runs</h3><div className="mt-2 space-y-2">{seoRuns.data?.length ? seoRuns.data.map(run => <div key={run.id} className="rounded bg-white/[0.03] px-3 py-2 text-xs"><div className="flex justify-between gap-3"><span className={run.status === "completed" ? "text-emerald-300" : "text-amber-300"}>{run.status}</span><span className="text-gray-500">{formatDate(run.completedAt || run.startedAt)}</span></div><p className="mt-1 text-gray-300 line-clamp-2">{run.summary || run.errorMessage || "No summary recorded"}</p><p className="mt-1 text-gray-500">{run.model || "model unavailable"} · {run.actionsCreated || 0} actions · {run.messagesCreated || 0} messages</p></div>) : <p className="py-3 text-xs text-gray-500">No SEO runs recorded yet.</p>}</div></div>
                <div className="rounded-lg border border-white/8 bg-black/20 p-3"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Optimization actions and review state</h3><div className="mt-2 space-y-2">{seoActions.data?.length ? seoActions.data.map(action => <div key={action.id} className="rounded bg-white/[0.03] px-3 py-2 text-xs"><div className="flex justify-between gap-3"><span className="text-violet-200">{action.title}</span><span className={action.status === "completed" ? "text-emerald-300" : action.status === "blocked" ? "text-red-300" : "text-amber-300"}>{action.status}</span></div><p className="mt-1 text-gray-400 line-clamp-2">{action.description}</p><p className="mt-1 text-gray-500">{action.priority.toUpperCase()} · created {formatDate(action.createdAt)}</p></div>) : <p className="py-3 text-xs text-gray-500">No SEO actions recorded yet.</p>}</div></div>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <header className="border-b border-white/10 px-5 py-4"><h2 className="text-sm font-semibold text-white">Recent verified snapshots</h2></header>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-black/20 text-xs uppercase tracking-wider text-gray-400">
                    <tr><th className="px-5 py-3">Captured</th><th className="px-5 py-3">Organic clicks</th><th className="px-5 py-3">Views</th><th className="px-5 py-3">CTR</th><th className="px-5 py-3">Avg. position</th><th className="px-5 py-3">Leads</th><th className="px-5 py-3">Appointments</th><th className="px-5 py-3">GEO</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.snapshots.map((row) => (
                      <tr key={row.id} className="text-gray-200">
                        <td className="px-5 py-3 text-gray-400">{formatDate(row.capturedAt)}</td>
                        <td className="px-5 py-3 font-medium">{row.clicks.toLocaleString()}</td>
                        <td className="px-5 py-3">{row.impressions.toLocaleString()}</td>
                        <td className="px-5 py-3">{Number(row.ctrPercent || 0).toFixed(2)}%</td>
                        <td className="px-5 py-3">{Number(row.avgPosition || 0).toFixed(2)}</td>
                        <td className="px-5 py-3">{row.durableLeads.toLocaleString()}</td>
                        <td className="px-5 py-3">{row.bookedAppointments.toLocaleString()}</td>
                        <td className="px-5 py-3">{row.geoReadiness}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </AdminLayout>
  );
}
