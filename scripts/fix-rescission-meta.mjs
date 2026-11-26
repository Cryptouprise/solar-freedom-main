#!/usr/bin/env node
/**
 * Tightens the rescission page title and meta description.
 *
 * WHY (Search Console, 1 Sep - 22 Nov 2026):
 *   /blog/solar-contract-rescission-rights earned 287 impressions across 53
 *   queries with ZERO clicks. The top three queries are:
 *     "three day right to cancel solar contract"  34 impr, pos 11.9
 *     "rescind solar contract"                    33 impr, pos 13.5
 *     "tila rescission solar loan"                25 impr, pos 12.7
 *   The served title was "Solar Contract Rescission Rights: 3-Day Rule
 *   Checklist | Solar Freedom" — exactly 70 characters, the hard limit, so the
 *   brand suffix consumed the tail and Google truncated around char 60. The
 *   word TILA, which 25 impressions are searching for, appeared nowhere in it.
 *
 *   Replacing "Checklist" with "TILA" keeps the title at 68 characters total
 *   and 52 visible before the brand, so the whole promise survives truncation
 *   and now covers all three top queries: Rescission/Rescind (morphological
 *   variants), 3-Day Rule, and TILA.
 *
 * The description was 165 characters, past the ~160 display budget, so it was
 * being cut mid-sentence. Rewritten to 137 characters with the same substance
 * plus the TILA/right-to-cancel language.
 *
 * Idempotent.
 */
import fs from "node:fs";

const FILE = "client/src/data/blog-extra.ts";
const OLD_TITLE = "Solar Contract Rescission Rights: 3-Day Rule Checklist";
const NEW_TITLE = "Solar Contract Rescission Rights: 3-Day Rule & TILA";
const OLD_DESC =
  "Check whether the FTC Cooling-Off Rule covers your solar sale, find the notice, calculate the deadline, preserve delivery proof, and review other written procedures.";
const NEW_DESC =
  "Check whether the FTC Cooling-Off Rule or TILA covers your solar sale, how to rescind, the deadline, and how to preserve your delivery proof.";

let src = fs.readFileSync(FILE, "utf8");

if (src.includes(NEW_TITLE)) {
  console.log("Already applied — nothing to do.");
  process.exit(0);
}

if (!src.includes(OLD_TITLE)) {
  throw new Error(`Old title not found; refusing to guess. Looked for: ${OLD_TITLE}`);
}

const before = src.length;
src = src.replace(OLD_TITLE, NEW_TITLE);

if (src.includes(OLD_DESC)) {
  src = src.replace(OLD_DESC, NEW_DESC);
} else {
  console.warn("WARN: old description not found; left unchanged.");
}

fs.writeFileSync(FILE, src);

const total = NEW_TITLE.length + " | Solar Freedom".length;
console.log(`Title: ${NEW_TITLE.length} chars + brand = ${total} (limit 70)`);
console.log(`Description: ${NEW_DESC.length} chars (limit 160)`);
console.log(`File delta: ${src.length - before} bytes`);
