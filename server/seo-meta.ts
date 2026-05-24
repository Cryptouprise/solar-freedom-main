/**
 * Server-Side SEO Meta Injection
 *
 * This module builds a lookup map of all site URLs → {title, description, canonical}
 * and injects the correct meta tags into index.html before serving it to Googlebot.
 *
 * WHY THIS EXISTS:
 * This is a React SPA. Without this module, every URL returns the same index.html
 * with the homepage title/description. Googlebot can't run JavaScript, so it sees
 * every page as a duplicate of the homepage — causing "Soft 404" errors in GSC
 * and preventing 283+ pages from being indexed.
 *
 * HOW IT WORKS:
 * 1. At server startup, buildMetaMap() creates a Record<path, MetaEntry> from all data files
 * 2. serveWithMeta() intercepts every request, looks up the path, and injects correct meta
 * 3. Googlebot receives unique, meaningful content for each URL
 *
 * LESSON LEARNED: Always implement this from day one on any React SPA that needs SEO.
 * See docs/lessons-learned/01-spa-soft-404-seo.md for full details.
 */

import * as cheerio from "cheerio";
import { cities } from "../client/src/data/cities";
import { companies } from "../client/src/data/companies";
import { stateLaws } from "../client/src/data/state-laws";
import { blogPosts } from "../client/src/data/blog";

const BASE_URL = "https://breakyoursolarcontract.com";

interface MetaEntry {
  title: string;
  description: string;
  canonical: string;
}

let _metaMap: Record<string, MetaEntry> | null = null;

