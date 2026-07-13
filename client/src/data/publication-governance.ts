/**
 * Public blog copy is treated as unreviewed source material. Posts containing
 * unsupported claims about Solar Freedom's professional role, fees, outcomes,
 * scale, or response time stay out of public discovery until rewritten and
 * backed by an editorial record.
 */
import {
  hasPublishableEditorialReview as hasSharedPublishableEditorialReview,
  type BlogEditorialPrimarySource,
  type BlogEditorialReviewFields,
} from '@shared/blogEditorialReview';

export {
  getBlogEditorialReviewIssues,
  parseEditorialDate,
  parseEditorialPrimarySources,
} from '@shared/blogEditorialReview';

export const PUBLICATION_PENDING_COPY =
  'This article is withheld until its legal and factual claims, sources, unique user value, and service statements pass editorial review.';

export type EditorialPrimarySource = BlogEditorialPrimarySource;

export interface EditorialReview {
  reviewerName: string;
  reviewerRole: string;
  /** ISO date or timestamp of the substantive editorial review. */
  reviewedAt: string | Date;
  primarySources: EditorialPrimarySource[];
  /** Explains the page-specific value that is not duplicated by another funnel page. */
  uniqueValueSummary: string;
  /** Must be explicitly false; legacy and ambiguous records fail closed. */
  funnelOnlyDuplicate: false;
}

export const UNSUPPORTED_FIRST_PARTY_PATTERNS: readonly RegExp[] = [
  /\bour attorneys?\b/i,
  /\bour legal team\b/i,
  /\bSolar Freedom\b[^.!?]{0,180}\b(?:attorneys?|lawyers?|law firm|legal representation)\b/i,
  /\b(?:written|reviewed) by (?:an? )?attorneys?\b/i,
  /\battorneys? (?:are )?(?:cancel(?:ing|ling)|eliminat(?:e|ing)|win(?:ning)?|secur(?:e|ing))\b/i,
  /\bfree (?:case |solar contract |contract )?(?:review|audit|consultation)\b/i,
  /\breview(?:ed|ing)? (?:your |the )?(?:agreement|contract)[^.!?]{0,100}\b(?:at no cost|for free)\b/i,
  /\b(?:no upfront (?:cost|fee)|work(?:s|ing)? on contingency|contingency[- ]based|pay nothing unless|no cost and no obligation)\b/i,
  /\b(?:we\b|our (?:attorneys?|team|firm)\b)[^.!?]{0,180}\b(?:helped|won|cancel(?:ed|led)|eliminated|reduced|saved|secured|recovered|resolved|negotiated|identified)\b/i,
  /\b(?:we handle everything|we(?:'ll| will) tell you exactly where you stand)\b/i,
  /\b(?:success rate|homeowners (?:helped|freed)|average resolution time)\b/i,
  /\b(?:results? in|resolved within|process typically takes|find out your options in)\s*\d+/i,
  /\b(?:respond|contact(?:ed)?|call(?:ed)?) within (?:\d+\s*)?(?:minutes?|hours?|days?)\b/i,
  /\b(?:achieved|guaranteed|proven)\b[^.!?]{0,160}\b(?:cancellation|reduction|savings?|outcome|result)\b/i,
  /\bhomeowners? can often\b[^.!?]{0,160}\b(?:reduce|cancel|recover|negotiate)\b/i,
];

function collectText(value: unknown, seen: WeakSet<object>): string[] {
  if (typeof value === 'string') return [value];
  if (!value || typeof value !== 'object') return [];
  if (seen.has(value)) return [];
  seen.add(value);
  if (Array.isArray(value)) return value.flatMap((item) => collectText(item, seen));
  return Object.values(value as Record<string, unknown>).flatMap((item) => collectText(item, seen));
}

/**
 * Search publication is evidence-first. A route remains accessible, but it is
 * not eligible for discovery until a named reviewer records current primary
 * sources and explains the page's non-duplicative user value.
 */
export function hasPublishableEditorialReview(value: unknown, now = new Date()): boolean {
  return hasSharedPublishableEditorialReview(value as BlogEditorialReviewFields, now);
}

export function hasUnsupportedFirstPartyClaims(value: unknown): boolean {
  const text = collectText(value, new WeakSet()).join('\n');
  return UNSUPPORTED_FIRST_PARTY_PATTERNS.some((pattern) => pattern.test(text));
}

export function isBlogPostPublishable(value: unknown): boolean {
  return hasPublishableEditorialReview(value) && !hasUnsupportedFirstPartyClaims(value);
}
