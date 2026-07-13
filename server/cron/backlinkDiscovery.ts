/**
 * Backlink research queue.
 *
 * This job creates unverified candidates for an administrator to investigate.
 * It does not verify that a site is active, accepts submissions, has a specific
 * link attribute or authority score, and it never submits or approves links.
 */

import { isIP } from "node:net";
import { eq, inArray } from "drizzle-orm";
import { backlinkOpportunities } from "../../drizzle/schema";
import { logSafeError } from "../_core/safeLog";
import { getDb } from "../db";
import { callLLM } from "./aiCostTracker";

export const DEFAULT_BACKLINK_RESEARCH_MODEL = "openrouter/free";

const FIRST_PARTY_HOST = "breakyoursolarcontract.com";
const MAX_CANDIDATES_PER_RUN = 20;
const RESEARCH_REASON =
  "Unverified research candidate; confirm the site, editorial fit, submission policy, pricing, and link attributes before approval.";

const OPPORTUNITY_TYPES = new Set<BacklinkOpportunityType>([
  "press_release",
  "directory",
  "guest_post",
  "resource_page",
  "forum",
  "social",
  "other",
]);

type BacklinkOpportunityType =
  | "press_release"
  | "directory"
  | "guest_post"
  | "resource_page"
  | "forum"
  | "social"
  | "other";

/**
 * Historical candidates retained only as a research starting point. Their
 * availability, submission policies, pricing, and link attributes are unknown
 * until a reviewer verifies them.
 */
export const KNOWN_PR_SITES = [
  { name: "PRLog.com", url: "https://www.prlog.org", type: "press_release" as const },
  { name: "OpenPR.com", url: "https://www.openpr.com", type: "press_release" as const },
  { name: "1888PressRelease.com", url: "https://www.1888pressrelease.com", type: "press_release" as const },
  { name: "PRFree.com", url: "https://prfree.com", type: "press_release" as const },
  { name: "PRBuzz.com", url: "https://www.prbuzz.com", type: "press_release" as const },
  { name: "Free-Press-Release.com", url: "https://free-press-release.com", type: "press_release" as const },
  { name: "PRUrgent.com", url: "https://www.prurgent.com", type: "press_release" as const },
  { name: "i-Newswire.com", url: "https://i-newswire.com", type: "press_release" as const },
  { name: "ClickPress.com", url: "https://www.clickpress.com", type: "press_release" as const },
  { name: "NewsByWire.com", url: "https://newsbywire.com", type: "press_release" as const },
  { name: "PRLeap.com", url: "https://www.prleap.com", type: "press_release" as const },
  { name: "PRZoom.com", url: "https://www.przoom.com", type: "press_release" as const },
  { name: "SBWire.com", url: "https://www.sbwire.com", type: "press_release" as const },
  { name: "24-7PressRelease.com", url: "https://www.24-7pressrelease.com", type: "press_release" as const },
  { name: "PRMac.com", url: "https://prmac.com", type: "press_release" as const },
  { name: "Avvo.com", url: "https://www.avvo.com", type: "directory" as const },
  { name: "FindLaw.com", url: "https://www.findlaw.com", type: "directory" as const },
  { name: "Justia.com", url: "https://www.justia.com", type: "directory" as const },
  { name: "Lawyers.com", url: "https://www.lawyers.com", type: "directory" as const },
  { name: "HG.org", url: "https://www.hg.org", type: "directory" as const },
  { name: "LegalMatch.com", url: "https://www.legalmatch.com", type: "directory" as const },
  { name: "CleanTechnica.com", url: "https://cleantechnica.com", type: "resource_page" as const },
  { name: "SolarReviews.com", url: "https://www.solarreviews.com", type: "directory" as const },
  { name: "EnergySage.com", url: "https://news.energysage.com", type: "resource_page" as const },
  { name: "ConsumerAffairs.com", url: "https://www.consumeraffairs.com", type: "directory" as const },
  { name: "BBB.org", url: "https://www.bbb.org", type: "directory" as const },
];