export function buildMetaMap(): Record<string, MetaEntry> {
  if (_metaMap) return _metaMap;

  const map: Record<string, MetaEntry> = {};

  // ─── Static pages ────────────────────────────────────────────────────────────
  const staticPages: Record<string, { title: string; description: string }> = {
    "/": {
      title: "Solar Freedom — Get Out of Your Solar Contract Today",
      description:
        "Trapped in a solar contract? Our attorneys cancel solar agreements for 3,000+ homeowners. Free case review. Results in 30–90 days.",
    },
    "/blog": {
      title: "Solar Contract Help Blog | Solar Freedom",
      description:
        "Expert articles on how to cancel solar contracts, fight solar fraud, and understand your legal rights as a homeowner.",
    },
    "/how-it-works": {
      title: "How Solar Contract Cancellation Works | Solar Freedom",
      description:
        "Learn how Solar Freedom helps homeowners cancel solar contracts through consumer protection law. Free case review.",
    },
    "/solar-contract-help": {
      title: "Solar Contract Help | Legal Options to Cancel | Solar Freedom",
      description:
        "Need solar contract help? Compare rescission, fraud claims, lender disputes, lien removal, and other legal options. Free case review.",
    },
    "/solar-panel-scam": {
      title: "Solar Panel Scam Warning Signs | Solar Freedom",
      description:
        "Learn the solar panel scam warning signs, from fake tax credit promises to hidden loan fees and liens. Free solar contract review.",
    },
    "/sunrun": {
      title:
        "Sunrun Solar Contract Cancellation — Free Legal Review | Solar Freedom",
      description:
        "Sunrun locked you into a 20-year contract with a 2.9% annual escalator. Our attorneys have cancelled hundreds of Sunrun agreements. Free case review — no obligation.",
    },
    "/solar-exit-options": {
      title: "Solar Exit Options | How to Get Out of a Solar Contract",
      description:
        "Explore every legal path to exit your solar contract — rescission, fraud claims, lender disputes, and more. Free case review.",
    },
    "/solar-lien-removal": {
      title: "Solar Lien Removal | Remove a UCC-1 Solar Lien From Your Home",
      description:
        "A solar lien (UCC-1 fixture filing) on your home can block a sale or refinance. Our attorneys remove solar liens. Free review.",
    },
    "/solar-loan-help": {
      title: "Solar Loan Help | Fight Back Against Predatory Solar Loans",
      description:
        "Trapped in a high-interest solar loan with hidden dealer fees? Our attorneys challenge solar loans under TILA and consumer protection law.",
    },
    "/selling-house-with-solar": {
      title: "Selling a House With Solar Panels & a Loan | Solar Freedom",
      description:
        "Solar loan blocking your home sale? We help homeowners pay off, negotiate, or legally challenge solar loans and liens so you can close. Free case review.",
    },
    "/solar-contract-laws": {
      title: "Solar Contract Laws by State | Your Legal Rights",
      description:
        "Every state has different solar contract laws. Find your state's cooling-off period, consumer protection statutes, and cancellation rights.",
    },
    "/solar-fraud-report": {
      title: "Report Solar Fraud | File a Solar Complaint",
      description:
        "Were you misled by a solar salesperson? Report solar fraud to the right agencies and explore your legal options. Free case review.",
    },
    "/solar-companies": {
      title:
        "Solar Company Complaints & Cancellation Guide 2026 | Solar Freedom",
      description:
        "Complete guide to canceling contracts with Sunrun, SunPower, Vivint Solar, Freedom Forever, GoodLeap, Sunnova, Tesla Solar & more. BBB ratings, complaint data, and legal grounds.",
    },
    "/media": {
      title: "Solar Contract Truth Hub — Watch & Listen | Solar Freedom",
      description:
        "Watch explainer videos and listen to the Elite Solar Recovery Podcast. Real cases, real outcomes — Sunrun, SunPower, GoodLeap, Pink Energy cancellations. Free 15-min case audit.",
    },
    "/watch": {
      title: "Solar Contract Videos & Podcast | Solar Freedom",
      description:
        "Explainer videos and podcast episodes on solar contract cancellation, loan reduction, and credit restoration. Learn your rights and get a free case audit.",
    },
  };

  for (const [path, meta] of Object.entries(staticPages)) {
    map[path] = { ...meta, canonical: BASE_URL + path };
  }

  // ─── Company cancel pages ─────────────────────────────────────────────────
  for (const company of companies) {
    const path = `/cancel-${company.slug}-solar-contract`;
    const desc =
      company.summary.length > 155
        ? company.summary.slice(0, 152) + "..."
        : company.summary ||
          `Trapped in a ${company.name} solar contract? Our attorneys have helped thousands cancel. Free case review — no obligation.`;
    map[path] = {
      title: `Cancel ${company.name} Solar Contract | Solar Freedom`,
      description: desc,
      canonical: BASE_URL + path,
    };
  }

  // ─── City pages ───────────────────────────────────────────────────────────
  // City-specific overrides for high-opportunity pages
  const cityOverrides: Record<string, { title: string; description: string }> =
    {
      "phoenix-az": {
        title:
          "Cancel Solar Contract in Phoenix, AZ | Get Out of Your Solar Lease",
        description:
          "Phoenix homeowners: APS net metering changes may have voided your solar contract's savings promises. Our attorneys cancel solar leases and loans. Free case review.",
      },
      "los-angeles-ca": {
        title: "Cancel Solar Contract in Los Angeles, CA | NEM 3.0 Rights",
        description:
          "Los Angeles homeowners: NEM 3.0 cut solar export credits by 75%. If your savings projections were based on NEM 2.0, you may have grounds to cancel. Free legal review.",
      },
      "north-las-vegas-nv": {
        title:
          "Cancel Solar Contract in North Las Vegas, NV | NV Energy Rights",
        description:
          "North Las Vegas homeowners: NV Energy net metering changes may have invalidated your solar contract. Nevada law requires specific disclosures. Free case review.",
      },
      "denver-co": {
        title: "Cancel Solar Contract in Denver, CO | Colorado Solar Rights",
        description:
          "Denver homeowners trapped in solar contracts: Colorado consumer protection laws give you real options. Our attorneys cancel solar leases and loans. Free case review.",
      },
      "las-vegas-nv": {
        title: "Cancel Solar Contract in Las Vegas, NV — Free Case Review 2026",
        description:
          "Las Vegas homeowners: trapped in a solar contract you didn't fully understand? Nevada SB 440 and NRS 598 protect you. Our attorneys have helped NV homeowners cancel solar contracts. Free review.",
      },
      "hartford-ct": {
        title:
          "Cancel Solar Contract in Hartford, CT | Connecticut CUTPA Rights",
        description:
          "Hartford homeowners: Connecticut CUTPA gives you strong grounds to cancel a predatory solar contract. Our attorneys have helped 200+ CT homeowners get out of solar agreements. Free case review.",
      },
      "dallas-tx": {
        title:
          "Cancel Solar Contract in Dallas, TX | Texas DTPA Triple Damages",
        description:
          "Dallas homeowners, escape predatory solar contracts now! Texas DTPA offers triple damages for deceptive sales. Don't wait, get your free case review today.",
      },
      "san-francisco-ca": {
        title: "Cancel Solar Contract in San Francisco, CA | NEM 3.0 Impact",
        description:
          "San Francisco homeowners, NEM 3.0 voided solar savings. Fight back under California CLRA & UCL. Get triple damages & free case review.",
      },
      "houston-tx": {
        title: "Cancel Solar Contract in Houston, TX | Texas DTPA Rights",
        description:
          "Houston homeowners, trapped by solar contracts? Fight back with Texas DTPA! Seek triple damages for deceptive sales. Get help now. Free case review.",
      },
      "san-antonio-tx": {
        title: "Cancel Solar Contract in San Antonio, TX | Texas DTPA Rights",
        description:
          "San Antonio homeowners, escape deceptive solar contracts now! Texas DTPA protects you, offering triple damages for unfair sales. Get help today. Free case review.",
      },
      "miami-fl": {
        title:
          "Cancel Solar Contract in Miami, FL | FDUTPA Rights & Attorney Fees",
        description:
          "Miami homeowners trapped by solar contracts? Florida FDUTPA protects you! Get attorney fees awarded & cancel your solar contract now. Free case review.",
      },
      "cincinnati-oh": {
        title:
          "Cancel Solar Contract in Cincinnati, OH | Ohio Rescission Rights",
        description:
          "Cincinnati homeowners trapped by solar contracts? The Ohio Consumer Sales Practices Act grants rescission rights. Act now to explore your options. Free case review.",
      },
      "greenville-sc": {
        title: "Cancel Solar Contract in Greenville, SC | Triple Damages",
        description:
          "Greenville, SC homeowners trapped by solar contracts from Freedom Forever or Sunrun, act now! Fight back under the SC Unfair Trade Practices Act for triple damages. Free case review.",
      },
      "west-valley-city-ut": {
        title:
          "Cancel Solar Contract in West Valley City, UT | Consumer Rights",
        description:
          "Trapped by a Vivint Solar contract in West Valley City, UT? The Utah Consumer Sales Practices Act protects you. Get triple damages & a free case review.",
      },
      "santa-ana-ca": {
        title: "Cancel Solar Contract in Santa Ana, CA | Consumer Rights",
        description:
          "Trapped by a solar contract in Santa Ana, CA? NEM 3.0 cut credits 75%! Fight back with California CLRA & UCL. You could recover triple damages. Free case review.",
      },
      "new-haven-ct": {
        title: "Cancel Solar Contract in New Haven, CT | Free Case Review",
        description:
          "New Haven homeowners, escape costly 20-year solar leases now! Connecticut CUTPA protects you with attorney fees & punitive damages. Don't wait, get a free case review today.",
      },
      "savannah-ga": {
        title:
          "Cancel Solar Contract in Savannah, GA | Georgia Fair Business Act",
        description:
          "Savannah, GA homeowners trapped by solar contracts? The Georgia Fair Business Practices Act protects you. Get out of your Sunrun/Freedom Forever contract now. Free case review.",
      },
      "san-diego-ca": {
        title: "Cancel Solar Contract in San Diego, CA | Fight NEM 3.0",
        description:
          "San Diego homeowners, trapped by solar contracts? Fight back with California CLRA & UCL! Recover triple damages. Act now to protect your investment. Free case review.",
      },
      "san-jose-ca": {
        title:
          "Cancel Solar Contract in San Jose, CA | NEM 3.0 Relief & Rights",
        description:
          "San Jose homeowners, trapped by NEM 3.0 & predatory solar contracts? Fight back with California CLRA & UCL for triple damages. Free case review.",
      },
      "austin-tx": {
        title: "Cancel Solar Contract in Austin, TX | DTPA Rights",
        description:
          "Trapped by a solar contract in Austin, TX? Texas DTPA protects you with triple damages for deceptive sales. GoodLeap/Mosaic loan issues? Get help now. Free case review.",
      },
      "peoria-az": {
        title:
          "Cancel Solar Contract in Peoria, AZ | Triple Damages & Free Review",
        description:
          "Peoria, AZ homeowners, trapped by solar contracts? The Arizona Consumer Fraud Act offers relief! Discover if you qualify for triple damages. Act now! Free case review.",
      },
      "topeka-ks": {
        title:
          "Cancel Solar Contract in Topeka, KS | Kansas Consumer Protection",
        description:
          "Topeka, KS homeowners trapped by solar contracts can fight back under the Kansas Consumer Protection Act. Seek triple damages & escape your solar burden now. Free case review.",
      },
      "little-rock-ar": {
        title: "Cancel Solar Contract in Little Rock, AR | AR Consumer Rights",
        description:
          "Trapped by a solar contract in Little Rock, AR? The Arkansas Deceptive Trade Practices Act protects you. Recover triple damages & cancel NOW. Free case review.",
      },
      "nampa-id": {
        title:
          "Cancel Solar Contract in Nampa, ID | Idaho Consumer Protection Act",
        description:
          "Trapped by a Vivint Solar contract in Nampa, ID? The Idaho Consumer Protection Act protects you. Fight back for triple damages. Don't wait! Free case review.",
      },
      "nashville-tn": {
        title:
          "Cancel Solar Contract in Nashville, TN | TN Consumer Protection",
        description:
          "Nashville, TN homeowners, fight back! The Tennessee Consumer Protection Act protects you. Seek triple damages & escape bad solar contracts now. Free case review.",
      },
      "columbus-ga": {
        title:
          "Cancel Solar Contract in Columbus, GA | Fight for Triple Damages",
        description:
          "Trapped by a solar contract in Columbus, GA? The Georgia Fair Business Practices Act protects you. Get help now and claim triple damages. Free case review.",
      },
      "costa-mesa-ca": {
        title:
          "Cancel Solar Contract in Costa Mesa, CA | Fight NEM 3.0 & Get Triple Damages",
        description:
          "Costa Mesa homeowners, NEM 3.0 cut solar credits 75%! Fight back with CA CLRA & UCL. Get triple damages & escape your solar trap NOW. Free case review.",
      },
      "erie-pa": {
        title: "Cancel Solar Contract in Erie, PA | PA Consumer Law Help",
        description:
          "Erie, PA homeowners trapped by solar contracts? Fight back under Pennsylvania Unfair Trade Practices and Consumer Protection Law. Get a free case review and seek triple damages now!",
      },
      "fishers-in": {
        title:
          "Cancel Solar Contract in Fishers, IN | Indiana Consumer Protection",
        description:
          "Fishers, IN homeowners, trapped by solar? The Indiana Deceptive Consumer Sales Act protects you. Get triple damages. Don't wait, act now! Free case review.",
      },
      "athens-ga": {
        title:
          "Cancel Solar Contract in Athens, GA | Georgia Fair Business Act Rights",
        description:
          "Athens, GA homeowners, trapped by solar contracts? The Georgia Fair Business Practices Act protects you! Act now for a free case review and potential triple damages.",
      },
      "macon-ga": {
        title: "Cancel Solar Contract in Macon, GA | Georgia Fair Business Act",
        description:
          "Trapped by a solar contract in Macon, GA? The Georgia Fair Business Practices Act protects you. Get triple damages & cancel your solar contract now. Free case review.",
      },
      "montgomery-al": {
        title: "Cancel Solar Contract in Montgomery, AL | Alabama DTPA Rights",
        description:
          "Montgomery, AL homeowners trapped by solar contracts need help now! Fight back under the Alabama Deceptive Trade Practices Act. Secure triple damages. Free case review.",
      },
      "roseville-ca": {
        title: "Cancel Solar Contract in Roseville, CA | CLRA & UCL Rights",
        description:
          "Roseville, CA homeowners, trapped by solar? California CLRA & UCL can help reclaim lost solar credits, potentially triple damages. NEM 3.0 cuts hit hard. Free case review.",
      },
      "santa-clara-ca": {
        title: "Cancel Solar Contract in Santa Clara, CA | Fight NEM 3.0",
        description:
          "Trapped by a solar contract in Santa Clara, CA? NEM 3.0 cuts credits. Know your California CLRA & UCL rights. Fight back against SunPower/Tesla Solar. Free case review.",
      },
      "escondido-ca": {
        title: "Cancel Solar Contract in Escondido, CA | CLRA & UCL Rights",
        description:
          "Escondido homeowners trapped by solar contracts? Act now! California CLRA & UCL laws protect you. Fight for triple damages & escape NEM 3.0 impact. Free case review.",
      },
      "fort-collins-co": {
        title: "Cancel Solar Contract in Fort Collins, CO | Get Triple Damages",
        description:
          "Fort Collins homeowners, escape bad solar contracts now! The Colorado Consumer Protection Act may secure triple damages. Free case review.",
      },
      "murfreesboro-tn": {
        title: "Cancel Solar Contract in Murfreesboro, TN | TN Consumer Rights",
        description:
          "Murfreesboro, TN homeowners, escape bad solar contracts now! The Tennessee Consumer Protection Act protects your rights. Seek triple damages. Free case review.",
      },
    };

  for (const city of cities) {
    const path = `/cancel-solar-contract/${city.slug}`;
    const override = cityOverrides[city.slug];
    map[path] = {
      title:
        override?.title ??
        `Cancel Solar Contract in ${city.name}, ${city.stateCode} | Solar Freedom`,
      description:
        override?.description ??
        `Trapped in a solar contract in ${city.name}, ${city.state}? Our attorneys have helped 3,000+ homeowners cancel solar agreements. Free case review — results in 30–90 days.`,
      canonical: BASE_URL + path,
    };
  }

  // ─── State law pages ──────────────────────────────────────────────────────
  for (const law of stateLaws) {
    const path = `/solar-contract-laws/${law.slug}`;
    // Use the data file's metaTitle/metaDescription (they are specific and compelling)
    const title = law.metaTitle
      ? `${law.metaTitle} | Solar Freedom`
      : `${law.state} Solar Contract Laws | Your Rights | Solar Freedom`;
    const description = law.metaDescription
      ? law.metaDescription
      : `Learn your legal rights under ${law.state} solar contract law — cooling-off periods, consumer protection statutes, and how to cancel. Free case review.`;
    map[path] = { title, description, canonical: BASE_URL + path };
  }

  // ─── Blog posts ───────────────────────────────────────────────────────────
  for (const post of blogPosts) {
    const path = `/blog/${post.slug}`;
    map[path] = {
      title: `${post.metaTitle} | Solar Freedom`,
      description: post.metaDescription,
      canonical: BASE_URL + path,
    };
  }

  _metaMap = map;
  console.log(`[SEO] Meta map built: ${Object.keys(map).length} URLs`);
  return map;
}

