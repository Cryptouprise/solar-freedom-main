#!/usr/bin/env node
/**
 * Verifies the four 26 Nov 2026 near-winner fixes in the BUILT output.
 *
 * The source files being correct is not the same as the served pages being
 * correct — the homepage and company pages are replaced by generated shells, and
 * two runtime transforms rewrite the pre-rendered HTML. So every fix is checked
 * against dist/public, which is what a crawler actually receives.
 */
import fs from "node:fs";

let failures = 0;

function check(label, condition, detail) {
  const status = condition ? "PASS" : "FAIL";
  if (!condition) failures += 1;
  console.log(`  [${status}] ${label}`);
  if (detail) console.log(`         ${detail}`);
}

function read(path) {
  try {
    return fs.readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

// Google measures the RENDERED title, so "&amp;" counts as one character.
// Measuring the raw HTML would over-count every escaped entity.
function unescapeHtml(s) {
  return String(s || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function titleOf(html) {
  const m = html && html.match(/<title>([^<]*)<\/title>/);
  return m ? unescapeHtml(m[1]) : null;
}

function descOf(html) {
  const m = html && html.match(/<meta name="description" content="([^"]*)"/);
  return m ? unescapeHtml(m[1]) : null;
}

console.log("1. Rescission page — title carries TILA, description under 160");
{
  const p = "dist/public/blog/solar-contract-rescission-rights/index.html";
  const html = read(p);
  const t = titleOf(html);
  const d = descOf(html);
  check("page exists", Boolean(html), p);
  check("title contains TILA", Boolean(t && t.includes("TILA")), `title = ${t}`);
  check("title at or under 70 chars", Boolean(t && t.length <= 70), `length = ${t ? t.length : "n/a"}`);
  check("description at or under 160 chars", Boolean(d && d.length <= 160), `length = ${d ? d.length : "n/a"}`);
}

console.log("\n2. Sunlight Financial — direct answer is in the served page");
{
  const p = "dist/public/blog/sunlight-financial-solar-loan-complaints/index.html";
  const html = read(p);
  check("page exists", Boolean(html), p);
  check(
    "contains the direct yes/no answer",
    Boolean(html && html.includes("Short answer: Sunlight Financial is a real")),
  );
  check(
    "states the Chapter 11 and emergence dates",
    Boolean(html && html.includes("30 October 2023") && html.includes("6 December 2023")),
  );
}

console.log("\n3. Tesla article — reviews and customer-service sections present");
{
  const p = "dist/public/blog/tesla-solar-solarcity-complaints-cancel-2026/index.html";
  const html = read(p);
  check("page exists", Boolean(html), p);
  check(
    "reviews heading present",
    Boolean(html && html.includes("What SolarCity and Tesla Solar Reviews Actually Show")),
  );
  check(
    "customer service heading present",
    Boolean(html && html.includes("How to Reach Tesla Solar Customer Service")),
  );
  check("published phone number present", Boolean(html && html.includes("798-3752")));
  check(
    "BBB rating and complaint count present",
    Boolean(html && /21/.test(html) && /failure to respond/i.test(html)),
  );
  check(
    "both new FAQs present",
    Boolean(
      html &&
        html.includes("What do Tesla Solar and SolarCity reviews actually say?") &&
        html.includes("How do I contact Tesla Solar customer service?"),
    ),
  );
}

console.log("\n4. ADT page — now has inbound internal links from two pages");
{
  const sources = [
    ["Sunrun California", "dist/public/blog/sunrun-complaints-california/index.html"],
    ["Vivint complaint guide", "dist/public/blog/vivint-solar-complaints-2026-cancellation-guide/index.html"],
  ];
  for (const [name, p] of sources) {
    const html = read(p);
    check(`${name} exists`, Boolean(html), p);
    check(
      `${name} links to /blog/adt-solar-complaints`,
      Boolean(html && html.includes("/blog/adt-solar-complaints")),
    );
  }
  const target = read("dist/public/blog/adt-solar-complaints/index.html");
  check("ADT target page exists", Boolean(target));
}

console.log("\n5. Site-wide sanity");
{
  const sitemap = read("dist/public/sitemap.xml");
  const urls = sitemap ? (sitemap.match(/<loc>/g) || []).length : 0;
  check("sitemap present", Boolean(sitemap), `${urls} URLs`);
  const home = read("dist/public/index.html");
  check("homepage still pre-rendered", Boolean(home && home.includes("voidable")));
}

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
