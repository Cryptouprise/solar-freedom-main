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

  // ─── Static pages ────────────────────────────────────────────
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