export interface DiscoveredOpportunity {
  name: string;
  url: string;
  type: BacklinkOpportunityType;
  /** Model-generated topical-fit score, not an authority or ranking metric. */
  relevanceScore: number | null;
  relevanceReason: string;
  domainAuthority: null;
  doFollow: null;
  discoveredVia: "ai_unverified_research";
}

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function isReservedResearchHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (isIP(host) !== 0) return true;
  if (host === FIRST_PARTY_HOST || host.endsWith(`.${FIRST_PARTY_HOST}`)) return true;
  if (!host.includes(".") || !/^[a-z0-9.-]+$/.test(host)) return true;
  if (host.startsWith(".") || host.endsWith(".") || host.includes("..")) return true;

  const reservedNames = [
    "localhost",
    ".localhost",
    ".local",
    ".internal",
    ".home",
    ".lan",
    ".onion",
    ".test",
    ".invalid",
  ];
  if (reservedNames.some((suffix) => host === suffix.replace(/^\./, "") || host.endsWith(suffix))) {
    return true;
  }

  return ["example.com", "example.net", "example.org"]
    .some((domain) => host === domain || host.endsWith(`.${domain}`));
}

/** Return a canonical, public-host HTTPS URL suitable for an external link. */
export function normalizeBacklinkCandidateUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const input = value.trim();
  if (!input || input.length > 500 || !/^https:\/\//i.test(input)) return null;

  try {
    const parsed = new URL(input);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return null;
    if (parsed.port && parsed.port !== "443") return null;
    if (isReservedResearchHost(parsed.hostname)) return null;
    parsed.hash = "";
    return parsed.href;
  } catch {
    return null;
  }
}

/** Include the historical raw spelling so pre-canonicalization rows are repaired. */
export function backlinkCandidateUrlVariants(value: unknown): string[] {
  if (typeof value !== "string") return [];
  const raw = value.trim();
  const canonical = normalizeBacklinkCandidateUrl(raw);
  return canonical ? Array.from(new Set([raw, canonical])) : [];
}

function asOpportunityType(value: unknown): BacklinkOpportunityType | null {
  return typeof value === "string" && OPPORTUNITY_TYPES.has(value as BacklinkOpportunityType)
    ? value as BacklinkOpportunityType
    : null;
}

function asModeledRelevance(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(100, Math.round(value)))
    : null;
}

/**
 * Parse provider JSON defensively and replace provider-authored assertions with
 * a fixed review warning. Unsafe, duplicate, or malformed candidates are
 * discarded before they can reach storage or the admin UI.
 */
export function parseUnverifiedBacklinkSuggestions(content: string): DiscoveredOpportunity[] {
  let payload: unknown;
  try {
    payload = JSON.parse(content);
  } catch {
    return [];
  }

  const candidateRecord = payload && typeof payload === "object"
    ? payload as Record<string, unknown>
    : null;
  const rawList = Array.isArray(payload)
    ? payload
    : Array.isArray(candidateRecord?.opportunities)
      ? candidateRecord.opportunities
      : Array.isArray(candidateRecord?.sites)
        ? candidateRecord.sites
        : [];

  const seen = new Set<string>();
  const results: DiscoveredOpportunity[] = [];

  for (const raw of rawList) {
    if (results.length >= MAX_CANDIDATES_PER_RUN) break;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const item = raw as Record<string, unknown>;
    const url = normalizeBacklinkCandidateUrl(item.url);
    const type = asOpportunityType(item.type);
    if (!url || !type || seen.has(url)) continue;

    const parsedUrl = new URL(url);
    const name = cleanText(item.name, 200) || parsedUrl.hostname;
    if (!name) continue;

    seen.add(url);
    results.push({
      name,
      url,
      type,
      relevanceScore: asModeledRelevance(item.relevanceScore),
      relevanceReason: RESEARCH_REASON,
      domainAuthority: null,
      doFollow: null,
      discoveredVia: "ai_unverified_research",
    });
  }

  return results;
}

async function discoverWithAI(model: string): Promise<DiscoveredOpportunity[]> {
  const excludedHosts = KNOWN_PR_SITES
    .map((site) => new URL(site.url).hostname.replace(/^www\./, ""))
    .join(", ");

  const prompt = `Create a research queue of up to 20 possible websites whose topics may overlap with solar-contract consumer education.

The site being researched is Solar Freedom (breakyoursolarcontract.com), which publishes general educational information about solar agreements, financing, and consumer resources.

Candidate categories may include press-release services, legal or consumer directories, solar publications, resource pages, and relevant guest-contribution programs.

Important limitations:
- Your knowledge may be stale. Do not claim that any candidate is active, reputable, high-authority, available, free, accepting submissions, or likely to provide a link.
- Do not estimate domain authority, traffic, ranking value, link attributes, acceptance likelihood, pricing, or endorsement.
- Do not include government or educational sites unless there is a plausible public resource or contribution page to investigate; never imply they will link to this site.
- Return candidates for manual verification only.
- Exclude these historical candidates: ${excludedHosts}

Return one JSON object shaped exactly as:
{"opportunities":[{"name":"Site name","url":"https://public.example/path","type":"press_release|directory|guest_post|resource_page|forum|social|other","relevanceScore":50}]}

relevanceScore is only a modeled 0-100 topical-fit sorting aid. It is not authority, quality, probability, or expected SEO impact.`;

  const content = await callLLM({
    model,
    messages: [{ role: "user", content: prompt }],
    feature: "backlink_research",
    responseFormat: { type: "json_object" },
    temperature: 0.2,
    maxTokens: 3000,
  });

  return parseUnverifiedBacklinkSuggestions(content);
}

