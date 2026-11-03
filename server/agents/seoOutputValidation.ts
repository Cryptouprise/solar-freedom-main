import { z } from "zod";

const priority = z.enum(["p1", "p2", "p3", "p4", "p5"]);
const text = z.string().trim().min(1);
const schema = z.object({
  analysis: z.string().trim().min(20).max(6000),
  actions: z.array(z.object({
    priority: priority.default("p2"),
    title: text.max(500),
    description: text.max(6000),
    actionType: text.max(100),
    pageSlug: text.optional(),
  })).max(3),
  contentDirectives: z.array(z.object({
    toAgent: z.literal("content").optional(), keyword: text.max(255), title: text.max(500),
    secondaryKeywords: z.array(text).max(8).default([]),
    wordCount: z.number().int().min(500).max(5000).default(2500),
    urgency: priority.default("p2"), revenueJustification: text.default("Unmeasured content opportunity; no revenue forecast verified."),
    specificSections: z.array(text).max(12).default([]), internalLinks: z.array(text).max(12).default([]),
  })).max(1).default([]),
  optimizeExisting: z.array(z.object({
    postSlug: text.max(500), keyword: text.max(255),
    metaTitle: text.max(60).optional(), metaDescription: text.max(155).optional(),
    seoImprovements: text.max(2000).optional(), priority: priority.default("p2"),
  })).max(1).default([]),
  messages: z.array(z.object({
    toAgent: z.enum(["content", "editor", "manager", "money_maker", "seo_intel", "infra", "revenue_intel"]),
    type: z.enum(["directive", "report", "info"]), subject: text.max(500), body: text.max(3000),
  })).max(2).default([]),
}).passthrough();
export type ValidSeoOutput = z.infer<typeof schema>;

/** Extract balanced JSON without treating braces inside quoted prose as delimiters. */
export function extractAgentJson(value: string): string | null {
  const start = value.indexOf("{");
  if (start < 0) return null;
  let depth = 0, quoted = false, escaped = false;
  for (let i = start; i < value.length; i++) {
    const char = value[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === "{") depth++;
    else if (char === "}" && --depth === 0) return value.slice(start, i + 1);
  }
  return null;
}

export function validateSeoOutput(response: string): ValidSeoOutput {
  const candidate = extractAgentJson(response);
  if (!candidate) throw new Error("SEO delivery invalid: no complete JSON object. No successful analysis or action is claimed.");
  let data: unknown;
  try { data = JSON.parse(candidate); }
  catch { throw new Error("SEO delivery invalid: malformed JSON. Rework required; no successful analysis or action is claimed."); }
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`SEO delivery invalid: ${result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).slice(0, 3).join("; ")}`);
  }
  return result.data;
}

export function normalizeSeoPublishedSlug(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let input = value.trim();
  if (/^https?:\/\//i.test(input)) {
    try {
      const url = new URL(input);
      if (!['breakyoursolarcontract.com', 'www.breakyoursolarcontract.com'].includes(url.hostname) || url.username || url.password || url.port) return null;
      input = url.pathname;
    } catch { return null; }
  }
  const match = input.match(/^(?:\/?blog\/)?([a-z0-9][a-z0-9-]{0,254})\/?$/i);
  return match ? match[1].toLowerCase() : null;
}
