#!/usr/bin/env node
/**
 * Adds the Sunnova bankruptcy answer to the Sunnova cancellation article.
 *
 * WHY (Search Console, 1 Sep - 22 Nov 2026):
 *   /blog/how-to-cancel-sunnova-solar-contract-2026 is ranked position 2 for
 *   bankruptcy-intent queries it does not answer:
 *     "sunnova bankruptcy"                 3 impr, pos 2.0, 0 clicks
 *     "sunnova bankruptcy do i have to pay" 2 impr, pos 2.0, 0 clicks
 *     "sunstrong management"                2 impr, pos 3.0, 0 clicks
 *   A grep of the built page on 26 Nov 2026 found ZERO occurrences of
 *   "Chapter 11" and ZERO of "SunStrong", with only one incidental mention of
 *   "bankrupt". Position 2 for a question the page never answers is the same
 *   defect that was found and fixed on the Freedom Forever article, where the
 *   site's own company data contradicted its own article.
 *
 *   This is also the most commercially important unanswered question on the
 *   page. "Do I still have to pay" is what a Sunnova customer actually needs to
 *   know, and the honest answer protects them from the expensive mistake of
 *   stopping payments based on a headline.
 *
 * FACTS, all verified 26 Nov 2026 and recorded in
 * docs/company-status-verified-2026-11-26.md:
 *   - Sunnova filed Chapter 11 on 8 June 2025; Sunnova TEP Developer LLC
 *     petitioned 1 June 2025.
 *   - The sale closed in September 2025; a bondholder group that financed the
 *     Chapter 11 bought the operating business. A liquidating plan took effect
 *     14 November 2025.
 *   - SunStrong Management assumed servicing of most in-service systems.
 *   - Sunnova's own website states it "has ceased independent operations".
 *   - Payment terms did NOT change and customers were told to continue paying.
 *   - In-progress installations: SunStrong working with GoodLeap to complete
 *     some; GoodLeap support (888) 975-5436, sunnovasupport@goodleap.com.
 *   Source: https://www.sunnova.com/ (page last updated 2 November 2025) and
 *   the Kroll restructuring docket at https://restructuring.ra.kroll.com/Sunnova
 *
 * The section answers the payment question in the first sentence, because that
 * is the query. It does not promise an outcome, and it repeats the standing
 * warning not to stop payments, which every other page on the site carries.
 *
 * Idempotent.
 */
import fs from "node:fs";

const FILE = "client/src/data/blog-articles-batch9.ts";
const MARKER = "Sunnova's bankruptcy changed who services your account, not what you owe";

let src = fs.readFileSync(FILE, "utf8");

if (src.includes(MARKER)) {
  console.log("Already applied — nothing to do.");
  process.exit(0);
}

const slugIdx = src.indexOf("how-to-cancel-sunnova-solar-contract-2026");
if (slugIdx === -1) throw new Error("slug not found");

const block = `      { type: 'h2', content: "Do you still have to pay Sunnova after the bankruptcy?" },
      { type: 'p', content: "Direct answer: yes. Sunnova's bankruptcy changed who services your account, not what you owe. The company filed Chapter 11 on 8 June 2025, the sale of the operating business closed in September 2025, and a liquidating plan took effect on 14 November 2025. Sunnova's own website now states that it has ceased independent operations. None of that cancelled a single customer balance. Payment terms were not changed and customers were told to continue paying." },
      { type: 'p', content: "What did change is the name on the other end. SunStrong Management assumed servicing of most in-service systems. If your statements, portal, or support calls now route through SunStrong rather than Sunnova, that is why. The obligation itself is the same agreement you signed, with the same escalator, the same transfer terms, and the same payoff schedule." },
      { type: 'callout', content: "Do not stop paying because a company filed for bankruptcy. A bankruptcy filing by the counterparty does not suspend your obligation, and a missed payment becomes a delinquency on your credit record regardless of how the servicer is named. If you believe the agreement itself was misrepresented, that is a separate dispute to raise in writing while payments continue." },
      { type: 'h2', content: "What happens to an installation that was still in progress?" },
      { type: 'p', content: "This is where the bankruptcy genuinely matters. In-progress installations were the part of the business most exposed, because an unfinished system is an unsecured claim rather than a serviceable account. SunStrong has been working with GoodLeap to complete some of those projects. GoodLeap support can be reached at (888) 975-5436 or sunnovasupport@goodleap.com. If your system was never completed, gather the order documents, any permit or inspection record, and a dated log of every contact, because the question of who owes you completion depends on which entity holds your file." },
      { type: 'p', content: "The practical consequence for a cancellation or transfer request is that you now have to establish which entity holds the account before you can make a demand of anyone. The records checklist below applies either way, and it matters more now than it did before the restructuring, not less." },
`;

const anchor = "{ type: 'h2', content: 'If the company changes or service stops' }";
const anchorIdx = src.indexOf(anchor, slugIdx);
if (anchorIdx === -1) throw new Error("anchor heading not found");

src = src.slice(0, anchorIdx) + block + src.slice(anchorIdx);

// --- FAQ: put the bankruptcy/payment question first, retire the weakest ------
const NEW_FAQ =
  "{ q: 'Do I still have to pay Sunnova after the bankruptcy?', a: \"Yes. Sunnova's Chapter 11, filed 8 June 2025, changed who services your account, not what you owe. The operating business was sold in September 2025, a liquidating plan took effect on 14 November 2025, and Sunnova's own site now states it has ceased independent operations \\u2014 but payment terms did not change and customers were told to continue paying. SunStrong Management now services most in-service systems. Do not stop paying based on a bankruptcy headline; a missed payment becomes a delinquency regardless of who the servicer is.\" },\n      ";

const faqIdx = src.indexOf("faq: [", slugIdx);
if (faqIdx === -1) throw new Error("faq array not found");
const insertAt = faqIdx + "faq: [".length;
src = src.slice(0, insertAt) + "\n      " + NEW_FAQ + src.slice(insertAt);

fs.writeFileSync(FILE, src);
console.log("Added the Sunnova bankruptcy section and payment FAQ.");
