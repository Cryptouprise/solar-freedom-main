/**
 * Justia consumer-law directory producer.
 *
 * Fetches one public Justia listing page, keeps at most 8 source-backed cards,
 * and never invents emails or sends outreach. Empty or blocked pages insert
 * zero rows and write a blocked receipt.
 */
import * as cheerio from "cheerio";
import { getDb } from "./db";
import { agentChatThreads, attorneyProspects } from "../drizzle/schema";
import { buildLinkedInLookupUrl } from "./attorneyQuality";

export const JUSTIA_MAX_LISTINGS = 8;
export const JUSTIA_DIRECTORY_ORIGIN = "https://www.justia.com";

export const JUSTIA_STATE_ROTATION = [
  { slug: "california", name: "California" },
  { slug: "texas", name: "Texas" },
  { slug: "florida", name: "Florida" },
  { slug: "arizona", name: "Arizona" },
  { slug: "nevada", name: "Nevada" },
  { slug: "colorado", name: "Colorado" },
  { slug: "georgia", name: "Georgia" },
  { slug: "north-carolina", name: "North Carolina" },
  { slug: "south-carolina", name: "South Carolina" },
  { slug: "new-york", name: "New York" },
  { slug: "new-jersey", name: "New Jersey" },
  { slug: "ohio", name: "Ohio" },
  { slug: "michigan", name: "Michigan" },
  { slug: "illinois", name: "Illinois" },
  { slug: "washington", name: "Washington" },
] as const;

const ABBREVIATIONS: Record<string, string> = {
  CA: "california",
  TX: "texas",
  FL: "florida",
  AZ: "arizona",
  NV: "nevada",
  CO: "colorado",
  GA: "georgia",
  NC: "north-carolina",
  SC: "south-carolina",
  NY: "new-york",
  NJ: "new-jersey",
  OH: "ohio",
  MI: "michigan",
  IL: "illinois",
  WA: "washington",
};

export type JustiaListing = {
  firmName: string;
  state: string;
  city?: string;
  phone?: string;
  website?: string;
  sourceUrl: string;
};

export type JustiaResearchResult = {
  found: number;
  saved: number;
  duplicates: number;
  states: string[];
  status: "completed" | "blocked";
  blockedReason?: string;
  reason?: string;
  sourceUrls: string[];
  listingUrl: string;
};

export type JustiaPageFetch = (url: string) => Promise<{ status: number; html: string }>;

export function justiaListingUrl(slug: string): string {
  return `${JUSTIA_DIRECTORY_ORIGIN}/lawyers/consumer-law/${slug}/`;
}

export function normalizeJustiaState(value: string): { slug: string; name: string } | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const abbr = ABBREVIATIONS[trimmed.toUpperCase()];
  const slug = abbr || trimmed.toLowerCase().replace(/_/g, " ").replace(/\s+/g, "-");
  return JUSTIA_STATE_ROTATION.find(state => state.slug === slug) ?? null;
}

export function nextRotatingJustiaState(now = new Date()): { slug: string; name: string } {
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Denver" }).format(now);
  const dayNumber = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
  return JUSTIA_STATE_ROTATION[Math.abs(dayNumber) % JUSTIA_STATE_ROTATION.length];
}

export function resolveJustiaState(requested: string[] = [], now = new Date()): { slug: string; name: string } {
  for (const value of requested) {
    const match = normalizeJustiaState(value);
    if (match) return match;
  }
  return nextRotatingJustiaState(now);
}

export function isJustiaBlockedPage(status: number, html: string): boolean {
  if (status !== 200) return true;
  const hay = html.toLowerCase();
  if (
    hay.includes("cf-browser-verification")
    || hay.includes("just a moment")
    || hay.includes("performing security verification")
    || hay.includes("enable javascript and cookies to continue")
  ) {
    return true;
  }
  return false;
}

