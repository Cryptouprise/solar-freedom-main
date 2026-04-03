// ─── useSeoMeta ──────────────────────────────────────────────────────────────
// Dynamically sets <title> and <meta name="description"> per page.
// Also updates og:title, og:description, og:url, og:type, canonical URL, and robots directive.

import { useEffect } from "react";

interface SeoMeta {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  /** og:type — "article" for blog posts, defaults to "website" */
  ogType?: "website" | "article";
  /** Set to true for thin/duplicate pages that should not be indexed */
  noindex?: boolean;
}

const DEFAULT_OG_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663287718525/46qo2AwgwNWJ4wJwr8EnH8/hero-bg-FmKRyibRwC4JGhU5naV2R2.webp";

export function useSeoMeta({ title, description, canonical, ogImage, ogType, noindex }: SeoMeta) {
  useEffect(() => {
    // Title
    document.title = title;

    // Meta description
    let descEl = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!descEl) {
      descEl = document.createElement("meta");
      descEl.name = "description";
      document.head.appendChild(descEl);
    }
    descEl.content = description;

    // Canonical
    const canonicalUrl = canonical ?? `https://breakyoursolarcontract.com${window.location.pathname}`;
    let canonEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonEl) {
      canonEl = document.createElement("link");
      canonEl.rel = "canonical";
      document.head.appendChild(canonEl);
    }
    canonEl.href = canonicalUrl;

    // Robots directive — noindex for thin/duplicate pages
    let robotsEl = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (noindex) {
      if (!robotsEl) {
        robotsEl = document.createElement("meta");
        robotsEl.name = "robots";
        document.head.appendChild(robotsEl);
      }
      robotsEl.content = "noindex, follow";
    } else if (robotsEl) {
      // Ensure indexable pages are explicitly marked index
      robotsEl.content = "index, follow";
    }

    // OG title
    let ogTitleEl = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    if (ogTitleEl) ogTitleEl.content = title;

    // OG description
    let ogDescEl = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    if (ogDescEl) ogDescEl.content = description;

    // OG URL
    let ogUrlEl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (ogUrlEl) ogUrlEl.content = canonicalUrl;

    // OG image
    const img = ogImage ?? DEFAULT_OG_IMAGE;
    let ogImgEl = document.querySelector<HTMLMetaElement>('meta[property="og:image"]');
    if (ogImgEl) ogImgEl.content = img;

    // OG type — "article" for blog posts, "website" for everything else
    let ogTypeEl = document.querySelector<HTMLMetaElement>('meta[property="og:type"]');
    if (ogTypeEl) ogTypeEl.content = ogType ?? "website";

    // Twitter title
    let twTitleEl = document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]');
    if (twTitleEl) twTitleEl.content = title;

    // Twitter description
    let twDescEl = document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]');
    if (twDescEl) twDescEl.content = description;

    // Cleanup: restore defaults when component unmounts
    return () => {
      document.title = "Solar Freedom — Get Out of Your Solar Contract Today";
      const d = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (d) d.content = "Trapped in a solar contract? Our attorneys cancel solar agreements for 3,000+ homeowners. Free case review. Results in 30–90 days.";
      const r = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
      if (r) r.content = "index, follow";
      const t = document.querySelector<HTMLMetaElement>('meta[property="og:type"]');
      if (t) t.content = "website";
    };
  }, [title, description, canonical, ogImage, ogType, noindex]);
}
