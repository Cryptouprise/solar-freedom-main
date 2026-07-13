/** Keep source-generated public artifacts from advertising unsupported services. */
export const unsupportedFirstPartyPatterns = [
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

export function hasUnsupportedFirstPartyClaims(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return unsupportedFirstPartyPatterns.some((pattern) => pattern.test(text));
}

const EDITORIAL_UNIQUE_VALUE_MIN_LENGTH = 80;
const EDITORIAL_UNIQUE_VALUE_MIN_WORDS = 12;
const PLACEHOLDER_VALUE = /^(?:admin|anonymous|editor|none|n\/?a|reviewer|tbd|unknown)$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2}))?$/;

function skipString(source, start) {
  const quote = source[start];
  for (let index = start + 1; index < source.length; index += 1) {
    if (source[index] === "\\") {
      index += 1;
      continue;
    }
    if (source[index] === quote) return index + 1;
  }
  return source.length;
}

function readBalanced(source, start, open, close) {
  if (source[start] !== open) return null;
  let depth = 0;
  for (let index = start; index < source.length; index += 1) {
    if (["'", '"', "`"].includes(source[index])) {
      index = skipString(source, index) - 1;
      continue;
    }
    if (source[index] === "/" && source[index + 1] === "/") {
      index = source.indexOf("\n", index + 2);
      if (index < 0) return null;
      continue;
    }
    if (source[index] === "/" && source[index + 1] === "*") {
      const end = source.indexOf("*/", index + 2);
      if (end < 0) return null;
      index = end + 1;
      continue;
    }
    if (source[index] === open) depth += 1;
    if (source[index] === close && --depth === 0) {
      return { value: source.slice(start, index + 1), end: index + 1 };
    }
  }
  return null;
}

function propertyPattern(name) {
  return new RegExp(`(?:["'\`]${name}["'\`]|\\b${name})\\s*:`);
}

function findPropertyStart(source, names) {
  let best = null;
  for (const name of names) {
    const match = propertyPattern(name).exec(source);
    if (match && (!best || match.index < best.index)) {
      best = { index: match.index, valueStart: match.index + match[0].length };
    }
  }
  if (!best) return null;
  while (/\s/.test(source[best.valueStart] ?? "")) best.valueStart += 1;
  return best;
}

function findStringProperty(source, names) {
  const property = findPropertyStart(source, names);
  if (!property || !["'", '"', "`"].includes(source[property.valueStart])) return "";
  const end = skipString(source, property.valueStart);
  return source.slice(property.valueStart + 1, end - 1).trim();
}

function findArrayProperty(source, names) {
  const property = findPropertyStart(source, names);
  if (!property) return null;
  return readBalanced(source, property.valueStart, "[", "]")?.value ?? null;
}

function isNamedValue(value, minimumLength) {
  return value.length >= minimumLength && /[a-z]/i.test(value) && !PLACEHOLDER_VALUE.test(value);
}

function isNonFutureDate(value, now) {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime())
    && parsed.toISOString().slice(0, 10) === value.slice(0, 10)
    && parsed.getTime() <= now.getTime() + 5 * 60_000;
}

/** Return balanced top-level object literals that contain a string property. */
export function collectObjectRecords(source, requiredProperty = "slug") {
  const records = [];
  for (let index = 0; index < source.length; index += 1) {
    if (["'", '"', "`"].includes(source[index])) {
      index = skipString(source, index) - 1;
      continue;
    }
    if (source[index] === "/" && source[index + 1] === "/") {
      const end = source.indexOf("\n", index + 2);
      if (end < 0) break;
      index = end;
      continue;
    }
    if (source[index] === "/" && source[index + 1] === "*") {
      const end = source.indexOf("*/", index + 2);
      if (end < 0) break;
      index = end + 1;
      continue;
    }
    if (source[index] !== "{") continue;
    const object = readBalanced(source, index, "{", "}");
    if (!object) continue;
    if (!requiredProperty || findStringProperty(object.value, [requiredProperty])) {
      records.push(object.value);
    }
    index = object.end - 1;
  }
  return records;
}

/** Build-time equivalent of the shared evidence gate used by client/server code. */
export function hasPublishableEditorialReview(source, now = new Date()) {
  if (typeof source !== "string" || !source.trim()) return false;
  const reviewerName = findStringProperty(source, ["editorialReviewerName", "reviewerName"]);
  const reviewerRole = findStringProperty(source, ["editorialReviewerRole", "reviewerRole"]);
  const reviewedAt = findStringProperty(source, ["editorialReviewedAt", "reviewedAt"]);
  const uniqueValueSummary = findStringProperty(source, ["editorialUniqueValueSummary", "uniqueValueSummary"]);
  if (!isNamedValue(reviewerName, 2) || !isNamedValue(reviewerRole, 2)) return false;
  if (!isNonFutureDate(reviewedAt, now)) return false;
  if (
    uniqueValueSummary.length < EDITORIAL_UNIQUE_VALUE_MIN_LENGTH
    || uniqueValueSummary.split(/\s+/).filter(Boolean).length < EDITORIAL_UNIQUE_VALUE_MIN_WORDS
  ) return false;

  const funnelProperty = findPropertyStart(source, [
    "editorialFunnelOnlyDuplicate",
    "funnelOnlyDuplicate",
  ]);
  if (!funnelProperty || !/^(?:false|0)\b/.test(source.slice(funnelProperty.valueStart))) return false;

  const sources = findArrayProperty(source, ["editorialPrimarySources", "primarySources"]);
  if (!sources) return false;
  const sourceRecords = collectObjectRecords(sources, null);
  if (sourceRecords.length === 0) return false;
  return sourceRecords.every((record) => {
    const title = findStringProperty(record, ["title"]);
    const url = findStringProperty(record, ["url"]);
    const accessedAt = findStringProperty(record, ["accessedAt"]);
    if (!isNamedValue(title, 4) || !isNonFutureDate(accessedAt, now)) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:"
        && Boolean(parsed.hostname)
        && !parsed.username
        && !parsed.password;
    } catch {
      return false;
    }
  });
}
