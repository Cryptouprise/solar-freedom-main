/**
 * Medium Backlink Tracker Cron
 *
 * Runs daily at 6am UTC.
 * 1. Seeds known Medium article URLs from our import strategy into mediumArticles table
 * 2. Crawls each Medium article to discover outbound links back to our site
 * 3. Stores discovered backlinks in discoveredBacklinks table
 * 4. Updates crawl status and timestamps
 *
 * Why: Medium has DA 95. Every article we syndicate there that links back to our
 * site pages is a high-authority backlink. This tracker maps those links so we
 * can measure their SEO impact.
 */

import { getDb } from "../db";
import { mediumArticles, discoveredBacklinks } from "../../drizzle/schema";
import { eq, and, or, lt } from "drizzle-orm";

const OUR_DOMAIN = "breakyoursolarcontract.com";

// ─── Known Medium articles from our import strategy ──────────────────────────
// These are the articles we've published on Medium that link back to our site.
// Add new Medium URLs here as we publish more articles.
const KNOWN_MEDIUM_ARTICLES: Array<{
  mediumUrl: string;
  title: string;
  canonicalUrl?: string;
}> = [
  {
    mediumUrl: "https://medium.com/@solarfreedom/goodleap-solar-loan-cancellation-guide",
    title: "GoodLeap Solar Loan Cancellation Guide",
    canonicalUrl: "https://breakyoursolarcontract.com/blog/goodleap-solar-loan-cancellation-guide",
  },
  {
    mediumUrl: "https://medium.com/@solarfreedom/sunrun-solar-contract-cancellation-2026",
    title: "Sunrun Solar Contract Cancellation 2026",
    canonicalUrl: "https://breakyoursolarcontract.com/blog/sunrun-solar-contract-cancellation-2026",
  },
  {
    mediumUrl: "https://medium.com/@solarfreedom/how-to-get-out-of-a-solar-contract",
    title: "How to Get Out of a Solar Contract",
    canonicalUrl: "https://breakyoursolarcontract.com/blog/how-to-get-out-of-a-solar-contract",
  },
  {
    mediumUrl: "https://medium.com/@solarfreedom/new-jersey-solar-contract-cancellation",
    title: "New Jersey Solar Contract Cancellation",
    canonicalUrl: "https://breakyoursolarcontract.com/blog/new-jersey-solar-contract-cancellation",
  },
  {
    mediumUrl: "https://medium.com/@solarfreedom/blue-raven-solar-complaints",
    title: "Blue Raven Solar Complaints",
    canonicalUrl: "https://breakyoursolarcontract.com/blog/blue-raven-solar-complaints",
  },
  {
    mediumUrl: "https://medium.com/@solarfreedom/solar-contract-rescission-rights",
    title: "Solar Contract Rescission Rights",
    canonicalUrl: "https://breakyoursolarcontract.com/blog/solar-contract-rescission-rights",
  },
  {
    mediumUrl: "https://medium.com/@solarfreedom/sunrun-complaints-california",
    title: "Sunrun Complaints California",
    canonicalUrl: "https://breakyoursolarcontract.com/blog/sunrun-complaints-california",
  },
  {
    mediumUrl: "https://medium.com/@solarfreedom/cancel-sunrun-solar-contract",
    title: "Cancel Sunrun Solar Contract",
    canonicalUrl: "https://breakyoursolarcontract.com/blog/cancel-sunrun-solar-contract",
  },
  {
    mediumUrl: "https://medium.com/@solarfreedom/adt-solar-complaints",
    title: "ADT Solar Complaints",
    canonicalUrl: "https://breakyoursolarcontract.com/blog/adt-solar-complaints",
  },
  {
    mediumUrl: "https://medium.com/@solarfreedom/cancel-solar-contract-houston",
    title: "Cancel Solar Contract Houston",
    canonicalUrl: "https://breakyoursolarcontract.com/blog/cancel-solar-contract-houston",
  },
  {
    mediumUrl: "https://medium.com/@solarfreedom/goodleap-solar-loan-hidden-dealer-fees",
    title: "GoodLeap Solar Loan Hidden Dealer Fees",
    canonicalUrl: "https://breakyoursolarcontract.com/blog/goodleap-solar-loan-hidden-dealer-fees-2024",
  },
  {
    mediumUrl: "https://medium.com/@solarfreedom/freedom-forever-solar-bankruptcy",
    title: "Freedom Forever Solar Bankruptcy Problems",
    canonicalUrl: "https://breakyoursolarcontract.com/blog/freedom-forever-solar-bankruptcy-problems",
  },
  {
    mediumUrl: "https://medium.com/@solarfreedom/how-to-file-complaint-against-solar-company",
    title: "How to File a Complaint Against Solar Company",
    canonicalUrl: "https://breakyoursolarcontract.com/blog/how-to-file-a-complaint-against-solar-company",
  },
  {
    mediumUrl: "https://medium.com/@solarfreedom/tesla-solar-solarcity-complaints",
    title: "Tesla Solar / SolarCity Complaints",
    canonicalUrl: "https://breakyoursolarcontract.com/blog/tesla-solar-solarcity-complaints",
  },
  {
    mediumUrl: "https://medium.com/@solarfreedom/solar-contract-escalator-clause",
    title: "Solar Contract Escalator Clause",
    canonicalUrl: "https://breakyoursolarcontract.com/blog/solar-contract-escalator-clause",
  },
  {
    mediumUrl: "https://medium.com/@solarfreedom/sell-house-with-solar-panels",
    title: "Sell House with Solar Panels",
    canonicalUrl: "https://breakyoursolarcontract.com/blog/sell-house-with-solar-panels",
  },
  {
    mediumUrl: "https://medium.com/@solarfreedom/selling-home-with-solar-ppa",
    title: "Selling Home with Solar PPA",
    canonicalUrl: "https://breakyoursolarcontract.com/blog/selling-home-with-solar-ppa",
  },
  {
    mediumUrl: "https://medium.com/@solarfreedom/solar-payment-shock-help",
    title: "Solar Payment Shock Help",
    canonicalUrl: "https://breakyoursolarcontract.com/blog/solar-payment-shock-help",
  },
  {
    mediumUrl: "https://medium.com/@solarfreedom/sunnova-contract-transfer-problems",
    title: "Sunnova Contract Transfer Problems",
    canonicalUrl: "https://breakyoursolarcontract.com/blog/sunnova-contract-transfer-problems",
  },
  {
    mediumUrl: "https://medium.com/@solarfreedom/cancel-vivint-solar-contract",
    title: "Cancel Vivint Solar Contract",
    canonicalUrl: "https://breakyoursolarcontract.com/blog/cancel-vivint-solar-contract",
  },
];

