import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  CheckCircle,
  PhoneCall,
  TrendingUp,
  Search,
  RefreshCw,
  ArrowLeft,
  Zap,
  XCircle,
} from "lucide-react";
import { Link } from "wouter";

type LeadStatus = "new" | "contacted" | "qualified" | "closed_won" | "closed_lost";

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: "New", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: <Zap className="h-3 w-3" /> },
  contacted: { label: "Contacted", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: <PhoneCall className="h-3 w-3" /> },
  qualified: { label: "Qualified", color: "bg-purple-500/15 text-purple-400 border-purple-500/30", icon: <TrendingUp className="h-3 w-3" /> },
  closed_won: { label: "Won", color: "bg-green-500/15 text-green-400 border-green-500/30", icon: <CheckCircle className="h-3 w-3" /> },
  closed_lost: { label: "Lost", color: "bg-red-500/15 text-red-400 border-red-500/30", icon: <XCircle className="h-3 w-3" /> },
};

function StatusBadge({ status }: { status: LeadStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.new;
  return (
    <Badge variant="outline" className={`gap-1 text-xs font-medium border ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

export default function AdminLeads() {
  const { user, loading } = useAuth();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const { data: leads = [], isLoading, refetch } = trpc.leads.list.useQuery(
    { limit: 500, offset: 0 },
    { enabled: !!user && user.role === "admin" }
  );

  const updateStatus = trpc.leads.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      showToast("Status updated successfully.");
    },
    onError: () => {
      showToast("Error: Failed to update status.");
    },
  });

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        lead.firstName?.toLowerCase().includes(q) ||
        lead.lastName?.toLowerCase().includes(q) ||
        lead.email?.toLowerCase().includes(q) ||
        lead.phone?.toLowerCase().includes(q) ||
        lead.solarCompany?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchSource = sourceFilter === "all" || lead.sourcePage === sourceFilter;
      return matchSearch && matchStatus && matchSource;
    });
  }, [leads, search, statusFilter, sourceFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = leads.length;
    const newLeads = leads.filter((l) => l.status === "new").length;
    const contacted = leads.filter((l) => l.status === "contacted").length;
    const qualified = leads.filter((l) => l.status === "qualified").length;
    const won = leads.filter((l) => l.status === "closed_won").length;
    const ghlSynced = leads.filter((l) => l.ghlWebhookSent === 1).length;
    return { total, newLeads, contacted, qualified, won, ghlSynced };
  }, [leads]);

  // Unique source pages for filter
  const sourcePagesOptions = useMemo(() => {
    const pages = new Set(leads.map((l) => l.sourcePage).filter(Boolean));
    return Array.from(pages) as string[];
  }, [leads]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0D0F14]">
        <RefreshCw className="h-6 w-6 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0D0F14]">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Sign in required</h1>
          <Button onClick={() => { window.location.href = getLoginUrl(); }} className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0D0F14]">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Access Denied</h1>
          <p className="text-gray-400">This page requires admin privileges.</p>
          <Link href="/">
            <Button variant="outline" className="border-white/20 text-white">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Site
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F14] text-white">
      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-50 bg-amber-500 text-black font-medium px-4 py-2 rounded-lg shadow-lg text-sm">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-white/10 bg-[#0D0F14]/95 sticky top-0 z-40 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Site
              </Button>
            </Link>
            <div className="h-5 w-px bg-white/20" />
            <div>
              <h1 className="text-lg font-bold text-white">Leads Dashboard</h1>
              <p className="text-xs text-gray-500 font-mono">Solar Freedom Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/analytics">
              <Button variant="outline" size="sm" className="border-white/10 text-gray-300 hover:text-white text-xs">
                Analytics
              </Button>
            </Link>
            <Link href="/admin/content">
              <Button variant="outline" size="sm" className="border-amber-500/30 text-amber-400 hover:text-amber-300 text-xs">
                Content Manager
              </Button>
            </Link>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="border-white/20 text-gray-300 hover:text-white gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total Leads", value: stats.total, icon: <Users className="h-4 w-4" />, color: "text-white" },
            { label: "New", value: stats.newLeads, icon: <Zap className="h-4 w-4" />, color: "text-blue-400" },
            { label: "Contacted", value: stats.contacted, icon: <PhoneCall className="h-4 w-4" />, color: "text-amber-400" },
            { label: "Qualified", value: stats.qualified, icon: <TrendingUp className="h-4 w-4" />, color: "text-purple-400" },
            { label: "Won", value: stats.won, icon: <CheckCircle className="h-4 w-4" />, color: "text-green-400" },
            { label: "GHL Synced", value: stats.ghlSynced, icon: <RefreshCw className="h-4 w-4" />, color: "text-gray-400" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-white/5 border-white/10">
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <span className={stat.color}>{stat.icon}</span>
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-3">
                <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by name, email, phone, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-amber-500/50"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1d24] border-white/10">
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-full sm:w-52 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1d24] border-white/10">
              <SelectItem value="all">All Sources</SelectItem>
              {sourcePagesOptions.map((src) => (
                <SelectItem key={src} value={src}>{src}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-500 font-mono">
          Showing {filtered.length} of {leads.length} leads
        </div>

        {/* Table */}
        <div className="rounded-lg border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-gray-400 font-mono text-xs uppercase">Name</TableHead>
                  <TableHead className="text-gray-400 font-mono text-xs uppercase">Contact</TableHead>
                  <TableHead className="text-gray-400 font-mono text-xs uppercase">Company</TableHead>
                  <TableHead className="text-gray-400 font-mono text-xs uppercase">Problem</TableHead>
                  <TableHead className="text-gray-400 font-mono text-xs uppercase">Payment</TableHead>
                  <TableHead className="text-gray-400 font-mono text-xs uppercase">Intent</TableHead>
                  <TableHead className="text-gray-400 font-mono text-xs uppercase">Source</TableHead>
                  <TableHead className="text-gray-400 font-mono text-xs uppercase">GHL</TableHead>
                  <TableHead className="text-gray-400 font-mono text-xs uppercase">Date</TableHead>
                  <TableHead className="text-gray-400 font-mono text-xs uppercase">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-gray-500">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                      Loading leads...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-gray-500">
                      {leads.length === 0
                        ? "No leads yet. Form submissions will appear here."
                        : "No leads match your filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((lead) => (
                    <TableRow key={lead.id} className="border-white/10 hover:bg-white/5 transition-colors">
                      <TableCell className="font-medium text-white whitespace-nowrap">
                        {lead.firstName} {lead.lastName}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <a
                            href={`mailto:${lead.email}`}
                            className="text-amber-400 hover:text-amber-300 text-sm block truncate max-w-[180px]"
                          >
                            {lead.email}
                          </a>
                          <a
                            href={`tel:${lead.phone}`}
                            className="text-gray-400 hover:text-white text-xs block"
                          >
                            {lead.phone}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm whitespace-nowrap">
                        {lead.solarCompany || <span className="text-gray-600">—</span>}
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm max-w-[140px]">
                        <span className="truncate block" title={lead.problemType ?? ""}>
                          {lead.problemType || <span className="text-gray-600">—</span>}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm whitespace-nowrap">
                        {lead.monthlyPayment || <span className="text-gray-600">—</span>}
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm max-w-[120px]">
                        <span className="truncate block" title={lead.intent ?? ""}>
                          {lead.intent || <span className="text-gray-600">—</span>}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-500 text-xs font-mono whitespace-nowrap">
                        {lead.sourcePage || "—"}
                      </TableCell>
                      <TableCell>
                        {lead.ghlWebhookSent === 1 ? (
                          <span className="text-green-400 text-xs font-mono">✓ Sent</span>
                        ) : (
                          <span className="text-red-400 text-xs font-mono">✗ Pending</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-500 text-xs font-mono whitespace-nowrap">
                        {lead.createdAt
                          ? new Date(lead.createdAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={lead.status ?? "new"}
                          onValueChange={(val) =>
                            updateStatus.mutate({ id: lead.id, status: val as LeadStatus })
                          }
                        >
                          <SelectTrigger className="w-32 h-7 text-xs bg-transparent border-white/10 text-white p-1">
                            <StatusBadge status={(lead.status ?? "new") as LeadStatus} />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1d24] border-white/10">
                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                              <SelectItem key={key} value={key} className="text-xs">
                                <span className="flex items-center gap-2">
                                  {cfg.icon} {cfg.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
