/**
 * Public Justia consumer-law directory research.
 *
 * Replaces Google Maps Places as the attorney-prospect source of record.
 * Only stores fields present on the public listing. Never emails, never
 * invents contacts, never touches GoHighLevel.
 */
import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import { attorneyProspects } from "../drizzle/schema";
import { buildLinkedInLookupUrl } from "./attorneyQuality";
import { saveAgentChatMessage } from "./agents/attorneyResearch";

export const JUSTIA_USER_AGENT =
  "SolarFreedomPartnerResearch/1.0 (+https://breakyoursolarcontract.com)";

export const JUSTIA_STATE_SLUGS = [
  "arizona", "texas", "california", "florida", "nevada", "new-jersey",
  "pennsylvania", "georgia", "colorado", "north-carolina", "south-carolina",
  "ohio", "michigan", "illinois", "new-york", "utah", "new-mexico",
  "washington", "oregon", "tennessee", "missouri", "indiana", "wisconsin",
  "minnesota", "maryland", "virginia", "massachusetts", "connecticut",
  "oklahoma", "alabama",
] as const;

const STATE_LABEL: Record<string, string> = Object.fromEntries(
  JUSTIA_STATE_SLUGS.map((slug) => [slug, slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())]),
);

export type JustiaPerson = {
  name?: string;
  url?: string;
  telephone?: string;
  workLocation?: JustiaWorkLocation | JustiaWorkLocation[];
};

type JustiaWorkLocation = {
  name?: string;
  telephone?: string;
  address?: {
    addressLocality?: string;
    addressRegion?: string;
  } | Array<{ addressLocality?: string; addressRegion?: string }>;
};

export type JustiaProspect = {
  firmName: string;
  attorneyName: string | null;
  city: string | null;
  state: string;
  phone: string | null;
  sourceUrl: string;
};

export function justiaListingUrl(stateSlug: string, page = 1) {
  const base = `https://www.justia.com/lawyers/consumer-law/${stateSlug}`;
  return page <= 1 ? `${base}/` : `${base}?page=${page}`;
}

export function rotateJustiaState(now = new Date()) {
  const index = Math.floor(now.getTime() / 86_400_000) % JUSTIA_STATE_SLUGS.length;
  return JUSTIA_STATE_SLUGS[index];
}

function asObject<T>(value: T | T[] | undefined): T | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseJustiaPeople(html: string): JustiaPerson[] {
  const people: JustiaPerson[] = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item && item["@type"] === "Person" && typeof item.name === "string") {
          people.push(item as JustiaPerson);
        }
      }
    } catch {
      /* skip malformed JSON-LD */
    }
  }
  return people;
}

export function buildJustiaProspect(person: JustiaPerson, stateLabel: string): JustiaProspect | null {
  const sourceUrl = typeof person.url === "string" ? person.url.trim() : "";
  if (!sourceUrl.startsWith("https://")) return null;
  const loc = asObject(person.workLocation) || {};
  const addr = asObject(loc.address) || {};
  const firmName = (loc.name || person.name || "").trim();
  if (firmName.length < 2) return null;
  const phone = (loc.telephone || person.telephone || "").trim() || null;
  const city = (addr.addressLocality || "").trim() || null;
  return {
    firmName,
    attorneyName: person.name?.trim() || null,
    city,
    state: stateLabel,
    phone,
    sourceUrl,
  };
}

export function listingHasNextPage(html: string, currentPage: number) {
  return html.includes('rel="next"') || html.includes(`page=${currentPage + 1}`);
}

export function buildJustiaProspectRecord(prospect: JustiaProspect) {
  const note = [
    `Justia public consumer-law listing for ${prospect.attorneyName || prospect.firmName}.`,
    `Source: ${prospect.sourceUrl}`,
    "Next step: run the partner quality review before drafting outreach. No message was sent.",
  ].join("\n");
  return {
    firmName: prospect.firmName,
    contactPerson: prospect.attorneyName,
    state: prospect.state,
    city: prospect.city,
    phone: prospect.phone,
    website: null,
    practiceAreas: JSON.stringify(["Justia consumer-law directory listing"]),
    overallScore: Math.min(100, 40 + (prospect.phone ? 15 : 0) + (prospect.city ? 10 : 0)),
    scoreBreakdown: JSON.stringify({
      publicDirectoryEvidence: 40,
      phone: prospect.phone ? 15 : 0,
      city: prospect.city ? 10 : 0,
      unknownPartnerFit: 0,
    }),
    outreachStatus: "researching" as const,
    outreachNotes: note,
    discoveredBy: "money_maker",
    discoveredVia: "justia_public_directory",
    sourceUrl: prospect.sourceUrl,
    linkedInSearchUrl: buildLinkedInLookupUrl(prospect.firmName, prospect.state),
    linkedInResearchStatus: "research_ready" as const,
    verifiedAt: new Date(),
  };
}

