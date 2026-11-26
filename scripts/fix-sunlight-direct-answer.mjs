#!/usr/bin/env node
/**
 * Adds a direct yes/no first answer to the Sunlight Financial article.
 *
 * WHY: Search Console (1 Sep - 22 Nov 2026) shows the page earning 47 impressions
 * at average position 12.3 for "is sunlight financial legit" and 76 impressions at
 * 16.4 for "sunlight financial reviews" with ZERO clicks on either. The article
 * opened with a soft narrative paragraph ("For many homeowners, the promise of
 * clean energy...") so neither the page nor any excerpt of it contained a direct
 * answer to the question being asked. Question-intent queries are answered by a
 * short declarative sentence near the top, not by atmosphere.
 *
 * Idempotent: running twice does not duplicate the block.
 */
import fs from "node:fs";

const FILE = "client/src/data/blog-articles-batch8.ts";
const SLUG = "sunlight-financial-solar-loan-complaints";
const MARKER = "Short answer: Sunlight Financial is a real, licensed solar lender";

let src = fs.readFileSync(FILE, "utf8");

if (src.includes(MARKER)) {
  console.log("Already present — nothing to do.");
  process.exit(0);
}

// Locate the article block by slug, then the first content array entry inside it.
const slugIdx = src.indexOf(`slug: "${SLUG}"`);
if (slugIdx === -1) throw new Error(`slug not found: ${SLUG}`);

const contentIdx = src.indexOf("content: [", slugIdx);
if (contentIdx === -1) throw new Error("content array not found");

// Insert the direct answer BEFORE the first h2 so it is the first thing a reader
// (and a snippet extractor) sees.
const insertAt = contentIdx + "content: [".length;

const block = `
      {
        type: "callout",
        content:
          "Short answer: Sunlight Financial is a real, licensed solar lender — not a scam — but it is not a company to trust blindly. It filed a prepackaged Chapter 11 on 30 October 2023, emerged under new ownership on 6 December 2023, and still services solar loans today. The complaints are about the terms, not the company's existence.",
      },
      {
        type: "p",
        content:
          "That distinction matters more than it sounds. Because Sunlight Financial still exists and still holds the note, the loan does not disappear just because the original installer misled you. Nothing about the bankruptcy filing cancelled a single customer balance. What it did change is who you are dealing with: servicing moved after the restructuring, and the entity collecting your payment today may not be the one named on your original paperwork. Before you argue about anything else, confirm who actually owns your loan and who is reporting it to the credit bureaus — that is the fact that determines every option below.",
      },`;

src = src.slice(0, insertAt) + block + src.slice(insertAt);

fs.writeFileSync(FILE, src);
console.log("Inserted direct yes/no answer into", SLUG);
