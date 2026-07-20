import { Link, useLocation } from "wouter";

const links = [
  ["/about", "About"],
  ["/contact", "Contact"],
  ["/editorial-policy", "Editorial Policy"],
  ["/corrections", "Corrections"],
  ["/privacy", "Privacy"],
  ["/terms", "Terms"],
  ["/disclaimer", "Disclaimer"],
] as const;

export default function TrustLinks() {
  const [location] = useLocation();
  if (location.startsWith("/admin/") || location === "/login") return null;

  return (
    <nav aria-label="Site policies" className="border-t border-white/10 bg-[#090b0f] px-4 py-5">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-zinc-400">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="hover:text-amber-400">
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