function titleCaseCity(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function parseJustiaConsumerLawListings(html: string, stateName: string): JustiaListing[] {
  const $ = cheerio.load(html);
  const listings: JustiaListing[] = [];
  const seen = new Set<string>();

  $("div.jld-card").each((_, element) => {
    if (listings.length >= JUSTIA_MAX_LISTINGS) return;
    const card = $(element);
    const nameLink = card.find("strong.name a").first();
    const firmName = nameLink.text().replace(/\s+/g, " ").trim();
    const sourceUrl = (
      nameLink.attr("href")
      || card.find('a[href*="lawyers.justia.com/lawyer/"]').first().attr("href")
      || ""
    ).trim();
    if (!firmName || !sourceUrl) return;
    const key = `${firmName.toLowerCase()}|${stateName.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);

    const phoneText = card.find("strong.phone a[href^='tel:']").first().text().replace(/\s+/g, " ").trim();
    const websiteHref = (
      card.find('a[data-vars-action="OrganicListingWebsite"]').attr("href")
      || card.find('a[aria-label$=" Website"], a[aria-label$="Website"]').attr("href")
      || ""
    ).trim();
    const website = websiteHref && !/justia\.com/i.test(websiteHref) ? websiteHref : undefined;
    const locationText = card.find(".rating").first().text().replace(/\s+/g, " ");
    const cityMatch = locationText.match(/([A-Za-z][A-Za-z.' -]+),\s*[A-Z]{2}\b/);
    const city = cityMatch ? titleCaseCity(cityMatch[1].trim()) : undefined;

    listings.push({
      firmName,
      state: stateName,
      sourceUrl,
      ...(phoneText ? { phone: phoneText } : {}),
      ...(website ? { website } : {}),
      ...(city ? { city } : {}),
    });
  });

  return listings;
}

export function dedupeJustiaListings(
  listings: JustiaListing[],
  existing: Array<{ firmName: string; state: string }>,
): { toInsert: JustiaListing[]; duplicates: number } {
  const known = new Set(existing.map(row => `${row.firmName.toLowerCase()}|${row.state.toLowerCase()}`));
  const toInsert: JustiaListing[] = [];
  let duplicates = 0;
  for (const listing of listings) {
    const key = `${listing.firmName.toLowerCase()}|${listing.state.toLowerCase()}`;
    if (known.has(key)) {
      duplicates++;
      continue;
    }
    known.add(key);
    toInsert.push(listing);
  }
  return { toInsert, duplicates };
}

async function defaultFetchPage(url: string): Promise<{ status: number; html: string }> {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(12_000),
    headers: {
      Accept: "text/html",
      "User-Agent": "SolarFreedomPartnerResearch/1.0 (+https://breakyoursolarcontract.com)",
    },
  });
  return { status: response.status, html: await response.text() };
}

export function formatJustiaReceipt(result: JustiaResearchResult): string {
  if (result.status === "blocked") {
    return `Attorney research blocked: ${result.blockedReason || result.reason || "Justia listing was empty or blocked."} No attorney records were created.`;
  }
  return `Attorney research complete: Justia ${result.states.join(", ")} listing ${result.listingUrl}; found ${result.found} source-backed listings; saved ${result.saved} new prospects; skipped ${result.duplicates} duplicates. No outreach was sent.`;
}

export async function runJustiaAttorneyResearch(
  requestedStates: string[] = [],
  runId?: number,
  deps: { fetchPage?: JustiaPageFetch } = {},
): Promise<JustiaResearchResult> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const state = resolveJustiaState(requestedStates);
  const listingUrl = justiaListingUrl(state.slug);
  const fetchPage = deps.fetchPage ?? defaultFetchPage;

  let status = 0;
  let html = "";
  try {
    const page = await fetchPage(listingUrl);
    status = page.status;
    html = page.html;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Justia listing fetch failed";
    return persistBlocked(listingUrl, state.name, runId, `Justia listing request failed (${message}).`);
  }

  if (isJustiaBlockedPage(status, html)) {
    return persistBlocked(
      listingUrl,
      state.name,
      runId,
      `Justia listing was blocked (HTTP ${status || "unknown"}). No attorney records were created.`,
    );
  }

  const listings = parseJustiaConsumerLawListings(html, state.name).slice(0, JUSTIA_MAX_LISTINGS);
  if (listings.length === 0) {
    return persistBlocked(
      listingUrl,
      state.name,
      runId,
      `Justia consumer-law listing for ${state.name} was empty. No attorney records were created.`,
    );
  }

  const existingRows = await db.select({
    firmName: attorneyProspects.firmName,
    state: attorneyProspects.state,
  }).from(attorneyProspects);
  const { toInsert, duplicates } = dedupeJustiaListings(listings, existingRows);

  for (const listing of toInsert) {
    await db.insert(attorneyProspects).values({
      firmName: listing.firmName,
      website: listing.website || null,
      phone: listing.phone || null,
      city: listing.city || null,
      state: listing.state,
      practiceAreas: JSON.stringify(["Consumer Law"]),
      overallScore: 30 + (listing.website ? 10 : 0) + (listing.phone ? 10 : 0),
      scoreBreakdown: JSON.stringify({
        justiaDirectoryEvidence: 30,
        website: listing.website ? 10 : 0,
        phone: listing.phone ? 10 : 0,
      }),
      outreachStatus: "researching",
      outreachNotes: `Justia public directory: ${listing.sourceUrl}\nListing page: ${listingUrl}\nNext step: verify practice fit before any message is sent.`,
      discoveredBy: "money_maker",
      discoveredVia: "justia_public_directory",
      sourceUrl: listing.sourceUrl,
      linkedInSearchUrl: buildLinkedInLookupUrl(listing.firmName, listing.state),
      linkedInResearchStatus: "research_ready",
      verifiedAt: new Date(),
    });
  }

  const result: JustiaResearchResult = {
    found: listings.length,
    saved: toInsert.length,
    duplicates,
    states: [state.name],
    status: "completed",
    sourceUrls: toInsert.map(row => row.sourceUrl),
    listingUrl,
  };
  await persistReceipt(formatJustiaReceipt(result), "result", runId, result);
  return result;
}

async function persistReceipt(
  message: string,
  messageType: "result" | "error",
  runId: number | undefined,
  metadata: object,
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  await db.insert(agentChatThreads).values({
    agentSlug: "money_maker",
    runId: runId || null,
    role: "agent",
    message,
    messageType,
    metadata: JSON.stringify(metadata),
    createdAt: new Date(),
    expiresAt,
  });
}

async function persistBlocked(
  listingUrl: string,
  stateName: string,
  runId: number | undefined,
  blockedReason: string,
): Promise<JustiaResearchResult> {
  const result: JustiaResearchResult = {
    found: 0,
    saved: 0,
    duplicates: 0,
    states: [stateName],
    status: "blocked",
    blockedReason,
    reason: blockedReason,
    sourceUrls: [],
    listingUrl,
  };
  await persistReceipt(formatJustiaReceipt(result), "error", runId, result);
  return result;
}

export function isTwoAmMountain(now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Denver",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  return Number(parts.find(part => part.type === "hour")?.value) === 2;
}
