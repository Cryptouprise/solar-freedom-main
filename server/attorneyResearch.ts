import { and, eq } from "drizzle-orm";
import { attorneyProspects } from "../drizzle/schema";
import { getDb } from "./db";
import { makeRequest, type PlaceDetailsResult, type PlacesSearchResult } from "./_core/map";

type ResearchReceipt = {
  state: string;
  searched: number;
  saved: number;
  duplicates: number;
  sourceUrls: string[];
};

const RESEARCH_QUERIES = [
  "consumer protection attorney",
  "solar contract lawyer",
  "DTPA attorney",
] as const;

function normalizeState(state: string) {
  return state.trim().replace(/\s+/g, " ");
}

function mapsUrl(placeId: string) {
  return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;
}

function calculateResearchScore(details: PlaceDetailsResult["result"], query: string) {
  let score = 25; // independently source-backed Google Maps listing
  if (details.website) score += 10;
  if (details.formatted_phone_number || details.international_phone_number) score += 10;
  if ((details.rating ?? 0) >= 4) score += 10;
  if ((details.user_ratings_total ?? 0) >= 20) score += 10;
  if (query.includes("consumer protection") || query.includes("solar contract")) score += 15;
  return Math.min(score, 100);
}

/**
 * Find verifiable, source-backed law-firm prospects using Google Places. This does
 * not invent firm names, emails, attorney names, fee arrangements, or case results.
 * Every saved record includes the original Maps source URL for human verification.
 */
export async function researchAttorneyProspects(states: string[]): Promise<ResearchReceipt[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const results: ResearchReceipt[] = [];

  for (const inputState of states.slice(0, 5)) {
    const state = normalizeState(inputState);
    const seenPlaceIds = new Set<string>();
    const receipt: ResearchReceipt = { state, searched: 0, saved: 0, duplicates: 0, sourceUrls: [] };

    for (const queryPrefix of RESEARCH_QUERIES) {
      const query = `${queryPrefix} in ${state}`;
      const search = await makeRequest<PlacesSearchResult>("/maps/api/place/textsearch/json", { query });

      for (const place of (search.results || []).slice(0, 8)) {
        if (!place.place_id || seenPlaceIds.has(place.place_id)) continue;
        seenPlaceIds.add(place.place_id);
        receipt.searched++;

        const detailsResponse = await makeRequest<PlaceDetailsResult>("/maps/api/place/details/json", {
          place_id: place.place_id,
          fields: "place_id,name,formatted_address,formatted_phone_number,international_phone_number,website,rating,user_ratings_total",
        });
        const details = detailsResponse.result;
        if (!details?.name) continue;

        const existing = await db.select({ id: attorneyProspects.id })
          .from(attorneyProspects)
          .where(and(eq(attorneyProspects.firmName, details.name), eq(attorneyProspects.state, state)))
          .limit(1);

        if (existing.length > 0) {
          receipt.duplicates++;
          continue;
        }

        const sourceUrl = mapsUrl(place.place_id);
        const score = calculateResearchScore(details, queryPrefix);
        await db.insert(attorneyProspects).values({
          firmName: details.name,
          website: details.website ?? null,
          phone: details.formatted_phone_number || details.international_phone_number || null,
          state,
          practiceAreas: JSON.stringify([`Google Maps query match: ${queryPrefix}`]),
          overallScore: score,
          scoreBreakdown: JSON.stringify({
            verifiedGoogleMaps: 25,
            website: details.website ? 10 : 0,
            phone: details.formatted_phone_number || details.international_phone_number ? 10 : 0,
            rating: (details.rating ?? 0) >= 4 ? 10 : 0,
            reviewVolume: (details.user_ratings_total ?? 0) >= 20 ? 10 : 0,
            searchRelevance: queryPrefix.includes("consumer protection") || queryPrefix.includes("solar contract") ? 15 : 0,
          }),
          outreachStatus: "researching",
          outreachNotes: `Verified source: ${sourceUrl}\nDiscovered via Google Maps query: ${query}\nNext step: verify practice area and the appropriate outreach contact before any message is sent.`,
          discoveredBy: "money_maker",
          discoveredVia: "google_maps",
          sourceUrl,
          verifiedAt: new Date(),
        });
        receipt.saved++;
        receipt.sourceUrls.push(sourceUrl);
      }
    }
    results.push(receipt);
  }
  return results;
}

export function formatResearchReceipt(receipts: ResearchReceipt[]) {
  if (receipts.length === 0) return "No attorney research was requested.";
  return receipts.map(receipt =>
    `${receipt.state}: searched ${receipt.searched} source-backed listings; saved ${receipt.saved} new prospects; skipped ${receipt.duplicates} duplicates.`
  ).join(" ");
}
