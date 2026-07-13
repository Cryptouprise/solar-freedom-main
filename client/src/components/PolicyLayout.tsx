import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { Link } from "wouter";

const SITE_ORIGIN = "https://breakyoursolarcontract.com";

type PolicyLayoutProps = {
  title: string;
  description: string;
  canonicalPath: string;
  effectiveDate: string;
  children: ReactNode;
};

export function PolicyLayout({
  title,
  description,
  canonicalPath,
  effectiveDate,
  children,
}: PolicyLayoutProps) {
  useEffect(() => {
    document.title = `${title} | Solar Freedom`;
    const upsertMeta = (name: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.name = name;
        document.head.appendChild(element);
      }
      element.content = content;
    };
    upsertMeta("description", description);
    upsertMeta("robots", "index, follow");

    document.head.querySelectorAll('link[rel="canonical"]').forEach(element => element.remove());
    const canonical = document.createElement("link");
    canonical.rel = "canonical";
    canonical.href = `${SITE_ORIGIN}${canonicalPath}`;
    document.head.appendChild(canonical);
  }, [canonicalPath, description, title]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      <header className="border-b border-white/10 bg-slate-950/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-amber-300">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Solar Freedom
          </Link>
          <nav aria-label="Policy navigation" className="flex gap-4 text-sm text-slate-400">
            <Link href="/privacy-policy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </nav>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
        <div className="mb-10 border-b border-white/10 pb-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-400">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" /> Website policy
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">{description}</p>
          <p className="mt-4 text-sm text-slate-500">Effective and last updated: {effectiveDate}</p>
        </div>

        <div className="policy-copy space-y-10 [&_a]:font-semibold [&_a]:text-amber-300 [&_a]:underline-offset-4 hover:[&_a]:text-amber-200 [&_a]:hover:underline [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-white [&_li]:leading-7 [&_p]:leading-7 [&_p]:text-slate-300 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2">
          {children}
        </div>

        <aside className="mt-12 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-bold text-white">Policy questions or privacy requests</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Email enough information to identify the request, but do not send passwords, full account credentials,
            Social Security numbers, or unnecessary sensitive documents.
          </p>
          <a href="mailto:info@breakyoursolarcontract.com" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-300">
            <Mail className="h-4 w-4" aria-hidden="true" /> info@breakyoursolarcontract.com
          </a>
        </aside>
      </article>
    </main>
  );
}

export function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2>{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
