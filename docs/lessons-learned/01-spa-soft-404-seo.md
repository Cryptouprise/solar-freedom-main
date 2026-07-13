# SPA Route Delivery and Soft-404 Prevention

An SPA catch-all that returns the homepage document and HTTP 200 for every path
can create duplicate canonicals, thin crawler responses, and soft-404 behavior.
Modern search engines may render JavaScript, but rendering is not a substitute
for correct status codes and source-visible metadata.

For every public route:

1. return a truthful status;
2. emit a self-consistent canonical;
3. provide route-specific source-visible title, description, and meaningful
   content;
4. return a real 404 with `noindex` for unknown routes;
5. mark private/admin shells `noindex, nofollow`; and
6. preserve `noindex` on evidence-withheld routes.

Validate built HTML, direct HTTP responses, JavaScript-rendered output, desktop
and mobile layouts, and a sample of unknown/lookalike paths. Use URL Inspection
after deployment when access is available; do not infer index status from a
sitemap or Search Analytics silence.
