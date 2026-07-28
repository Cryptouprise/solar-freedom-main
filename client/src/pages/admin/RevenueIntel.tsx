/**
 * Revenue Intel Dashboard
 * Shows AI-predicted revenue opportunities, action pipeline, and actual vs predicted tracking.
 * Data comes from revenueIntelPredictions and revenueIntelRuns tables.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import {
  TrendingUp, DollarSign, Target, Zap, CheckCircle, Clock, AlertTriangle,
  RefreshCw, ChevronRight, ArrowUp, BarChart2, Loader2, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// ─── Color palette ─────────────────────────────────────────────────────────────
const CHART_COLORS = {
  amber: "#f97316",
  green: "#22c55e",
  blue: "#3b82f6",
  purple: "#a855f7",
  red: "#ef4444",
  gray: "#6b7280",
};

const ACTION_TYPE_COLORS: Record<string, string> = {
  cta_rewrite: CHART_COLORS.amber,
  title_optimization: CHART_COLORS.blue,
  interlink_injection: CHART_COLORS.green,
  keyword_density: CHART_COLORS.purple,
  faq_addition: "#06b6d4",
  meta_rewrite: "#f59e0b",
  position_push: "#10b981",
};

const STATUS_COLORS: Record<string, string> = {
  queued: CHART_COLORS.amber,
  executing: CHART_COLORS.blue,
  done: CHART_COLORS.green,
  skipped: CHART_COLORS.gray,
  failed: CHART_COLORS.red,
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmt$(n: string | number | null | undefined): string {
  const v = parseFloat(String(n || 0));
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function fmtNum(n: string | number | null | undefined): string {
  return Number(n || 0).toLocaleString();
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, color = "amber", trend,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color?: string; trend?: string;
}) {
  const colorMap: Record<string, string> = {
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    green: "text-green-400 bg-green-500/10 border-green-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
  };
  const cls = colorMap[color] || colorMap.amber;
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-xs font-mono uppercase tracking-wider">{label}</span>
        <Icon className="w-4 h-4 opacity-60" />
      </div>
      <div className="text-white text-2xl font-bold font-mono">{value}</div>
      {sub && <div className="text-gray-500 text-xs mt-1">{sub}</div>}
      {trend && <div className="text-green-400 text-xs mt-1 flex items-center gap-1"><ArrowUp className="w-3 h-3" />{trend}</div>}
    </div>
  );
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1d24] border border-white/10 rounded-lg p-3 text-xs shadow-xl">
      <div className="text-gray-400 font-mono mb-2">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-300">{p.name}:</span>
          <span className="text-white font-bold">
            {p.name?.toLowerCase().includes("revenue") || p.name?.toLowerCase().includes("$")
              ? fmt$(p.value) : fmtNum(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function RevenueIntel() {
  const [activeTab, setActiveTab] = useState<"overview" | "predictions" | "tracker">("overview");

  const { data: latestRun, isLoading: runLoading } = trpc.revenueIntel.getLatestRun.useQuery();
  const { data: summaryStats, isLoading: statsLoading } = trpc.revenueIntel.getSummaryStats.useQuery();
  const { data: byActionType = [], isLoading: actionLoading } = trpc.revenueIntel.getByActionType.useQuery();
  const { data: byPage = [], isLoading: pageLoading } = trpc.revenueIntel.getByPage.useQuery({ limit: 12 });
  const { data: topPredictions = [], isLoading: predLoading } = trpc.revenueIntel.getTopPredictions.useQuery({ limit: 25, status: "all" });
  const { data: revenueByMonth = [], isLoading: monthLoading } = trpc.revenueIntel.getRevenueByMonth.useQuery();
  const { data: revenueTracker = [], isLoading: trackerLoading } = trpc.revenueIntel.getRevenueTracker.useQuery({ limit: 50 });

  const markExecuted = trpc.revenueIntel.markExecuted.useMutation({
    onSuccess: () => toast.success("Marked as executed"),
    onError: (e) => toast.error(e.message),
  });

  const isLoading = runLoading || statsLoading || actionLoading || pageLoading;

  // Prepare chart data
  const actionTypeChartData = byActionType.map(a => ({
    name: a.actionType.replace(/_/g, " "),
    revenue: parseFloat(a.totalPredictedRevenue || "0"),
    count: a.count,
    confidence: Math.round(a.avgConfidence || 0),
  }));

  const pageChartData = byPage.slice(0, 10).map(p => ({
    name: p.pageSlug.replace("blog/", "").substring(0, 25) + (p.pageSlug.length > 25 ? "…" : ""),
    revenue: parseFloat(p.totalPredictedRevenue || "0"),
    leads: parseFloat(p.totalPredictedLeads || "0"),
    actions: p.actionCount,
  }));

  const monthChartData = revenueByMonth.map(m => ({
    month: m.month,
    invoiced: parseFloat(m.invoiced || "0"),
    paid: parseFloat(m.paid || "0"),
    count: m.count,
  }));

  // Pie data for action type distribution
  const pieData = byActionType.map(a => ({
    name: a.actionType.replace(/_/g, " "),
    value: parseFloat(a.totalPredictedRevenue || "0"),
    color: ACTION_TYPE_COLORS[a.actionType] || CHART_COLORS.gray,
  })).filter(d => d.value > 0);

  const totalPredicted = parseFloat(summaryStats?.predictions?.totalPredictedRevenue || "0");
  const totalActual = parseFloat(summaryStats?.tracker?.totalPaid || "0");
  const totalInvoiced = parseFloat(summaryStats?.tracker?.totalInvoiced || "0");
  const totalOverdue = parseFloat(summaryStats?.tracker?.totalOverdue || "0");
  const queuedActions = Number(summaryStats?.predictions?.queuedActions || 0);
  const doneActions = Number(summaryStats?.predictions?.doneActions || 0);
  const totalActions = Number(summaryStats?.predictions?.totalActions || 0);

  return (
    <AdminLayout title="Revenue Intel" subtitle="AI-powered revenue predictions and opportunity pipeline">
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-green-400" />
              Revenue Intelligence
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {latestRun
                ? `Last run: ${new Date(latestRun.runAt).toLocaleString()} · ${latestRun.postsAnalyzed} posts analyzed · ${latestRun.actionsGenerated} actions generated`
                : "No runs yet — trigger the Revenue Intel agent to generate predictions"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {latestRun && (
              <Badge className={`text-xs px-2 py-1 ${
                latestRun.status === "completed" ? "bg-green-500/20 text-green-300 border-green-500/30" :
                latestRun.status === "running" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                "bg-red-500/20 text-red-300 border-red-500/30"
              } border`}>
                {latestRun.status}
              </Badge>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center gap-3 text-gray-400 text-sm py-8 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading revenue intelligence data...
          </div>
        )}

        {!isLoading && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Predicted Revenue"
                value={fmt$(totalPredicted)}
                sub={`${totalActions} total actions`}
                icon={TrendingUp}
                color="green"
              />
              <StatCard
                label="Collected"
                value={fmt$(totalActual)}
                sub={`${fmt$(totalInvoiced)} invoiced`}
                icon={DollarSign}
                color="amber"
              />
              <StatCard
                label="Queued Actions"
                value={fmtNum(queuedActions)}
                sub={`${doneActions} completed`}
                icon={Target}
                color="blue"
              />
              <StatCard
                label="Overdue"
                value={fmt$(totalOverdue)}
                sub="Needs follow-up"
                icon={AlertTriangle}
                color={totalOverdue > 0 ? "red" : "green"}
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white/5 rounded-lg p-1 w-fit">
              {(["overview", "predictions", "tracker"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${
                    activeTab === tab
                      ? "bg-amber-500 text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Revenue by Action Type */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-[#12141a] border border-white/5 rounded-xl p-5">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-amber-400" />
                      Predicted Revenue by Action Type
                    </h3>
                    {actionTypeChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={actionTypeChartData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: "#6b7280", fontSize: 10 }}
                            angle={-35}
                            textAnchor="end"
                            interval={0}
                          />
                          <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="revenue" name="Predicted Revenue $" radius={[4, 4, 0, 0]}>
                            {actionTypeChartData.map((_, i) => (
                              <Cell key={i} fill={Object.values(ACTION_TYPE_COLORS)[i % Object.keys(ACTION_TYPE_COLORS).length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[220px] text-gray-600 text-sm">
                        No predictions yet — run the Revenue Intel agent
                      </div>
                    )}
                  </div>

                  <div className="bg-[#12141a] border border-white/5 rounded-xl p-5">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-400" />
                      Revenue Distribution by Type
                    </h3>
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: any) => fmt$(v)} />
                          <Legend
                            formatter={(value) => <span style={{ color: "#9ca3af", fontSize: 11 }}>{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[220px] text-gray-600 text-sm">
                        No predictions yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Pages by Revenue Potential */}
                <div className="bg-[#12141a] border border-white/5 rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Top Pages by Revenue Potential
                  </h3>
                  {pageChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={pageChartData} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
                        <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                        <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} width={160} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="revenue" name="Predicted Revenue $" fill={CHART_COLORS.amber} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[200px] text-gray-600 text-sm">
                      No page predictions yet
                    </div>
                  )}
                </div>

                {/* Revenue Tracker Trend */}
                {monthChartData.length > 0 && (
                  <div className="bg-[#12141a] border border-white/5 rounded-xl p-5">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      Actual Revenue Trend (Monthly)
                    </h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={monthChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="invoicedGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLORS.amber} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={CHART_COLORS.amber} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                        <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 10 }} />
                        <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="invoiced" name="Invoiced $" stroke={CHART_COLORS.amber} fill="url(#invoicedGrad)" strokeWidth={2} />
                        <Area type="monotone" dataKey="paid" name="Paid $" stroke={CHART_COLORS.green} fill="url(#paidGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Latest Run Summary */}
                {latestRun?.summary && (
                  <div className="bg-[#12141a] border border-white/5 rounded-xl p-5">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-400" />
                      Latest Run Summary
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{latestRun.summary}</p>
                    {latestRun.topAction && (
                      <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <div className="text-amber-400 text-xs font-mono font-bold mb-1">TOP ACTION</div>
                        <div className="text-white text-sm">{latestRun.topAction}</div>
                        {latestRun.topActionRevenue && (
                          <div className="text-green-400 text-sm font-bold mt-1">{fmt$(latestRun.topActionRevenue)} predicted impact</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Predictions Tab */}
            {activeTab === "predictions" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">Top Revenue Predictions</h3>
                  <span className="text-gray-500 text-xs font-mono">{topPredictions.length} predictions</span>
                </div>
                {predLoading ? (
                  <div className="flex items-center gap-2 text-gray-400 text-sm py-8 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                  </div>
                ) : topPredictions.length === 0 ? (
                  <div className="text-center py-12 text-gray-600">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No predictions yet. Run the Revenue Intel agent to generate opportunities.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topPredictions.map((pred) => (
                      <div
                        key={pred.id}
                        className="bg-[#12141a] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-white text-sm font-semibold truncate">
                                {pred.pageTitle || pred.pageSlug}
                              </span>
                              <Badge
                                className="text-[10px] px-1.5 py-0 h-4 border shrink-0"
                                style={{
                                  background: `${ACTION_TYPE_COLORS[pred.actionType] || CHART_COLORS.gray}20`,
                                  color: ACTION_TYPE_COLORS[pred.actionType] || CHART_COLORS.gray,
                                  borderColor: `${ACTION_TYPE_COLORS[pred.actionType] || CHART_COLORS.gray}40`,
                                }}
                              >
                                {pred.actionType.replace(/_/g, " ")}
                              </Badge>
                              <Badge
                                className="text-[10px] px-1.5 py-0 h-4 border shrink-0"
                                style={{
                                  background: `${STATUS_COLORS[pred.status] || CHART_COLORS.gray}20`,
                                  color: STATUS_COLORS[pred.status] || CHART_COLORS.gray,
                                  borderColor: `${STATUS_COLORS[pred.status] || CHART_COLORS.gray}40`,
                                }}
                              >
                                {pred.status}
                              </Badge>
                            </div>
                            <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{pred.actionDetail}</p>
                            {pred.reasoning && (
                              <p className="text-gray-600 text-xs mt-1 line-clamp-1 italic">{pred.reasoning}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 font-mono">
                              <span>Pos: {pred.currentPosition || "—"}</span>
                              <span>Clicks: {fmtNum(pred.currentClicks)}</span>
                              <span>Impr: {fmtNum(pred.currentImpressions)}</span>
                              <span>Confidence: {pred.confidenceScore}%</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-green-400 font-bold text-lg font-mono">
                              {fmt$(pred.predictedRevenueGain)}
                            </div>
                            <div className="text-gray-500 text-xs">+{parseFloat(String(pred.predictedLeadsGain || 0)).toFixed(1)} leads</div>
                            {pred.status === "queued" && (
                              <Button
                                size="sm"
                                onClick={() => markExecuted.mutate({ id: pred.id })}
                                disabled={markExecuted.isPending}
                                className="mt-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold h-7 px-3"
                              >
                                {markExecuted.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                                Done
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Revenue Tracker Tab */}
            {activeTab === "tracker" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">Revenue Tracker</h3>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-amber-400">Invoiced: {fmt$(totalInvoiced)}</span>
                    <span className="text-green-400">Paid: {fmt$(totalActual)}</span>
                    <span className="text-red-400">Overdue: {fmt$(totalOverdue)}</span>
                  </div>
                </div>
                {trackerLoading ? (
                  <div className="flex items-center gap-2 text-gray-400 text-sm py-8 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                  </div>
                ) : revenueTracker.length === 0 ? (
                  <div className="text-center py-12 text-gray-600">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No revenue records yet. Add entries via the Lead Distribution page.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-500 text-xs font-mono uppercase tracking-wider border-b border-white/5">
                          <th className="text-left py-2 pr-4">Source</th>
                          <th className="text-left py-2 pr-4">Firm</th>
                          <th className="text-right py-2 pr-4">Amount</th>
                          <th className="text-left py-2 pr-4">Status</th>
                          <th className="text-left py-2">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {revenueTracker.map((entry) => (
                          <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-2.5 pr-4">
                              <span className="text-gray-300 text-xs font-mono">{entry.source.replace(/_/g, " ")}</span>
                            </td>
                            <td className="py-2.5 pr-4">
                              <span className="text-gray-400 text-xs">{entry.firmName || "—"}</span>
                            </td>
                            <td className="py-2.5 pr-4 text-right">
                              <span className="text-white font-bold font-mono">{fmt$(entry.amount)}</span>
                            </td>
                            <td className="py-2.5 pr-4">
                              <Badge
                                className="text-[10px] px-1.5 py-0 h-4 border"
                                style={{
                                  background: `${STATUS_COLORS[entry.status] || CHART_COLORS.gray}20`,
                                  color: STATUS_COLORS[entry.status] || CHART_COLORS.gray,
                                  borderColor: `${STATUS_COLORS[entry.status] || CHART_COLORS.gray}40`,
                                }}
                              >
                                {entry.status}
                              </Badge>
                            </td>
                            <td className="py-2.5">
                              <span className="text-gray-500 text-xs font-mono">
                                {new Date(entry.createdAt).toLocaleDateString()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Empty state when no data at all */}
        {!isLoading && !latestRun && totalActions === 0 && (
          <div className="text-center py-16 border border-white/5 rounded-xl bg-[#12141a]">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-green-400 opacity-30" />
            <h3 className="text-white text-lg font-semibold mb-2">No Revenue Intel Data Yet</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
              The Revenue Intel agent analyzes your top pages and generates specific revenue-optimized actions.
              Go to Agent Command Center and run the Revenue Intel agent to get started.
            </p>
            <Button
              onClick={() => window.location.href = "/admin/agents"}
              className="bg-green-600 hover:bg-green-500 text-white font-bold"
            >
              <Zap className="w-4 h-4 mr-2" />
              Go to Agent Command Center
            </Button>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
