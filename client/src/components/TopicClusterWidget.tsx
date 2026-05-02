// ─── TOPIC CLUSTER WIDGET ────────────────────────────────────────────────────
// Design: Dark Industrial / Cinematic — Bebas Neue + Inter
// Purpose: Internal linking widget shown at bottom of blog/city/company pages
// Tells Google these pages are topically related and boosts cluster authority

import { Link } from "wouter";
import { getRelatedSpokes, getClusterForPage, TOPIC_CLUSTERS } from "@/data/topicClusters";
import type { ClusterSpoke } from "@/data/topicClusters";

const TYPE_ICONS: Record<ClusterSpoke["type"], string> = {
  blog: "📝",
  city: "📍",
  company: "⚠️",
  home: "🔓",
};

const TYPE_LABELS: Record<ClusterSpoke["type"], string> = {
  blog: "GUIDE",
  city: "STATE LAW",
  company: "COMPANY",
  home: "FREE REVIEW",
};

const COLOR_MAP: Record<string, { border: string; badge: string; glow: string }> = {
  amber: {
    border: "border-amber-500/30",
    badge: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
    glow: "hover:border-amber-500/60 hover:shadow-amber-500/10",
  },
  red: {
    border: "border-red-500/30",
    badge: "bg-red-500/10 text-red-400 border border-red-500/30",
    glow: "hover:border-red-500/60 hover:shadow-red-500/10",
  },
  blue: {
    border: "border-blue-500/30",
    badge: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
    glow: "hover:border-blue-500/60 hover:shadow-blue-500/10",
  },
  green: {
    border: "border-green-500/30",
    badge: "bg-green-500/10 text-green-400 border border-green-500/30",
    glow: "hover:border-green-500/60 hover:shadow-green-500/10",
  },
  purple: {
    border: "border-purple-500/30",
    badge: "bg-purple-500/10 text-purple-400 border border-purple-500/30",
    glow: "hover:border-purple-500/60 hover:shadow-purple-500/10",
  },
  orange: {
    border: "border-orange-500/30",
    badge: "bg-orange-500/10 text-orange-400 border border-orange-500/30",
    glow: "hover:border-orange-500/60 hover:shadow-orange-500/10",
  },
};

interface TopicClusterWidgetProps {
  currentUrl: string;
  showAllClusters?: boolean;
}

export default function TopicClusterWidget({ currentUrl, showAllClusters = false }: TopicClusterWidgetProps) {
  const cluster = getClusterForPage(currentUrl);
  const spokes = getRelatedSpokes(currentUrl, 4);

  if (!cluster && !showAllClusters) return null;

  const colors = COLOR_MAP[cluster?.color || "amber"] || COLOR_MAP.amber;

  if (showAllClusters) {
    // Show all 5 clusters (used on homepage / blog index)
    return (
      <div className="mt-16 border-t border-white/10 pt-12">
        <div className="mb-8">
          <div className="text-xs font-mono text-amber-400 tracking-widest mb-2">KNOWLEDGE BASE</div>
          <h3 className="text-2xl font-black tracking-tight text-white" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>
            EVERYTHING YOU NEED TO KNOW
          </h3>
          <p className="text-gray-400 text-sm mt-1">Five topic clusters covering every angle of solar contract cancellation.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOPIC_CLUSTERS.map((tc) => {
            const c = COLOR_MAP[tc.color] || COLOR_MAP.amber;
            return (
              <Link key={tc.id} href={tc.pillarUrl}>
                <div className={`group p-4 rounded-lg bg-white/3 border ${c.border} ${c.glow} hover:shadow-lg transition-all duration-200 cursor-pointer`}>
                  <div className={`text-xs font-mono px-2 py-0.5 rounded-full inline-block mb-3 ${c.badge}`}>
                    TOPIC CLUSTER
                  </div>
                  <div className="text-white font-bold text-sm leading-tight group-hover:text-amber-400 transition-colors">
                    {tc.pillarTitle}
                  </div>
                  <div className="text-gray-500 text-xs mt-2 leading-relaxed line-clamp-2">
                    {tc.pillarDescription}
                  </div>
                  <div className="text-gray-600 text-xs mt-3 font-mono">
                    {tc.spokes.length} related pages →
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 border-t border-white/10 pt-10">
      <div className="mb-6">
        <div className={`text-xs font-mono tracking-widest mb-1 ${colors.badge.includes("amber") ? "text-amber-400" : colors.badge.includes("red") ? "text-red-400" : colors.badge.includes("blue") ? "text-blue-400" : colors.badge.includes("green") ? "text-green-400" : "text-purple-400"}`}>
          RELATED RESOURCES
        </div>
        <h3 className="text-xl font-black tracking-tight text-white" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>
          {cluster?.pillarTitle?.toUpperCase()}
        </h3>
        <p className="text-gray-500 text-xs mt-1">
          Part of the <span className="text-gray-300">{cluster?.pillarTitle}</span> knowledge cluster
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {spokes.map((spoke) => (
          <Link key={spoke.url} href={spoke.url}>
            <div className={`group p-4 rounded-lg bg-white/3 border ${colors.border} ${colors.glow} hover:shadow-lg transition-all duration-200 cursor-pointer flex gap-3 items-start`}>
              <span className="text-lg mt-0.5 flex-shrink-0">{TYPE_ICONS[spoke.type]}</span>
              <div className="min-w-0">
                <div className={`text-xs font-mono px-1.5 py-0.5 rounded inline-block mb-1 ${colors.badge}`}>
                  {TYPE_LABELS[spoke.type]}
                </div>
                <div className="text-white text-sm font-semibold leading-tight group-hover:text-amber-400 transition-colors">
                  {spoke.title}
                </div>
                <div className="text-gray-500 text-xs mt-1 leading-relaxed">
                  {spoke.description}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pillar page link if we're on a spoke */}
      {cluster && cluster.pillarUrl !== currentUrl && (
        <div className="mt-4">
          <Link href={cluster.pillarUrl}>
            <div className={`group p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/50 transition-all duration-200 cursor-pointer flex items-center justify-between`}>
              <div>
                <div className="text-xs font-mono text-amber-500/70 mb-0.5">MAIN GUIDE</div>
                <div className="text-amber-400 text-sm font-bold group-hover:text-amber-300 transition-colors">
                  {cluster.pillarTitle} →
                </div>
              </div>
              <div className="text-amber-500/40 text-2xl">⚡</div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
