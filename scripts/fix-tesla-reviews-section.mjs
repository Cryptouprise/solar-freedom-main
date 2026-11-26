#!/usr/bin/env node
/**
 * Adds a reviews / customer-service section to the Tesla Solar article.
 *
 * WHY (Search Console, 1 Sep - 22 Nov 2026):
 *   /blog/tesla-solar-solarcity-complaints-cancel-2026 earns impressions on
 *   review-and-support intent that the page has no section for:
 *     "solarcity reviews"           8 impr, pos 17.0
 *     "solarcity customer service"  5 impr, pos 19.6
 *     "solarcity lease"             4 impr, pos 26.5
 *   The article was all process — agreement types, transfers, UCC-1 filings —
 *   and never answered "what do people actually say about them" or "how do I
 *   reach them". Both are question-shaped, so both want a direct answer.
 *
 * FACTS USED, all verified 26 Nov 2026:
 *   - Tesla's own Customer Support page states: for Powerwall and solar system
 *     support call (877) 798-3752, select option 4 then option 2. Vehicle
 *     support on the same number runs Monday-Saturday 4 AM to 9 PM PT.
 *     Source: https://www.tesla.com/support/customer-support
 *   - Tesla's contact guide directs app users to tap Support on the energy
 *     system home screen.
 *     Source: https://www.tesla.com/support/energy/more/additional-support/contact-us
 *   - BBB profile for Tesla Energy (Solar Energy Development, Tucson AZ), read
 *     26 Nov 2026: rated F; 21 complaints filed in the three-year reporting
 *     window; all 21 recorded as failure to respond. Not BBB accredited.
 *     Source: https://www.bbb.org/us/az/tucson/profile/solar-energy-development/tesla-energy-1286-20124934
 *
 * The section deliberately does not state a "star rating" or a review count,
 * because BBB publishes neither on that profile. It states the rating letter,
 * the complaint count and the non-response count, which is what is actually on
 * the page.
 *
 * Idempotent.
 */
import fs from "node:fs";

const FILE = "client/src/data/blog-articles-batch10.ts";
const SLUG = "tesla-solar-solarcity-complaints-cancel-2026";
const MARKER = "What SolarCity and Tesla Solar Reviews Actually Show";

let src = fs.readFileSync(FILE, "utf8");

if (src.includes(MARKER)) {
  console.log("Already present — nothing to do.");
  process.exit(0);
}

const slugIdx = src.indexOf(`slug: '${SLUG}'`);
if (slugIdx === -1) throw new Error(`slug not found: ${SLUG}`);

// Anchor: insert immediately before the closing "Questions This Guide Cannot
// Answer" section so the reviews/contact content sits after all process steps
// but before the disclaimer.
const anchor = "{ type: 'h2', content: 'Questions This Guide Cannot Answer' }";
const anchorIdx = src.indexOf(anchor, slugIdx);
if (anchorIdx === -1) throw new Error("anchor section not found");

const block = `{ type: 'h2', content: 'What SolarCity and Tesla Solar Reviews Actually Show' },
      { type: 'p', content: 'Two questions sit underneath most SolarCity searches, and they deserve separate answers. The first is what people actually say about the company. The second is how to reach a human when something is wrong.' },
      { type: 'p', content: 'On the first, the clearest public record is the Better Business Bureau profile for Tesla Energy, the solar and energy development entity. Read on 26 November 2026, it carried an F rating with 21 complaints filed in the three-year reporting window, and BBB recorded failure to respond on all 21. The profile is not BBB accredited. That non-response count is the detail worth pausing on: it measures the company\\'s engagement with complaints, not the number of complaints alone.' },
      { type: 'stat-block', stats: [
        { value: 'F', label: 'BBB rating, Tesla Energy solar profile' },
        { value: '21', label: 'Complaints in 3-year window' },
        { value: '21', label: 'Recorded as failure to respond' },
        { value: 'Not accredited', label: 'BBB accreditation status' },
      ] },
      { type: 'p', content: 'Reviews written by former SolarCity customers carry a recurring theme worth understanding before you call anyone. The systems are frequently reported as working fine while the administrative side is the problem: billing that does not match the agreement, transfers that stall during a home sale, service appointments that slip, and difficulty reaching a person who can actually change an account. That distinction matters because it tells you which evidence to gather. A production complaint needs monitoring data and utility bills. An administrative complaint needs statements, your agreement, and a dated record of every contact.' },
      { type: 'h2', content: 'How to Reach Tesla Solar Customer Service' },
      { type: 'p', content: 'Tesla publishes one number for energy products. On its Customer Support page, read 26 November 2026, Tesla directs Powerwall and solar system owners to call (877) 798-3752 and select option 4, then option 2. The same number handles vehicle support, so the option sequence is what routes you to energy rather than a car.' },
      { type: 'p', content: 'If your system is operating, Tesla\\'s contact guide points to the Tesla app first: open the energy system home screen, tap Support at the bottom, then use the contact button on the Support screen. Third-party-installed systems may display the original installer\\'s contact information instead of Tesla\\'s, which is a useful diagnostic in itself — if the app shows another company, that company may still own the service obligation.' },
      { type: 'callout', content: 'Whichever route you use, ask for the issue, the request, a case number and the next step in writing, then keep the reply. A support conversation you cannot produce later is worth very little in a dispute. This is the single habit that separates homeowners who get an account corrected from those who make the same call five times.' },
      { type: 'p', content: 'Before you call, have the agreement type in hand. A lease, a PPA, a MyPower loan, a Tesla loan, a third-party loan, a subscription and a cash purchase all route differently, and the person on the line will ask which one you have. If you are not certain, the order agreement and your account records settle it.' },
      `;

src = src.slice(0, anchorIdx) + block + src.slice(anchorIdx);
fs.writeFileSync(FILE, src);
console.log("Inserted reviews + customer service section into", SLUG);
