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
import { suppressUnverifiedFirstPartyClaims, suppressUnverifiedQuoteMarkup } from "@shared/contentGovernance";
import { cities } from "../client/src/data/cities";
import { companies } from "../client/src/data/companies";
import { stateLaws } from "../client/src/data/state-laws";
import { blogPosts } from "../client/src/data/blog";
import { INDEXED_CITY_SLUGS } from "../client/src/data/indexed-cities";
import { isCanonicalBlogIndexed, isCompanyIndexed, isStateIndexed } from "../client/src/data/indexEligibility";
import { sanitizeStoredHtml } from "./security/html";  // server/security/html.ts

const BASE_URL = "https://breakyoursolarcontract.com";

interface MetaEntry {
  title: string;
  description: string;
  canonical: string;
  noindex?: boolean;
}

let _metaMap: Record<string, MetaEntry> | null = null;

export function buildMetaMap(): Record<string, MetaEntry> {
  if (_metaMap) return _metaMap;

  const map: Record<string, MetaEntry> = {};

  // ─── Static pages ────────────────────────────────────────────────────────
  const staticPages: Record<string, { title: string; description: string }> = {
    "/": {
      title: "Cancel Your Solar Contract | Solar Freedom",
      description:
        "Trapped in a solar contract? Solar Freedom helps homeowners review their options, understand their rights, and connect with consumer protection attorneys. Free case review.",
    },
    "/blog": {
      title: "Solar Contract Cancellation Blog | Guides & Legal Tips | Solar Freedom",
      description:
        "In-depth guides on canceling solar contracts with Sunrun, GoodLeap, SunPower, Tesla Solar & more. Learn your rights, cancellation grounds, and next steps.",
    },
    "/how-it-works": {
      title: "How to Cancel a Solar Contract | Step-by-Step Process | Solar Freedom",
      description:
        "Learn how Solar Freedom reviews solar contracts, identifies legal grounds for cancellation, and connects homeowners with consumer protection attorneys. Free case review.",
    },
    "/solar-contract-help": {
      title: "Solar Contract Help | Legal Options to Cancel | Solar Freedom",
      description:
        "Review solar contract terms, rescission information, financing disputes, UCC filings, and records to gather before requesting an individual review.",
    },
    "/solar-panel-scam": {
      title: "Solar Panel Scam Warning Signs | Solar Freedom",
      description:
        "Learn the solar panel scam warning signs, from fake tax credit promises to hidden loan fees and liens. Free solar contract review.",
    },
    "/sunrun": {
      title:
        "Sunrun Solar Contract Review | Solar Freedom",
      description:
        "Review Sunrun contract terms, escalator provisions, complaint resources, and records to gather before requesting an individual case review.",
    },
    "/solar-exit-options": {
      title: "Solar Exit Options | How to Get Out of a Solar Contract",
      description:
        "Compare possible solar-contract paths and the documents, limits, and risks to review before deciding what to do next.",
    },
    "/solar-lien-removal": {
      title: "Solar Lien Removal | Remove a UCC-1 Solar Lien From Your Home",
      description:
        "Learn how a UCC-1 fixture filing may affect a home sale or refinance and which records to gather before requesting an individual review.",
    },
    "/solar-loan-help": {
      title: "Solar Loan Help | Fight Back Against Predatory Solar Loans",
      description:
        "Review solar loan terms, disclosures, dealer fees, and consumer resources. Available options depend on the documents and applicable law.",
    },
    "/selling-house-with-solar": {
      title: "Selling a House With Solar Panels & a Loan | Solar Freedom",
      description:
        "Review transfer, payoff, financing, and UCC-filing questions that may arise when selling a home with solar equipment.",
    },
    "/solar-contract-laws": {
      title: "Solar Contract Laws by State | Your Legal Rights",
      description:
        "Every state has different solar contract laws. Find your state's cooling-off period, consumer protection statutes, and cancellation rights.",
    },
    "/solar-companies": {
      title: "Solar Company Cancellation Guides 2026 | Sunrun, GoodLeap, SunPower & More",
      description:
        "How to cancel contracts with Sunrun, SunPower, Vivint Solar, Freedom Forever, GoodLeap, Sunnova, Tesla Solar & more. BBB ratings, complaint data, and legal grounds explained.",
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
    "/sitemap": {
      title: "Site Map — All Pages | Solar Freedom",
      description:
        "Browse the Solar Freedom website directory, including service, company, city, state-law, and blog pages.",
    },
    "/free-cancellation-letter": {
      title: "Free Solar Contract Cancellation Letter | Solar Freedom",
      description:
        "Download solar contract cancellation letter templates for cooling-off, pre-installation, and post-installation situations. Review your documents before sending anything.",
    },
    "/calculator": {
      title: "Solar Contract Cancellation Calculator | Solar Freedom",
      description:
        "Estimate remaining payments, escalator growth, and buyout questions on a solar lease, PPA, or loan. Results are informational, not a quote or legal advice.",
    },
    "/compare": {
      title: "Compare Solar Company Contract Issues | Solar Freedom",
      description:
        "Compare cancellation issues, complaint themes, and documents to gather for major solar companies before requesting an individual case review.",
    },
  };

  for (const [path, meta] of Object.entries(staticPages)) {
    map[path] = { ...meta, canonical: BASE_URL + path };
  }

  // ─── Company cancel pages ─────────────────────────────────────────────
  for (const company of companies) {
    const path = `/cancel-${company.slug}-solar-contract`;
    const desc = `Review ${company.name} solar contract terms, complaint resources, and records to gather before requesting an individual case review.`;
    map[path] = {
      title: `Cancel ${company.name} Solar Contract | Solar Freedom`,
      description: desc,
      canonical: BASE_URL + path,
      noindex: !isCompanyIndexed(company.slug),
    };
  }

  // ─── City pages ───────────────────────────────────────────────────
  // CTR-optimized meta descriptions for the 25 indexed cities
  const cityMetaOverrides: Record<string, { title: string; description: string }> = {
    'hartford-ct': {
      title: 'Cancel Solar Contract in Hartford, CT | Solar Freedom',
      description: 'Trapped in a Hartford solar contract? Review your cancellation rights under Connecticut law. Free case review — no upfront cost.',
    },
    'phoenix-az': {
      title: 'Cancel Solar Contract in Phoenix, AZ | Solar Freedom',
      description: 'Phoenix homeowners: review your Sunrun, SunPower, or Tesla Solar contract rights. Arizona consumer law may give you an exit. Free case review.',
    },
    'cincinnati-oh': {
      title: 'Cancel Solar Contract in Cincinnati, OH | Solar Freedom',
      description: 'Ohio\'s Consumer Sales Practices Act protects Cincinnati homeowners from deceptive solar sales. Review your cancellation options — free case review.',
    },
    'north-las-vegas-nv': {
      title: 'Cancel Solar Contract in North Las Vegas, NV | Solar Freedom',
      description: 'North Las Vegas homeowners: review your solar contract rights under Nevada law. Rocky Mountain Power rate changes may affect your case. Free review.',
    },
    'houston-tx': {
      title: 'Cancel Solar Contract in Houston, TX | Solar Freedom',
      description: 'Houston has 1,400+ solar complaints. Texas DTPA gives you strong cancellation rights. Review your Sunrun, Freedom Forever, or Sunnova contract — free.',
    },
    'greenville-sc': {
      title: 'Cancel Solar Contract in Greenville, SC | Solar Freedom',
      description: 'Duke Energy\'s Solar Choice tariff changes affect Greenville solar savings. Review your contract rights under SC Unfair Trade Practices Act — free.',
    },
    'denver-co': {
      title: 'Cancel Solar Contract in Denver, CO | Solar Freedom',
      description: 'Denver homeowners: Xcel Energy rate changes may have made your solar contract a bad deal. Review your Colorado cancellation rights — free case review.',
    },
    'san-antonio-tx': {
      title: 'Cancel Solar Contract in San Antonio, TX | Solar Freedom',
      description: 'San Antonio solar homeowners: CPS Energy\'s net metering rules affect your savings. Review your Texas DTPA rights — free case review.',
    },
    'little-rock-ar': {
      title: 'Cancel Solar Contract in Little Rock, AR | Solar Freedom',
      description: 'Little Rock homeowners: review your solar contract rights under Arkansas consumer law. Entergy rate changes may affect your case. Free review.',
    },
    'las-vegas-nv': {
      title: 'Cancel Solar Contract in Las Vegas, NV | Solar Freedom',
      description: 'Las Vegas solar homeowners: NV Energy\'s net metering changes may have cut your savings. Review your Nevada cancellation rights — free case review.',
    },
    'youngstown-oh': {
      title: 'Cancel Solar Contract in Youngstown, OH | Solar Freedom',
      description: 'Youngstown\'s lower solar irradiance means inflated projections are common. Review your Ohio CSPA rights and cancellation options — free.',
    },
    'west-valley-city-ut': {
      title: 'Cancel Solar Contract in West Valley City, UT | Solar Freedom',
      description: 'Rocky Mountain Power\'s reduced net metering hit Utah homeowners hard. Review your West Valley City solar contract rights — free case review.',
    },
    'shreveport-la': {
      title: 'Cancel Solar Contract in Shreveport, LA | Solar Freedom',
      description: 'Shreveport homeowners: SWEPCO and Cleco net metering terms affect solar savings. Review your Louisiana consumer rights — free case review.',
    },
    'santa-ana-ca': {
      title: 'Cancel Solar Contract in Santa Ana, CA | Solar Freedom',
      description: 'Santa Ana solar homeowners: California\'s NEM 3.0 changes may have impacted your savings. Review your cancellation rights — free case review.',
    },
    'new-haven-ct': {
      title: 'Cancel Solar Contract in New Haven, CT | Solar Freedom',
      description: 'New Haven homeowners: review your solar contract rights under Connecticut consumer law. Eversource rate changes may affect your case. Free review.',
    },
    'los-angeles-ca': {
      title: 'Cancel Solar Contract in Los Angeles, CA | Solar Freedom',
      description: 'LA homeowners: NEM 3.0 slashed solar export credits by 75%. Review your Sunrun, Tesla, or SunPower contract rights — free case review.',
    },
    'dallas-tx': {
      title: 'Cancel Solar Contract in Dallas, TX | Solar Freedom',
      description: 'Dallas homeowners: Texas DTPA gives you strong rights against deceptive solar sales. Review your Sunrun or Freedom Forever contract — free.',
    },
    'san-diego-ca': {
      title: 'Cancel Solar Contract in San Diego, CA | Solar Freedom',
      description: 'San Diego solar homeowners: SDG&E\'s NEM 3.0 changes may have made your contract a bad deal. Review your California rights — free case review.',
    },
    'austin-tx': {
      title: 'Cancel Solar Contract in Austin, TX | Solar Freedom',
      description: 'Austin Energy\'s solar program changes affect homeowners. Review your Texas DTPA cancellation rights against Sunrun, Tesla, or SunPower — free.',
    },
    'murfreesboro-tn': {
      title: 'Cancel Solar Contract in Murfreesboro, TN | Solar Freedom',
      description: 'Murfreesboro homeowners: review your solar contract rights under Tennessee consumer law. Middle Tennessee Electric rates affect your case. Free review.',
    },
    'miami-fl': {
      title: 'Cancel Solar Contract in Miami, FL | Solar Freedom',
      description: 'Miami solar homeowners: FPL net metering changes may affect your savings. Review your Florida solar contract cancellation rights — free case review.',
    },
    'nashville-tn': {
      title: 'Cancel Solar Contract in Nashville, TN | Solar Freedom',
      description: 'Nashville homeowners: NES rate changes and aggressive solar sales tactics have left many overpaying. Review your Tennessee rights — free case review.',
    },
    'san-francisco-ca': {
      title: 'Cancel Solar Contract in San Francisco, CA | Solar Freedom',
      description: 'SF homeowners: PG&E\'s NEM 3.0 cut solar export credits dramatically. Review your Sunrun, Tesla, or SunPower contract rights — free.',
    },
    'san-jose-ca': {
      title: 'Cancel Solar Contract in San Jose, CA | Solar Freedom',
      description: 'San Jose solar homeowners: PG&E\'s NEM 3.0 changes may have made your contract a bad deal. Review your California cancellation rights — free.',
    },
    'savannah-ga': {
      title: 'Cancel Solar Contract in Savannah, GA | Solar Freedom',
      description: 'Savannah homeowners: Georgia Power rate changes affect solar savings. Review your solar contract rights under Georgia consumer law — free case review.',
    },
  };

  for (const city of cities) {
    const path = `/cancel-solar-contract/${city.slug}`;
    const override = cityMetaOverrides[city.slug];
    map[path] = {
      title: override?.title ?? `Cancel Solar Contract in ${city.name}, ${city.stateCode} | Solar Freedom`,
      description: override?.description ?? `Review solar contract terms and consumer resources for ${city.name}, ${city.stateCode}. Options and timing depend on your agreement, facts, and jurisdiction.`,
      canonical: BASE_URL + path,
      noindex: !INDEXED_CITY_SLUGS.has(city.slug),
    };
  }

  // ─── State law pages ──────────────────────────────────────────
  for (const law of stateLaws) {
    const path = `/solar-contract-laws/${law.slug}`;
    // Use the data file's metaTitle/metaDescription (they are specific and compelling)
    const title = law.metaTitle
      ? `${law.metaTitle} | Solar Freedom`
      : `${law.state} Solar Contract Laws | Your Rights | Solar Freedom`;
    const description = `Review solar-contract consumer information for ${law.state}, including records to gather and official sources to verify. Options depend on facts and current law.`;
    map[path] = { title, description, canonical: BASE_URL + path, noindex: !isStateIndexed(law.slug) };
  }

  // ─── Blog posts ───────────────────────────────────────────
  for (const post of blogPosts) {
    const path = `/blog/${post.slug}`;
    map[path] = {
      title: `${post.metaTitle} | Solar Freedom`,
      description: suppressUnverifiedFirstPartyClaims(post.metaDescription),
      canonical: BASE_URL + path,
      noindex: !isCanonicalBlogIndexed(post.slug),
    };
  }

  _metaMap = map;
  console.log(`[SEO] Meta map built: ${Object.keys(map).length} URLs`);
  return map;
}
