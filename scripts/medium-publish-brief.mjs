/**
 * Medium publishing brief generator.
 *
 * The hand-maintained Medium instructions drifted badly out of sync with the
 * site: after the August 2026 spam recovery, 7 of 11 phrases in its internal
 * link table pointed at pages that are noindex, 301-redirecting or 404, and
 * more than half its publishing queue named articles that are no longer
 * indexable. Every one of those links wasted a Medium backlink and sent readers
 * to a suppressed page.
 *
 * This script derives the queue and the link map from the same source of truth
 * the sitemap and robots tags use — shared/index-eligibility.json plus the
 * redirect ledger and trust quarantine — so a brief can never name a page the
 * site does not want indexed. It self-checks every URL it emits.
 *
 * Usage:
 *   node scripts/medium-publish-brief.mjs --list          # the real queue
 *   node scripts/medium-publish-brief.mjs --list --json   # machine-readable
 *   node scripts/medium-publish-brief.mjs <slug>          # paste-ready brief
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://breakyoursolarcontract.com";

/** The second domain that actually resolves. cancelyoursolar.co does not. */
const SECOND_DOMAIN = "https://solarcomplaints.co";
const YOUTUBE = "https://www.youtube.com/@BreakYourSolarContract";
const PHONE = "904-921-4971";

const eligibility = JSON.parse(
  fs.readFileSync(path.resolve(ROOT, "shared/index-eligibility.json"), "utf-8"),
);
const redirects = JSON.parse(
  fs.readFileSync(path.resolve(ROOT, "shared/seo-redirects.json"), "utf-8"),
);

