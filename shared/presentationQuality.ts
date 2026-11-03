import { load } from "cheerio";
import { marked } from "marked";

/** Editorial heuristics, NOT Google requirements or a measurement of rendered design. */
export const PRESENTATION_LIMITS = {
  longParagraphWords: 120,
  uninterruptedProseWords: 360,
  sectionHeadingsRequiredAfterWords: 300,
} as const;
export const DRAFT_PRESENTATION_EVIDENCE =
  "Draft-only structural evidence: no screenshot/visual render verified. Image URLs were inventoried, not fetched; appearance, relevance, licensing, availability, mobile layout and CTA prominence are not visually verified.";
export const MANAGED_IMAGE_POLICY =
  "Image needs must be routed separately to the managed asset workflow with a subject, purpose, placement and descriptive alt-text brief. Use only supplied approved managed assets; never invent image URLs, placeholder pictures or unsupported image-generation claims. Missing imagery alone does not block editorial readiness or trigger another text-revision round.";

export type PresentationLocation = { index: number; section: string };
export type DraftPresentationAudit = {
  version: 1;
  evidence: typeof DRAFT_PRESENTATION_EVIDENCE;
  visualRenderVerified: false;
  format: "html" | "markdown";
  limits: typeof PRESENTATION_LIMITS;
  wordCount: number;
  paragraphCount: number;
  longParagraphs: Array<PresentationLocation & { words: number; excerpt: string }>;
  proseRuns: Array<{ fromParagraph: number; toParagraph: number; words: number; section: string }>;
  headings: Array<{ level: number; text: string; usable: boolean }>;
  lists: Array<{ ordered: boolean; items: number; usable: boolean }>;
  calloutCount: number;
  images: Array<{ index: number; url: string; alt: string; warnings: string[] }>;
  cta: { caseReviewMentioned: boolean; noObligationMentioned: boolean; currentPhoneMentioned: boolean; actionLinks: string[] };
  issues: string[];
  warnings: string[];
  assetPolicy: typeof MANAGED_IMAGE_POLICY;
  passed: boolean;
};

const wordsIn = (text: string) => (text.match(new RegExp("[\\p{L}\\p{N}]+(?:['’-][\\p{L}\\p{N}]+)*", "gu")) || []).length;
const compact = (text: string) => text.replace(/\s+/g, " ").trim();

