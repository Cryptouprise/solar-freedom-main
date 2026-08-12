/** Canonical targets for legacy blog URLs that must never enter the sitemap. */
export const BLOG_SLUG_REDIRECTS: Record<string, string> = {
  "/blog/freedom-forever-solar-bankruptcy": "/blog/freedom-forever-solar-bankruptcy-what-homeowners-can-do-2026",
  "/blog/how-to-cancel-sunnova-solar-contract": "/blog/how-to-cancel-sunnova-solar-contract-2026",
  "/blog/solar-contract-escalator-clause-what-it-means": "/blog/solar-contract-escalator-clause-explained-how-to-fight-it",
  "/blog/solar-panel-scam-signs-what-to-do": "/blog/solar-panel-scam-signs-and-solutions",
  "/blog/solar-contract-red-flags-and-scams": "/blog/solar-contract-red-flags",
  "/blog/solar-lease-vs-loan-vs-ppa": "/blog/solar-loan-vs-lease-problems",
  "/blog/goodleap-solar-loan-cancellation-guide": "/blog/goodleap-cancel-solar-loan-2026",
  "/blog/new-jersey-solar-contract-cancellation": "/blog/new-jersey-solar-contract-rights",
  "/blog/cancel-solar-contract-houston": "/blog/cancel-solar-contract-houston-tx",
  "/blog/goodleap-solar-loan-hidden-dealer-fees-2024": "/blog/goodleap-solar-loan-hidden-dealer-fees-2026",
  "/blog/freedom-forever-solar-bankruptcy-problems": "/blog/freedom-forever-solar-bankruptcy-what-homeowners-can-do-2026",
  "/blog/how-to-file-a-complaint-against-solar-company": "/blog/how-to-file-a-complaint-against-solar-company-attorney-general",
  "/blog/tesla-solar-solarcity-complaints": "/blog/tesla-solar-solarcity-complaints-cancel-2026",
  "/blog/solar-contract-escalator-clause": "/blog/solar-contract-escalator-clause-explained-how-to-fight-it",
  "/blog/selling-home-with-solar-ppa": "/blog/selling-home-with-solar-ppa-panels-transfer-or-cancel",
  "/blog/sunnova-contract-transfer-problems": "/blog/sunnova-solar-contract-transfer-problems",
};

export function isLegacyBlogSlug(slug: string): boolean {
  return Object.hasOwn(BLOG_SLUG_REDIRECTS, `/blog/${slug}`);
}
