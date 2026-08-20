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
  const latest = data?.snapshots?.[0];

  return (
    <AdminLayout title="Outcome Scorecard" subtitle="Organic clicks → views → durable leads → booked appointments">
      <main className="p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-400">
            One view of recovery. A metric is shown only after its source system records it.
          </p>
          <button
            onClick={() => refetch()}
            className="rounded-lg border border-white/15 px-3 py-2 text-xs font-mono text-gray-300 transition hover:border-amber-400 hover:text-white"
          >
            Refresh
          </button>
        </div>

        {isLoading && <p className="py-16 text-center font-mono text-sm text-gray-400">Loading scorecard…</p>}
        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">The scorecard could not be loaded. It will not substitute zeroes for unavailable data.</p>}

        {!isLoading && !error && !latest && (
          <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-100">
            No verified scorecard snapshot exists yet. The first scheduled recovery check will write the baseline after Search Console, durable lead, CRM-delivery, and appointment sources respond.
          </section>
        )}

        {latest && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Organic clicks" value={latest.clicks} sub={`${latest.periodStart} to ${latest.periodEnd} · Search Console`} tone={latest.clicks > 0 ? "success" : "warning"} />
              <MetricCard label="Organic views" value={latest.impressions} sub={`${latest.pageRows} ranking pages · Search Console impressions`} tone={latest.impressions > 0 ? "success" : "warning"} />
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

            <section className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <header className="border-b border-white/10 px-5 py-4"><h2 className="text-sm font-semibold text-white">Recent verified snapshots</h2></header>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-black/20 text-xs uppercase tracking-wider text-gray-400">
                    <tr><th className="px-5 py-3">Captured</th><th className="px-5 py-3">Organic clicks</th><th className="px-5 py-3">Views</th><th className="px-5 py-3">Leads</th><th className="px-5 py-3">Appointments</th><th className="px-5 py-3">GEO</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.snapshots.map((row) => (
                      <tr key={row.id} className="text-gray-200">
                        <td className="px-5 py-3 text-gray-400">{formatDate(row.capturedAt)}</td>
                        <td className="px-5 py-3 font-medium">{row.clicks.toLocaleString()}</td>
                        <td className="px-5 py-3">{row.impressions.toLocaleString()}</td>
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
