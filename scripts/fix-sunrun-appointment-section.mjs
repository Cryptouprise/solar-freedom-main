#!/usr/bin/env node
/**
 * Adds a "cancel your Sunrun appointment" section to the Sunrun cancellation article.
 *
 * WHY (Search Console, 1 Sep - 22 Nov 2026):
 *   /blog/sunrun-solar-contract-cancellation-2026 is our highest-volume page:
 *   2,007 impressions across 138 queries at average position 10.4, and only 11
 *   clicks. A distinct cluster inside it is people trying to stop a VISIT, not
 *   a contract:
 *     "how to cancel sunrun appointment"          85 impr, pos 9.0, 0 clicks
 *     "cancel sunrun appointment"                 71 impr, pos 9.9, 0 clicks
 *     "how to cancel sunrun appointment online"   51 impr, pos 9.2, 0 clicks
 *   That is roughly 207 impressions for a question the page never answers. A
 *   grep of the built page on 26 Nov 2026 returned ZERO occurrences of the word
 *   "appointment" anywhere in it. The page is being matched on the surrounding
 *   cancellation context, which caps how high it can rank for the appointment
 *   queries and guarantees the snippet will not match.
 *
 *   This matters commercially as well as for rankings: someone with an
 *   installer visit scheduled tomorrow is the most time-pressured visitor the
 *   site gets, and until now the page had nothing for them.
 *
 * PLACEMENT: before "How do you evaluate a cancellation fee or buyout quote?",
 * because the appointment question sits between "what happens after
 * installation" and the money questions in the reader's own sequence.
 *
 * CONTENT RULE: the section does not invent a phone menu or a web form path.
 * It states the one thing that is verifiable and useful — that stopping a visit
 * and cancelling a contract are different actions, that the appointment route
 * runs through the account, and that a cancelled visit does not cancel the
 * agreement — then routes the reader to the documented notice requirement,
 * which is what the rest of the article is built on.
 *
 * Also adds a matching FAQ at the front, since BlogPost.tsx renders only the
 * first five of the seven existing FAQs and the appointment question now has
 * more measured demand than "Can I sell my house with a Sunrun agreement?".
 *
 * Idempotent.
 */
import fs from "node:fs";

const FILE = "client/src/data/blog-articles-batch9.ts";
const MARKER = "How do you cancel or reschedule a Sunrun appointment?";

let src = fs.readFileSync(FILE, "utf8");

if (src.includes(MARKER)) {
  console.log("Already applied — nothing to do.");
  process.exit(0);
}

const slugIdx = src.indexOf('"sunrun-solar-contract-cancellation-2026"');
if (slugIdx === -1) throw new Error("slug not found");

const block = `      { type: "h2", content: "How do you cancel or reschedule a Sunrun appointment?" },
      { type: "p", content: "Stopping an installer visit and cancelling a contract are two different actions, and treating one as the other is how homeowners end up surprised. Cancelling the appointment does not cancel the agreement. The obligation continues whether or not anyone comes to the house, and in most agreements the clock on a cancellation window keeps running from the signing or notice date, not from the visit." },
      { type: "p", content: "Sunrun schedules visits through your account, so the appointment route starts there. If a visit was booked by a sales representative who came to your door, the same account should still show it once the order exists. Rescheduling is usually straightforward; cancelling the visit outright while keeping the contract in place is a narrower request, and the representative handling it may try to resolve the underlying objection rather than simply close the appointment." },
      { type: "callout", content: "If your goal is to end the agreement rather than delay a visit, the appointment is not the lever. Send written notice under the notice clause in your own agreement, keep proof of how and when you sent it, and treat the visit question separately. This page covers the notice requirement in the sections above." },
      { type: "p", content: "If you are inside a statutory cancellation window and a visit is scheduled, say so explicitly in writing and cite the deadline. A visit that happens after you have sent valid notice does not extend the window, but a paper trail showing you told them to stop makes the sequence unambiguous if it is disputed later." },
`;

const anchor = '{ type: "h2", content: "How do you evaluate a cancellation fee or buyout quote?" }';
const anchorIdx = src.indexOf(anchor, slugIdx);
if (anchorIdx === -1) throw new Error("anchor heading not found");

src = src.slice(0, anchorIdx) + block + src.slice(anchorIdx);

// --- FAQ: add the appointment question, retire the lowest-demand one --------
const RETIRE =
  '{ q: "Can I sell my house with a Sunrun agreement?", a:';
const retireIdx = src.indexOf(RETIRE, slugIdx);
if (retireIdx !== -1) {
  const end = src.indexOf("},\n", retireIdx);
  if (end !== -1) {
    src = src.slice(0, retireIdx) + src.slice(end + 3);
    console.log("Retired the home-sale FAQ (its own page covers that topic).");
  }
}

const NEW_FAQ =
  '{ q: "How do I cancel a Sunrun appointment?", a: "Cancel it through your Sunrun account, where visits are scheduled. Be clear about which you want: rescheduling a visit is routine, and cancelling the visit while keeping the agreement is a narrower request. Critically, cancelling an appointment does not cancel the contract, and any cancellation window keeps running from the signing or notice date rather than from the visit date. If your goal is to end the agreement, send written notice under the notice clause in your agreement instead." },\n      ';

const faqIdx = src.indexOf("faq: [", slugIdx);
if (faqIdx === -1) throw new Error("faq array not found");
const insertAt = faqIdx + "faq: [".length;
src = src.slice(0, insertAt) + "\n      " + NEW_FAQ + src.slice(insertAt);

fs.writeFileSync(FILE, src);
console.log("Added the appointment section and FAQ.");