/** Queue historical candidates as unverified, resetting legacy invented data. */
export async function seedKnownPRSites(): Promise<number> {
  let db: Awaited<ReturnType<typeof getDb>>;
  try {
    db = await getDb();
  } catch (error) {
    logSafeError("backlink.discovery_failed", error);
    throw new Error("Backlink research storage is unavailable.");
  }
  if (!db) throw new Error("Backlink research storage is unavailable.");

  let queued = 0;
  try {
    for (const site of KNOWN_PR_SITES) {
      const urlVariants = backlinkCandidateUrlVariants(site.url);
      const canonicalUrl = normalizeBacklinkCandidateUrl(site.url);
      if (!canonicalUrl || urlVariants.length === 0) continue;

      const matchingRows = await db
        .select({
          id: backlinkOpportunities.id,
          url: backlinkOpportunities.url,
          discoveredVia: backlinkOpportunities.discoveredVia,
          reviewedAt: backlinkOpportunities.reviewedAt,
          reviewNotes: backlinkOpportunities.reviewNotes,
        })
        .from(backlinkOpportunities)
        .where(inArray(backlinkOpportunities.url, urlVariants));

      const unverifiedValues = {
        name: site.name,
        type: site.type,
        discoveredVia: "legacy_unverified_seed",
        relevanceScore: null,
        relevanceReason: RESEARCH_REASON,
        domainAuthority: null,
        doFollow: null,
        status: "new" as const,
        reviewedAt: null,
        reviewNotes: null,
      };

      if (matchingRows.length === 0) {
        await db.insert(backlinkOpportunities).values({
          ...unverifiedValues,
          url: canonicalUrl,
        });
        queued += 1;
        continue;
      }

      const historicalSeedRows = matchingRows.filter((row) =>
        ["initial seed", "legacy_unverified_seed"].includes(row.discoveredVia ?? "")
      );
      const unreviewedSeedRows = historicalSeedRows.filter((row) =>
        row.reviewedAt === null && !(row.reviewNotes ?? "").trim()
      );
      const humanReviewedSeedRows = historicalSeedRows.filter((row) =>
        !unreviewedSeedRows.some((seedRow) => seedRow.id === row.id)
      );
      const independentlyOwnedRows = matchingRows.filter((row) =>
        !historicalSeedRows.some((seedRow) => seedRow.id === row.id)
      );

      // Human review state is evidence and is preserved, but the old generated
      // metrics and rationale are not. Sanitize those fields in place.
      for (const reviewedRow of humanReviewedSeedRows) {
        await db
          .update(backlinkOpportunities)
          .set({
            discoveredVia: "legacy_unverified_seed",
            relevanceScore: null,
            relevanceReason: RESEARCH_REASON,
            domainAuthority: null,
            doFollow: null,
          })
          .where(eq(backlinkOpportunities.id, reviewedRow.id));
      }

      if (independentlyOwnedRows.length > 0 || humanReviewedSeedRows.length > 0) {
        // A person-owned or reviewed record wins. Remove only obsolete,
        // never-reviewed seed duplicates.
        if (unreviewedSeedRows.length > 0) {
          await db.delete(backlinkOpportunities).where(inArray(
            backlinkOpportunities.id,
            unreviewedSeedRows.map((row) => row.id),
          ));
        }

        // Canonicalize a single reviewed legacy row only when no independent or
        // other reviewed spelling can collide with the unique URL constraint.
        if (independentlyOwnedRows.length === 0 && humanReviewedSeedRows.length === 1) {
          const reviewedRow = humanReviewedSeedRows[0];
          if (reviewedRow.url !== canonicalUrl) {
            await db
              .update(backlinkOpportunities)
              .set({ url: canonicalUrl })
              .where(eq(backlinkOpportunities.id, reviewedRow.id));
          }
        }
        continue;
      }

      const keeper = unreviewedSeedRows.find((row) => row.url === canonicalUrl)
        ?? unreviewedSeedRows[0];
      if (!keeper) continue;

      // Reset the chosen row before canonicalizing, then remove alternate raw
      // spellings so the unique URL constraint cannot collide on the update.
      await db
        .update(backlinkOpportunities)
        .set(unverifiedValues)
        .where(eq(backlinkOpportunities.id, keeper.id));

      const duplicateIds = unreviewedSeedRows
        .filter((row) => row.id !== keeper.id)
        .map((row) => row.id);
      if (duplicateIds.length > 0) {
        await db.delete(backlinkOpportunities).where(inArray(
          backlinkOpportunities.id,
          duplicateIds,
        ));
      }

      if (keeper.url !== canonicalUrl) {
        await db
          .update(backlinkOpportunities)
          .set({ url: canonicalUrl })
          .where(eq(backlinkOpportunities.id, keeper.id));
      }
      queued += 1;
    }
  } catch (error) {
    logSafeError("backlink.discovery_failed", error);
    throw new Error("Unable to queue backlink research candidates.");
  }

  console.log(`[Backlink] Queued ${queued} unverified historical candidates`);
  return queued;
}

