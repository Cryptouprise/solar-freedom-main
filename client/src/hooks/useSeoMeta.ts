// ─── useSeoMeta ──────────────────────────────────────────────────────────────
// Dynamically sets <title> and <meta name="description"> per page.
// Also updates og:title, og:description, and canonical URL.

import { useEffect } from "react";

interface SeoMeta {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
}

const DEFAULT_OG_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663287718525/46qo2AwgwNWJ4wJwr8EnH8/hero-bg-FmKRyibRwC4JGhU5naV2R2.webp";

export function useSeoMeta({ title, description, canonical, ogImage }: SeoMeta) {
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
    };
  }, [title, description, canonical, ogImage]);
}