/** No network, screenshot, vision/model call, asset creation or publication side effects. */
export function auditDraftPresentation(draft?: string | null): DraftPresentationAudit {
  const source = draft || "";
  const format = /^\s*<(?:!doctype|html|body|article|section|div|p|h[1-6])\b/i.test(source) ? "html" : "markdown";
  // Markdown's parser handles inline/reference images, setext headings, nested lists
  // and fenced code. HTML is parsed rather than matching <p> with a text regex.
  const $ = load(format === "html" ? source : marked.parse(source, { async: false, gfm: true }));
  $("script, style, template, noscript, pre, [hidden], [aria-hidden='true']").remove();
  const headings: DraftPresentationAudit["headings"] = [];
  const lists: DraftPresentationAudit["lists"] = [];
  const longParagraphs: DraftPresentationAudit["longParagraphs"] = [];
  const proseRuns: DraftPresentationAudit["proseRuns"] = [];
  const images: DraftPresentationAudit["images"] = [];
  const inventoriedImages = new WeakSet<object>();
  const warnings: string[] = [];
  let paragraphCount = 0;
  let calloutCount = 0;
  let section = "Opening (before first heading)";
  let runWords = 0;
  let runFrom = 1;
  let runSection = section;
  const endRun = () => {
    if (runWords > PRESENTATION_LIMITS.uninterruptedProseWords) {
      proseRuns.push({ fromParagraph: runFrom, toParagraph: paragraphCount, words: runWords, section: runSection });
    }
    runWords = 0;
    runFrom = paragraphCount + 1;
    runSection = section;
  };
  const paragraph = (text: string) => {
    const visible = compact(text);
    const words = wordsIn(visible);
    if (!words) return;
    paragraphCount++;
    if (!runWords) { runFrom = paragraphCount; runSection = section; }
    runWords += words;
    if (words > PRESENTATION_LIMITS.longParagraphWords) {
      longParagraphs.push({ index: paragraphCount, section, words, excerpt: visible.slice(0, 100) });
    }
  };
  const visit = (node: any): void => {
    if (node.type === "text") { paragraph(node.data || ""); return; }
    if (!node.name) return;
    const element = $(node);
    const name = node.name.toLowerCase();
    const text = compact(element.text());
    if (/^h[1-6]$/.test(name)) {
      const usable = wordsIn(text) > 0 && text.length >= 3;
      headings.push({ level: Number(name[1]), text, usable });
      if (usable) { endRun(); section = text; }
      else warnings.push(`Heading ${headings.length} is empty or too short to identify a readable section.`);
      element.find("img").each((_, image) => visit(image));
      return;
    }
    if (name === "ul" || name === "ol") {
      const items = element.children("li").filter((_, item) => wordsIn($(item).text()) > 0).length;
      const usable = items >= 2;
      lists.push({ ordered: name === "ol", items, usable });
      if (usable) endRun();
      else warnings.push(`List ${lists.length} needs at least two non-empty items to be useful for scanning.`);
      // Lists may interrupt surrounding prose, but cannot hide dense list items.
      element.children("li").each((_, item) => {
        const content = $(item).clone();
        content.find("ul, ol, img").remove();
        const paragraphs = content.find("p");
        if (paragraphs.length) paragraphs.each((_, p) => paragraph($(p).text()));
        else paragraph(content.text());
        if (usable) endRun();
      });
      element.children("li").children("ul, ol").each((_, list) => visit(list));
      element.find("img").each((_, image) => visit(image));
      return;
    }
    if (name === "img") {
      if (inventoriedImages.has(node)) return;
      inventoriedImages.add(node);
      const url = (element.attr("src") || "").trim();
      const alt = (element.attr("alt") || "").trim();
      const imageWarnings: string[] = [];
      if (!alt) imageWarnings.push("Missing or empty alt text; confirm decorative intent or supply descriptive alt text.");
      else if (/^(?:image|photo|picture|placeholder|img)(?:\s*\d+)?$/i.test(alt)) imageWarnings.push("Generic alt text does not describe the image's purpose.");
      let usableUrl = /^\/(?!\/)/.test(url) && url !== "/";
      if (/^https:\/\//i.test(url)) {
        try { const parsed = new URL(url); usableUrl = Boolean(parsed.hostname) && !parsed.username && !parsed.password; } catch { /* Warning below. */ }
      }
      if (!usableUrl) imageWarnings.push("Missing, unsafe or unsupported image URL; use an approved managed asset (HTTPS or site-relative), not an invented URL.");
      if (/\b(?:placeholder|example\.(?:com|org|net)|via\.placeholder|placehold\.co|dummyimage|loremflickr)\b/i.test(url)) {
        imageWarnings.push("Image URL looks illustrative/placeholder; confirm an approved managed asset instead of publishing a fake picture.");
      }
      images.push({ index: images.length + 1, url, alt, warnings: imageWarnings });
      return;
    }
    if (name === "blockquote" || name === "aside" || element.attr("role") === "note"
      || /(?:^|\s)(?:callout|notice|admonition)(?:\s|$)/i.test(element.attr("class") || "")) {
      if (wordsIn(text)) { calloutCount++; endRun(); }
      // A real callout interrupts outside prose; its own dense paragraphs still
      // need repair and cannot be disguised by wrapping everything in a quote.
      if (element.find("p").length) element.contents().each((_, child) => visit(child));
      else { paragraph(text); element.find("img").each((_, image) => visit(image)); }
      endRun();
      return;
    }
    if (name === "table" && element.find("tr").length >= 2) {
      endRun(); element.find("img").each((_, image) => visit(image)); return;
    }
    if (name === "p") {
      // Exclude descendant blocks so malformed HTML cannot double-count prose.
      paragraph(element.clone().find("img").remove().end().text());
      element.find("img").each((_, image) => visit(image));
      return;
    }
    // Unwrapped HTML prose is still assessed. Consecutive inline/text nodes are
    // joined before counting; <br> is not mistaken for a real paragraph boundary.
    let inline = "";
    const flush = () => { paragraph(inline); inline = ""; };
    for (const child of element.contents().toArray()) {
      const tag = "name" in child ? child.name.toLowerCase() : "";
      if (child.type === "text" || /^(?:a|span|strong|em|b|i|u|code|br)$/.test(tag)) {
        inline += child.type === "text" ? child.data : tag === "br" ? " " : $(child).text();
        if (tag) $(child).find("img").each((_, image) => visit(image));
      } else { flush(); visit(child); }
    }
    flush();
  };
  $("body").contents().each((_, node) => visit(node));
  endRun();
  const textBody = $("body").clone();
  textBody.find("p, div, h1, h2, h3, h4, h5, h6, li, tr, blockquote, aside, br").append(" ").prepend(" ");
  const visibleText = compact(textBody.text());
  const wordCount = wordsIn(visibleText);
  const issues: string[] = [];
  // Aggregate gate messages keep durable editorFeedback inside its repair bound;
  // per-location diagnostics remain available in the audit inventory.
  if (longParagraphs.length) issues.push(`${longParagraphs.length} dense paragraph(s) exceed the editorial ${PRESENTATION_LIMITS.longParagraphWords}-word heuristic: ${longParagraphs.slice(0, 5).map(p => `paragraph ${p.index} (${p.words} words, ${p.section.slice(0, 60)})`).join("; ")}. Split these exact paragraphs into short, single-idea paragraphs; this is not a Google rule.`);
  if (proseRuns.length) issues.push(`${proseRuns.length} uninterrupted prose run(s) exceed the editorial ${PRESENTATION_LIMITS.uninterruptedProseWords}-word heuristic: ${proseRuns.slice(0, 5).map(r => `paragraphs ${r.fromParagraph}–${r.toParagraph} (${r.words} words, ${r.section.slice(0, 60)})`).join("; ")}. Add a meaningful heading, useful list or factual callout within these exact sections; this is not a Google rule.`);
  if (wordCount >= PRESENTATION_LIMITS.sectionHeadingsRequiredAfterWords && !headings.some(h => h.usable && h.level >= 2 && h.level <= 3)) {
    issues.push("Substantive draft lacks usable H2/H3 section headings; organize the same article into readable, descriptive sections.");
  }
  if (wordCount >= 600 && !lists.some(list => list.usable)) warnings.push("No useful list found; consider a factual records checklist or practical numbered steps where it improves comprehension, not lists for their own sake.");
  if (!images.length) warnings.push("No existing draft images found. Consider useful evidence/educational visuals only if they help this article; route any image need separately to managed assets. Missing imagery alone is non-blocking.");
  images.forEach(image => image.warnings.forEach(warning => warnings.push(`Image ${image.index}: ${warning}`)));
  const actionLinks = $("a[href]").toArray().map(link => ({ href: $(link).attr("href") || "", text: compact($(link).text()) }))
    .filter(link => /^tel:|case[- ]review|request|contact|assessment/i.test(`${link.href} ${link.text}`)).map(link => link.href);
  const cta = { caseReviewMentioned: /\bcase[- ]review\b/i.test(visibleText), noObligationMentioned: /\bno[- ]obligation\b/i.test(visibleText),
    currentPhoneMentioned: /904[\s().-]*921[\s().-]*4971/.test(visibleText), actionLinks };
  if (wordCount >= 600 && (!cta.caseReviewMentioned || !cta.noObligationMentioned || !cta.currentPhoneMentioned)) {
    warnings.push("CTA copy is missing the case review, no-obligation qualification or current phone; review the exact next action and safe wording. CTA prominence is not visually verified.");
  }
  return { version: 1, evidence: DRAFT_PRESENTATION_EVIDENCE, visualRenderVerified: false, format,
    limits: PRESENTATION_LIMITS, wordCount, paragraphCount, longParagraphs, proseRuns, headings, lists, calloutCount,
    images, cta,
    issues, warnings, assetPolicy: MANAGED_IMAGE_POLICY, passed: issues.length === 0 };
}

