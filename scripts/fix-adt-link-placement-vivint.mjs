#!/usr/bin/env node
/**
 * Repositions the ADT internal link inside the Vivint article.
 *
 * WHY: same defect as the Sunrun California page. The link landed as the very
 * first body paragraph, before the Vivint merger was explained, so it referred
 * to "the pattern" before any pattern existed. Moved to sit after the merger
 * section, where the reader has just learned that their counterparty changed
 * hands — the exact moment a comparison to another company's exit is useful.
 *
 * Idempotent.
 */
import fs from "node:fs";

const FILE = "client/src/data/blog-articles-batch10.ts";
const TARGET = "/blog/adt-solar-complaints";

const OLD = `      { type: 'p', content: 'The pattern is not unique to Vivint. When a parent company decides residential solar is no longer worth it, homeowners are left holding agreements with an entity that no longer wants the business — the [ADT Solar complaints and reviews](${TARGET}) page documents the clearest recent example and what homeowners did about it.' },\n`;

let src = fs.readFileSync(FILE, "utf8");

if (src.includes(OLD)) {
  src = src.replace(OLD, "");
  console.log("Removed misplaced paragraph.");
} else if (!src.includes(`(${TARGET})`)) {
  throw new Error("Neither the old block nor the link is present; refusing to guess.");
}

const NEW = `      { type: 'p', content: 'That change of hands is the part most homeowners were never told about, and it is not unique to Vivint. The [ADT Solar complaints and reviews](${TARGET}) page documents what happened when a parent company exited residential solar outright, and what the homeowners holding those agreements were left to do about it.' },\n`;

// Anchor: the H2 that follows the merger section.
const anchor = "{ type: 'h2', content: 'Top Vivint Solar Complaints in 2026' }";
let anchorIdx = src.indexOf(anchor);

if (anchorIdx === -1) {
  // Fall back: list the H2s so the next run can be corrected precisely.
  const slugIdx = src.indexOf("slug: 'vivint-solar-complaints-2026-cancellation-guide'");
  const j = src.indexOf("slug:", slugIdx + 10);
  const seg = src.slice(slugIdx, j === -1 ? src.length : j);
  const h2s = [...seg.matchAll(/\{ type: 'h2', content: ['"`]([^'"`]{0,90})/g)].map((m) => m[1]);
  console.error("Available H2s in this article:");
  h2s.forEach((h) => console.error("  - " + h));
  throw new Error("Anchor H2 not found");
}

if (!src.includes(`(${TARGET})`)) {
  src = src.slice(0, anchorIdx) + NEW + src.slice(anchorIdx);
  console.log("Inserted paragraph before the complaints section.");
}

fs.writeFileSync(FILE, src);
console.log(`Link occurrences now: ${(src.match(/\/blog\/adt-solar-complaints/g) || []).length}`);
