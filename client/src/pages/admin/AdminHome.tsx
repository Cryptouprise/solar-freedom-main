/**
 * Admin Home — Central hub for all Solar Freedom admin tools.
 * Accessible at /admin — shows quick-links to every tool with status indicators.
 */

import { Link } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard,
  Users,
  FileText,
  Newspaper,
  Link2,
  DollarSign,
  ChevronRight,
  PenSquare,
  Target,
  Wand2,
  Bot,
  Brain,
  Building2,
  Zap,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TOOL_CARDS = [
  {
    section: "Overview",
    color: "amber",
    tools: [
      {
        label: "Analytics Dashboard",
        href: "/admin/analytics",
        icon: LayoutDashboard,
        description: "Live GA4 traffic, conversions, and revenue data",
        badge: null,
      },
      {
        label: "Lead Manager",
        href: "/admin/leads",
        icon: Users,
        description: "All form submissions, CRM sync, and lead status",
        badge: null,
      },
    ],
  },
  {
    section: "Content",
    color: "blue",
    tools: [
      {
        label: "Blog Studio",
        href: "/admin/blog-studio",
        icon: Wand2,
        description: "AI writing, agent drafts, SEO scoring, and publishing",
        badge: "AI",
      },
      {
        label: "Post Editor",
        href: "/admin/posts",
        icon: PenSquare,
        description: "Edit any blog post — content, images, links, and meta",
        badge: null,
      },
      {
        label: "Content Manager",
        href: "/admin/content",
        icon: FileText,
        description: "All posts and pages — publish, unpublish, delete",
        badge: null,
      },
      {
        label: "Press Releases",
        href: "/admin/press-releases",
        icon: Newspaper,
        description: "Auto-distribution engine, backlink tracker, AI costs",
        badge: null,
      },
    ],
  },
  {
    section: "Revenue",
    color: "green",
    tools: [
      {
        label: "Lead Distribution",
        href: "/admin/lead-distribution",
        icon: Building2,
        description: "Law firm partners, lead routing, billing, and delivery history",
        badge: null,
      },
      {
        label: "AI Cost Tracker",
        href: "/admin/press-releases#costs",
        icon: DollarSign,
        description: "Per-agent model spend, daily cost breakdown",
        badge: null,
      },
    ],
  },
  {
    section: "Agents & Automation",
    color: "purple",
    tools: [
      {
        label: "Agent Command Center",
        href: "/admin/agents",
        icon: Brain,
        description: "6-agent autonomous system — run, message, and monitor all agents",
        badge: "6 Agents",
      },
      {
        label: "Automation Builder",
        href: "/admin/automations",
        icon: Bot,
        description: "Custom schedules, triggers, and AI-driven workflows",
        badge: null,
      },
    ],
  },
  {
    section: "SEO",
    color: "orange",
    tools: [
      {
        label: "SEO Command Center",
        href: "/seo-command-center",
        icon: Target,
        description: "Full SEO strategy, task tracking, and indexing status",
        badge: null,
      },
      {
        label: "Backlink Tracker",
        href: "/admin/press-releases#backlinks",
        icon: Link2,
        description: "Inbound links from Medium, press releases, and outreach",
        badge: null,
      },
    ],
  },
];

const COLOR_MAP: Record<string, { bg: string; border: string; icon: string; badge: string }> = {
  amber:  { bg: "bg-amber-500/10",  border: "border-amber-500/20",  icon: "text-amber-400",  badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  blue:   { bg: "bg-blue-500/10",   border: "border-blue-500/20",   icon: "text-blue-400",   badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  green:  { bg: "bg-green-500/10",  border: "border-green-500/20",  icon: "text-green-400",  badge: "bg-green-500/20 text-green-300 border-green-500/30" },
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", icon: "text-purple-400", badge: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  orange: { bg: "bg-orange-500/10", border: "border-orange-500/20", icon: "text-orange-400", badge: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
};

export default function AdminHome() {
  const { data: leadsData } = trpc.leads.list.useQuery({ limit: 999, offset: 0 });

  return (
    <AdminLayout title="Admin Home" subtitle="Solar Freedom — Command Center">
      <div className="p-8 space-y-10">

        {/* Hero welcome */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-white text-2xl font-bold mb-1">Welcome back, Chase.</h2>
            <p className="text-gray-400 text-sm">
              Everything you need to run Solar Freedom is below. Click any tool to open it — the sidebar stays with you everywhere.
            </p>
          </div>
          <a
            href="https://www.breakyoursolarcontract.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-amber-400 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View Live Site
          </a>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Leads", value: leadsData?.length ?? "—", icon: Users, color: "amber" },
            { label: "Active Agents", value: "6", icon: Brain, color: "purple" },
            { label: "Blog Posts", value: "127+", icon: FileText, color: "blue" },
            { label: "Cities Covered", value: "303", icon: Target, color: "orange" },
          ].map((stat) => {
            const Icon = stat.icon;
            const c = COLOR_MAP[stat.color];
            return (
              <div key={stat.label} className={`rounded-xl border ${c.border} ${c.bg} p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${c.icon}`} />
                  <span className="text-gray-400 text-xs">{stat.label}</span>
                </div>
                <div className="text-white text-2xl font-bold">{stat.value}</div>
              </div>
            );
          })}
        </div>

        {/* Tool sections */}
        {TOOL_CARDS.map((section) => {
          const c = COLOR_MAP[section.color];
          return (
            <div key={section.section}>
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-xs font-semibold uppercase tracking-widest ${c.icon}`}>{section.section}</span>
                <div className={`flex-1 h-px ${c.border} border-t`} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {section.tools.map((tool) => {
                  const Icon = tool.icon;
                  const isExternal = !tool.href.startsWith("/admin");
                  return (
                    <Link key={tool.href} href={tool.href}>
                      <a className={`group flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:${c.bg} hover:${c.border} transition-all duration-200`}>
                        <div className={`w-10 h-10 rounded-lg ${c.bg} ${c.border} border flex items-center justify-center shrink-0`}>
                          <Icon className={`w-5 h-5 ${c.icon}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-white text-sm font-semibold group-hover:text-white">{tool.label}</span>
                            {tool.badge && (
                              <Badge className={`text-[10px] px-1.5 py-0 h-4 ${c.badge} border`}>{tool.badge}</Badge>
                            )}
                          </div>
                          <p className="text-gray-500 text-xs leading-relaxed truncate">{tool.description}</p>
                        </div>
                        <ArrowRight className={`w-4 h-4 text-gray-600 group-hover:${c.icon} transition-colors shrink-0`} />
                      </a>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Footer note */}
        <div className="text-center pt-4 border-t border-white/5">
          <p className="text-gray-600 text-xs">
            Use the sidebar on the left to navigate between tools at any time. Back and forward browser buttons work on all pages.
          </p>
        </div>

      </div>
    </AdminLayout>
  );
}
