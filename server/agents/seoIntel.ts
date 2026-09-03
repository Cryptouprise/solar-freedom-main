/**
 * SEO Intelligence Agent — Solar Freedom
 *
 * ONE JOB: Drive traffic that converts to leads that make money.
 *
 * This agent monitors GSC data, tracks ranking changes, identifies
 * keyword gaps, and sends content directives to the Content Agent.
 * Every SEO recommendation must be tied to lead generation potential.
 *
 * NEW: Also writes SEO optimization drafts directly to BlogStudio
 * for existing posts that need improvement (optimize_existing action).
 */

import {
  agentLLM,
  startRun,
  completeRun,
  sendMessage,
  createAction,
  getUnreadMessages,
  markMessageActedOn,
  type AgentThinkResult,
} from "./engine";
import { getDb } from "../db";
import { seoChangeLog, seoPages, blogPosts, contentPipeline, blogDrafts } from "../../drizzle/schema";
import { desc, eq, sql, and, gte, lt } from "drizzle-orm";
import { blogPosts as staticBlogPosts } from "../../client/src/data/blog";
import { refreshGscPageMetrics } from "../gscRefresh";

const SYSTEM_PROMPT = `You are the SEO Intelligence Agent for Solar Freedom (breakyoursolarcontract.com).

MISSION: EVERY RANKING POINT = MORE LEADS = MORE MONEY.

EXECUTION SAFETY:
- For optimizeExisting, copy a slug exactly from the supplied PUBLISHED ARTICLES list.
- Never invent a future-dated, old, or /blog-prefixed slug. If no supplied post is a fit, return an empty optimizeExisting list.
- Only link city URLs from the supplied CITY PAGES list. Never invent Jacksonville, Tampa, Orlando, or other non-allowlisted city pages. Do not restore thin city templates. Florida and Nevada state-law pages stay quarantined. Company hubs 301 to blogs — link the blogs, not /cancel-*-solar-contract hubs. Daily content should deepen Sunrun/GoodLeap/Sunnova blogs, TX/CA/AZ law pages, letter, calculator, and compare.
`;

const SEO_OPTIMIZE_PROMPT = `You are an expert SEO content optimizer for Solar Freedom (breakyoursolarcontract.com).`;

function normalizeSeoDraftLanguage(value: string | undefined) {
  return (value ?? "")
    .replace(/\bfree legal review\b/gi, "free case review")
    .replace(/\bfree legal guide(s)?\b/gi, "consumer protection guide$1");
}

function normalizePublishedPostSlug(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\/?blog\//i, "")
    .replace(/^\/+|\/+$/g, "");
}

function extractFirstJsonObject(value: string): string | null {
  const start = value.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = start; index < value.length; index++) {
    const char = value[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === "{") depth++;
    else if (char === "}" && --depth === 0) return value.slice(start, index + 1);
  }
  return null;
}

function parseSeoIntelResponse<T extends { analysis?: string }>(response: string): T {
  const candidate = extractFirstJsonObject(response);
  if (!candidate) return { analysis: response } as T;
  try {
    return JSON.parse(candidate) as T;
  } catch {
    try {
      return JSON.parse(candidate.replace(/[\r\n]+/g, " ")) as T;
    } catch {
      return { analysis: response } as T;
    }
  }
}

