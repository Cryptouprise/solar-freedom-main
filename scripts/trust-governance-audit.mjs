import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import {
  collectObjectRecords,
  hasPublishableEditorialReview,
  hasUnsupportedFirstPartyClaims,
} from "./publication-governance.mjs";

const root = path.resolve(import.meta.dirname, "..");
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function reject(relativePath, patterns) {
  const source = read(relativePath);
  for (const pattern of patterns) {
    if (pattern.test(source)) failures.push(`${relativePath}: forbidden pattern ${pattern}`);
  }
}

function requirePattern(relativePath, patterns) {
  const source = read(relativePath);
  for (const pattern of patterns) {
    if (!pattern.test(source)) failures.push(`${relativePath}: missing governance control ${pattern}`);
  }
}

function walkFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(absolute) : [absolute];
  });
}

function collectBlogChunks() {
  const dataRoot = path.join(root, "client", "src", "data");
  const unsafeSlugs = new Set();
  for (const filename of fs.readdirSync(dataRoot).filter(name => name.startsWith("blog") && name.endsWith(".ts"))) {
    const source = fs.readFileSync(path.join(dataRoot, filename), "utf8");
    const slugPattern = /(?:["'`]slug["'`]|\bslug)\s*:\s*(["'`])((?:\\[\s\S]|(?!\1)[\s\S])*?)\1/g;
    const matches = [...source.matchAll(slugPattern)];
    for (let index = 0; index < matches.length; index += 1) {
      const slug = matches[index][2].trim();
      if (!slug || slug.includes("${") || slug.length <= 5) continue;
      const chunk = source.slice(matches[index].index, matches[index + 1]?.index ?? source.length);
      if (
        !hasPublishableEditorialReview(chunk) ||
        hasUnsupportedFirstPartyClaims(chunk)
      ) unsafeSlugs.add(slug);
    }
  }
  return unsafeSlugs;
}

function stringProperty(source, property) {
  return new RegExp(`(?:["'\`]${property}["'\`]|\\b${property})\\s*:\\s*["'\`]([^"'\`]+)["'\`]`)
    .exec(source)?.[1]?.trim() || "";
}

function collectWithheldRecordSlugs(relativePath) {
  const source = read(relativePath);
  return new Set(
    collectObjectRecords(source)
      .filter(record => !hasPublishableEditorialReview(record))
      .map(record => stringProperty(record, "slug"))
      .filter(Boolean)
  );
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function schemaNodes(value) {
  if (Array.isArray(value)) return value.flatMap(schemaNodes);
  if (!isObject(value)) return [];
  if (Array.isArray(value["@graph"])) return value["@graph"].flatMap(schemaNodes);
  return value["@type"] ? [value] : [];
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (isObject(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}

function schemaKeys(node) {
  const rawTypes = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
  const types = rawTypes.filter(type => typeof type === "string").sort().join("|");
  const url = [node.url, node["@id"], node.mainEntityOfPage].find(value => typeof value === "string");
  const keys = [`json:${stableJson(node)}`];
  if (types && url) keys.push(`type-url:${types}:${String(url).replace(/#(?:webpage|article)$/i, "")}`);
  if (rawTypes.some(type => ["FAQPage", "BreadcrumbList"].includes(type))) keys.push(`singleton:${types}`);
  return keys;
}

for (const relativePath of [
  "client/src/components/SocialProofTicker.tsx",
  "client/src/components/UrgencyTimer.tsx",
  "client/src/data/featured-cities.ts",
]) {
  if (fs.existsSync(path.join(root, relativePath))) {
    failures.push(`${relativePath}: fabricated activity/scarcity component still exists`);
  }
}

reject("client/index.html", [
  /"@type"\s*:\s*"(?:LegalService|AggregateRating|HowTo|HowToStep)"/,
  /Solar Freedom Legal Team/,
  /Our attorneys/i,
  /all 50/i,
]);
const indexSchemaCount = (read("client/index.html").match(/type="application\/ld\+json"/g) ?? []).length;
if (indexSchemaCount !== 1) failures.push(`client/index.html: expected exactly one conservative identity schema, found ${indexSchemaCount}`);
requirePattern("client/index.html", [/"@type"\s*:\s*"Organization"/, /"name"\s*:\s*"Solar Freedom"/]);

reject("client/src/pages/CompanyPage.tsx", [/AggregateRating/, /bbbToScore/, /'@type':\s*'(?:LegalService|Organization)'/]);
reject("client/src/pages/CityPage.tsx", [/'@type':\s*'(?:LegalService|LocalBusiness|PostalAddress)'/, /addressLocality/]);
reject("client/src/pages/StateLawPage.tsx", [/'@type':\s*'LegalService'/]);
reject("scripts/prerender.mjs", [/"@type":\s*"LegalService"/, /"@type":\s*"PostalAddress"/]);

reject("client/src/pages/BlogPost.tsx", [
  /Solar Freedom Legal Team/,
  /Reviewed by Licensed Consumer Protection Attorneys/,
  /Licensed in 50 States/,
  /function AuthorBio/,
]);
reject("client/src/data/blog-articles-batch9.ts", [/Solar Freedom legal team/i, /our legal team/i]);
requirePattern("client/src/pages/BlogPost.tsx", [
  /hasVerifiedQuoteEvidence\(section\.verification\)/,
  /suppressUnverifiedQuoteMarkup\(content\)/,
  /isBlogPostPublishable\(post\)/,
  /noindex:\s*Boolean\(post && !postIsPublishable\)/,
]);
requirePattern("client/src/pages/Blog.tsx", [/staticBlogPosts\.filter\(isBlogPostPublishable\)/]);
requirePattern("client/src/data/publication-governance.ts", [
  /hasSharedPublishableEditorialReview/,
  /hasPublishableEditorialReview\(value\)[\s\S]*!hasUnsupportedFirstPartyClaims\(value\)/,
]);
requirePattern("client/src/pages/CityPage.tsx", [
  /hasPublishableEditorialReview\(city\)/,
  /noindex:\s*!cityEvidenceAvailable/,
]);
requirePattern("client/src/pages/CompanyPage.tsx", [
  /hasPublishableEditorialReview\(company\)/,
  /noindex:\s*!companyEvidenceAvailable/,
]);
requirePattern("scripts/generate-sitemap.mjs", [
  /hasPublishableEditorialReview\(chunk\)/,
  /companyEntries\.filter\(\(entry\) => entry\.publishable\)/,
  /cityEntries\.filter\(\(entry\) => entry\.publishable\)/,
  /hasUnsupportedFirstPartyClaims\(chunk\)/,
]);
requirePattern("scripts/generate-llms.mjs", [
  /hasPublishableEditorialReview\(chunk\)/,
  /optional llms\.txt machine-readable convention/,
  /not a guaranteed crawler standard or citation mechanism/,
  /hasUnsupportedFirstPartyClaims\(chunk\)/,
]);
requirePattern("server/seo-meta.ts", [/suppressUnverifiedQuoteMarkup\(sanitizeStoredHtml\(content\)\)/]);
requirePattern("server/seo-meta.ts", [
  /interface MetaEntry[\s\S]*noindex\?:\s*boolean/,
  /hasPublishableEditorialReview\(city\)/,
  /hasPublishableEditorialReview\(company\)/,
  /hasPublishableStateLawEvidence\(law\)/,
  /isBlogPostPublishable\(post\)/,
  /applyMetaEntry\(html, meta\)/,
  /noindex, follow/,
]);
requirePattern("server/seo-delivery.ts", [
  /mergeDynamicPostsIntoSitemap[\s\S]*!isBlogPostPublishable\(post\)/,
  /appendDynamicPostsToLlms[\s\S]*isBlogPostPublishable\(post\)/,
  /getDbBlogPostsForPublication\(5000, 0\)/,
  /if \(!isBlogPostPublishable\(lookup\.post\)\)/,
  /X-Robots-Tag", "noindex, follow"/,
]);
requirePattern("server/db.ts", [
  /function getDbBlogPostsForPublication/,
  /getDbBlogPostsForPublication[\s\S]*faqItems:\s*safeJson\(row\.faqItems, \[\]\)/,
  /getDbBlogPostsForPublication[\s\S]*galleryImages:\s*safeJson\(row\.galleryImages, \[\]\)/,
  /getDbBlogPosts\([\s\S]*getDbBlogPostsForPublication\(5000, 0\)[\s\S]*filterPublishableBlogPostPage\(rows, limit, offset\)/,
  /getDbBlogPost\(slug[\s\S]*isBlogPostPublishable\(post\) \? post : null/,
]);
requirePattern("server/routers.ts", [
  /listCompanies:\s*publicProcedure[\s\S]*?\.query\(\(\) => \[\]\)/,
  /getCompany:\s*publicProcedure[\s\S]*?\.query\(\(\) => null\)/,
]);
requirePattern("scripts/prerender.mjs", [/hasVerifiedQuoteEvidence\(section\)/]);

requirePattern("client/src/data/state-laws.ts", [
  /primarySources:\s*StateLawPrimarySource\[\]/,
  /reviewerName:\s*string/,
  /hasPublishableStateLawEvidence/,
]);
requirePattern("client/src/pages/StateLawPage.tsx", [
  /noindex:\s*!law \|\| !isPublishable/,
  /if \(law && isPublishable\)[\s\S]*FAQPage/,
  /solar-contract-laws/,
]);
requirePattern("scripts/generate-sitemap.mjs", [/entry\.publishable/]);
requirePattern("scripts/prerender.mjs", [
  /noindex:\s*!state\.publishable/,
  /!meta\.noindex && Array\.isArray\(meta\.faq\)/,
  /State solar contract research/,
]);

for (const relativePath of [
  "client/src/pages/Home.tsx",
  "client/src/pages/SolarPanelScam.tsx",
  "client/src/pages/YouTubeLanding.tsx",
  "client/src/pages/Yt2Landing.tsx",
  "client/src/pages/Yt3Landing.tsx",
]) {
  reject(relativePath, [/SocialProofTicker/, /UrgencyTimer/]);
}

const firstPartyClaimPatterns = [
  /3,000\+/i,
  /Our attorneys/i,
  /licensed counsel/i,
  /Success Rate/i,
  /Homeowners (?:Helped|Freed)/i,
  /Avg\. Resolution Time/i,
  /Results in 30[–-]90 days/i,
  /within 24 hours/i,
  /nationwide coverage/i,
  /zero financial risk/i,
  /limited number of new cases/i,
  /Contract cancelled\. No more payments/i,
  /\bfree (?:case |solar contract |contract )?(?:review|audit|consultation)\b/i,
  /\b(?:our legal team|written by attorneys|real attorneys|real outcomes)\b/i,
  /\b(?:no upfront (?:cost|fee)|work(?:s|ing)? on contingency|contingency[- ]based|pay nothing unless)\b/i,
  /\b(?:we\b|our (?:attorneys?|team|firm)\b)[^.!?]{0,180}\b(?:helped|won|cancel(?:ed|led)|eliminated|reduced|saved|secured|recovered|resolved|negotiated)\b/i,
  /\b(?:results? in|resolved within|process typically takes|find out your options in)\s*\d+/i,
  /(?:Solar Freedom|\bwe\b|\bour (?:team|attorneys)\b)[^.!?]{0,160}(?:no upfront cost|contingency basis|all 50 states)/i,
];

for (const relativePath of [
  "client/src/pages/Home.tsx",
  "client/src/pages/BlogPost.tsx",
  "client/src/pages/CityPage.tsx",
  "client/src/pages/CompanyPage.tsx",
  "client/src/pages/SolarPanelScam.tsx",
  "client/src/pages/YouTubeLanding.tsx",
  "client/src/pages/Yt2Landing.tsx",
  "client/src/pages/Yt3Landing.tsx",
  "client/src/pages/HowItWorks.tsx",
  "client/src/pages/MediaHub.tsx",
  "client/src/pages/SolarContractHelp.tsx",
  "client/src/pages/SolarExitOptions.tsx",
  "client/src/pages/SellingHouseWithSolar.tsx",
  "client/src/pages/SolarLienRemoval.tsx",
  "client/src/pages/SolarLoanHelp.tsx",
  "server/seo-meta.ts",
]) reject(relativePath, firstPartyClaimPatterns);

const staticClaimRiskPatterns = [
  /The average trapped solar homeowner/i,
  /average homeowner who contacts us/i,
  /Most homeowners who want out/i,
  /regardless of how long ago you signed/i,
  /window may still be legally open[^.]*years later/i,
  /Most states have[^.]*allow consumers to void/i,
  /Many solar lenders[^.]*violating TILA/i,
  /sometimes 20[–-]30%[^.]*violates disclosure requirements/i,
  /every day you wait[^.]*costs you money/i,
  /all removable/i,
];
for (const relativePath of [
  "client/src/pages/Home.tsx",
  "client/src/pages/SolarContractHelp.tsx",
  "client/src/pages/SolarExitOptions.tsx",
  "client/src/pages/SolarPanelScam.tsx",
  "client/src/pages/SolarLoanHelp.tsx",
  "client/src/pages/SolarLienRemoval.tsx",
  "server/seo-meta.ts",
  "scripts/prerender.mjs",
]) reject(relativePath, staticClaimRiskPatterns);
requirePattern("client/src/pages/SolarContractHelp.tsx", [
  /https:\/\/www\.ftc\.gov\/legal-library\/browse\/rules\/cooling-period-sales-made-home-or-other-locations/,
  /https:\/\/www\.consumerfinance\.gov\/rules-policy\/regulations\/1026\/23\//,
]);
requirePattern("client/src/pages/SolarLoanHelp.tsx", [
  /https:\/\/www\.consumerfinance\.gov\/data-research\/research-reports\/issue-spotlight-solar-financing\//,
]);
requirePattern("client/src/pages/SolarLienRemoval.tsx", [
  /https:\/\/www\.consumerfinance\.gov\/ask-cfpb\/i-am-considering-a-pace-loan/,
]);
requirePattern("scripts/prerender.mjs", [
  /function suppressUnverifiedFirstPartyClaims/,
  /suppressUnverifiedFirstPartyClaims\(section\.content/,
  /suppressUnverifiedFirstPartyClaims\(data\.description/,
]);

for (const relativePath of [
  "client/src/App.tsx",
  "client/src/main.tsx",
  "client/src/pages/SitemapPage.tsx",
  "server/seo-meta.ts",
  "scripts/prerender.mjs",
  "scripts/generate-sitemap.mjs",
]) reject(relativePath, [/\/solar-fraud-report(?=[/?#"'\s<]|$)/i, /SolarFraudReport/]);

for (const relativePath of [
  "client/src/pages/Home.tsx",
  "client/src/pages/SunrunPage.tsx",
  "client/src/pages/YouTubeLanding.tsx",
  "client/src/pages/Yt2Landing.tsx",
  "client/src/pages/Yt3Landing.tsx",
]) {
  reject(relativePath, [
    /TestimonialCard/,
    /const TESTIMONIALS\s*=/,
    /ATTORNEYS WHO FIGHT/,
    /State Bar-Licensed Counsel/,
    /Documented Case Outcomes/,
  ]);
}

for (const relativePath of [
  "server/cron/highDaSubmitters.ts",
  "server/cron/prSubmitter.ts",
  "server/cron/prWireSubmitters.ts",
  "server/_core/voiceTranscription.ts",
]) {
  if (fs.existsSync(path.join(root, relativePath))) {
    failures.push(`${relativePath}: dormant publisher or voice proxy must remain removed`);
  }
}

for (const relativePath of [
  "scripts/trending-content-pipeline.py",
  "scripts/build_keyword_report.py",
  "scripts/ga4_report.py",
]) {
  if (fs.existsSync(path.join(root, relativePath))) {
    failures.push(`${relativePath}: unsafe legacy content or embedded-measurement script must remain removed`);
  }
}
requirePattern("scripts/seo-backlinks.mjs", [
  /assertPublicExternalHttpsUrl/,
  /redirect:\s*"manual"/,
  /approvedTargets\.has\(target\)/,
  /readLimitedHtml/,
  /source_fetch_failed/,
]);
reject("scripts/seo-backlinks.mjs", [
  /redirect:\s*"follow"/,
  /String\(error\?\.message/,
  /34 Medium articles/,
]);
requirePattern("scripts/seo-internal-links.mjs", [
  /pages already approved[\s\S]{0,80}public sitemap/,
  /no indexing or ranking effect is promised/,
]);
reject("server/prompts/press-release.md", [/Create a realistic quote/i, /covers all 50 states/i]);
reject("scripts/generate-llms.mjs", [
  /Over 3,000 solar contracts reviewed/,
  /89% success rate/,
  /Serving all 50/,
  /Our attorneys focus/,
]);

const publicSource = [
  "client/index.html",
  ...fs.readdirSync(path.join(root, "client/src"), { recursive: true })
    .filter(entry => typeof entry === "string" && /\.(?:ts|tsx)$/.test(entry) && !/\.test\.(?:ts|tsx)$/.test(entry))
    .map(entry => `client/src/${entry.replaceAll("\\", "/")}`),
];
for (const relativePath of publicSource) reject(relativePath, [/\[VERIFY(?:[:\]])/]);

for (const relativePath of ["client/public/sitemap-index.xml", "client/public/robots.txt"]) {
  reject(relativePath, [/news-sitemap\.xml/i]);
}

reject("client/src/pages/Home.tsx", [
  /featuredCities/,
  /COMPANY_PAGES\.map/,
  /\/cancel-solar-contract\/\$\{/,
  /\/cancel-\$\{company\.slug\}-solar-contract/,
  /href=["']\/cancel-solar-contract\/[^"']+/,
  /href=["']\/cancel-[^"']+-solar-contract/,
  /href=\{`\/blog\/\$\{/,
]);
reject("client/src/pages/SitemapPage.tsx", [
  /from ["']@\/data\/(?:cities|companies)["']/,
  /\/cancel-solar-contract\/\$\{/,
  /\/cancel-\$\{/,
  /href=["']\/cancel-solar-contract\/[^"']+/,
  /href=["']\/cancel-[^"']+-solar-contract/,
]);
if (fs.existsSync(path.join(root, "client/public/news-sitemap.xml"))) {
  failures.push("client/public/news-sitemap.xml: unsupported News sitemap is still published");
}
reject("client/public/image-sitemap.xml", [/attorney[- ]team/i, /Solar contract attorney/i]);

const unsafeBlogSlugs = collectBlogChunks();
if (unsafeBlogSlugs.size === 0) {
  failures.push("blog publication quarantine fixture unexpectedly found no unsupported source posts");
}
const discoveryArtifacts = [
  "client/public/sitemap.xml",
  "client/public/image-sitemap.xml",
  "client/public/llms.txt",
  "client/public/llms-full.txt",
];
for (const relativePath of discoveryArtifacts) {
  const source = read(relativePath);
  for (const slug of unsafeBlogSlugs) {
    if (source.includes(`/blog/${slug}`)) {
      failures.push(`${relativePath}: quarantined blog slug remains discoverable: ${slug}`);
    }
  }
}

const withheldCitySlugs = collectWithheldRecordSlugs("client/src/data/cities.ts");
const withheldCompanySlugs = collectWithheldRecordSlugs("client/src/data/companies.ts");
for (const relativePath of [
  "client/public/sitemap.xml",
  "client/public/llms.txt",
  "client/public/llms-full.txt",
]) {
  const source = read(relativePath);
  for (const slug of withheldCitySlugs) {
    if (source.includes(`/cancel-solar-contract/${slug}`)) {
      failures.push(`${relativePath}: withheld city URL remains discoverable: ${slug}`);
    }
  }
  for (const slug of withheldCompanySlugs) {
    if (source.includes(`/cancel-${slug}-solar-contract`)) {
      failures.push(`${relativePath}: withheld company URL remains discoverable: ${slug}`);
    }
  }
}

const stateSource = read("client/src/data/state-laws.ts");
const hasReviewedStateEntries = /\beditorialReview\s*:\s*\{/.test(stateSource);
if (!hasReviewedStateEntries && /<loc>https:\/\/breakyoursolarcontract\.com\/solar-contract-laws\/[^<]+<\/loc>/.test(read("client/public/sitemap.xml"))) {
  failures.push("client/public/sitemap.xml: unreviewed state detail URL is published");
}

const builtRoot = path.join(root, "dist", "public");
for (const absolute of walkFiles(builtRoot).filter(file => file.endsWith(".html"))) {
  const source = fs.readFileSync(absolute, "utf8");
  const relativePath = path.relative(root, absolute).replaceAll("\\", "/");
  for (const pattern of firstPartyClaimPatterns) {
    if (pattern.test(source)) failures.push(`${relativePath}: rendered forbidden pattern ${pattern}`);
  }
  if (/\/solar-fraud-report(?=[/?#"'\s<]|$)/i.test(source)) {
    failures.push(`${relativePath}: rendered output links to quarantined solar-fraud-report`);
  }

  const $ = load(source);
  const seenSchemaKeys = new Set();
  $("script[type='application/ld+json']").each((_, element) => {
    let parsed;
    try {
      parsed = JSON.parse($(element).text());
    } catch {
      failures.push(`${relativePath}: invalid rendered JSON-LD`);
      return;
    }
    for (const node of schemaNodes(parsed)) {
      if (/\[VERIFY(?:[:\]])|\b(?:TODO|TBD|CHANGEME|REPLACE_ME)\b|https?:\/\/(?:www\.)?example\.(?:com|org|net)|\{\{[^{}]+\}\}/i.test(JSON.stringify(node))) {
        failures.push(`${relativePath}: placeholder data in rendered JSON-LD`);
      }
      const keys = schemaKeys(node);
      if (keys.some(key => seenSchemaKeys.has(key))) {
        failures.push(`${relativePath}: duplicate rendered JSON-LD node`);
      }
      keys.forEach(key => seenSchemaKeys.add(key));
    }
  });

  const builtRelative = path.relative(builtRoot, absolute).replaceAll("\\", "/");
  const cityMatch = builtRelative.match(/^cancel-solar-contract\/([^/]+)\/index\.html$/);
  if (cityMatch && withheldCitySlugs.has(cityMatch[1])) {
    if (!/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(source)) {
      failures.push(`${relativePath}: withheld city page is missing noindex`);
    }
    if (/"@type"\s*:\s*"FAQPage"/.test(source)) {
      failures.push(`${relativePath}: withheld city page emits FAQPage schema`);
    }
  }

  const companyMatch = builtRelative.match(/^cancel-([^/]+)-solar-contract\/index\.html$/);
  if (companyMatch && withheldCompanySlugs.has(companyMatch[1])) {
    if (!/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(source)) {
      failures.push(`${relativePath}: withheld company page is missing noindex`);
    }
    if (/"@type"\s*:\s*"FAQPage"/.test(source)) {
      failures.push(`${relativePath}: withheld company page emits FAQPage schema`);
    }
  }

  if (/^solar-contract-laws\/[^/]+\/index\.html$/.test(builtRelative)) {
    if (!/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(source)) {
      failures.push(`${relativePath}: unreviewed state page is missing noindex`);
    }
    if (/"@type"\s*:\s*"FAQPage"/.test(source)) {
      failures.push(`${relativePath}: unreviewed state page emits FAQPage schema`);
    }
    if (!source.includes("https://www.ecfr.gov/current/title-16/part-429") || !source.includes("https://www.usa.gov/state-attorney-general")) {
      failures.push(`${relativePath}: unreviewed state page is missing primary resource links`);
    }
  }

  const blogMatch = builtRelative.match(/^blog\/([^/]+)\/index\.html$/);
  if (blogMatch && unsafeBlogSlugs.has(blogMatch[1])) {
    if (!/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(source)) {
      failures.push(`${relativePath}: quarantined blog page is missing noindex`);
    }
    if (/"@type"\s*:\s*"(?:Article|FAQPage)"/.test(source)) {
      failures.push(`${relativePath}: quarantined blog page emits Article or FAQ schema`);
    }
  }
}

if (fs.existsSync(path.join(builtRoot, "solar-fraud-report"))) {
  failures.push("dist/public/solar-fraud-report: quarantined route was rendered");
}

if (failures.length) {
  console.error(`Trust governance audit failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Trust governance audit passed.");
