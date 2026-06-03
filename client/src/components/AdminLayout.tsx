import { useState } from "react";
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
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "@/components/ui/sheet";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin/analytics",
    icon: LayoutDashboard,
    description: "Traffic & conversions",
  },
  {
    label: "Leads",
    href: "/admin/leads",
    icon: Users,
    description: "Form submissions & CRM",
  },
  {
    label: "Content",
    href: "/admin/content",
    icon: FileText,
    description: "Blog posts & pages",
  },
  {
    label: "Post Editor",
    href: "/admin/posts",
    icon: PenSquare,
    description: "Edit posts, images & links",
  },
  {
    label: "Blog Studio",
    href: "/admin/blog-studio",
    icon: Wand2,
    description: "AI writing, SEO, media",
  },
  {
    label: "Press Releases",
    href: "/admin/press-releases",
    icon: Newspaper,
    description: "Auto-distribution engine",
  },
  {
    label: "Backlinks",
    href: "/admin/press-releases#backlinks",
    icon: Link2,
    description: "Link acquisition tracker",
  },
  {
    label: "AI Costs",
    href: "/admin/press-releases#costs",
    icon: DollarSign,
    description: "Model spend tracking",
  },
  {
    label: "SEO Command Center",
    href: "/seo-command-center",
    icon: Target,
    description: "SEO tasks & strategy",
  },
  {
    label: "Automations",
    href: "/admin/automations",
    icon: Bot,
    description: "Custom schedules & AI agents",
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
}

export default function AdminLayout({ children, title, subtitle, headerActions }: AdminLayoutProps) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });

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

  const currentNavItem = NAV_ITEMS.find(item => 
    location === item.href || location.startsWith(item.href.split("#")[0] + "/")
  );
  const displayTitle = title || currentNavItem?.label || "Admin";

  return (
    <div className="min-h-screen bg-[#0D0F14] flex flex-col md:flex-row">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 shrink-0 bg-[#111318] border-r border-white/5 flex flex-col">
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
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
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
        {/* Sticky Mobile Admin Header */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-[#111318] border-b border-white/5 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white h-9 w-9">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-[#111318] border-r border-white/5 flex flex-col [&>button]:hidden">
                {/* Logo */}
                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                  <Link href="/">
                    <a className="flex items-center gap-2 group" onClick={() => setIsMobileOpen(false)}>
                      <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                        <span className="text-amber-400 font-bold text-sm">SF</span>
                      </div>
                      <div>
                        <div className="text-white text-sm font-semibold leading-none">Solar Freedom</div>
                        <div className="text-gray-500 text-xs mt-0.5">Admin Panel</div>
                      </div>
                    </a>
                  </Link>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white h-8 w-8">
                      <X className="w-4 h-4" />
                    </Button>
                  </SheetClose>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.href || location.startsWith(item.href.split("#")[0] + "/");
                    return (
                      <Link key={item.href} href={item.href}>
                        <a
                          onClick={() => setIsMobileOpen(false)}
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
              </SheetContent>
            </Sheet>
            <span className="text-white font-semibold text-sm truncate max-w-[150px]">{displayTitle}</span>
          </div>

          {/* Mobile Header Actions (Save/Publish buttons) */}
          <div className="flex items-center gap-1">
            {headerActions}
          </div>
        </header>

        {/* Desktop Header */}
        {(title || subtitle) && (
          <header className="hidden md:block bg-[#111318] border-b border-white/5 px-8 py-5 shrink-0">
            {title && <h1 className="text-white text-xl font-semibold">{title}</h1>}
            {subtitle && <p className="text-gray-400 text-sm mt-0.5">{subtitle}</p>}
          </header>
        )}

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