export async function runSeoIntel(
  triggerType: "cron" | "manual" | "directive" | "event" = "cron",
  triggeredBy: string = "system"
): Promise<AgentThinkResult> {
  const context = await startRun("seo_intel", triggerType, triggeredBy);
  try {
    let seoState = await gatherSeoState();
    let measurementRefreshNote = "";
    if (!seoState.hasCurrentMeasurements) {
      try {
        const refreshed = await refreshGscPageMetrics();
        seoState = await gatherSeoState();
        measurementRefreshNote = `\n\nLIVE MEASUREMENT REFRESH\nSearch Console page metrics were refreshed for ${refreshed.rows} canonical pages before this analysis.`;
      } catch (refreshError: any) {
        measurementRefreshNote = `\n\nLIVE MEASUREMENT REFRESH FAILED\n${refreshError?.message || "Unknown Search Console refresh error"}.`;
      }
    }
    const inbox = await getUnreadMessages("seo_intel");
    const response = await agentLLM({
      agentSlug: "seo_intel",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `CURRENT SEO STATE:\n${seoState.content}${measurementRefreshNote}` },
      ],
      context,
      temperature: 0.25,
      maxTokens: 4096,
    });
    let parsed: any = parseSeoIntelResponse(response);
    if (!seoState.hasCurrentMeasurements) {
      parsed.topOpportunities = [];
      parsed.contentDirectives = [];
      parsed.optimizeExisting = [];
      parsed.actions = [{
        priority: "p1",
        title: "Refresh verified Google Search Console measurements",
        description: "SEO Intel cannot make ranking-based recommendations because current page-level Search Console measurements are unavailable or stale.",
        actionType: "gsc_data_sync",
      }];
      parsed.analysis = "Current Search Console measurements are unavailable or stale.";
    }
    const db = await getDb();
    for (const action of (parsed.actions || [])) {
      await createAction({
        agentSlug: "seo_intel",
        priority: (action.priority as any) || "p3",
        title: action.title,
        description: action.description,
        actionType: action.actionType || "content_gap",
        requiresApproval: 0,
      });
      context.actionsCreated++;
    }
    for (const directive of (parsed.contentDirectives || [])) {
      await sendMessage({
        fromAgent: "seo_intel",
        toAgent: "content",
        type: "directive",
        priority: (directive.urgency as any) || "p2",
        subject: `[SEO DIRECTIVE] Write: "${directive.title}"`,
        body: `Primary Keyword: ${directive.keyword}`,
      });
      context.messagesCreated++;
    }
    for (const m of inbox) {
      await markMessageActedOn(m.id);
    }
    const summary = parsed.analysis || "SEO analysis cycle completed";
    await completeRun(context, summary);
    return { summary, actionsCreated: context.actionsCreated, messagesCreated: context.messagesCreated };
  } catch (error: any) {
    await completeRun(context, `Error: ${error.message}`, "failed", error.message);
    throw error;
  }
}

async function gatherSeoState(): Promise<{ content: string; hasCurrentMeasurements: boolean }> {
  const db = await getDb();
  if (!db) {
    return {
      content: "Database unavailable. Do not make ranking, traffic, revenue, or optimization claims.",
      hasCurrentMeasurements: false,
    };
  }
  const pages = await db.select().from(seoPages).orderBy(desc(seoPages.gscImpressions)).limit(30);
  const currentMeasurementCutoff = Date.now() - 72 * 60 * 60 * 1000;
  const hasCurrentMeasurements = pages.some((page) => {
    const checkedAt = page.gscLastChecked?.getTime() ?? 0;
    return checkedAt >= currentMeasurementCutoff && Number(page.gscImpressions ?? 0) > 0;
  });
  return {
    hasCurrentMeasurements,
    content: `
CITY PAGES AVAILABLE FOR INTERNAL LINKING
  /cancel-solar-contract/phoenix-az
  /cancel-solar-contract/houston-tx
  /cancel-solar-contract/dallas-tx
  /cancel-solar-contract/austin-tx
  /cancel-solar-contract/san-antonio-tx
  /cancel-solar-contract/los-angeles-ca
  /cancel-solar-contract/san-diego-ca
  /cancel-solar-contract/las-vegas-nv
  /cancel-solar-contract/denver-co
  /cancel-solar-contract/miami-fl

MONEY HUBS TO LINK (prefer these over cities)
  /free-cancellation-letter
  /calculator
  /compare
  /solar-contract-laws/texas
  /solar-contract-laws/california
  /solar-contract-laws/arizona
  /blog/sunrun-solar-contract-cancellation-2026
  /blog/goodleap-solar-loan-cancellation-hidden-fees-2026
  /blog/how-to-cancel-sunnova-solar-contract-2026
  /blog/freedom-forever-solar-bankruptcy-what-homeowners-can-do-2026
  /blog/adt-solar-complaints
  /blog/tesla-solar-solarcity-complaints-cancel-2026`,
  };
}
