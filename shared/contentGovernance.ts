export type QuoteVerification = {
  sourceUrl: string;
  sourceLabel: string;
  verifiedAt: string;
  consentConfirmed: boolean;
};

/**
 * Testimonials and attributed quotes are publishable only when an editor has
 * recorded a reviewable source, a verification date, and consent. The current
 * static and database content models contain no such record, so their quote
 * surfaces remain suppressed until real evidence is attached.
 */
export function hasVerifiedQuoteEvidence(value: unknown): value is QuoteVerification {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<QuoteVerification>;
  if (candidate.consentConfirmed !== true) return false;
  if (!candidate.sourceLabel?.trim()) return false;

  try {
    const url = new URL(candidate.sourceUrl ?? "");
    if (url.protocol !== "https:") return false;
  } catch {
    return false;
  }

  if (!candidate.verifiedAt) return false;
  const verifiedAt = new Date(candidate.verifiedAt);
  return !Number.isNaN(verifiedAt.getTime());
}

/**
 * Database-authored HTML has no quote-evidence field today. Remove quote
 * containers before either client rendering or source-HTML delivery so an AI
 * generated testimonial cannot become public by accident.
 */
export function suppressUnverifiedQuoteMarkup(input: string): string {
  return input
    .replace(/<blockquote\b[^>]*>[\s\S]*?<\/blockquote\s*>/gi, "")
    .replace(
      /<([a-z][\w:-]*)\b[^>]*\bdata-content-type\s*=\s*(["'])quote\2[^>]*>[\s\S]*?<\/\1\s*>/gi,
      ""
    );
}