export interface DiscoveryResult {
  discovered: number;
  newOpportunities: number;
  skippedDuplicates: number;
  /** Fixed machine-safe codes only; never provider or database messages. */
  errors: Array<"AI_RESEARCH_UNAVAILABLE" | "CANDIDATE_SAVE_FAILED">;
}

export async function runBacklinkDiscovery(): Promise<DiscoveryResult> {
  console.log("[Backlink] Starting unverified research queue generation");

  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("Backlink research provider is not configured.");
  }

  let db: Awaited<ReturnType<typeof getDb>>;
  try {
    db = await getDb();
  } catch (error) {
    logSafeError("backlink.discovery_failed", error);
    throw new Error("Backlink research storage is unavailable.");
  }
  if (!db) throw new Error("Backlink research storage is unavailable.");

  const errors = new Set<DiscoveryResult["errors"][number]>();
  let newOpportunities = 0;
  let skippedDuplicates = 0;
  let discovered: DiscoveredOpportunity[] = [];

  try {
    discovered = await discoverWithAI(DEFAULT_BACKLINK_RESEARCH_MODEL);
    console.log(`[Backlink] Generated ${discovered.length} unverified candidates`);
  } catch (error) {
    logSafeError("backlink.discovery_failed", error);
    errors.add("AI_RESEARCH_UNAVAILABLE");
  }

  for (const opportunity of discovered) {
    try {
      const existing = await db
        .select({ id: backlinkOpportunities.id })
        .from(backlinkOpportunities)
        .where(eq(backlinkOpportunities.url, opportunity.url))
        .limit(1);

      if (existing.length > 0) {
        skippedDuplicates += 1;
        continue;
      }

      await db.insert(backlinkOpportunities).values({
        name: opportunity.name,
        url: opportunity.url,
        type: opportunity.type,
        discoveredVia: opportunity.discoveredVia,
        relevanceScore: opportunity.relevanceScore,
        relevanceReason: opportunity.relevanceReason,
        domainAuthority: null,
        doFollow: null,
        status: "new",
      });
      newOpportunities += 1;
    } catch (error) {
      logSafeError("backlink.discovery_failed", error);
      errors.add("CANDIDATE_SAVE_FAILED");
    }
  }

  console.log(
    `[Backlink] Research queue complete. New: ${newOpportunities}, duplicates: ${skippedDuplicates}`,
  );

  return {
    discovered: discovered.length,
    newOpportunities,
    skippedDuplicates,
    errors: Array.from(errors),
  };
}

let cronInterval: ReturnType<typeof setInterval> | null = null;

export function startBacklinkDiscoveryCron(): void {
  cronInterval = setInterval(async () => {
    try {
      const now = new Date();
      const utcDay = now.getUTCDay();
      const utcHour = now.getUTCHours();
      const utcMin = now.getUTCMinutes();

      if (utcDay === 3 && utcHour === 15 && utcMin < 5) {
        console.log("[Backlink Cron] Starting scheduled unverified research queue");
        await runBacklinkDiscovery();
      }
    } catch (error) {
      logSafeError("backlink.discovery_failed", error);
    }
  }, 5 * 60 * 1000);

  console.log("[Backlink Cron] Unverified research queue scheduler started");
}

export function stopBacklinkDiscoveryCron(): void {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
  }
}