/** Compact diagnostics only; the caller must still supply the exact full article. */
export function presentationAuditForModel(audit: DraftPresentationAudit) {
  const bounded = <T>(items: T[]) => ({ total: items.length, items: items.slice(0, 12), omitted: Math.max(0, items.length - 12) });
  return { ...audit, diagnosticBounds: "At most 12 entries per inventory; section/heading labels, image URL/alt and action links may be shortened here only. Full article and persisted audit are not truncated.",
    longParagraphs: bounded(audit.longParagraphs.map(p => ({ ...p, section: p.section.slice(0, 120) }))),
    proseRuns: bounded(audit.proseRuns.map(r => ({ ...r, section: r.section.slice(0, 120) }))),
    headings: bounded(audit.headings.map(h => ({ ...h, text: h.text.slice(0, 120) }))), lists: bounded(audit.lists),
    images: bounded(audit.images.map(image => ({ ...image, url: image.url.slice(0, 500), alt: image.alt.slice(0, 160) }))),
    warnings: bounded(audit.warnings), cta: { ...audit.cta, actionLinks: bounded(audit.cta.actionLinks.map(link => link.slice(0, 500))) } };
}

export function presentationAuditFeedback(audit: DraftPresentationAudit): string {
  const observations = [
    `${audit.paragraphCount} paragraphs; ${audit.headings.filter(h => h.usable).length} usable headings; ${audit.lists.filter(l => l.usable).length} usable lists; ${audit.images.length} existing images.`,
    ...audit.warnings.slice(0, 4),
  ];
  return [audit.evidence, ...observations, audit.assetPolicy].join(" ");
}
