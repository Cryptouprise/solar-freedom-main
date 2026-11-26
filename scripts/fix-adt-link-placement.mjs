#!/usr/bin/env node
/**
 * Repositions the ADT internal link added by fix-adt-internal-links.mjs.
 *
 * WHY: that script appended after the FIRST "}," in the content array, which in
 * this article is before the opening body paragraph — so the sentence began
 * with "If what you actually want is a sense of how these failures compare"
 * before any failures had been described. A dangling reference reads as spam to
 * a human and gives a crawler no topical context for the anchor. Moved to sit
 * directly after the "Common Sunrun Complaints" section, where the reader has
 * just read a list of failures and the comparison is the natural next thought.
 *
 * Idempotent: removes the old block then inserts the corrected one; running
 * twice leaves exactly one link.
 */
import fs from "node:fs";

const FILE = "client/src/data/blog-articles-batch6.ts";
const SLUG = "sunrun-complaints-california";
const TARGET = "/blog/adt-solar-complaints";

const OLD = `      { type: 'p', content: 'If what you actually want is a sense of how these failures compare across installers, the [ADT Solar complaints and reviews](${TARGET}) page lays out what happened when a national security company exited residential solar entirely — and what that meant for the homeowners holding its contracts.' },\n`;

let src = fs.readFileSync(FILE, "utf8");

// 1. Remove the misplaced paragraph if present.
if (src.includes(OLD)) {
  src = src.replace(OLD, "");
  console.log("Removed misplaced paragraph.");
} else if (!src.includes(`(${TARGET})`)) {
  throw new Error("Neither the old block nor the link is present; refusing to guess.");
}

// 2. Insert after the complaints section: anchor on the H2 that follows it.
const NEW =
  `      { type: 'p', content: 'Those complaints are not unique to Sunrun. The [ADT Solar complaints and reviews](${TARGET}) page documents what happened when a national security company exited residential solar entirely, and what the homeowners holding those agreements were left to do about it.' },\n`;

const anchor = "{ type: 'h2', content: `The Legal Shield: California Consumer Protection Laws` }";
const anchorIdx = src.indexOf(anchor);

if (anchorIdx === -1) {
  throw new Error("Anchor H2 not found: " + anchor);
}

if (!src.includes(`(${TARGET})`)) {
  src = src.slice(0, anchorIdx) + NEW + src.slice(anchorIdx);
  console.log("Inserted paragraph before 'The Legal Shield' section.");
} else {
  console.log("Link already present in the correct region; no insert needed.");
}

fs.writeFileSync(FILE, src);

const count = (src.match(new RegExp(TARGET.replace(/\//g, "\\/"), "g")) || []).length;
console.log(`Link occurrences in file now: ${count}`);
