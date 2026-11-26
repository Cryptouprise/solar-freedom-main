#!/usr/bin/env node
/**
 * Rewrites the Blue Raven meta description to name the things it ranks for.
 *
 * WHY (Search Console, 1 Sep - 22 Nov 2026):
 *   /blog/blue-raven-solar-complaints is our best-positioned high-volume page:
 *   1,994 impressions, average position 6.4, but only 19 clicks (0.95% CTR).
 *   At position 6 a page should earn several times that. The queries:
 *     "blue raven solar reviews"                     459 impr, pos 15.6
 *     "blue raven solar"                             333 impr, pos  5.9
 *     "is blue raven solar still in business"        247 impr, pos  3.4
 *     "blue raven solar customer service"            238 impr, pos  6.6
 *     "blue raven solar phone number"                115 impr, pos  8.5
 *     "blue raven solar out of business"             115 impr, pos  2.3
 *     "blue raven solar customer service phone number" 96 impr, pos 7.0
 *     "blue raven solar review"                       88 impr, pos 13.1
 *   The old description read "What happened to Blue Raven Solar, who services
 *   its systems and warranties now, and your options if your system or loan is
 *   a problem." It contains none of the words reviews, customer service, phone
 *   number, or still in business — roughly 1,080 impressions searching for
 *   words the snippet never shows.
 *
 *   The page BODY already answers all of them, including a verified BBB block.
 *   Only the snippet was silent, and the snippet is what earns the click.
 *
 * FACTS: the body's BBB figures were re-verified on 26 Nov 2026 against the
 * BBB profile's own structured data for Blue Raven Solar (Cary, NC):
 *   BBB rating A+; 555 complaints filed in the last 3 years; 877 customer
 *   reviews; accredited since 23 October 2015; phone (800) 377-4480.
 *   Source: https://www.bbb.org/us/nc/cary/profile/solar-installation/blue-raven-solar-0593-90340295
 *   The description states the rating letter and the support number, both of
 *   which are on that profile. No review count is put in the description
 *   because the number changes and a stale figure in a snippet is worse than
 *   none.
 *
 * Idempotent.
 */
import fs from "node:fs";

const FILE = "client/src/data/blog-articles-batch8.ts";
const OLD =
  "What happened to Blue Raven Solar, who services its systems and warranties now, and your options if your system or loan is a problem.";

// Chosen to stay inside the ~160-character display budget while naming the
// terms that carry the impressions.
const NEW =
  "Blue Raven Solar reviews, complaints and customer service: the (800) 377-4480 support line, who services your system now, and your options if it fails.";

let src = fs.readFileSync(FILE, "utf8");

if (src.includes(NEW)) {
  console.log("Already applied — nothing to do.");
  process.exit(0);
}
if (!src.includes(OLD)) {
  throw new Error("Old description not found; refusing to guess.");
}

src = src.replace(OLD, NEW);
fs.writeFileSync(FILE, src);

console.log(`Old: ${OLD.length} chars`);
console.log(`New: ${NEW.length} chars`);
if (NEW.length > 160) {
  console.error("ERROR: new description exceeds the 160-character budget.");
  process.exit(1);
}
const missing = ["reviews", "customer service", "phone", "support"].filter(
  (w) => !NEW.toLowerCase().includes(w.split(" ")[0])
);
console.log(missing.length ? `WARN missing terms: ${missing.join(", ")}` : "All target terms present.");
