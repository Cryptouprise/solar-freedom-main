import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useState } from "react";

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

function IndexCoverageStrategyWidget({ coverage, priorityPages }: {
  coverage: {
    capturedAt: Date | string;
    source: string;
    indexedUrlCount: number;
    notIndexedUrlCount: number;
    trackedArticleCount: number;
    articleIndexedCount: number | null;
    articleInspectionStatus: "verified" | "unavailable" | "partial";
    notes: string | null;
  } | null | undefined;
  priorityPages: Array<{ url: string; slug: string; clicks: number | null; impressions: number | null; avgPosition: string | null }>;
}) {
  const pageLabel = (page: { slug: string }) => page.slug.replace(/^blog\//, "").replace(/-/g, " ");
  const indexedArticleLabel = coverage?.articleInspectionStatus === "verified"
    ? `${coverage.articleIndexedCount ?? 0}`
    : "Verification unavailable";

  return (
    <section className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.035] p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.16em] text-cyan-200">Two-week SEO control panel</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Index coverage and the next three moves</h2>
          <p className="mt-1 max-w-3xl text-sm text-gray-400">The index total is scope-labeled. Strategy cards require an implementation receipt before they count as work.</p>
        </div>
        {coverage && <span className="shrink-0 text-xs font-mono text-gray-500">Captured {formatDate(coverage.capturedAt)}</span>}
      </div>

      {coverage ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-cyan-300/15 bg-black/20 p-4"><p className="text-xs uppercase tracking-wider text-gray-400">Indexed site URLs</p><p className="mt-1 text-3xl font-bold text-cyan-100">{coverage.indexedUrlCount.toLocaleString()}</p><p className="mt-1 text-xs text-gray-500">All URL types · {coverage.source}</p></div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-4"><p className="text-xs uppercase tracking-wider text-gray-400">Tracked articles</p><p className="mt-1 text-3xl font-bold text-white">{coverage.trackedArticleCount.toLocaleString()}</p><p className="mt-1 text-xs text-gray-500">Published blog URLs in the article audit</p></div>
          <div className={`rounded-lg border bg-black/20 p-4 ${coverage.articleInspectionStatus === "verified" ? "border-emerald-400/25" : "border-amber-400/25"}`}><p className="text-xs uppercase tracking-wider text-gray-400">Indexed articles</p><p className={`mt-1 text-xl font-bold ${coverage.articleInspectionStatus === "verified" ? "text-emerald-200" : "text-amber-200"}`}>{indexedArticleLabel}</p><p className="mt-1 text-xs text-gray-500">{coverage.articleInspectionStatus === "verified" ? "Per-article inspection verified" : "Not inferred from site-wide totals"}</p></div>
        </div>
      ) : <div className="mt-4 rounded-lg border border-dashed border-amber-400/30 bg-black/20 p-4 text-sm text-amber-100">Index coverage has not been captured yet. The dashboard will not estimate an indexed-article count.</div>}

      <div className="mt-5 grid gap-3 xl:grid-cols-3">
        <article className="rounded-lg border border-amber-400/20 bg-black/20 p-4"><div className="flex items-center justify-between"><span className="text-xs font-mono text-amber-200">01 · CAPTURE DEMAND</span><span className="rounded bg-amber-400/10 px-2 py-1 text-[10px] font-mono text-amber-100">CTR</span></div><h3 className="mt-3 font-semibold text-white">Publish snippet fixes near page one</h3><p className="mt-2 text-sm leading-6 text-gray-400">Approve metadata updates for the highest-impression Sunrun, GoodLeap, and pre-installation pages, then verify live metadata and canonicals before measuring CTR.</p><p className="mt-3 text-xs text-amber-100">Target: 3.0%, 3.0%, and 2.5% CTR respectively.</p></article>
        <article className="rounded-lg border border-violet-400/20 bg-black/20 p-4"><div className="flex items-center justify-between"><span className="text-xs font-mono text-violet-200">02 · IMPROVE RANK</span><span className="rounded bg-violet-400/10 px-2 py-1 text-[10px] font-mono text-violet-100">CONTENT</span></div><h3 className="mt-3 font-semibold text-white">Finish the same pages before new topics</h3><p className="mt-2 text-sm leading-6 text-gray-400">Add decision-stage sections, 4–6 factual FAQs with valid schema, and contextual links from live relevant pages through Content QA, Editor, owner approval, and technical verification.</p><p className="mt-3 text-xs text-violet-100">Target: median position improvement of two places.</p></article>
        <article className="rounded-lg border border-emerald-400/20 bg-black/20 p-4"><div className="flex items-center justify-between"><span className="text-xs font-mono text-emerald-200">03 · BOOK THE REVIEW</span><span className="rounded bg-emerald-400/10 px-2 py-1 text-[10px] font-mono text-emerald-100">APPOINTMENTS</span></div><h3 className="mt-3 font-semibold text-white">Prove the 15-minute review path</h3><p className="mt-2 text-sm leading-6 text-gray-400">Make booking the primary CTA, preserve page and session source in the calendar flow, and require a signed GoHighLevel appointment receipt.</p><p className="mt-3 text-xs text-emerald-100">Target: 100% booking-event capture and one verified booking in 14 days.</p></article>
      </div>

      {priorityPages.length > 0 && <div className="mt-4 rounded-lg border border-white/[0.08] bg-black/20 p-3"><p className="text-xs font-mono uppercase tracking-wider text-gray-500">Current high-impression pages</p><div className="mt-2 grid gap-2 md:grid-cols-3">{priorityPages.map((page) => <div key={page.url} className="rounded bg-white/[0.03] px-3 py-2"><p className="line-clamp-1 text-xs text-gray-200" title={pageLabel(page)}>{pageLabel(page)}</p><p className="mt-1 text-[11px] text-gray-500">{Number(page.impressions || 0).toLocaleString()} impressions · {Number(page.clicks || 0).toLocaleString()} clicks · position {page.avgPosition || "—"}</p></div>)}</div></div>}
    </section>
  );
}