// ─── Seed known articles into DB ─────────────────────────────────────────────

async function seedKnownMediumArticles(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  let seeded = 0;
  for (const article of KNOWN_MEDIUM_ARTICLES) {
    // Check if already exists
    const existing = await db
      .select({ id: mediumArticles.id })
      .from(mediumArticles)
      .where(eq(mediumArticles.mediumUrl, article.mediumUrl))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(mediumArticles).values({
        mediumUrl: article.mediumUrl,
        title: article.title,
        canonicalUrl: article.canonicalUrl ?? null,
        crawlStatus: "pending",
      });
      seeded++;
    }
  }

  return seeded;
}

// ─── Crawl a Medium article for outbound links ───────────────────────────────

interface FoundLink {
  url: string;
  anchorText: string;
  doFollow: boolean;
}

async function crawlMediumArticle(mediumUrl: string): Promise<FoundLink[]> {
  try {
    const response = await fetch(mediumUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SolarFreedomBot/1.0; +https://breakyoursolarcontract.com)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Extract all links from the HTML
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    const noFollowRegex = /rel=["'][^"']*nofollow[^"']*["']/i;
    const foundLinks: FoundLink[] = [];

    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const innerHtml = match[2];
      const fullTag = match[0];

      // Only capture links to our domain
      if (href.includes(OUR_DOMAIN)) {
        const anchorText = innerHtml.replace(/<[^>]+>/g, "").trim().slice(0, 500);
        const doFollow = !noFollowRegex.test(fullTag);

        // Normalize the URL
        let url = href;
        if (url.startsWith("//")) url = "https:" + url;
        if (!url.startsWith("http")) continue;

        foundLinks.push({ url, anchorText, doFollow });
      }
    }

    return foundLinks;
  } catch (error) {
    console.error(`[MediumTracker] Failed to crawl ${mediumUrl}:`, error);
    throw error;
  }
}

// ─── Store discovered backlinks ───────────────────────────────────────────────

async function storeBacklinks(
  mediumUrl: string,
  links: FoundLink[]
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  for (const link of links) {
    // Extract slug from URL
    const urlObj = new URL(link.url);
    const targetSlug = urlObj.pathname;

    // Upsert — update lastSeenAt if already exists
    const existing = await db
      .select({ id: discoveredBacklinks.id })
      .from(discoveredBacklinks)
      .where(
        and(
          eq(discoveredBacklinks.sourceUrl, mediumUrl),
          eq(discoveredBacklinks.targetUrl, link.url)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(discoveredBacklinks)
        .set({
          lastSeenAt: new Date(),
          isActive: 1,
          status: "verified",
          anchorText: link.anchorText,
        })
        .where(eq(discoveredBacklinks.id, existing[0].id));
    } else {
      await db.insert(discoveredBacklinks).values({
        sourceUrl: mediumUrl,
        sourceDomain: "medium.com",
        sourceType: "medium",
        targetUrl: link.url,
        targetSlug,
        anchorText: link.anchorText,
        doFollow: link.doFollow ? 1 : 0,
        domainAuthority: 95, // Medium's DA
        domainRating: 90,
        status: "new",
        isActive: 1,
      });
    }
  }
}

// ─── Main tracker run ─────────────────────────────────────────────────────────

export async function runMediumBacklinkTracker(): Promise<{
  seeded: number;
  crawled: number;
  backlinksFound: number;
  errors: number;
}> {
  const db = await getDb();
  if (!db) return { seeded: 0, crawled: 0, backlinksFound: 0, errors: 0 };

  console.log("[MediumTracker] Starting Medium backlink tracker run...");

  // 1. Seed known articles
  const seeded = await seedKnownMediumArticles();
  console.log(`[MediumTracker] Seeded ${seeded} new Medium articles`);

  // 2. Find articles that need crawling (pending or not crawled in 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const toCrawl = await db
    .select()
    .from(mediumArticles)
    .where(
      or(
        eq(mediumArticles.crawlStatus, "pending"),
        and(
          eq(mediumArticles.crawlStatus, "crawled"),
          lt(mediumArticles.lastCrawledAt, sevenDaysAgo)
        )
      )
    )
    .limit(10); // Process max 10 per run to avoid rate limiting

  let crawled = 0;
  let backlinksFound = 0;
  let errors = 0;

  for (const article of toCrawl) {
    try {
      console.log(`[MediumTracker] Crawling: ${article.mediumUrl}`);

      const links = await crawlMediumArticle(article.mediumUrl);
      await storeBacklinks(article.mediumUrl, links);

      // Update article record
      await db
        .update(mediumArticles)
        .set({
          crawlStatus: "crawled",
          lastCrawledAt: new Date(),
          outboundLinks: JSON.stringify(links),
          outboundLinkCount: links.length,
          crawlError: null,
        })
        .where(eq(mediumArticles.id, article.id));

      crawled++;
      backlinksFound += links.length;

      // Small delay to be polite to Medium's servers
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[MediumTracker] Error crawling ${article.mediumUrl}:`, errorMsg);

      await db
        .update(mediumArticles)
        .set({
          crawlStatus: "error",
          crawlError: errorMsg,
          lastCrawledAt: new Date(),
        })
        .where(eq(mediumArticles.id, article.id));

      errors++;
    }
  }

  console.log(`[MediumTracker] Complete: ${crawled} crawled, ${backlinksFound} backlinks found, ${errors} errors`);
  return { seeded, crawled, backlinksFound, errors };
}

// ─── Cron starter (interval-based) ───────────────────────────────────────────

let mediumTrackerInterval: ReturnType<typeof setInterval> | null = null;

export function startMediumBacklinkTrackerCron(): void {
  if (mediumTrackerInterval) return; // Already running

  // Run once at startup (with delay to let server settle)
  setTimeout(() => {
    runMediumBacklinkTracker().catch(err =>
      console.error("[MediumTracker] Startup run failed:", err)
    );
  }, 30000); // 30 second delay

  // Then run every 24 hours
  mediumTrackerInterval = setInterval(() => {
    runMediumBacklinkTracker().catch(err =>
      console.error("[MediumTracker] Scheduled run failed:", err)
    );
  }, 24 * 60 * 60 * 1000);

  console.log("[MediumTracker] Medium backlink tracker cron started (daily)");
}
