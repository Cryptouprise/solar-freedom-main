export type BlogEditorialPrimarySource = {
  url: string;
  title: string;
  accessedAt: string | Date;
};

export type BlogEditorialReviewFields = {
  editorialReviewerName?: unknown;
  editorialReviewerRole?: unknown;
  editorialReviewedAt?: unknown;
  editorialPrimarySources?: unknown;
  editorialUniqueValueSummary?: unknown;
  editorialFunnelOnlyDuplicate?: unknown;
  editorialReview?: unknown;
};

export const BLOG_EDITORIAL_UNIQUE_VALUE_MIN_LENGTH = 80;
export const BLOG_EDITORIAL_UNIQUE_VALUE_MIN_WORDS = 12;

const PLACEHOLDER_REVIEWER_NAME = /^(?:admin|anonymous|editor|none|n\/?a|reviewer|tbd|unknown)$/i;
const PLACEHOLDER_ROLE = /^(?:anonymous|none|n\/?a|tbd|unknown)$/i;
const PLACEHOLDER_TEXT = /^(?:none|n\/?a|tbd|unknown)$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2}))?$/;

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function nestedReview(value: BlogEditorialReviewFields): Record<string, unknown> {
  return asObject(value.editorialReview) ?? {};
}

function reviewerField(
  value: BlogEditorialReviewFields,
  flatKey: "editorialReviewerName" | "editorialReviewerRole",
  nestedKey: "reviewerName" | "reviewerRole",
  reviewerKey: "name" | "role",
): unknown {
  if (value[flatKey] !== undefined) return value[flatKey];
  const nested = nestedReview(value);
  if (nested[nestedKey] !== undefined) return nested[nestedKey];
  return asObject(nested.reviewer)?.[reviewerKey];
}

function reviewField(
  value: BlogEditorialReviewFields,
  flatKey:
    | "editorialReviewedAt"
    | "editorialPrimarySources"
    | "editorialUniqueValueSummary"
    | "editorialFunnelOnlyDuplicate",
  nestedKey: "reviewedAt" | "primarySources" | "uniqueValueSummary" | "funnelOnlyDuplicate",
): unknown {
  if (value[flatKey] !== undefined) return value[flatKey];
  return nestedReview(value)[nestedKey];
}

export function parseEditorialPrimarySources(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function parseEditorialDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value !== "string" || !ISO_DATE.test(value.trim())) return null;
  const normalized = value.trim();
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.toISOString().slice(0, 10) !== normalized.slice(0, 10)) return null;
  return parsed;
}

function isNonFutureDate(value: unknown, now: Date): boolean {
  const parsed = parseEditorialDate(value);
  return Boolean(parsed && parsed.getTime() <= now.getTime() + 5 * 60_000);
}

function isNamedValue(
  value: unknown,
  minimumLength: number,
  placeholderPattern = PLACEHOLDER_TEXT,
): boolean {
  if (typeof value !== "string") return false;
  const normalized = value.trim();
  return normalized.length >= minimumLength
    && /[a-z]/i.test(normalized)
    && !placeholderPattern.test(normalized);
}

export function isValidEditorialPrimarySource(value: unknown, now = new Date()): boolean {
  const source = asObject(value);
  if (!source || !isNamedValue(source.title, 4) || !isNonFutureDate(source.accessedAt, now)) {
    return false;
  }
  if (typeof source.url !== "string") return false;
  try {
    const url = new URL(source.url);
    return url.protocol === "https:"
      && Boolean(url.hostname)
      && !url.username
      && !url.password;
  } catch {
    return false;
  }
}

export function getBlogEditorialReviewIssues(
  value: BlogEditorialReviewFields | null | undefined,
  now = new Date(),
): string[] {
  if (!value) return ["editorial_review_required"];
  const issues: string[] = [];
  const reviewerName = reviewerField(value, "editorialReviewerName", "reviewerName", "name");
  const reviewerRole = reviewerField(value, "editorialReviewerRole", "reviewerRole", "role");
  const reviewedAt = reviewField(value, "editorialReviewedAt", "reviewedAt");
  const primarySources = parseEditorialPrimarySources(
    reviewField(value, "editorialPrimarySources", "primarySources"),
  );
  const uniqueValueSummary = reviewField(
    value,
    "editorialUniqueValueSummary",
    "uniqueValueSummary",
  );
  const funnelOnlyDuplicate = reviewField(
    value,
    "editorialFunnelOnlyDuplicate",
    "funnelOnlyDuplicate",
  );

  if (!isNamedValue(reviewerName, 2, PLACEHOLDER_REVIEWER_NAME)) {
    issues.push("editorial_reviewer_name_required");
  }
  if (!isNamedValue(reviewerRole, 2, PLACEHOLDER_ROLE)) {
    issues.push("editorial_reviewer_role_required");
  }
  if (!isNonFutureDate(reviewedAt, now)) issues.push("editorial_reviewed_at_invalid");
  if (!primarySources?.length || primarySources.some(source => !isValidEditorialPrimarySource(source, now))) {
    issues.push("editorial_primary_sources_invalid");
  }

  const summary = typeof uniqueValueSummary === "string" ? uniqueValueSummary.trim() : "";
  if (
    summary.length < BLOG_EDITORIAL_UNIQUE_VALUE_MIN_LENGTH
    || summary.split(/\s+/).filter(Boolean).length < BLOG_EDITORIAL_UNIQUE_VALUE_MIN_WORDS
  ) {
    issues.push("editorial_unique_value_summary_required");
  }

  if (funnelOnlyDuplicate !== false && funnelOnlyDuplicate !== 0) {
    issues.push("editorial_funnel_only_duplicate_must_be_false");
  }

  return issues;
}

export function hasPublishableEditorialReview(
  value: BlogEditorialReviewFields | null | undefined,
  now = new Date(),
): boolean {
  return getBlogEditorialReviewIssues(value, now).length === 0;
}
