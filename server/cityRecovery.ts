import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import { cities } from "../client/src/data/cities";
import { getCityContentDepthAll } from "../client/src/data/city-content-depth-all";
import { contentPipeline, seoChangeLog, seoPages } from "../drizzle/schema";
import indexEligibility from "../shared/index-eligibility.json";
import redirects from "../shared/seo-redirects.json";
import { getDb } from "./db";

const BASE_URL = "https://breakyoursolarcontract.com";
const ELIGIBLE_CITY_SLUGS = new Set(indexEligibility.citySlugs);
const QUARANTINED_PATHS = new Set(
  (indexEligibility.trustQuarantine?.paths ?? []).map(entry => entry.path),
);
const REDIRECTED_PATHS = new Set(Object.keys(redirects.public));

const sourceSchema = z.object({
  label: z.string().trim().min(3).max(200),
  url: z.string().url().max(2_000).refine(value => value.startsWith("https://"), "Source URLs must use HTTPS"),
});

const linkSchema = z.object({
  label: z.string().trim().min(2).max(120),
  url: z.string().trim().min(1).max(500).refine(value => value.startsWith("/"), "Internal links must be site-relative"),
});

export const cityRecoveryPayloadSchema = z.object({
  title: z.string().trim().min(20).max(180),
  metaTitle: z.string().trim().min(20).max(70),
  metaDescription: z.string().trim().min(70).max(170),
  heroHeading: z.string().trim().min(20).max(180),
  heroCopy: z.string().trim().min(120).max(1_500),
  sections: z.array(z.object({
    heading: z.string().trim().min(8).max(180),
    body: z.string().trim().min(160).max(5_000),
  })).min(3).max(10),
  faq: z.array(z.object({
    question: z.string().trim().min(10).max(240),
    answer: z.string().trim().min(60).max(1_500),
  })).min(3).max(10),
  sources: z.array(sourceSchema).min(2).max(20),
  internalLinks: z.array(linkSchema).min(2).max(12),
  ctaHeading: z.string().trim().min(10).max(160),
  ctaCopy: z.string().trim().min(60).max(700),
  targetKeyword: z.string().trim().min(5).max(180),
});

export type CityRecoveryPayload = z.infer<typeof cityRecoveryPayloadSchema>;

export interface CityRecoveryQa {
  passed: boolean;
  score: number;
  duplicateRisk: number;
  blockers: string[];
  warnings: string[];
  checkedAt: string;
}

type RecoveryEnvelope = {
  cityRecoveryVersion: 1;
  payload: CityRecoveryPayload;
  qa?: CityRecoveryQa;
};

function pagePath(slug: string) {
  return `/cancel-solar-contract/${slug}`;
}

export function isRecoverableCitySlug(slug: string) {
  const path = pagePath(slug);
  return ELIGIBLE_CITY_SLUGS.has(slug)
    && !REDIRECTED_PATHS.has(path)
    && !QUARANTINED_PATHS.has(path)
    && cities.some(city => city.slug === slug);
}

export function recoverableCities() {
  return cities.filter(city => isRecoverableCitySlug(city.slug));
}

function safeParseEnvelope(value: string | null | undefined): RecoveryEnvelope | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<RecoveryEnvelope>;
    const payload = cityRecoveryPayloadSchema.safeParse(parsed.payload);
    if (parsed.cityRecoveryVersion !== 1 || !payload.success) return null;
    return {
      cityRecoveryVersion: 1,
      payload: payload.data,
      qa: parsed.qa,
    };
  } catch {
    return null;
  }
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function payloadText(payload: CityRecoveryPayload) {
  return [
    payload.title,
    payload.heroHeading,
    payload.heroCopy,
    ...payload.sections.flatMap(section => [section.heading, section.body]),
    ...payload.faq.flatMap(item => [item.question, item.answer]),
    payload.ctaHeading,
    payload.ctaCopy,
  ].join(" ");
}