/**
 * Inject page-specific meta tags into the index.html string.
 * Uses cheerio (server-side DOM parser) instead of regex for robust handling
 * of Vite-built HTML which may have different attribute ordering/whitespace.
 *
 * Replaces: <title>, meta description, canonical, og:url, og:title, og:description,
 *           twitter:title, twitter:description
 */
export function injectMeta(html: string, path: string): string {
  const map = buildMetaMap();

  // Normalize path: strip trailing slash (except root), strip query string
  const normalizedPath =
    path === "/" ? "/" : path.replace(/\/$/, "").split("?")[0];

  const meta = map[normalizedPath];
  if (!meta) return html; // Unknown path — serve as-is (homepage meta is fine)

  const $ = cheerio.load(html);

  // <title>
  $("title").text(meta.title);

  // meta description
  $('meta[name="description"]').attr("content", meta.description);

  // canonical — remove all existing canonicals first, then set one
  $('link[rel="canonical"]').remove();
  $("head").append(`<link rel="canonical" href="${meta.canonical}" />`);

  // og:url
  $('meta[property="og:url"]').attr("content", meta.canonical);

  // og:title
  $('meta[property="og:title"]').attr("content", meta.title);

  // og:description
  $('meta[property="og:description"]').attr("content", meta.description);

  // twitter:title
  $('meta[name="twitter:title"]').attr("content", meta.title);

  // twitter:description
  $('meta[name="twitter:description"]').attr("content", meta.description);

  return $.html();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Async version of injectMeta that also handles DB-published blog posts.
 *
 * DB posts are created after the build, so they don't have pre-rendered HTML files
 * and aren't in the static meta map. This function does a live DB lookup for
 * /blog/* paths that aren't in the static map, ensuring Googlebot always gets
 * the correct title and meta description even for newly published DB posts.
 */
export async function injectMetaDynamic(
  html: string,
  path: string
): Promise<string> {
  const map = buildMetaMap();

  // Normalize path: strip trailing slash (except root), strip query string
  const normalizedPath =
    path === "/" ? "/" : path.replace(/\/$/, "").split("?")[0];

  let meta = map[normalizedPath];

  // If not in static map and it's a blog path, try DB lookup
  if (!meta && normalizedPath.startsWith("/blog/")) {
    try {
      const { getDbBlogPost } = await import("./db");
      const slug = normalizedPath.replace("/blog/", "");
      const post = await getDbBlogPost(slug);
      if (post && post.metaTitle) {
        meta = {
          title: `${post.metaTitle} | Solar Freedom`,
          description:
            post.metaDescription ||
            `Learn how to cancel your solar contract. Free case review from Solar Freedom attorneys.`,
          canonical: `${BASE_URL}${normalizedPath}`,
        };
      }
    } catch (err) {
      console.warn(`[SEO] DB lookup failed for ${normalizedPath}:`, err);
    }
  }

  if (!meta) return html; // Unknown path — serve as-is

  const $ = cheerio.load(html);

  // <title>
  $("title").text(meta.title);

  // meta description
  $('meta[name="description"]').attr("content", meta.description);

  // canonical — remove all existing canonicals first, then set one
  $('link[rel="canonical"]').remove();
  $("head").append(`<link rel="canonical" href="${meta.canonical}" />`);

  // og:url
  $('meta[property="og:url"]').attr("content", meta.canonical);

  // og:title
  $('meta[property="og:title"]').attr("content", meta.title);

  // og:description
  $('meta[property="og:description"]').attr("content", meta.description);

  // twitter:title
  $('meta[name="twitter:title"]').attr("content", meta.title);

  // twitter:description
  $('meta[name="twitter:description"]').attr("content", meta.description);

  return $.html();
}
