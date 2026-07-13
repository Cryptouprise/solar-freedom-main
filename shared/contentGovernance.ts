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

const unsupportedFirstPartyClaimPatterns = [
  /3,000\+/i,
  /Our attorneys/i,
  /Success Rate/i,
  /Homeowners (?:Helped|Freed)/i,
  /Avg\. Resolution Time/i,
  /Results in 30[–-]90 days/i,
  /within 24 hours/i,
  /licensed counsel/i,
  /nationwide coverage/i,
  /limited number of new cases/i,
  /Contract cancelled\. No more payments/i,
  /(?:Solar Freedom|\bwe\b|\bour (?:team|attorneys)\b)[^.!?]{0,160}(?:no upfront cost|contingency basis|all 50 states)/i,
];

/**
 * Legacy editorial records predate evidence metadata for first-party outcomes,
 * fee arrangements, service levels, and professional coverage. Fail closed at
 * every public renderer until a claim can point to reviewed evidence.
 */
export function suppressUnverifiedFirstPartyClaims(input: string): string {
  const replacement = "This material is withheld pending documented evidence and review. Options depend on the agreement, facts, jurisdiction, and any written engagement terms.";
  const isUnsafe = (value: string) => unsupportedFirstPartyClaimPatterns.some(pattern => pattern.test(value));
  if (!isUnsafe(input)) return input;

  if (/<(?:p|li|h2|h3)\b/i.test(input)) {
    const governed = input.replace(
      /<(p|li|h2|h3)(\b[^>]*)>[\s\S]*?<\/\1\s*>/gi,
      (block, tag, attributes) => isUnsafe(block) ? `<${tag}${attributes}>${replacement}</${tag}>` : block
    );
    if (!isUnsafe(governed)) return governed;
  }

  return replacement;
}
