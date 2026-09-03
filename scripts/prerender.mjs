/**
 * Static Pre-rendering Script
 *
 * Runs after `vite build` to generate individual HTML files for every URL.
 * Each file gets the correct title, description, and canonical tag baked in.
 *
 * WHY: Cloudflare (used by Manus hosting) caches HTML at the edge and ignores
 * server-side Cache-Control headers. By generating static HTML files at build
 * time, we ensure every page has the correct meta tags without needing server
 * injection at runtime.
 *
 * CRITICAL LESSONS LEARNED (do not remove this comment):
 * 1. The injectMeta function MUST remove all existing canonical tags and append
 *    a new one — NOT use .attr() which fails silently if the element is missing.
 * 2. Blog posts MUST be included in the meta map — the prerender script must
 *    read all batch files and extract slugs/metaTitle/metaDescription.
 * 3. The index.html template has a hardcoded canonical pointing to / — this
 *    MUST be replaced for every non-homepage URL or Google will treat all pages
 *    as duplicates of the homepage (causing "Duplicate without user-selected canonical"
 *    in GSC and preventing indexing of 300+ pages).
 * 4. When adding new blog batch files, MUST update loadBlogData() to include them.
 * 5. City pages need state codes in titles for geo-targeting (e.g., "Phoenix, AZ").
 *
 * OUTPUT: dist/public/cancel-solar-contract/phoenix-az/index.html, etc.
 *
 * See docs/lessons-learned/01-spa-soft-404-seo.md for full context.
 */

import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.resolve(ROOT, "dist", "public");
const BASE_URL = "https://breakyoursolarcontract.com";
