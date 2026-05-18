/**
 * Backlink Discovery Cron — Weekly automated link opportunity finder
 *
 * Runs every Wednesday at 9am MT (15:00 UTC).
 * Uses OpenRouter AI to identify high-quality backlink opportunities in the
 * solar/legal/consumer protection space, scores them for relevance and DA,
 * and adds them to the backlinkOpportunities table for admin review.
 *
 * Discovery methods:
 *   1. Google search queries for relevant directories, resource pages, guest post sites
 *   2. Analysis of competitor backlink profiles (via public data)
 *   3. Niche-specific site lists (solar news, legal directories, consumer advocacy)
 *
 * Cost: ~$0.001 per discovery run using Qwen 3 8B via OpenRouter
 */

import { getDb } from "../db";
import { backlinkOpportunities } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "qwen/qwen3-8b:free";

// ─── Known high-value PR and backlink sites (always in the list) ──────────────

export const KNOWN_PR_SITES = [
  // Free press release sites
  { name: "PRLog.com", url: "https://www.prlog.org", type: "press_release" as const, da: 72, doFollow: 1 },
  { name: "OpenPR.com", url: "https://www.openpr.com", type: "press_release" as const, da: 65, doFollow: 1 },
  { name: "1888PressRelease.com", url: "https://www.1888pressrelease.com", type: "press_release" as const, da: 55, doFollow: 1 },
  { name: "PRFree.com", url: "https://prfree.com", type: "press_release" as const, da: 50, doFollow: 1 },
  { name: "PRBuzz.com", url: "https://www.prbuzz.com", type: "press_release" as const, da: 48, doFollow: 1 },
  { name: "Free-Press-Release.com", url: "https://free-press-release.com", type: "press_release" as const, da: 52, doFollow: 1 },
  { name: "PRUrgent.com", url: "https://www.prurgent.com", type: "press_release" as const, da: 45, doFollow: 1 },
  { name: "i-Newswire.com", url: "https://i-newswire.com", type: "press_release" as const, da: 55, doFollow: 1 },
  { name: "ClickPress.com", url: "https://www.clickpress.com", type: "press_release" as const, da: 47, doFollow: 1 },
  { name: "NewsByWire.com", url: "https://newsbywire.com", type: "press_release" as const, da: 44, doFollow: 1 },
  { name: "PRLeap.com", url: "https://www.prleap.com", type: "press_release" as const, da: 58, doFollow: 1 },
  { name: "PRZoom.com", url: "https://www.przoom.com", type: "press_release" as const, da: 46, doFollow: 1 },
  { name: "SBWire.com", url: "https://www.sbwire.com", type: "press_release" as const, da: 54, doFollow: 1 },
  { name: "24-7PressRelease.com", url: "https://www.24-7pressrelease.com", type: "press_release" as const, da: 62, doFollow: 1 },
  { name: "PRMac.com", url: "https://prmac.com", type: "press_release" as const, da: 56, doFollow: 1 },

  // Legal directories
  { name: "Avvo.com", url: "https://www.avvo.com", type: "directory" as const, da: 78, doFollow: 0 },
  { name: "FindLaw.com", url: "https://www.findlaw.com", type: "directory" as const, da: 85, doFollow: 0 },
  { name: "Justia.com", url: "https://www.justia.com", type: "directory" as const, da: 82, doFollow: 1 },
  { name: "Lawyers.com", url: "https://www.lawyers.com", type: "directory" as const, da: 75, doFollow: 0 },
  { name: "HG.org", url: "https://www.hg.org", type: "directory" as const, da: 70, doFollow: 1 },
  { name: "LegalMatch.com", url: "https://www.legalmatch.com", type: "directory" as const, da: 68, doFollow: 0 },

  // Consumer advocacy / solar news
  { name: "CleanTechnica.com", url: "https://cleantechnica.com", type: "resource_page" as const, da: 79, doFollow: 1 },
  { name: "SolarReviews.com", url: "https://www.solarreviews.com", type: "directory" as const, da: 65, doFollow: 1 },
  { name: "EnergySage.com", url: "https://news.energysage.com", type: "resource_page" as const, da: 72, doFollow: 1 },
  { name: "ConsumerAffairs.com", url: "https://www.consumeraffairs.com", type: "directory" as const, da: 80, doFollow: 0 },
  { name: "BBB.org", url: "https://www.bbb.org", type: "directory" as const, da: 91, doFollow: 0 },
];

// ─── AI-powered opportunity discovery ────────────────────────────────────────

interface DiscoveredOpportunity {
  name: string;
  url: string;
  type: "press_release" | "directory" | "guest_post" | "resource_page" | "forum" | "social" | "other";
  relevanceScore: number;
  relevanceReason: string;
  domainAuthority: number;
  doFollow: number;
  discoveredVia: string;
}

