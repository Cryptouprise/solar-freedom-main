/**
 * Attorney Research Executor
 *
 * Uses Google Maps search and Place Details as the source of record. It never
 * writes LLM-recalled firms, private contact data, fee arrangements, or outcomes.
 */
import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { agentChatThreads, attorneyProspects } from "../../drizzle/schema";
import { makeRequest, type PlaceDetailsResult, type PlacesSearchResult } from "../_core/map";
import { buildLinkedInLookupUrl } from "../attorneyQuality";

const QUERY_PREFIXES = ["consumer protection attorney", "solar contract lawyer", "DTPA attorney"] as const;

function sourceUrl(placeId: string) {
  return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;
}

function prospectScore(details: PlaceDetailsResult["result"], query: string) {
  let score = 25;
  if (details.website) score += 10;
  if (details.formatted_phone_number || details.international_phone_number) score += 10;
  if ((details.rating || 0) >= 4) score += 10;
  if ((details.user_ratings_total || 0) >= 20) score += 10;
  if (query !== "DTPA attorney") score += 15;
  return Math.min(score, 100);
}

export async function executeAttorneyResearch(states: string[], runId?: number): Promise<{
  found: number;
  saved: number;
  duplicates: number;
  states: string[];
  status: "completed";
  sourceUrls: string[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  let found = 0;
  let saved = 0;
  let duplicates = 0;
  const sourceUrls: string[] = [];
  const safeStates = states.map(state => state.trim()).filter(Boolean).slice(0, 5);

  for (const state of safeStates) {
    const seenPlaceIds = new Set<string>();
    for (const queryPrefix of QUERY_PREFIXES) {
      const query = `${queryPrefix} in ${state}`;
      const search = await makeRequest<PlacesSearchResult>("/maps/api/place/textsearch/json", { query });
      for (const place of (search.results || []).slice(0, 8)) {
        if (!place.place_id || seenPlaceIds.has(place.place_id)) continue;
        seenPlaceIds.add(place.place_id);
        found++;
        const detailResponse = await makeRequest<PlaceDetailsResult>("/maps/api/place/details/json", {
          place_id: place.place_id,
          fields: "place_id,name,formatted_address,formatted_phone_number,international_phone_number,website,rating,user_ratings_total",
        });
        const details = detailResponse.result;
        if (!details?.name) continue;
        const duplicate = await db.select({ id: attorneyProspects.id })
          .from(attorneyProspects)
          .where(and(eq(attorneyProspects.firmName, details.name), eq(attorneyProspects.state, state)))
          .limit(1);
        if (duplicate.length) {
          duplicates++;
          continue;
        }
        const evidenceUrl = sourceUrl(place.place_id);
        const score = prospectScore(details, queryPrefix);
        await db.insert(attorneyProspects).values({
          firmName: details.name,
          website: details.website || null,
          phone: details.formatted_phone_number || details.international_phone_number || null,
          state,
          practiceAreas: JSON.stringify([`Google Maps query match: ${queryPrefix}`]),
          overallScore: score,
          scoreBreakdown: JSON.stringify({ googleMapsEvidence: 25, website: details.website ? 10 : 0, phone: details.formatted_phone_number || details.international_phone_number ? 10 : 0, rating: (details.rating || 0) >= 4 ? 10 : 0, reviewVolume: (details.user_ratings_total || 0) >= 20 ? 10 : 0, queryRelevance: queryPrefix === "DTPA attorney" ? 0 : 15 }),
          outreachStatus: "researching",
          outreachNotes: `Verified Google Maps source: ${evidenceUrl}\nSearch query: ${query}\nNext step: verify the practice fit and correct outreach contact before any message is sent.`,
          discoveredBy: "money_maker",
          discoveredVia: "google_maps",
          sourceUrl: evidenceUrl,
          linkedInSearchUrl: buildLinkedInLookupUrl(details.name, state),
          linkedInResearchStatus: "research_ready",
          verifiedAt: new Date(),
        });
        saved++;
        sourceUrls.push(evidenceUrl);
      }
    }
  }

  const result = { found, saved, duplicates, states: safeStates, status: "completed" as const, sourceUrls };
  await saveAgentChatMessage("money_maker", `Attorney research complete: searched ${found} source-backed listings; saved ${saved} new prospects; skipped ${duplicates} duplicates. No outreach was sent.`, "result", runId, result);
  return result;
}

export async function saveAgentChatMessage(
  agentSlug: string,
  message: string,
  messageType: "analysis" | "action" | "result" | "error" | "directive" | "summary",
  runId?: number,
  metadata?: object
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  await db.insert(agentChatThreads).values({
    agentSlug,
    runId: runId || null,
    role: "agent",
    message,
    messageType,
    metadata: metadata ? JSON.stringify(metadata) : null,
    createdAt: new Date(),
    expiresAt,
  });
}
