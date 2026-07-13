# Structured-Data Duplication Prevention

Do not emit the same FAQ, breadcrumb, article, or identity entity from both the
static shell and a route component. Generate each eligible entity once and only
for content visible on that page.

The release tests should:

- parse every JSON-LD block;
- reject duplicate singleton entities;
- reject FAQ schema when the visible content or publication gate is absent;
- reject unsupported organization, professional-service, rating, review, and
  outcome claims; and
- verify canonical and entity URLs agree.

Rich-result eligibility and display are controlled by the search engine and are
not guaranteed by valid markup.