function shingles(value: string, size = 5) {
  const words = normalizeText(value).split(" ").filter(Boolean);
  const result = new Set<string>();
  for (let index = 0; index <= words.length - size; index += 1) {
    result.add(words.slice(index, index + size).join(" "));
  }
  return result;
}

function similarity(left: string, right: string) {
  const a = shingles(left);
  const b = shingles(right);
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const item of Array.from(a)) if (b.has(item)) intersection += 1;
  return Math.round((intersection / (a.size + b.size - intersection)) * 100);
}

function isAllowedInternalLink(url: string) {
  if (REDIRECTED_PATHS.has(url) || QUARANTINED_PATHS.has(url)) return false;
  if (url === "/" || ["/blog", "/solar-contract-help", "/solar-loan-help", "/solar-lien-removal", "/selling-house-with-solar"].includes(url)) return true;
  if (url.startsWith("/blog/")) {
    return indexEligibility.blogSlugs.includes(url.slice("/blog/".length));
  }
  if (url.startsWith("/cancel-solar-contract/")) {
    return isRecoverableCitySlug(url.slice("/cancel-solar-contract/".length));
  }
  return false;
}

function isGovernmentSource(url: string) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.endsWith(".gov") || hostname === "govinfo.gov";
  } catch {
    return false;
  }
}

export async function evaluateCityRecovery(
  slug: string,
  payload: CityRecoveryPayload,
  excludeId?: number,
): Promise<CityRecoveryQa> {
  const city = cities.find(entry => entry.slug === slug);
  const blockers: string[] = [];
  const warnings: string[] = [];
  let duplicateRisk = 0;

  if (!city || !isRecoverableCitySlug(slug)) {
    blockers.push("Target is not a canonical city in the evidence-backed recovery allowlist.");
  } else {
    const text = normalizeText(payloadText(payload));
    if (!text.includes(city.name.toLowerCase()) || !text.includes(city.state.toLowerCase())) {
      blockers.push(`Copy must name both ${city.name} and ${city.state}.`);
    }
    if (city.stateCode !== "TX" && /\b(texas|tdu|ercot|puc\.texas\.gov)\b/i.test(text)) {
      blockers.push("Texas-only language or assets cannot appear on a non-Texas city page.");
    }
    if (/\b(guaranteed|will win|always qualifies|active investigation|cancel for \$0|zero[- ]dollar cancellation)\b/i.test(text)) {
      blockers.push("Draft contains an unsupported result, qualification, or enforcement claim.");
    }
    if (!payload.sources.some(source => isGovernmentSource(source.url))) {
      blockers.push("At least one primary .gov source is required.");
    }
    const duplicateSources = payload.sources.length - new Set(payload.sources.map(source => source.url)).size;
    if (duplicateSources > 0) warnings.push("Duplicate source URLs should be removed.");
    const invalidLinks = payload.internalLinks.filter(link => !isAllowedInternalLink(link.url));
    if (invalidLinks.length) {
      blockers.push(`Internal links must resolve directly to eligible canonical pages: ${invalidLinks.map(link => link.url).join(", ")}`);
    }
    if (!payload.metaTitle.toLowerCase().includes(city.name.toLowerCase())) {
      warnings.push("Meta title should contain the city name.");
    }
    if (payloadText(payload).split(/\s+/).length < 700) {
      warnings.push("Draft is under 700 words; verify that it fully answers the local search intent.");
    }
  }

  const db = await getDb();
  if (db) {
    const rows = await db.select({
      id: contentPipeline.id,
      slug: contentPipeline.slug,
      draft: contentPipeline.draft,
      finalContent: contentPipeline.finalContent,
    })
      .from(contentPipeline)
      .where(and(
        eq(contentPipeline.contentType, "city_page"),
        excludeId ? ne(contentPipeline.id, excludeId) : ne(contentPipeline.id, 0),
      ))
      .limit(200);
    const candidateText = payloadText(payload);
    for (const row of rows) {
      const envelope = safeParseEnvelope(row.finalContent) ?? safeParseEnvelope(row.draft);
      if (!envelope || row.slug === slug) continue;
      duplicateRisk = Math.max(duplicateRisk, similarity(candidateText, payloadText(envelope.payload)));
    }
    if (duplicateRisk > 30) blockers.push(`Cross-city duplicate risk is ${duplicateRisk}%, above the 30% limit.`);
    else if (duplicateRisk > 20) warnings.push(`Cross-city duplicate risk is elevated at ${duplicateRisk}%.`);
  }

  const score = Math.max(0, 100 - blockers.length * 25 - warnings.length * 5 - Math.max(0, duplicateRisk - 10));
  return {
    passed: blockers.length === 0 && score >= 80 && duplicateRisk <= 30,
    score,
    duplicateRisk,
    blockers,
    warnings,
    checkedAt: new Date().toISOString(),
  };
}

