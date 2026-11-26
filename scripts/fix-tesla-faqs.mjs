#!/usr/bin/env node
/**
 * Re-points the Tesla article FAQ set at the queries the page actually earns.
 *
 * WHY: client/src/pages/BlogPost.tsx renders and marks up only the first
 * MAX_FAQ_ITEMS = 5 entries, positionally. The Tesla article already had 5, so
 * adding the two review/contact questions would have made them invisible — the
 * exact failure mode of "I added an FAQ and nothing changed". The cap forces a
 * choice, so the two questions with the weakest measured demand are retired and
 * the two with real impressions take their place.
 *
 * Measured demand per FAQ (Search Console, 1 Sep - 22 Nov 2026, this URL):
 *   RETIRE "How does a Tesla solar agreement transfer when a home is sold?"
 *     nearest query "tesla solar lease transfer" = 1 impression, pos 40.
 *     The full transfer path is already covered in the body section
 *     "If You Are Selling or Refinancing the Home".
 *   RETIRE "What should I do if I think service, billing, or sales
 *     information is wrong?" = 0 matching queries; generic, and the new
 *     callout in the body now carries the "get it in writing" advice.
 *
 *   ADD "What do Tesla Solar and SolarCity reviews actually say?"
 *     queries: "solarcity reviews" 8 impr pos 17.0
 *   ADD "How do I contact Tesla Solar customer service?"
 *     queries: "solarcity customer service" 5 impr pos 19.6
 *
 * The two new answers state only what was verified on 26 Nov 2026 from Tesla's
 * own support pages and the BBB profile — see fix-tesla-reviews-section.mjs for
 * the source URLs. No star rating is claimed because BBB publishes none there.
 *
 * Idempotent.
 */
import fs from "node:fs";

const FILE = "client/src/data/blog-articles-batch10.ts";
const SLUG = "tesla-solar-solarcity-complaints-cancel-2026";

let src = fs.readFileSync(FILE, "utf8");

if (src.includes("What do Tesla Solar and SolarCity reviews actually say?")) {
  console.log("Already applied — nothing to do.");
  process.exit(0);
}

const slugIdx = src.indexOf(`slug: '${SLUG}'`);
if (slugIdx === -1) throw new Error(`slug not found: ${SLUG}`);

// --- retire the two weakest FAQs -------------------------------------------
const RETIRE = [
  "{ q: 'How does a Tesla solar agreement transfer when a home is sold?', a: 'Tesla’s official process differs by contract type. The seller generally initiates the request, the assuming party reviews and signs the transfer documents, and closing confirmation is required. Begin early and confirm the agreement-specific requirements with Tesla and the title or escrow team.' },",
  "{ q: 'What should I do if I think service, billing, or sales information is wrong?', a: 'Preserve the agreement, billing history, support requests, service records, proposal, production information, and written communications. Use Tesla’s support path and any agreement-specific dispute procedure; do not change payments or other obligations based only on general information.' },",
];

let retired = 0;
for (const line of RETIRE) {
  if (src.includes(line)) {
    src = src.replace(line + "\n", "");
    retired += 1;
  } else {
    console.warn("WARN: could not find FAQ to retire:", line.slice(0, 60));
  }
}

// --- add the two demand-backed FAQs at the front ---------------------------
const NEW_FAQS = `{ q: 'What do Tesla Solar and SolarCity reviews actually say?', a: 'The clearest public record is the Better Business Bureau profile for Tesla Energy, which on 26 November 2026 carried an F rating with 21 complaints in the three-year window, all 21 recorded as failure to respond, and no BBB accreditation. Customer reviews of legacy SolarCity systems more often describe administrative problems — billing that does not match the agreement, stalled transfers, slow service — than failed equipment. That distinction tells you which records to gather.' },
      { q: 'How do I contact Tesla Solar customer service?', a: 'Tesla publishes one number for energy products: call (877) 798-3752 and select option 4, then option 2. The same number handles vehicle support, so the option sequence is what routes you to solar. If your system is operating, Tesla directs you to the Tesla app first — open the energy system home screen, tap Support at the bottom, then use the contact button. Third-party-installed systems may show the original installer instead.' },
      `;

const faqIdx = src.indexOf("faq: [", slugIdx);
if (faqIdx === -1) throw new Error("faq array not found");
const insertAt = faqIdx + "faq: [".length;
src = src.slice(0, insertAt) + "\n      " + NEW_FAQS + src.slice(insertAt);

fs.writeFileSync(FILE, src);
console.log(`Retired ${retired} FAQ(s); added 2 review/contact FAQs.`);
