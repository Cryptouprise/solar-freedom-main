import redirects from "../shared/seo-redirects.json";

export const PUBLIC_PATH_REDIRECTS: Record<string, string> = redirects.public;
export const BLOG_SLUG_REDIRECTS: Record<string, string> = redirects.blog;

export function isLegacyBlogSlug(slug: string): boolean {
  return Object.hasOwn(BLOG_SLUG_REDIRECTS, `/blog/${slug}`);
}
