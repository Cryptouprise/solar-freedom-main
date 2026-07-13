import fs from "node:fs";
import path from "node:path";

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

for (const relativePath of [
  "client/src/components/SocialProofTicker.tsx",
  "client/src/components/UrgencyTimer.tsx",
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
]);
requirePattern("server/seo-meta.ts", [/suppressUnverifiedQuoteMarkup\(sanitizeStoredHtml\(content\)\)/]);
requirePattern("scripts/prerender.mjs", [/hasVerifiedQuoteEvidence\(section\)/]);

for (const relativePath of [
  "client/src/pages/Home.tsx",
  "client/src/pages/SolarPanelScam.tsx",
  "client/src/pages/YouTubeLanding.tsx",
  "client/src/pages/Yt2Landing.tsx",
  "client/src/pages/Yt3Landing.tsx",
]) {
  reject(relativePath, [/SocialProofTicker/, /UrgencyTimer/]);
}

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

reject("server/cron/prWireSubmitters.ts", [/Solar Freedom Legal Team/]);

reject("scripts/trending-content-pipeline.py", [
  /realistic homeowner testimonial/i,
  /reviewed by the Solar Freedom legal team/i,
  /solar contract cancellation law firm/i,
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
    .filter(entry => typeof entry === "string" && /\.(?:ts|tsx)$/.test(entry))
    .map(entry => `client/src/${entry.replaceAll("\\", "/")}`),
];
for (const relativePath of publicSource) reject(relativePath, [/\[VERIFY(?:[:\]])/]);

if (failures.length) {
  console.error(`Trust governance audit failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Trust governance audit passed.");
