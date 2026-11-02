import pageKeywords from "./page-meta-keywords.json";

/** Page-specific metadata; an absent entry must not introduce site-wide keywords. */
export function getPageMetaKeywords(pagePath: string): string | undefined {
  const normalizedPath = pagePath.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
  const keywords = (pageKeywords as Record<string, string[]>)[normalizedPath];
  return keywords?.join(", ");
}