export async function listCityRecoveryTargets() {
  const db = await getDb();
  const targets = recoverableCities();
  if (!db) {
    return targets.map(city => ({
      ...city,
      path: pagePath(city.slug),
      gscClicks: 0,
      gscImpressions: 0,
      gscAvgPosition: null,
      gscLastChecked: null,
      workflowStage: "not_started",
      workflowId: null,
      qaScore: null,
      priorityScore: 0,
    }));
  }

  const urls = targets.map(city => `${BASE_URL}${pagePath(city.slug)}`);
  const [metrics, workflowRows] = await Promise.all([
    urls.length
      ? db.select().from(seoPages).where(inArray(seoPages.url, urls))
      : Promise.resolve([]),
    db.select().from(contentPipeline)
      .where(eq(contentPipeline.contentType, "city_page"))
      .orderBy(desc(contentPipeline.updatedAt))
      .limit(300),
  ]);
  const metricByUrl = new Map(metrics.map(row => [row.url, row]));
  const workflowBySlug = new Map<string, typeof workflowRows[number]>();
  for (const row of workflowRows) {
    if (row.slug && !workflowBySlug.has(row.slug)) workflowBySlug.set(row.slug, row);
  }

  return targets.map(city => {
    const metric = metricByUrl.get(`${BASE_URL}${pagePath(city.slug)}`);
    const workflow = workflowBySlug.get(city.slug);
    const position = Number(metric?.gscAvgPosition ?? 100);
    const impressions = Number(metric?.gscImpressions ?? 0);
    const opportunityMultiplier = position <= 10 ? 3 : position <= 20 ? 2 : 1;
    return {
      ...city,
      path: pagePath(city.slug),
      gscClicks: Number(metric?.gscClicks ?? 0),
      gscImpressions: impressions,
      gscAvgPosition: metric?.gscAvgPosition ?? null,
      gscLastChecked: metric?.gscLastChecked ?? null,
      workflowStage: workflow?.stage ?? "not_started",
      workflowId: workflow?.id ?? null,
      qaScore: workflow?.seoScore ?? null,
      priorityScore: impressions * opportunityMultiplier,
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore || a.name.localeCompare(b.name));
}

export async function getCityRecoveryWorkspace(slug: string) {
  if (!isRecoverableCitySlug(slug)) throw new Error("City is not eligible for recovery");
  const city = cities.find(entry => entry.slug === slug)!;
  const db = await getDb();
  const revisions = db
    ? await db.select().from(contentPipeline)
      .where(and(eq(contentPipeline.contentType, "city_page"), eq(contentPipeline.slug, slug)))
      .orderBy(desc(contentPipeline.updatedAt))
      .limit(20)
    : [];
  return {
    city,
    current: getCityContentDepthAll(slug) ?? null,
    revisions: revisions.map(row => ({
      ...row,
      recovery: safeParseEnvelope(row.finalContent) ?? safeParseEnvelope(row.draft),
    })),
  };
}

export async function getPublishedCityRecovery(slug: string) {
  if (!isRecoverableCitySlug(slug)) return null;
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select({
    id: contentPipeline.id,
    slug: contentPipeline.slug,
    finalContent: contentPipeline.finalContent,
    publishedAt: contentPipeline.publishedAt,
    updatedAt: contentPipeline.updatedAt,
  })
    .from(contentPipeline)
    .where(and(
      eq(contentPipeline.contentType, "city_page"),
      eq(contentPipeline.slug, slug),
      eq(contentPipeline.stage, "published"),
    ))
    .orderBy(desc(contentPipeline.publishedAt), desc(contentPipeline.id))
    .limit(1);
  const recovery = safeParseEnvelope(row?.finalContent);
  return row && recovery?.qa?.passed ? { ...row, ...recovery } : null;
}

export async function saveCityRecoveryDraft(input: {
  id?: number;
  slug: string;
  payload: CityRecoveryPayload;
  actor: string;
}) {
  if (!isRecoverableCitySlug(input.slug)) throw new Error("City is not eligible for recovery");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const qa = await evaluateCityRecovery(input.slug, input.payload, input.id);
  const envelope: RecoveryEnvelope = { cityRecoveryVersion: 1, payload: input.payload, qa };
  const values = {
    title: input.payload.title,
    slug: input.slug,
    contentType: "city_page" as const,
    targetKeyword: input.payload.targetKeyword,
    draft: JSON.stringify(envelope),
    finalContent: null,
    wordCount: payloadText(input.payload).split(/\s+/).length,
    stage: (qa.passed ? "in_review" : "revision_needed") as "in_review" | "revision_needed",
    requestedBy: input.actor,
    assignedTo: "content",
    reviewedBy: null,
    approvedBy: null,
    seoScore: qa.score,
    duplicateRisk: qa.duplicateRisk,
    editorFeedback: [...qa.blockers, ...qa.warnings].join("\n") || "Deterministic city-page QA passed.",
    contentBrief: JSON.stringify(envelope),
    updatedAt: new Date(),
  };

  if (input.id) {
    const [existing] = await db.select().from(contentPipeline).where(eq(contentPipeline.id, input.id)).limit(1);
    if (!existing || existing.contentType !== "city_page" || existing.slug !== input.slug) throw new Error("City recovery draft not found");
    if (existing.stage === "published") throw new Error("Published revisions are immutable; create a new revision");
    await db.update(contentPipeline).set(values).where(eq(contentPipeline.id, input.id));
    return { id: input.id, qa };
  }
  const result = await db.insert(contentPipeline).values({
    ...values,
    revenueJustification: "Recover an evidence-backed local landing page with measurable organic demand and lead attribution.",
  });
  const id = Number((result as unknown as { [key: number]: { insertId?: number } })[0]?.insertId ?? 0);
  return { id, qa };
}

export async function reviewCityRecovery(input: {
  id: number;
  decision: "approve" | "revision_needed" | "reject";
  feedback: string;
  actor: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [row] = await db.select().from(contentPipeline).where(eq(contentPipeline.id, input.id)).limit(1);
  if (!row || row.contentType !== "city_page" || !row.slug) throw new Error("City recovery draft not found");
  const envelope = safeParseEnvelope(row.draft);
  if (!envelope) throw new Error("City recovery draft is invalid");
  const qa = await evaluateCityRecovery(row.slug, envelope.payload, row.id);
  if (input.decision === "approve" && !qa.passed) throw new Error("Draft cannot be approved until deterministic QA passes");
  const stage = input.decision === "approve" ? "approved" : input.decision === "reject" ? "rejected" : "revision_needed";
  await db.update(contentPipeline).set({
    stage,
    reviewedBy: input.actor,
    editorFeedback: input.feedback,
    seoScore: qa.score,
    duplicateRisk: qa.duplicateRisk,
    draft: JSON.stringify({ ...envelope, qa }),
    contentBrief: JSON.stringify({ ...envelope, qa }),
    updatedAt: new Date(),
  }).where(eq(contentPipeline.id, input.id));
  return { ok: true, qa };
}

export async function publishCityRecovery(id: number, actor: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [row] = await db.select().from(contentPipeline).where(eq(contentPipeline.id, id)).limit(1);
  if (!row || row.contentType !== "city_page" || !row.slug) throw new Error("City recovery draft not found");
  if (row.stage !== "approved") throw new Error("Owner publishing requires an approved city recovery draft");
  const envelope = safeParseEnvelope(row.draft);
  if (!envelope) throw new Error("City recovery draft is invalid");
  const qa = await evaluateCityRecovery(row.slug, envelope.payload, row.id);
  if (!qa.passed) throw new Error("Draft failed final deterministic QA");

  const [previous] = await db.select().from(contentPipeline)
    .where(and(
      eq(contentPipeline.contentType, "city_page"),
      eq(contentPipeline.slug, row.slug),
      eq(contentPipeline.stage, "published"),
    ))
    .orderBy(desc(contentPipeline.publishedAt))
    .limit(1);
  if (previous) {
    await db.update(contentPipeline).set({
      stage: "approved",
      managerFeedback: `Superseded by city recovery revision #${id}`,
      updatedAt: new Date(),
    }).where(eq(contentPipeline.id, previous.id));
  }

  const finalEnvelope: RecoveryEnvelope = { ...envelope, qa };
  const publishedAt = new Date();
  await db.update(contentPipeline).set({
    stage: "published",
    approvedBy: actor,
    managerFeedback: "Published by an authenticated owner after deterministic QA and editorial approval.",
    finalContent: JSON.stringify(finalEnvelope),
    publishedUrl: `${BASE_URL}${pagePath(row.slug)}`,
    publishedAt,
    updatedAt: publishedAt,
  }).where(eq(contentPipeline.id, id));
  await db.insert(seoChangeLog).values({
    changeType: "content_updated",
    title: `Published governed city recovery: ${row.slug}`,
    description: "Owner approved a source-backed city-page replacement after deterministic local-content QA.",
    pagesAffected: JSON.stringify([pagePath(row.slug)]),
    pageCount: 1,
    beforeSnapshot: previous?.finalContent ?? JSON.stringify({ source: "static_city_template" }),
    afterSnapshot: JSON.stringify(finalEnvelope),
    madeBy: actor,
  });
  return { ok: true, publishedAt, path: pagePath(row.slug) };
}

export async function rollbackCityRecovery(id: number, actor: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [row] = await db.select().from(contentPipeline).where(eq(contentPipeline.id, id)).limit(1);
  if (!row || row.contentType !== "city_page" || !row.slug || row.stage !== "published") {
    throw new Error("Published city recovery revision not found");
  }
  const [previous] = await db.select().from(contentPipeline)
    .where(and(
      eq(contentPipeline.contentType, "city_page"),
      eq(contentPipeline.slug, row.slug),
      eq(contentPipeline.stage, "approved"),
    ))
    .orderBy(desc(contentPipeline.publishedAt), desc(contentPipeline.id))
    .limit(1);
  await db.update(contentPipeline).set({
    stage: "rejected",
    managerFeedback: `Rolled back by ${actor}`,
    updatedAt: new Date(),
  }).where(eq(contentPipeline.id, id));
  if (previous?.finalContent) {
    await db.update(contentPipeline).set({
      stage: "published",
      approvedBy: actor,
      managerFeedback: `Restored after rollback of city recovery revision #${id}`,
      publishedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(contentPipeline.id, previous.id));
  }
  await db.insert(seoChangeLog).values({
    changeType: "content_updated",
    title: `Rolled back governed city recovery: ${row.slug}`,
    description: previous?.finalContent ? `Restored revision #${previous.id}.` : "Restored the static city page.",
    pagesAffected: JSON.stringify([pagePath(row.slug)]),
    pageCount: 1,
    beforeSnapshot: row.finalContent,
    afterSnapshot: previous?.finalContent ?? JSON.stringify({ source: "static_city_template" }),
    madeBy: actor,
  });
  return { ok: true, restoredRevisionId: previous?.id ?? null };
}
