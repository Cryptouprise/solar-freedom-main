# Search Measurement Workbook Specification

Historical keyword positions formerly embedded in this public repository were
unverified operational data and are not a release artifact. Store current raw
Search Console exports and workbooks in the approved private evidence store.

An approved monthly workbook may contain:

- a documented property and search type;
- exact date range, timezone, country/device filters, and data lag;
- query and page dimensions;
- clicks, impressions, CTR, and average position as reported by GSC;
- branded/non-branded classification rules;
- a retained baseline and immutable monthly snapshots; and
- explicit labels for missing, truncated, sampled, or unknown data.

Average position is not a fixed rank and must not be presented as one. “No row”
means no observed Search Analytics row in the selected export, not “not
indexed” or “outside the top 100.”

Use [CASE-STUDY-PROTOCOL.md](CASE-STUDY-PROTOCOL.md) for the experiment design
and [SEO-MEASUREMENT.md](SEO-MEASUREMENT.md) for credential and freshness
requirements.
