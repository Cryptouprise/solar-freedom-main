import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

type Range = "7daysAgo" | "30daysAgo" | "90daysAgo";

const RANGE_LABELS: Record<Range, string> = {
  "7daysAgo": "Last 7 Days",
  "30daysAgo": "Last 30 Days",
  "90daysAgo": "Last 90 Days",
};

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        highlight
          ? "border-amber-500/50 bg-amber-500/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <p className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
        {label}
      </p>
      <p
        className={`text-3xl font-bold ${
          highlight ? "text-amber-400" : "text-white"
        }`}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function formatDate(d: string) {
  // d is "YYYYMMDD"
  const y = d.slice(0, 4);
  const m = d.slice(4, 6);
  const day = d.slice(6, 8);
  return `${m}/${day}`;
}

export default function AdminAnalytics() {
  const { user, loading } = useAuth();
  const [range, setRange] = useState<Range>("7daysAgo");

  const { data, isLoading, error, refetch } = trpc.analytics.report.useQuery(
    { range },
    { enabled: !!user && user.role === "admin" }
  );

  // Auth is handled by AdminLayout

  const conversionRate =
    data && data.summary.sessions > 0
      ? ((data.summary.generateLeads / data.summary.sessions) * 100).toFixed(2)
      : "0.00";

  return (
    <AdminLayout title="Analytics" subtitle="Live GA4 traffic data for breakyoursolarcontract.com">
      <div className="p-6">
        {/* Range + Refresh controls */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
            {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-all ${
                  range === r
                    ? "bg-amber-500 text-black font-bold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded border border-white/10 text-xs font-mono text-gray-400 hover:text-white hover:border-white/30 transition-all"
          >
            Refresh
          </button>
        </div>

        <div className="space-y-8">
        {isLoading && (
          <div className="text-center py-20 text-gray-400 font-mono text-sm animate-pulse">
            Pulling live data from GA4...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <p className="text-red-400 font-mono text-sm">
              GA4 data is unavailable. Review sanitized server diagnostics and the private provider configuration.
            </p>
          </div>
        )}

        {data && (
          <>
            {/* Summary Stats */}
            <section>
              <h2 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">
                Overview — {RANGE_LABELS[range]}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                <div className="col-span-2 md:col-span-2">
                  <StatCard label="Sessions" value={data.summary.sessions} />
                </div>
                <div className="col-span-2 md:col-span-2">
                  <StatCard label="Users" value={data.summary.users} sub={`${data.summary.newUsers.toLocaleString()} new`} />
                </div>
                <div className="col-span-2 md:col-span-2">
                  <StatCard label="Page Views" value={data.summary.pageViews} />
                </div>
                <div className="col-span-2 md:col-span-2">
                  <StatCard label="Conversion Rate" value={`${conversionRate}%`} sub={`${data.summary.generateLeads} leads`} highlight />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <StatCard label="CTA Clicks" value={data.summary.ctaClicks} />
                <StatCard label="Form Starts" value={data.summary.formSubmits} />
                <StatCard label="Phone Clicks" value={data.summary.phoneClicks} />
                <StatCard label="Leads Generated" value={data.summary.generateLeads} highlight />
              </div>
            </section>

            {/* Daily Traffic Chart */}
            {data.daily.length > 0 && (
              <section>
                <h2 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">
                  Daily Sessions
                </h2>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={data.daily.map((d) => ({ ...d, date: formatDate(d.date) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: "#1a1d24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }}
                      />
                      <Line type="monotone" dataKey="sessions" stroke="#f97316" strokeWidth={2} dot={false} name="Sessions" />
                      <Line type="monotone" dataKey="pageViews" stroke="#60a5fa" strokeWidth={2} dot={false} name="Page Views" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Traffic Sources */}
              <section>
                <h2 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">
                  Traffic Sources
                </h2>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={data.channels} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                      <YAxis type="category" dataKey="channel" tick={{ fill: "#9ca3af", fontSize: 11 }} width={100} />
                      <Tooltip
                        contentStyle={{ background: "#1a1d24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }}
                      />
                      <Bar dataKey="sessions" fill="#f97316" radius={[0, 4, 4, 0]} name="Sessions" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Top Events */}
              <section>
                <h2 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">
                  Events
                </h2>
                <div className="rounded-xl border border-white/10 bg-white/5 divide-y divide-white/5">
                  {data.events.slice(0, 8).map((ev) => {
                    const isConversion = ["generate_lead", "form_submit", "cta_click", "phone_click"].includes(ev.name);
                    return (
                      <div key={ev.name} className="flex items-center justify-between px-4 py-2.5">
                        <span className={`font-mono text-sm ${isConversion ? "text-amber-400" : "text-gray-300"}`}>
                          {ev.name}
                          {isConversion && <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">conversion</span>}
                        </span>
                        <span className="font-mono text-sm text-white font-bold">{ev.count.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Top Pages */}
            <section>
              <h2 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">
                Top Pages
              </h2>
              <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-4 py-3 font-mono text-xs text-gray-400 uppercase tracking-wider">Page</th>
                      <th className="text-right px-4 py-3 font-mono text-xs text-gray-400 uppercase tracking-wider">Views</th>
                      <th className="text-right px-4 py-3 font-mono text-xs text-gray-400 uppercase tracking-wider">Sessions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.topPages.map((page) => (
                      <tr key={page.path} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-xs text-gray-300 max-w-xs truncate">
                          {page.path}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-xs text-white">{page.views}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-xs text-gray-400">{page.sessions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Footer */}
            <div className="text-center text-xs font-mono text-gray-600 pt-4 border-t border-white/5">
              Data source: Google Analytics 4 — Property 530239045 — breakyoursolarcontract.com
              <br />
              Range: {data.dateRange} · Pulled live via GA4 Data API
            </div>
          </>
        )}
        </div>
      </div>
    </AdminLayout>
  );
}