async function fetchJustiaPage(url: string) {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(12_000),
    headers: {
      "User-Agent": JUSTIA_USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!response.ok) {
    throw new Error(`Justia returned HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

export async function executeJustiaAttorneyResearch(
  states: string[],
  options?: { runId?: number; maxPagesPerState?: number; maxSaves?: number },
): Promise<{
  found: number;
  saved: number;
  duplicates: number;
  states: string[];
  status: "completed" | "blocked";
  blockedReason?: string;
  sourceUrls: string[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const maxPages = Math.max(1, Math.min(options?.maxPagesPerState ?? 1, 8));
  const maxSaves = Math.max(1, Math.min(options?.maxSaves ?? 80, 250));
  const slugs = states
    .map((value) => value.trim().toLowerCase().replace(/\s+/g, "-"))
    .map((slug) => (JUSTIA_STATE_SLUGS as readonly string[]).includes(slug) ? slug : "")
    .filter(Boolean)
    .slice(0, 5);

  if (!slugs.length) {
    return {
      found: 0,
      saved: 0,
      duplicates: 0,
      states: [],
      status: "blocked",
      blockedReason: "No recognized Justia state slug was provided.",
      sourceUrls: [],
    };
  }

  let found = 0;
  let saved = 0;
  let duplicates = 0;
  const sourceUrls: string[] = [];
  let blockedReason: string | undefined;

  for (const slug of slugs) {
    const label = STATE_LABEL[slug] || slug;
    for (let page = 1; page <= maxPages && saved < maxSaves; page++) {
      const url = justiaListingUrl(slug, page);
      let html: string;
      try {
        html = await fetchJustiaPage(url);
      } catch (error) {
        blockedReason = error instanceof Error ? error.message : "Justia directory was unavailable";
        break;
      }
      const people = parseJustiaPeople(html);
      if (!people.length) {
        if (page === 1) blockedReason = `Justia listing for ${label} returned no public Person records.`;
        break;
      }
      for (const person of people) {
        if (saved >= maxSaves) break;
        const prospect = buildJustiaProspect(person, label);
        if (!prospect) continue;
        found++;
        const existing = await db.select({ id: attorneyProspects.id })
          .from(attorneyProspects)
          .where(and(
            eq(attorneyProspects.sourceUrl, prospect.sourceUrl),
          ))
          .limit(1);
        const nameDup = existing.length ? existing : await db.select({ id: attorneyProspects.id })
          .from(attorneyProspects)
          .where(and(eq(attorneyProspects.firmName, prospect.firmName), eq(attorneyProspects.state, prospect.state)))
          .limit(1);
        if (nameDup.length) {
          duplicates++;
          continue;
        }
        await db.insert(attorneyProspects).values(buildJustiaProspectRecord(prospect));
        saved++;
        sourceUrls.push(prospect.sourceUrl);
      }
      if (!listingHasNextPage(html, page)) break;
    }
    if (blockedReason) break;
  }

  const result = {
    found,
    saved,
    duplicates,
    states: slugs.map((slug) => STATE_LABEL[slug] || slug),
    status: blockedReason && saved === 0 ? "blocked" as const : "completed" as const,
    ...(blockedReason ? { blockedReason } : {}),
    sourceUrls,
  };
  const summary = result.status === "blocked"
    ? `Justia attorney research blocked: ${blockedReason}`
    : `Justia attorney research complete: ${found} public listings; saved ${saved}; skipped ${duplicates} duplicates. No outreach was sent.`;
  await saveAgentChatMessage("money_maker", summary, result.status === "blocked" ? "error" : "result", options?.runId, result);
  return result;
}
