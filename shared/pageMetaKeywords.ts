import pageKeywords from './page-meta-keywords.json';

const registry = pageKeywords as Record<string,string[]>;
for (const [path, keywords] of Object.entries(registry)) {
  if (keywords.length < 3 || keywords.length > 8 || keywords.some(keyword => !keyword.trim() || keyword.includes(',')) || new Set(keywords.map(keyword=>keyword.toLowerCase().trim())).size !== keywords.length) {
    throw new Error(`Invalid meta keyword registry entry: ${path}. Require 3–8 distinct nonempty keywords.`);
  }
}
/** Page-specific metadata; absent entries never introduce site-wide keywords. */
export function getPageMetaKeywords(pagePath:string): string | undefined {
  const path = pagePath.split(/[?#]/,1)[0].replace(/\/+$/, '') || '/';
  return Object.prototype.hasOwnProperty.call(registry,path) ? registry[path].join(', ') : undefined;
}