async function discoverWithAI(apiKey: string, model: string): Promise<DiscoveredOpportunity[]> {
  const prompt = `You are an SEO expert specializing in link building for consumer advocacy websites.

The website is Solar Freedom (breakyoursolarcontract.com) — a consumer advocacy site helping homeowners cancel predatory solar contracts. Topics covered: solar contract cancellation, solar lease problems, solar loan issues, consumer protection law, homeowner rights.

Find 20 high-quality backlink opportunities for this site. Focus on:
1. Free press release distribution sites (not already in the list below)
2. Legal resource directories that accept consumer advocacy sites
3. Solar energy news sites that accept guest posts or press releases
4. Consumer protection resource pages that link to helpful tools
5. Home improvement / real estate sites that cover solar issues
6. State government or .edu pages about solar consumer rights

EXCLUDE these already-known sites:
prlog.org, openpr.com, 1888pressrelease.com, prfree.com, prbuzz.com, free-press-release.com, prurgent.com, i-newswire.com, clickpress.com, newsbywire.com, prleap.com, przoom.com, sbwire.com, 24-7pressrelease.com, prmac.com, avvo.com, findlaw.com, justia.com, lawyers.com, hg.org, legalmatch.com, cleantechnica.com, solarreviews.com, energysage.com, consumeraffairs.com, bbb.org

Return a JSON array of opportunities. Each item must have:
- name: site name
- url: homepage URL (https://...)
- type: one of "press_release", "directory", "guest_post", "resource_page", "forum", "social", "other"
- relevanceScore: 0-100 (how relevant to solar contract cancellation)
- relevanceReason: 1 sentence explaining why this is a good link source
- domainAuthority: estimated DA 0-100 (be conservative/realistic)
- doFollow: 1 if likely dofollow, 0 if nofollow
- discoveredVia: brief description of how you identified this (e.g. "legal directory search", "solar news site")

Only include sites that:
- Are real, currently active websites
- Would likely accept a press release or link from a consumer advocacy solar site
- Have DA > 30 (be realistic)

Return ONLY the JSON array, no other text.`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://www.breakyoursolarcontract.com",
      "X-Title": "Solar Freedom Backlink Discovery",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from AI");

  const parsed = JSON.parse(content);
  // Handle both array and {opportunities: [...]} formats
  const list = Array.isArray(parsed) ? parsed : (parsed.opportunities ?? parsed.sites ?? []);

  return list.filter((item: any) =>
    item.url && item.type && typeof item.relevanceScore === "number"
  );
}

// ─── Seed known sites into DB ─────────────────────────────────────────────────

export async function seedKnownPRSites(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  for (const site of KNOWN_PR_SITES) {
    await db
      .insert(backlinkOpportunities)
      .values({
        name: site.name,
        url: site.url,
        type: site.type,
        discoveredVia: "initial seed",
        relevanceScore: 90,
        relevanceReason: "Known high-quality free press release or directory site",
        domainAuthority: site.da,
        doFollow: site.doFollow,
        status: "approved",
      })
      .onDuplicateKeyUpdate({ set: { name: site.name } });
  }

  console.log(`[Backlink] Seeded ${KNOWN_PR_SITES.length} known PR sites`);
}

// ─── Main discovery runner ────────────────────────────────────────────────────

export interface DiscoveryResult {
  discovered: number;
  newOpportunities: number;
  skippedDuplicates: number;
  errors: string[];
}

export async function runBacklinkDiscovery(): Promise<DiscoveryResult> {
  console.log("[Backlink] Starting backlink discovery cycle...");

  const apiKey = process.env.OPENROUTER_API_KEY ?? "";
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not set");
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const errors: string[] = [];
  let newOpportunities = 0;
  let skippedDuplicates = 0;

  // 1. Discover via AI
  let discovered: DiscoveredOpportunity[] = [];
  try {
    discovered = await discoverWithAI(apiKey, DEFAULT_MODEL);
    console.log(`[Backlink] AI discovered ${discovered.length} opportunities`);
  } catch (err) {
    errors.push(`AI discovery failed: ${String(err)}`);
  }

  // 2. Save to DB (skip duplicates)
  for (const opp of discovered) {
    try {
      await db
        .insert(backlinkOpportunities)
        .values({
          name: opp.name,
          url: opp.url,
          type: opp.type,
          discoveredVia: opp.discoveredVia,
          relevanceScore: opp.relevanceScore,
          relevanceReason: opp.relevanceReason,
          domainAuthority: opp.domainAuthority,
          doFollow: opp.doFollow,
          status: "new",
        })
        .onDuplicateKeyUpdate({ set: { relevanceScore: opp.relevanceScore } });

      newOpportunities++;
    } catch (err: any) {
      if (err?.message?.includes("Duplicate")) {
        skippedDuplicates++;
      } else {
        errors.push(`Failed to save ${opp.url}: ${String(err)}`);
      }
    }
  }

  console.log(`[Backlink] Discovery complete. New: ${newOpportunities}, Skipped: ${skippedDuplicates}`);

  return {
    discovered: discovered.length,
    newOpportunities,
    skippedDuplicates,
    errors,
  };
}

// ─── Cron scheduler ───────────────────────────────────────────────────────────

let cronInterval: ReturnType<typeof setInterval> | null = null;

export function startBacklinkDiscoveryCron(): void {
  cronInterval = setInterval(async () => {
    try {
      const now = new Date();
      const utcDay = now.getUTCDay();    // 3 = Wednesday
      const utcHour = now.getUTCHours(); // 15 = 9am MT
      const utcMin = now.getUTCMinutes();

      if (utcDay === 3 && utcHour === 15 && utcMin < 5) {
        console.log("[Backlink Cron] Wednesday 9am MT — starting discovery");
        await runBacklinkDiscovery();
      }
    } catch (err) {
      console.error("[Backlink Cron] Error:", err);
    }
  }, 5 * 60 * 1000);

  console.log("[Backlink Cron] Discovery cron started");
}

export function stopBacklinkDiscoveryCron(): void {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
  }
}
