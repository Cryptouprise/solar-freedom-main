/**
 * Lead Distribution Dashboard
 * Manage law firm partners, view delivery history, and track billing.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  Zap,
  Star,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Firm = {
  id: number;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  coveredStates: string | null;
  exclusiveStates: string | null;
  pricePerLead: string;
  billingCycle: "per_lead" | "weekly" | "monthly";
  webhookUrl: string | null;
  webhookSecret: string | null;
  emailDelivery: number;
  minLeadScore: number | null;
  filterCompanies: string | null;
  filterProblemTypes: string | null;
  maxLeadsPerDay: number | null;
  maxLeadsPerMonth: number | null;
  status: "active" | "paused" | "inactive";
  notes: string | null;
  totalLeadsDelivered: number;
  totalLeadsAccepted: number;
  totalLeadsRejected: number;
  totalRevenue: string;
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  icon: Icon,
  sub,
  color = "amber",
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  color?: "amber" | "green" | "blue" | "purple";
}) {
  const colors = {
    amber: "text-amber-400 bg-amber-400/10",
    green: "text-green-400 bg-green-400/10",
    blue: "text-blue-400 bg-blue-400/10",
    purple: "text-purple-400 bg-purple-400/10",
  };
  return (
    <Card className="bg-[#0D0F14] border-white/10">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-400 text-sm">{title}</p>
            <p className="text-white text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Firm Form ─────────────────────────────────────────────────────────────────

function FirmForm({
  initial,
  onSave,
  onCancel,
  loading,
}: {
  initial?: Partial<Firm>;
  onSave: (data: Partial<Firm>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<Partial<Firm>>(
    initial ?? {
      name: "",
      pricePerLead: "50",
      billingCycle: "per_lead",
      emailDelivery: 1,
      minLeadScore: 0,
      status: "active",
    }
  );
  const set = (k: keyof Firm, v: string | number | null) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-gray-300">Firm Name *</Label>
          <Input
            value={form.name ?? ""}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Smith & Associates"
            className="bg-white/5 border-white/10 text-white mt-1"
          />
        </div>
        <div>
          <Label className="text-gray-300">Contact Name</Label>
          <Input
            value={form.contactName ?? ""}
            onChange={(e) => set("contactName", e.target.value)}
            placeholder="John Smith"
            className="bg-white/5 border-white/10 text-white mt-1"
          />
        </div>
        <div>
          <Label className="text-gray-300">Email</Label>
          <Input
            value={form.email ?? ""}
            onChange={(e) => set("email", e.target.value)}
            placeholder="john@smithlaw.com"
            className="bg-white/5 border-white/10 text-white mt-1"
          />
        </div>
        <div>
          <Label className="text-gray-300">Phone</Label>
          <Input
            value={form.phone ?? ""}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="(555) 000-0000"
            className="bg-white/5 border-white/10 text-white mt-1"
          />
        </div>
        <div>
          <Label className="text-gray-300">Website</Label>
          <Input
            value={form.website ?? ""}
            onChange={(e) => set("website", e.target.value)}
            placeholder="https://smithlaw.com"
            className="bg-white/5 border-white/10 text-white mt-1"
          />
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <p className="text-amber-400 text-xs font-mono uppercase tracking-wider mb-3">Pricing & Billing</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-gray-300">Price Per Lead ($)</Label>
            <Input
              type="number"
              value={form.pricePerLead ?? "50"}
              onChange={(e) => set("pricePerLead", e.target.value)}
              className="bg-white/5 border-white/10 text-white mt-1"
            />
          </div>
          <div>
            <Label className="text-gray-300">Billing Cycle</Label>
            <Select
              value={form.billingCycle ?? "per_lead"}
              onValueChange={(v) => set("billingCycle", v as "per_lead" | "weekly" | "monthly")}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="per_lead">Per Lead</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <p className="text-amber-400 text-xs font-mono uppercase tracking-wider mb-3">Geographic Coverage</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-gray-300">Covered States (JSON array)</Label>
            <Input
              value={form.coveredStates ?? ""}
              onChange={(e) => set("coveredStates", e.target.value)}
              placeholder='["CA","TX","FL"] or leave empty for all'
              className="bg-white/5 border-white/10 text-white mt-1"
            />
          </div>
          <div>
            <Label className="text-gray-300">Exclusive States (JSON array)</Label>
            <Input
              value={form.exclusiveStates ?? ""}
              onChange={(e) => set("exclusiveStates", e.target.value)}
              placeholder='["CA"] — firm gets leads first'
              className="bg-white/5 border-white/10 text-white mt-1"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <p className="text-amber-400 text-xs font-mono uppercase tracking-wider mb-3">Lead Delivery</p>
        <div className="space-y-3">
          <div>
            <Label className="text-gray-300">Webhook URL</Label>
            <Input
              value={form.webhookUrl ?? ""}
              onChange={(e) => set("webhookUrl", e.target.value)}
              placeholder="https://firm.com/webhooks/solar-leads"
              className="bg-white/5 border-white/10 text-white mt-1"
            />
          </div>
          <div>
            <Label className="text-gray-300">Webhook Secret (HMAC signing)</Label>
            <Input
              value={form.webhookSecret ?? ""}
              onChange={(e) => set("webhookSecret", e.target.value)}
              placeholder="Leave blank to skip signing"
              className="bg-white/5 border-white/10 text-white mt-1"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <p className="text-amber-400 text-xs font-mono uppercase tracking-wider mb-3">Quality Filters</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-gray-300">Min Lead Score (0-10)</Label>
            <Input
              type="number"
              min={0}
              max={10}
              value={form.minLeadScore ?? 0}
              onChange={(e) => set("minLeadScore", parseInt(e.target.value))}
              className="bg-white/5 border-white/10 text-white mt-1"
            />
          </div>
          <div>
            <Label className="text-gray-300">Max Leads/Day</Label>
            <Input
              type="number"
              value={form.maxLeadsPerDay ?? ""}
              onChange={(e) => set("maxLeadsPerDay", e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Unlimited"
              className="bg-white/5 border-white/10 text-white mt-1"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <p className="text-amber-400 text-xs font-mono uppercase tracking-wider mb-3">Status & Notes</p>
        <div className="space-y-3">
          <div>
            <Label className="text-gray-300">Status</Label>
            <Select
              value={form.status ?? "active"}
              onValueChange={(v) => set("status", v as "active" | "paused" | "inactive")}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-300">Notes</Label>
            <Textarea
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Contract terms, contact preferences, etc."
              className="bg-white/5 border-white/10 text-white mt-1"
              rows={2}
            />
          </div>
        </div>
      </div>

      <DialogFooter className="pt-2">
        <Button variant="outline" onClick={onCancel} className="border-white/20 text-gray-300">
          Cancel
        </Button>
        <Button
          onClick={() => onSave(form)}
          disabled={loading || !form.name}
          className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
        >
          {loading ? "Saving..." : "Save Firm"}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function LeadDistribution() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("firms");
  const [showFirmDialog, setShowFirmDialog] = useState(false);
  const [editingFirm, setEditingFirm] = useState<Firm | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const utils = trpc.useUtils();

  // Queries
  const { data: stats } = trpc.leadDistribution.getDashboardStats.useQuery();
  const { data: firms = [], isLoading: firmsLoading } = trpc.leadDistribution.listFirms.useQuery();
  const { data: deliveries = [], isLoading: deliveriesLoading } =
    trpc.leadDistribution.listDeliveries.useQuery({ limit: 100 });

  // Mutations
  const createFirm = trpc.leadDistribution.createFirm.useMutation({
    onSuccess: () => {
      utils.leadDistribution.listFirms.invalidate();
      utils.leadDistribution.getDashboardStats.invalidate();
      setShowFirmDialog(false);
      toast.success("Firm added successfully");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateFirm = trpc.leadDistribution.updateFirm.useMutation({
    onSuccess: () => {
      utils.leadDistribution.listFirms.invalidate();
      setShowFirmDialog(false);
      setEditingFirm(null);
      toast.success("Firm updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteFirm = trpc.leadDistribution.deleteFirm.useMutation({
    onSuccess: () => {
      utils.leadDistribution.listFirms.invalidate();
      utils.leadDistribution.getDashboardStats.invalidate();
      setDeleteConfirm(null);
      toast.success("Firm removed");
    },
    onError: (e) => toast.error(e.message),
  });

  const markCharged = trpc.leadDistribution.markCharged.useMutation({
    onSuccess: () => {
      utils.leadDistribution.listDeliveries.invalidate();
      utils.leadDistribution.listFirms.invalidate();
      toast.success("Marked as charged");
    },
    onError: (e) => toast.error(e.message),
  });

  // Auth guard
  if (authLoading) return <div className="min-h-screen bg-[#0D0F14]" />;
  if (!user || user.role !== "admin") {
    navigate("/login");
    return null;
  }

  const handleSaveFirm = (data: Partial<Firm>) => {
    if (editingFirm) {
      updateFirm.mutate({ id: editingFirm.id, ...data } as Parameters<typeof updateFirm.mutate>[0]);
    } else {
      createFirm.mutate(data as Parameters<typeof createFirm.mutate>[0]);
    }
  };

  const acceptanceRate = (firm: Firm) => {
    if (!firm.totalLeadsDelivered) return "—";
    return `${Math.round((firm.totalLeadsAccepted / firm.totalLeadsDelivered) * 100)}%`;
  };

  const statusBadge = (status: string) => {
    if (status === "active") return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
    if (status === "paused") return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Paused</Badge>;
    return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Inactive</Badge>;
  };

  const deliveryStatusIcon = (status: string) => {
    if (status === "delivered") return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (status === "failed") return <XCircle className="w-4 h-4 text-red-400" />;
    return <Clock className="w-4 h-4 text-amber-400" />;
  };

  const scoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 5) return "text-amber-400";
    return "text-gray-400";
  };

  return (
    <div className="min-h-screen bg-[#0D0F14] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Lead Distribution</h1>
              <p className="text-gray-400 text-xs">Manage law firm partners & lead routing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin/leads")}
              className="border-white/20 text-gray-300 text-xs"
            >
              ← Back to Leads
            </Button>
            <Button
              size="sm"
              onClick={() => { setEditingFirm(null); setShowFirmDialog(true); }}
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Firm
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Active Firms"
            value={stats?.activeFirms ?? 0}
            icon={Building2}
            sub={`${stats?.totalFirms ?? 0} total`}
            color="amber"
          />
          <StatCard
            title="Leads Delivered"
            value={(stats?.totalDelivered ?? 0).toLocaleString()}
            icon={Send}
            sub={`${stats?.deliveriesLast7Days ?? 0} this week`}
            color="blue"
          />
          <StatCard
            title="Acceptance Rate"
            value={
              stats?.totalDelivered
                ? `${Math.round(((stats.totalAccepted ?? 0) / stats.totalDelivered) * 100)}%`
                : "—"
            }
            icon={TrendingUp}
            sub={`${stats?.totalAccepted ?? 0} accepted`}
            color="green"
          />
          <StatCard
            title="Total Revenue"
            value={`$${parseFloat(String(stats?.totalRevenue ?? 0)).toLocaleString()}`}
            icon={DollarSign}
            sub="All time"
            color="purple"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="firms" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <Users className="w-3 h-3 mr-1" />
              Law Firms ({firms.length})
            </TabsTrigger>
            <TabsTrigger value="deliveries" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <Zap className="w-3 h-3 mr-1" />
              Deliveries
            </TabsTrigger>
          </TabsList>

          {/* Firms Tab */}
          <TabsContent value="firms">
            <Card className="bg-[#0D0F14] border-white/10">
              <CardContent className="p-0">
                {firmsLoading ? (
                  <div className="p-8 text-center text-gray-500">Loading firms...</div>
                ) : firms.length === 0 ? (
                  <div className="p-12 text-center">
                    <Building2 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No law firms yet</p>
                    <p className="text-gray-600 text-sm mt-1">Add your first partner firm to start routing leads</p>
                    <Button
                      onClick={() => { setEditingFirm(null); setShowFirmDialog(true); }}
                      className="mt-4 bg-amber-500 hover:bg-amber-600 text-black font-bold"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Firm
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-gray-400">Firm</TableHead>
                        <TableHead className="text-gray-400">Coverage</TableHead>
                        <TableHead className="text-gray-400">Price</TableHead>
                        <TableHead className="text-gray-400">Delivered</TableHead>
                        <TableHead className="text-gray-400">Accepted</TableHead>
                        <TableHead className="text-gray-400">Revenue</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(firms as Firm[]).map((firm) => (
                        <TableRow key={firm.id} className="border-white/10 hover:bg-white/5">
                          <TableCell>
                            <div>
                              <p className="text-white font-medium">{firm.name}</p>
                              {firm.contactName && (
                                <p className="text-gray-500 text-xs">{firm.contactName}</p>
                              )}
                              {firm.exclusiveStates && (
                                <Badge className="mt-1 bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
                                  <Star className="w-2 h-2 mr-1" />
                                  Exclusive
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-gray-300 text-sm">
                              {firm.coveredStates
                                ? (() => {
                                    try {
                                      const states = JSON.parse(firm.coveredStates) as string[];
                                      return states.length === 0 ? "All states" : states.slice(0, 3).join(", ") + (states.length > 3 ? ` +${states.length - 3}` : "");
                                    } catch { return firm.coveredStates; }
                                  })()
                                : "All states"}
                            </p>
                          </TableCell>
                          <TableCell>
                            <p className="text-amber-400 font-mono font-bold">
                              ${parseFloat(firm.pricePerLead).toFixed(0)}
                            </p>
                            <p className="text-gray-500 text-xs">{firm.billingCycle.replace("_", " ")}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-white">{firm.totalLeadsDelivered.toLocaleString()}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-green-400">{firm.totalLeadsAccepted.toLocaleString()}</p>
                            <p className="text-gray-500 text-xs">{acceptanceRate(firm)}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-white font-mono">
                              ${parseFloat(firm.totalRevenue).toLocaleString()}
                            </p>
                          </TableCell>
                          <TableCell>{statusBadge(firm.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => { setEditingFirm(firm); setShowFirmDialog(true); }}
                                className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteConfirm(firm.id)}
                                className="h-7 w-7 p-0 text-gray-400 hover:text-red-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deliveries Tab */}
          <TabsContent value="deliveries">
            <Card className="bg-[#0D0F14] border-white/10">
              <CardContent className="p-0">
                {deliveriesLoading ? (
                  <div className="p-8 text-center text-gray-500">Loading deliveries...</div>
                ) : deliveries.length === 0 ? (
                  <div className="p-12 text-center">
                    <Send className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No deliveries yet</p>
                    <p className="text-gray-600 text-sm mt-1">Leads will appear here once firms are added and leads come in</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-gray-400">Lead</TableHead>
                        <TableHead className="text-gray-400">Firm</TableHead>
                        <TableHead className="text-gray-400">Score</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400">Accepted</TableHead>
                        <TableHead className="text-gray-400">Charged</TableHead>
                        <TableHead className="text-gray-400">Date</TableHead>
                        <TableHead className="text-gray-400 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deliveries.map(({ delivery, firmName, leadFirstName, leadLastName, leadPhone }) => (
                        <TableRow key={delivery.id} className="border-white/10 hover:bg-white/5">
                          <TableCell>
                            <p className="text-white text-sm">
                              {leadFirstName} {leadLastName}
                            </p>
                            {leadPhone && (
                              <p className="text-gray-500 text-xs">{leadPhone}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="text-gray-300 text-sm">{firmName ?? "—"}</p>
                          </TableCell>
                          <TableCell>
                            <span className={`font-mono font-bold text-sm ${scoreColor(delivery.leadScore)}`}>
                              {delivery.leadScore}/10
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {deliveryStatusIcon(delivery.status)}
                              <span className="text-xs text-gray-400 capitalize">{delivery.status}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {delivery.accepted === "accepted" && (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Accepted</Badge>
                            )}
                            {delivery.accepted === "rejected" && (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Rejected</Badge>
                            )}
                            {delivery.accepted === "pending" && (
                              <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {delivery.charged ? (
                              <span className="text-green-400 font-mono text-sm">
                                ${parseFloat(String(delivery.chargeAmount ?? 0)).toFixed(0)}
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs">Unbilled</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="text-gray-400 text-xs">
                              {new Date(delivery.createdAt).toLocaleDateString()}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            {!delivery.charged && delivery.status === "delivered" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const firm = (firms as Firm[]).find(f => f.id === delivery.firmId);
                                  if (firm) {
                                    markCharged.mutate({
                                      deliveryId: delivery.id,
                                      chargeAmount: firm.pricePerLead,
                                    });
                                  }
                                }}
                                className="h-6 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                              >
                                <DollarSign className="w-3 h-3 mr-1" />
                                Bill
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Firm Dialog */}
      <Dialog open={showFirmDialog} onOpenChange={setShowFirmDialog}>
        <DialogContent className="bg-[#0D0F14] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingFirm ? `Edit ${editingFirm.name}` : "Add Law Firm Partner"}
            </DialogTitle>
          </DialogHeader>
          <FirmForm
            initial={editingFirm ?? undefined}
            onSave={handleSaveFirm}
            onCancel={() => { setShowFirmDialog(false); setEditingFirm(null); }}
            loading={createFirm.isPending || updateFirm.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-[#0D0F14] border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Firm?</DialogTitle>
          </DialogHeader>
          <p className="text-gray-400 text-sm">
            This will remove the firm and all their delivery records. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="border-white/20 text-gray-300">
              Cancel
            </Button>
            <Button
              onClick={() => deleteConfirm !== null && deleteFirm.mutate({ id: deleteConfirm })}
              disabled={deleteFirm.isPending}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteFirm.isPending ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