function SeoTrendChart({ snapshots, pageMetrics, options, loading = false }: { snapshots: Array<{ capturedAt: Date | string; ctrPercent?: number | string | null; avgPosition?: number | string | null }>; pageMetrics: Array<{ capturedAt: Date | string; pageSlug: string; ctrPercent?: number | string | null; avgPosition?: number | string | null }>; options: Array<{ pageSlug: string; pageUrl: string; targetKeyword: string | null }>; loading?: boolean }) {
  const [selection, setSelection] = useState("all");
  if (loading) {
    return <section className="rounded-xl border border-white/10 bg-white/5 p-5" aria-busy="true" aria-live="polite"><div className="flex items-end justify-between gap-4"><div className="space-y-2"><div className="h-4 w-44 animate-pulse rounded bg-white/10" /><div className="h-3 w-72 animate-pulse rounded bg-white/[0.07]" /></div><div className="h-10 w-72 animate-pulse rounded-md bg-white/[0.08]" /></div><div className="relative mt-5 h-72 overflow-hidden rounded-lg border border-white/[0.06] bg-black/15"><div className="absolute inset-x-5 top-12 h-px bg-white/[0.06]" /><div className="absolute inset-x-5 top-1/2 h-px bg-white/[0.06]" /><div className="absolute inset-x-5 bottom-12 h-px bg-white/[0.06]" /><div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" /><div className="absolute inset-0 flex items-center justify-center"><span className="rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-3 py-1.5 text-xs font-mono text-amber-100">Loading verified trend data…</span></div></div></section>;
  }
  const source = selection === "all" ? snapshots : pageMetrics.filter((metric) => metric.pageSlug === selection);
  const latestByUtcDay = new Map<string, (typeof source)[number]>();
  [...source].reverse().forEach((snapshot) => {
    const date = new Date(snapshot.capturedAt);
    const day = Number.isNaN(date.getTime()) ? "unknown" : date.toISOString().slice(0, 10);
    latestByUtcDay.set(day, snapshot);
  });
  const points = Array.from(latestByUtcDay.values()).map((snapshot) => ({
    date: formatDate(snapshot.capturedAt).replace(/, \d{4}$/, ""),
    ctr: Number(snapshot.ctrPercent || 0),
    position: Number(snapshot.avgPosition || 0),
  }));

  const selectedOption = options.find((option) => option.pageSlug === selection);
  return <section className="rounded-xl border border-white/10 bg-white/5 p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-sm font-semibold text-white">30-day organic trend</h2><p className="mt-1 text-sm text-gray-400">Verified daily scorecard snapshots only. Lower average position is better.</p></div><label className="text-xs font-mono text-gray-300">PAGE OR TARGET KEYWORD<select value={selection} onChange={(event) => setSelection(event.target.value)} className="mt-1 block w-full min-w-72 rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"><option value="all">All organic pages</option>{options.map((option) => <option key={option.pageSlug} value={option.pageSlug}>{option.targetKeyword ? `${option.targetKeyword} — ${option.pageSlug}` : option.pageSlug}</option>)}</select></label></div><div className="mt-3 flex gap-3 text-xs font-mono"><span className="text-amber-300">● CTR %</span><span className="text-violet-300">● Avg. position</span>{selectedOption?.targetKeyword && <span className="text-gray-400">Target: {selectedOption.targetKeyword}</span>}</div>{points.length < 2 ? <div className="mt-4 rounded-lg border border-dashed border-amber-400/30 bg-amber-400/[0.04] px-4 py-8 text-sm text-amber-100">{selection === "all" ? "One verified baseline is recorded. The chart will draw a real trend after the next daily scorecard—not an invented line between missing days." : "This page has fewer than two verified daily measurements. The chart will appear when a comparable daily snapshot is available."}</div> : <div className="chart-data-fade mt-5 h-72" aria-label="Thirty day organic click-through rate and average ranking position chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}><CartesianGrid stroke="#ffffff12" vertical={false} /><XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} /><YAxis yAxisId="ctr" tick={{ fill: "#fbbf24", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} width={42} /><YAxis yAxisId="position" orientation="right" tick={{ fill: "#c4b5fd", fontSize: 11 }} tickLine={false} axisLine={false} width={32} reversed /><Tooltip contentStyle={{ background: "#101217", border: "1px solid #ffffff20", borderRadius: 8 }} labelStyle={{ color: "#e2e8f0" }} formatter={(value: number, name: string) => [name === "CTR" ? `${Number(value).toFixed(2)}%` : Number(value).toFixed(2), name]} /><Line yAxisId="ctr" type="monotone" dataKey="ctr" name="CTR" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: "#f59e0b" }} activeDot={{ r: 6 }} isAnimationActive animationDuration={650} animationEasing="ease-out" /><Line yAxisId="position" type="monotone" dataKey="position" name="Avg. position" stroke="#a78bfa" strokeWidth={3} dot={{ r: 4, fill: "#a78bfa" }} activeDot={{ r: 6 }} isAnimationActive animationDuration={650} animationEasing="ease-out" /></LineChart></ResponsiveContainer></div>}</section>;
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

        {isLoading && <p className="pt-4 text-center font-mono text-sm text-gray-400">Loading scorecard…</p>}
        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">The scorecard could not be loaded. It will not substitute zeroes for unavailable data.</p>}

        {!error && <SeoTrendChart snapshots={data?.snapshots || []} pageMetrics={data?.pageMetrics || []} options={data?.pageTrendOptions || []} loading={isLoading} />}

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
            <IndexCoverageStrategyWidget coverage={data.indexCoverage} priorityPages={data.priorityPages || []} />
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
