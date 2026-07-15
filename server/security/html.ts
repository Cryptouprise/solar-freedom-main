import * as cheerio from "cheerio";

const MAX_HTML_BYTES = 500_000;
const DROP_WITH_CONTENT = new Set([
  "script", "style", "iframe", "object", "embed", "form", "input", "button",
  "textarea", "select", "option", "meta", "link", "base", "svg", "math",
  "template", "noscript",
]);
const ALLOWED_TAGS = new Set([
  "p", "br", "hr", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li",
  "blockquote", "strong", "b", "em", "i", "u", "s", "code", "pre", "a",
  "img", "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td",
  "div", "span",
]);
const GLOBAL_ATTRIBUTES = new Set(["id"]);
const TAG_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "title", "width", "height", "loading"]),
  th: new Set(["colspan", "rowspan", "scope"]),
  td: new Set(["colspan", "rowspan"]),
};

function isSafeUrl(value: string, kind: "link" | "image"): boolean {
  const candidate = value.trim();
  if (!candidate || candidate.startsWith("//")) return false;
  if (candidate.startsWith("/") || candidate.startsWith("#")) return true;
  try {
    const parsed = new URL(candidate);
    if (kind === "image") return parsed.protocol === "https:" || parsed.protocol === "http:";
    return ["https:", "http:", "mailto:", "tel:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitizes database-backed article HTML before storage and again before render.
 * The allowlist intentionally excludes active content, forms, inline CSS, SVG and
 * event/data attributes. Unknown layout tags are unwrapped so their text remains.
 */
export function sanitizeStoredHtml(input: string): string {
  if (typeof input !== "string") throw new TypeError("HTML content must be a string");
  if (Buffer.byteLength(input, "utf8") > MAX_HTML_BYTES) {
    throw new RangeError(`HTML content exceeds ${MAX_HTML_BYTES} bytes`);
  }

  const $ = cheerio.load(input, { xmlMode: false }, false);
  $("*").each((_index, node) => {
    const htmlNode = node as typeof node & { tagName?: string; attribs?: Record<string, string> };
    if (!htmlNode.tagName) return;
    const element = $(node);
    const tag = htmlNode.tagName.toLowerCase();

    if (DROP_WITH_CONTENT.has(tag)) {
      element.remove();
      return;
    }
    if (!ALLOWED_TAGS.has(tag)) {
      element.replaceWith(element.contents());
      return;
    }

    for (const attribute of Object.keys(htmlNode.attribs ?? {})) {
      const name = attribute.toLowerCase();
      const allowed = GLOBAL_ATTRIBUTES.has(name) || TAG_ATTRIBUTES[tag]?.has(name);
      if (!allowed || name.startsWith("on") || name === "style") element.removeAttr(attribute);
    }

    if (tag === "a") {
      const href = element.attr("href");
      if (href && !isSafeUrl(href, "link")) element.removeAttr("href");
      const target = element.attr("target");
      if (target && target !== "_blank" && target !== "_self") element.removeAttr("target");
      if (target === "_blank") element.attr("rel", "noopener noreferrer");
    }
    if (tag === "img") {
      const src = element.attr("src");
      if (!src || !isSafeUrl(src, "image")) {
        element.remove();
        return;
      }
      element.attr("loading", "lazy");
    }
  });

  return $.root().html() ?? "";
}