const REDIRECTED_BLOG = new Set(
  Object.keys(redirects.blog).map(p => p.replace(/^\/blog\//, "")),
);
const REDIRECTED_PUBLIC = new Set(Object.keys(redirects.public));
const QUARANTINED = new Set((eligibility.trustQuarantine?.paths ?? []).map(e => e.path));
const RETIRED = new Set(eligibility.retiredPublicPaths ?? []);

/** True only for pages the site actually wants indexed and served without a hop. */
function isPublishable(pagePath) {
  if (REDIRECTED_PUBLIC.has(pagePath) || QUARANTINED.has(pagePath) || RETIRED.has(pagePath)) {
    return false;
  }
  if (pagePath.startsWith("/blog/")) {
    const slug = pagePath.slice("/blog/".length);
    return eligibility.blogSlugs.includes(slug) && !REDIRECTED_BLOG.has(slug);
  }
  if (pagePath.startsWith("/cancel-solar-contract/")) {
    return eligibility.citySlugs.includes(pagePath.slice("/cancel-solar-contract/".length));
  }
  return true;
}

const publishableArticles = eligibility.blogSlugs
  .filter(slug => isPublishable(`/blog/${slug}`))
  .sort();

const publishableCities = eligibility.citySlugs
  .filter(slug => isPublishable(`/cancel-solar-contract/${slug}`))
  .sort();

/**
 * Anchor phrase -> destination. Every destination is checked against
 * isPublishable() before a brief is emitted, so a retargeted or retired page
 * fails loudly here instead of silently shipping a dead link on Medium.
 */
const PHRASE_MAP = [
  ["cancel a solar contract", "/blog/how-to-get-out-of-a-solar-contract"],
  ["get out of a solar contract", "/blog/how-to-get-out-of-a-solar-contract"],
  ["legal grounds for cancellation", "/blog/how-to-get-out-of-a-solar-contract"],
  ["free case review", "/blog/how-to-get-out-of-a-solar-contract"],
  ["solar loan documents", "/blog/solar-loan-document-checklist"],
  ["gather your paperwork", "/blog/solar-loan-document-checklist"],
  ["right of rescission", "/blog/solar-contract-rescission-rights"],
  ["TILA violations", "/blog/solar-contract-rescission-rights"],
  ["three-day window", "/blog/solar-contract-rescission-rights"],
  ["escalator clause", "/blog/solar-contract-escalator-clause-explained-how-to-fight-it"],
  ["dealer fees", "/blog/goodleap-solar-loan-cancellation-hidden-fees-2026"],
  ["hidden fees", "/blog/goodleap-solar-loan-cancellation-hidden-fees-2026"],
  ["payment went up", "/blog/solar-payment-shock-help"],
  ["higher than expected", "/blog/solar-payment-shock-help"],
  ["misleading savings claims", "/blog/solar-misleading-savings-claims"],
  ["savings never materialized", "/blog/solar-misleading-savings-claims"],
  ["fraud warning signs", "/blog/solar-fraud-warning-signs"],
  ["deceptive sales tactics", "/blog/solar-fraud-warning-signs"],
  ["file a complaint", "/blog/how-to-file-a-complaint-against-solar-company-attorney-general"],
  ["state attorney general", "/blog/how-to-file-a-complaint-against-solar-company-attorney-general"],
  ["installer went out of business", "/blog/solar-installer-out-of-business"],
  ["company closed", "/blog/solar-installer-out-of-business"],
  ["system is underperforming", "/blog/undersized-solar-system-legal-options"],
  ["not producing what was promised", "/blog/undersized-solar-system-legal-options"],
  ["selling your home with solar", "/blog/sell-house-with-solar-panels"],
  ["sell the system with the home", "/blog/sell-house-with-solar-panels"],
  ["transfer the PPA", "/blog/selling-home-with-solar-ppa-panels-transfer-or-cancel"],
  ["assigned without your consent", "/blog/solar-contract-assignment-without-consent"],
  ["contract was sold", "/blog/solar-contract-assignment-without-consent"],
];

/** City name -> its live landing page, derived so it can never name a 301. */
function cityPhrases() {
  return publishableCities.map(slug => {
    const parts = slug.split("-");
    const state = parts.pop().toUpperCase();
    const city = parts.map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
    return [`${city}, ${state}`, `/cancel-solar-contract/${slug}`];
  });
}

function assertAllTargetsPublishable() {
  const bad = [...PHRASE_MAP, ...cityPhrases()].filter(([, target]) => !isPublishable(target));
  if (bad.length) {
    console.error("✖ The phrase map points at pages that are not publishable:");
    for (const [phrase, target] of bad) console.error(`   - "${phrase}" -> ${target}`);
    console.error("\nRetarget these in scripts/medium-publish-brief.mjs before publishing.");
    process.exit(1);
  }
}

function titleCase(slug) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function printQueue(asJson) {
  if (asJson) {
    console.log(JSON.stringify({ articles: publishableArticles, cities: publishableCities }, null, 2));
    return;
  }
  console.log(`Publishable Medium queue — ${publishableArticles.length} indexable articles\n`);
  console.log("Anything not on this list is noindex, redirecting or retired. Publishing it to");
  console.log("Medium spends a backlink on a page the site does not want indexed.\n");
  publishableArticles.forEach((slug, i) => {
    console.log(`${String(i + 1).padStart(2, " ")}. ${titleCase(slug)}`);
    console.log(`    ${BASE}/blog/${slug}`);
  });
  console.log(`\n${publishableCities.length} city landing pages are also live and safe to link.`);
}

function printBrief(slug) {
  const pagePath = `/blog/${slug}`;
  if (!isPublishable(pagePath)) {
    console.error(`✖ ${pagePath} is not publishable.`);
    if (REDIRECTED_BLOG.has(slug)) console.error("   It 301-redirects to another article.");
    else if (QUARANTINED.has(pagePath)) console.error("   It is in the trust quarantine pending a source-backed rewrite.");
    else if (!eligibility.blogSlugs.includes(slug)) console.error("   It is not index-eligible, so it serves noindex.");
    console.error("\nRun with --list to see the articles that are safe to publish.");
    process.exit(1);
  }

  assertAllTargetsPublishable();
  const canonical = `${BASE}${pagePath}`;

  console.log(`MEDIUM PUBLISHING BRIEF — ${titleCase(slug)}`);
  console.log("=".repeat(72));
  console.log(`\nSource article : ${canonical}`);
  console.log(`Canonical line : Originally published at: ${canonical}`);
  console.log(`Tags           : Solar, Solar Energy, Solar Contract, Consumer Rights, Personal Finance`);
  console.log(`Cover image    : required — Medium suppresses distribution without one`);

  console.log(`\n\n--- 1. INTRO BLOCK (paste at the very top) ---\n`);
  console.log("In this article you'll learn:");
  console.log("  1. [the problem this article addresses, in one sentence]");
  console.log("  2. [what the reader will understand by the end, in one sentence]");
  console.log("  3. [the action they can take, in one sentence]");
  console.log("\nTrapped in a solar contract that's costing you more than it should?");
  console.log("You're not alone — and you're not stuck. Here's what you need to know.");

  console.log(`\n\n--- 2. WATCH / LISTEN BLOCK (first third of the article) ---\n`);
  console.log("🎥 Prefer to watch or listen?");
  console.log("We cover this topic — and dozens more — on our YouTube channel and podcast.");
  console.log(`👉 Watch: ${YOUTUBE}`);
  console.log(`👉 Learn more: ${BASE}`);

  console.log(`\n\n--- 3. INTERNAL LINKS (target 15-25; link a phrase only where it reads naturally) ---\n`);
  console.log("Every destination below is verified index-eligible as of this run.");
  console.log("Do not invent targets — an unlisted URL is very likely noindex.\n");
  for (const [phrase, target] of PHRASE_MAP) {
    if (target === pagePath) continue; // never self-link
    console.log(`  "${phrase}"`);
    console.log(`      ${BASE}${target}`);
  }
  console.log("\n  City mentions — link the city name when the article names one:");
  for (const [phrase, target] of cityPhrases()) {
    console.log(`  "${phrase}"  ->  ${BASE}${target}`);
  }

  console.log(`\n\n--- 4. WHAT YOU CAN WALK AWAY WITH (before the close, bolded) ---\n`);
  console.log("What you can walk away with after reading this:");
  console.log("  • A clear understanding of why your contract may be legally challengeable");
  console.log("  • The specific violations or misrepresentations that give you leverage");
  console.log("  • The exact steps to start the process of getting out");

  console.log(`\n\n--- 5. FROM TRAPPED TO FREE (every article, no exceptions) ---\n`);
  console.log("From Trapped to Free — 4 Steps");
  console.log("\n1. The Review");
  console.log("We read your contract line by line and identify every violation,");
  console.log("misrepresentation, and legal weakness.");
  console.log("\n2. The Custom Strategy");
  console.log("No two contracts are the same. We build a case strategy specific to your");
  console.log("lender, your company, and your situation.");
  console.log("\n3. We Fight");
  console.log("Our team goes to work — negotiating, disputing, and applying legal pressure");
  console.log("where it counts.");
  console.log("\n4. You're Free");
  console.log("Cancelled. Reduced. Or fully resolved. We don't stop until the contract is no");
  console.log("longer a problem.");
  console.log("\nWe don't just review contracts. We break them.");

  console.log(`\n\n--- 6. CLOSING CTA (the very last thing) ---\n`);
  console.log("Ready to find out if you have a case?");
  console.log("\nGet your free 15-minute case audit — no obligation, no pressure, just answers.");
  console.log(`\n📞 Call or text: ${PHONE}`);
  console.log(`🌐 Start here: ${BASE}`);
  console.log(`🌐 More homeowner stories: ${SECOND_DOMAIN}`);
  console.log(`\nOriginally published at: ${canonical}`);
  console.log("\n" + "=".repeat(72));
  console.log(`All ${PHRASE_MAP.length + publishableCities.length} link targets verified index-eligible.`);
}

const args = process.argv.slice(2);
if (!args.length || args.includes("--help")) {
  console.log("Usage:");
  console.log("  node scripts/medium-publish-brief.mjs --list [--json]");
  console.log("  node scripts/medium-publish-brief.mjs <article-slug>");
  process.exit(args.length ? 0 : 1);
}
if (args.includes("--list")) {
  assertAllTargetsPublishable();
  printQueue(args.includes("--json"));
} else {
  printBrief(args[0].replace(/^\/?blog\//, "").replace(/^\//, ""));
}
