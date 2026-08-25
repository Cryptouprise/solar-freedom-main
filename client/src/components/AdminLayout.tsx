import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Newspaper,
  Link2,
  DollarSign,
  Settings,
  ChevronRight,
  LogOut,
  ExternalLink,
  PenSquare,
  Target,
  Wand2,
  Bot,
  Brain,
  Building2,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";

const NAV_SECTIONS = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", href: "/admin/analytics", icon: LayoutDashboard, description: "Traffic & conversions" },
      { label: "Outcomes", href: "/admin/outcomes", icon: BarChart3, description: "Clicks, leads & appointments" },
      { label: "Leads", href: "/admin/leads", icon: Users, description: "Form submissions & CRM" },
    ],
  },
  {
    section: "Content",
    items: [
      { label: "Blog Studio", href: "/admin/blog-studio", icon: Wand2, description: "AI writing, drafts & SEO" },
      { label: "Post Editor", href: "/admin/posts", icon: PenSquare, description: "Edit posts, images & links" },
      { label: "Content Manager", href: "/admin/content", icon: FileText, description: "All posts & pages" },
      { label: "Press Releases", href: "/admin/press-releases", icon: Newspaper, description: "Auto-distribution engine" },
    ],
  },
  {
    section: "Revenue",
    items: [
      { label: "GHL CRM", href: "/admin/ghl", icon: DollarSign, description: "GoHighLevel contacts & pipeline" },
      { label: "Attorney Pipeline", href: "/admin/attorneys", icon: Building2, description: "Prospects, outreach & revenue partners" },
      { label: "Lead Distribution", href: "/admin/lead-distribution", icon: Building2, description: "Law firm partners & routing" },
      { label: "AI Costs", href: "/admin/press-releases#costs", icon: BarChart3, description: "Model spend tracking" },
    ],
  },
  {
    section: "Agents & Automation",
    items: [
      { label: "Agent Command", href: "/admin/agents", icon: Brain, description: "6-agent autonomous system" },
      { label: "Automations", href: "/admin/automations", icon: Bot, description: "Custom schedules & triggers" },
    ],
  },
  {
    section: "SEO",
    items: [
      { label: "SEO Command Center", href: "/seo-command-center", icon: Target, description: "SEO tasks & strategy" },
      { label: "Backlinks", href: "/admin/press-releases#backlinks", icon: Link2, description: "Link acquisition tracker" },
    ],
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [location] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });
  const seoAlert = trpc.agents.seoRankingAlert.useQuery(undefined, { staleTime: 5 * 60 * 1000, retry: false });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0F14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    window.location.href = getLoginUrl();
    return null;
  }

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  return (
    <div className="min-h-screen bg-[#0D0F14] flex">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 bg-[#111318] border-r border-white/5 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-white/5">
          <Link href="/">
            <a className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <span className="text-amber-400 font-bold text-sm">SF</span>
              </div>
              <div>
                <div className="text-white text-sm font-semibold leading-none">Solar Freedom</div>
                <div className="text-gray-500 text-xs mt-0.5">Admin Panel</div>
              </div>
            </a>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.section}>
              <div className="px-3 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">{section.section}</span>
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href || location.startsWith(item.href.split("#")[0] + "/");
                  return (
                    <Link key={item.href} href={item.href}>
                      <a
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group",
                          isActive
                            ? "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                            : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                        )}
                      >
                        <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-amber-400" : "text-gray-500 group-hover:text-gray-300")} />
                        <div className="flex-1 min-w-0">
                          <div className={cn("text-sm font-medium leading-none", isActive ? "text-amber-300" : "")}>{item.label}</div>
                          <div className="text-xs text-gray-600 mt-0.5 truncate">{item.description}</div>
                        </div>
                        {isActive && <ChevronRight className="w-3 h-3 text-amber-500/60 shrink-0" />}
                      </a>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <Separator className="bg-white/5" />

        {/* View Site */}
        <div className="p-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            View Live Site
          </a>
        </div>

        {/* User */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarImage src={undefined} />
              <AvatarFallback className="bg-amber-500/20 text-amber-300 text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{user?.name ?? "Admin"}</div>
              <div className="text-gray-500 text-xs truncate">{user?.email ?? ""}</div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-gray-500 hover:text-red-400 hover:bg-red-500/10 shrink-0"
              onClick={() => logoutMutation.mutate()}
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        {(title || subtitle) && (
          <header className="bg-[#111318] border-b border-white/5 px-8 py-5 shrink-0">
            {title && <h1 className="text-white text-xl font-semibold">{title}</h1>}
            {subtitle && <p className="text-gray-400 text-sm mt-0.5">{subtitle}</p>}
          </header>
        )}

        {seoAlert.data?.significant && seoAlert.data.clicks && seoAlert.data.impressions && (
          <a href="/seo-command-center" className={cn(
            "mx-6 mt-4 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
            seoAlert.data.direction === "up"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15"
              : seoAlert.data.direction === "down"
                ? "border-amber-500/35 bg-amber-500/10 text-amber-100 hover:bg-amber-500/15"
                : "border-sky-500/30 bg-sky-500/10 text-sky-100 hover:bg-sky-500/15"
          )}>
            {seoAlert.data.direction === "up" ? <TrendingUp className="h-5 w-5 shrink-0 text-emerald-400" /> : seoAlert.data.direction === "down" ? <TrendingDown className="h-5 w-5 shrink-0 text-amber-400" /> : <AlertTriangle className="h-5 w-5 shrink-0 text-sky-400" />}
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Significant verified SEO change detected</p>
              <p className="mt-0.5 text-xs opacity-85">
                Clicks {seoAlert.data.clicks.delta >= 0 ? "+" : ""}{seoAlert.data.clicks.delta} ({seoAlert.data.clicks.percent}%) · Impressions {seoAlert.data.impressions.delta >= 0 ? "+" : ""}{seoAlert.data.impressions.delta} ({seoAlert.data.impressions.percent}%) across {seoAlert.data.measuredPages} measured pages. Review SEO evidence →
              </p>
            </div>
          </a>
        )}

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
