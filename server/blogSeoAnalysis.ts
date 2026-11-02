import { load } from "cheerio";

export type BlogSeoInput = {
  title: string;
  content: string;
  targetKeyword?: string;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  /** Optional audit-compliance field; not a Google ranking factor. */
  metaKeywords?: string;
};

export type BlogSeoCriterion = {
  id: string;
  label: string;
  status: "pass" | "fail" | "info" | "unmeasured";
  weight: number;
  earned: number;
  message: string;
};

type Suggestion = { type: "warning" | "success" | "info"; message: string };

function normalize(text: string): string {
  return text.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Literal, non-overlapping phrase matches; user input is never a regular expression. */
function countKeyword(text: string, keyword: string): number {
  const haystack = normalize(text);
  const needle = normalize(keyword);
  if (!needle) return 0;
  let count = 0;
  let position = 0;
  const wordStart = new RegExp("^[\\p{L}\\p{N}_]", "u");
  const wordEnd = new RegExp("[\\p{L}\\p{N}_]$", "u");
  while ((position = haystack.indexOf(needle, position)) !== -1) {
    const end = position + needle.length;
    const leftBoundary = !wordStart.test(needle) || !wordEnd.test(haystack.slice(Math.max(0, position - 2), position));
    const rightBoundary = !wordEnd.test(needle) || !wordStart.test(haystack.slice(end, end + 2));
    if (leftBoundary && rightBoundary) count++;
    position = end;
  }
  return count;
}

const SITE_ORIGIN = "https://breakyoursolarcontract.com";

function linkKind(href: string): "internal" | "external" | null {
  // Ignore fragment-only, protocol-relative, script, malformed and ambiguous URLs.
  if (!href || /[\s\\\u0000-\u001f\u007f]/.test(href) || href.startsWith("//")) return null;
  if (/%(?![\da-f]{2})/i.test(href)) return null;
  if (!href.startsWith("/") && !/^https?:\/\//i.test(href)) return null;
  try {
    const url = new URL(href, SITE_ORIGIN);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    return url.origin === SITE_ORIGIN ? "internal" : "external";
  } catch {
    return null;
  }
}

/** Draft text/field checks only: no network, database, rendering or ranking predictions. */
export function analyzeBlogSeo(input: BlogSeoInput) {
  const $ = load(input.content);
  $("script, style, template, noscript, [hidden], [aria-hidden='true']").remove();
  const body = $("body");
  const h2Count = body.find("h2").filter((_, el) => !!$(el).text().trim()).length;
  const h3Count = body.find("h3").filter((_, el) => !!$(el).text().trim()).length;
  let internalLinks = 0;
  let externalLinks = 0;
  body.find("a[href]").each((_, el) => {
    if (!$(el).text().trim()) return;
    const kind = linkKind($(el).attr("href") ?? "");
    if (kind === "internal") internalLinks++;
    if (kind === "external") externalLinks++;
  });
  // Block boundaries must not concatenate words; Cheerio decodes HTML entities.
  body.find("br").replaceWith(" ");
  body.find("p, div, li, h1, h2, h3, h4, h5, h6, section, article, blockquote, td, th").append(" ");
  const text = body.text().replace(/\s+/g, " ").trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const keyword = input.targetKeyword?.trim() ?? "";
  const keywordCount = countKeyword(text, keyword);
  const keywordDensity = wordCount ? Number(((keywordCount / wordCount) * 100).toFixed(2)) : 0;
  const criteria: BlogSeoCriterion[] = [];
  const add = (id: string, label: string, weight: number, status: BlogSeoCriterion["status"], message: string) => {
    criteria.push({ id, label, weight, status, earned: status === "pass" ? weight : 0, message });
  };

  add("draft_title", "Draft title", 10, input.title.trim() ? "pass" : "fail",
    input.title.trim() ? "Draft title is present; this does not verify the published title tag." : "Draft title is missing.");
  add("keyword_title", "Target keyword in draft title", 15,
    !keyword ? "unmeasured" : countKeyword(input.title, keyword) ? "pass" : "fail",
    !keyword ? "Unmeasured: select a target keyword to check the draft title." :
      countKeyword(input.title, keyword) ? "Target keyword appears in the draft title." : `Target keyword \"${keyword}\" is missing from the draft title.`);
  add("keyword_body", "Target keyword in draft text", 25,
    !keyword ? "unmeasured" : keywordCount ? "pass" : "fail",
    !keyword ? "Unmeasured: select a target keyword to check the draft text." :
      keywordCount ? `Target keyword appears ${keywordCount} time(s) in draft text.` : `Target keyword \"${keyword}\" is missing from draft text (HTML attributes and meta tags do not count).`);
  add("headings", "Nonempty H2 structure", 10, h2Count > 0 ? "pass" : "fail",
    h2Count > 0 ? `Draft contains ${h2Count} nonempty H2 heading(s) and ${h3Count} H3 heading(s).` : "No nonempty H2 headings found; add useful section headings where appropriate.");
  add("internal_links", "Internal link URL syntax", 10, internalLinks > 0 ? "pass" : "fail",
    internalLinks > 0 ? `${internalLinks} internal link(s) with readable anchor text and valid URL syntax; destinations were not fetched.` : "No valid root-relative or same-origin internal links with readable anchor text found.");
  add("meta_title", "Supplied meta title", 15,
    input.metaTitle === undefined ? "unmeasured" : !input.metaTitle.trim() ? "fail" :
      !keyword ? "unmeasured" : countKeyword(input.metaTitle, keyword) ? "pass" : "fail",
    input.metaTitle === undefined ? "Unmeasured: no meta title field supplied; published HTML was not inspected." :
      !input.metaTitle.trim() ? "Supplied meta title is empty." : !keyword ? "Unmeasured: select a target keyword to check the supplied meta title." :
        countKeyword(input.metaTitle, keyword) ? "Supplied meta title includes the target keyword; published HTML was not inspected." : "Target keyword is missing from the supplied meta title.");
  add("meta_description", "Supplied meta description", 15,
    input.metaDescription === undefined ? "unmeasured" : input.metaDescription.trim() ? "pass" : "fail",
    input.metaDescription === undefined ? "Unmeasured: no meta description field supplied; published HTML was not inspected." :
      input.metaDescription.trim() ? "Supplied meta description is nonempty; accuracy and published HTML still need review." : "Supplied meta description is empty.");

  // Fixed denominator: failed, informational and unmeasured criteria earn no points.
  // No word-count/density bonuses or success-message counting can override failures.
  const score = criteria.reduce((total, criterion) => total + criterion.earned, 0);
  const metaKeywordsAudit = {
    status: input.metaKeywords === undefined ? "unmeasured" as const :
      input.metaKeywords.trim() ? "present" as const : "empty" as const,
    scored: false as const,
    message: input.metaKeywords === undefined ?
      "Optional meta keywords audit is unmeasured: no field supplied. This tag is not a Google ranking factor and is separate from target-keyword checks in text." :
      input.metaKeywords.trim() ?
        "Supplied meta keywords field is present for optional audit compliance only; it is not a Google ranking factor and published HTML was not inspected." :
        "Supplied meta keywords field is empty. It is optional audit compliance only, not a Google ranking factor; no checklist points are deducted.",
  };
  const limitations = [
    "Draft checklist only, not a Google or ranking score. Weights are editorial checklist choices, not search-engine weights.",
    "Only supplied draft text and metadata fields were checked. Published HTML, indexability, canonical tags and structured data are unmeasured.",
    "Internal links are checked for URL syntax and same-origin classification only; destination existence and HTTP status are unmeasured.",
    "Word count and keyword density are descriptive only. No ideal density or word count guarantees rankings; relevance, accuracy and natural language require human review.",
    "Draft text extraction does not evaluate browser CSS visibility or rendered output.",
  ];
  const suggestions: Suggestion[] = criteria.map(criterion => ({
    type: criterion.status === "pass" ? "success" : criterion.status === "fail" ? "warning" : "info",
    message: criterion.message,
  }));
  suggestions.push({ type: "info", message: `Draft has ${wordCount} words; target phrase occurrences per word: ${keywordDensity}%. These statistics do not earn points or predict rankings.` });
  suggestions.push({ type: "info", message: metaKeywordsAudit.message });

  return {
    wordCount, readingTime: Math.ceil(wordCount / 200), h2Count, h3Count,
    internalLinks, externalLinks, keywordDensity, keywordCount, suggestions,
    score, maxScore: 100 as const, scoreLabel: "Draft checklist" as const,
    criteria, limitations, metaKeywordsAudit, publishedHtmlVerified: false as const,
  };
}

export type BlogSeoAnalysis = ReturnType<typeof analyzeBlogSeo>;
