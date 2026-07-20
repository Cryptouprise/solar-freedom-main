import policy from "./seo-policy.json";

const staticPaths = new Set<string>(policy.indexableStaticPaths);
const citySlugs = new Set<string>(policy.retainedCitySlugs);
const stateSlugs = new Set<string>(policy.retainedStateSlugs);
const companySlugs = new Set<string>(policy.retainedCompanySlugs);
const blogSlugs = new Set<string>(policy.retainedBlogSlugs);

export const SEO_RECOVERY_MODE = policy.recoveryMode;
export const INDEXABLE_STATIC_PATHS = staticPaths;
export const RETAINED_CITY_SLUGS = citySlugs;
export const RETAINED_STATE_SLUGS = stateSlugs;
export const RETAINED_COMPANY_SLUGS = companySlugs;
export const RETAINED_BLOG_SLUGS = blogSlugs;

export function isPathIndexable(pathname: string): boolean {
  const path = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  if (staticPaths.has(path)) return true;

  const city = path.match(/^\/cancel-solar-contract\/([^/]+)$/);
  if (city) return citySlugs.has(city[1]);

  const state = path.match(/^\/solar-contract-laws\/([^/]+)$/);
  if (state) return stateSlugs.has(state[1]);

  const company = path.match(/^\/cancel-(.+)-solar-contract$/);
  if (company) return companySlugs.has(company[1]);

  const blog = path.match(/^\/blog\/([^/]+)$/);
  if (blog) return blogSlugs.has(blog[1]);

  return false;
}
