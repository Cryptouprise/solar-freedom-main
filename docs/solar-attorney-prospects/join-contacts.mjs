#!/usr/bin/env node
/**
 * Join contact-enrichment results back onto the master prospect list.
 *
 * Produces the send-ready outreach CSV: one row per firm that has a real,
 * published email, addressed to the best-identified decision maker.
 *
 * Every email here was read off a page. Nothing is pattern-generated.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const BASE = "/tmp/claude-0/-home-user-solar-freedom-main/005037d7-056f-51ba-9145-9a83ee12f610/scratchpad";
const CONTACTS = process.env.CONTACT_DIR || join(BASE, "contacts");
const MASTER = process.env.MASTER_JSON || "/home/user/solar-freedom-main/docs/solar-attorney-prospects/solar-attorney-master.json";
const OUT = process.env.OUT_DIR || "/home/user/solar-freedom-main/docs/solar-attorney-prospects";

const str = (v) => (v === undefined || v === null ? "" : String(v).trim());
const arr = (v) => (Array.isArray(v) ? v.filter(Boolean) : []);

/** Same normalisation the merge uses, so firms join reliably. */
const LEGAL_SUFFIXES = [
  "llp", "llc", "pllc", "pc", "pa", "plc", "ltd", "inc", "co", "chartered",
  "law firm", "law firms", "law offices", "law office", "attorneys at law",
  "attorney at law", "law group", "law", "legal", "lawyers", "attorneys",
  "and associates", "associates", "trial lawyers", "injury lawyers",
];
function normName(raw) {
  if (!raw) return "";
  let s = String(raw).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9\s]/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  let changed = true;
  while (changed) {
    changed = false;
    for (const suf of LEGAL_SUFFIXES) {
      if (s === suf) break;
      if (s.endsWith(" " + suf)) { s = s.slice(0, -(suf.length + 1)).trim(); changed = true; }
    }
  }
  return s;
}

/** Registrable-ish domain from a URL, for comparing an email domain to the site. */
function normDomain(url) {
  if (!url) return "";
  try { return new URL(String(url).trim()).hostname.toLowerCase().replace(/^www\./, ""); }
  catch {
    const m = String(url).toLowerCase().match(/([a-z0-9-]+\.[a-z]{2,})(?:\/|$)/);
    return m ? m[1] : "";
  }
}

// A real address, not a placeholder or an image filename.
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const JUNK_RE = /^(example|test|your|name|email|someone|user|noreply|no-reply|donotreply)@|@(example|test|domain|yourfirm|email)\./i;
const isRealEmail = (e) => EMAIL_RE.test(str(e)) && !JUNK_RE.test(str(e));

// Who we would rather reach, best first.
function rankEmail(belongsTo) {
  const b = str(belongsTo).toLowerCase();
  if (/marketing|business development|bd\b/.test(b)) return 0;
  if (/attorney|partner|founder|principal/.test(b)) return 1;
  if (/intake/.test(b)) return 2;
  return 3; // general inbox
}

// ------------------------------------------------------------------- load

if (!existsSync(CONTACTS)) { console.error(`No contacts dir: ${CONTACTS}`); process.exit(1); }

const contactRows = [];
let filesRead = 0, dropped = 0;
for (const f of readdirSync(CONTACTS).filter((x) => x.startsWith("contacts-") && x.endsWith(".json"))) {
  let parsed;
  try { parsed = JSON.parse(readFileSync(join(CONTACTS, f), "utf8")); }
  catch (e) { console.error(`SKIP ${f}: ${e.message}`); continue; }
  filesRead++;
  for (const r of arr(parsed)) if (str(r.firm_name)) contactRows.push(r);
}

const byName = new Map();
for (const r of contactRows) {
  const k = normName(r.firm_name);
  if (!k) continue;
  if (!byName.has(k)) byName.set(k, r);
}

const master = JSON.parse(readFileSync(MASTER, "utf8"));

// ------------------------------------------------------------------ join

let enriched = 0, newEmails = 0, dmFound = 0, blocked = 0, corrected = 0;

for (const f of master.firms) {
  const c = byName.get(normName(f.firm_name));
  if (!c) continue;
  enriched++;
  if (c.fetch_blocked) blocked++;

  f.attorney_headcount = str(c.attorney_headcount);
  f.contact_form_url = str(c.contact_form_url);
  if (!f.phone) f.phone = str(c.phone);

  // Every email the agent actually read, filtered for validity.
  const found = arr(c.emails_found)
    .filter((e) => isRealEmail(e.email))
    .map((e) => ({ email: str(e.email).toLowerCase(), belongs_to: str(e.belongs_to), source_url: str(e.source_url) }));

  const bad = arr(c.emails_found).length - found.length;
  if (bad > 0) dropped += bad;

  found.sort((a, b) => rankEmail(a.belongs_to) - rankEmail(b.belongs_to));
  f.all_emails = found.map((e) => e.email);

  const dm = c.decision_maker || {};
  const dmEmail = isRealEmail(dm.email) ? str(dm.email).toLowerCase() : "";
  if (str(dm.name)) dmFound++;

  f.contact_name = str(dm.name);
  f.contact_title = str(dm.title);
  f.contact_rationale = str(c.decision_maker_rationale);
  f.contact_source = str(dm.source_url);
  f.contact_note = str(c.notes);
  // Some firms publish an email but obfuscate it against harvesters. It is
  // genuinely published and renders to any human visitor, but the obfuscation
  // signals a preference worth respecting - flag it so a human decides.
  f.email_obfuscated = /obfuscat|cloudflare|hex.?encod|entity.?encod|decoded/i.test(str(c.notes));

  // Prefer a direct line to the decision maker; fall back to the best inbox.
  const best = dmEmail || (found[0] ? found[0].email : "");
  const onFile = str(f.email).toLowerCase();

  if (best && !onFile) {
    f.email = best;
    newEmails++;
  } else if (best && onFile) {
    const seen = found.some((e) => e.email === onFile) || dmEmail === onFile;
    if (seen) {
      f.email_status = "verified_on_site";
      // A direct line to the decision maker beats a general inbox we already had.
      if (dmEmail && dmEmail !== onFile) { f.email_superseded = onFile; f.email = dmEmail; }
    } else {
      // The address on file was NOT found anywhere on the site this pass, and
      // the site does publish others. Trust what is actually on the page.
      const domOf = (e) => str(e).split("@")[1] || "";
      const site = normDomain(f.website);
      const onFileDomainMismatch = site && domOf(onFile) && !site.endsWith(domOf(onFile)) && !domOf(onFile).endsWith(site);
      f.email_superseded = onFile;
      f.email = best;
      f.email_status = onFileDomainMismatch
        ? "corrected — on-file address used a domain that is not the firm's site"
        : "corrected — on-file address was not published anywhere on the site";
      corrected++;
    }
  } else if (onFile) {
    f.email_status = found.length || dmEmail ? "on_file" : "on_file — could not re-verify, no emails published on site";
  }
  f.contact_email = f.email || "";
  f.email_type = dmEmail
    ? "decision_maker_direct"
    : found[0]
      ? (["marketing", "attorney", "intake", "general"][rankEmail(found[0].belongs_to)])
      : "";

  f.reachable = f.email ? "email" : f.phone ? "phone" : (f.contact_form_url || f.contact_path) ? "form" : "none";
}

// ---------------------------------------------------------------- outputs

function csvCell(v) {
  const s = Array.isArray(v) ? v.join(" | ") : str(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
const toCsv = (rows, cols) =>
  [cols.join(","), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(","))].join("\n") + "\n";

const sendable = master.firms
  .filter((f) => f.tier !== "X" && isRealEmail(f.email))
  .sort((a, b) => (a.tier || "").localeCompare(b.tier || "") || b.raw_score - a.raw_score);

// Pipeline-compatible, matching docs/attorney-first-outreach-batch.csv headers,
// with the decision-maker columns appended.
const PIPE_COLS = [
  "first_name", "company_name", "email", "city", "state", "website",
  "source_url", "score", "quality_confidence", "personalization_note", "status",
  "contact_name", "contact_title", "email_type", "attorney_headcount",
  "contact_form_url", "phone", "tier", "opportunity_type", "contact_rationale",
  "email_status", "email_superseded", "email_obfuscated", "contact_note",
];
const rows = sendable.map((f) => ({
  first_name: (f.contact_name || f.attorney_names[0] || "").split(/\s+/)[0] || "",
  company_name: f.firm_name,
  email: f.email,
  city: f.city,
  state: f.state,
  website: f.website,
  source_url: f.source_urls[0] || "",
  score: f.score,
  quality_confidence: f.confidence,
  personalization_note: (f.seo_weakness || f.evidence[0] || "").slice(0, 300),
  status: f.already_known ? "duplicate_review" : "needs_verification",
  contact_name: f.contact_name || "",
  contact_title: f.contact_title || "",
  email_type: f.email_type || "",
  attorney_headcount: f.attorney_headcount || "",
  contact_form_url: f.contact_form_url || "",
  phone: f.phone || "",
  tier: f.tier,
  opportunity_type: f.opportunity_type,
  contact_rationale: f.contact_rationale || "",
  email_status: f.email_status || "",
  email_superseded: f.email_superseded || "",
  email_obfuscated: f.email_obfuscated ? "yes - consider calling instead" : "",
  contact_note: f.contact_note || "",
}));
writeFileSync(join(OUT, "solar-attorney-outreach-ready.csv"), toCsv(rows, PIPE_COLS));

// Firms worth a call but with no email.
const callList = master.firms
  .filter((f) => f.tier !== "X" && !isRealEmail(f.email) && (f.phone || f.contact_form_url))
  .sort((a, b) => b.raw_score - a.raw_score)
  .map((f) => ({
    company_name: f.firm_name, city: f.city, state: f.state, tier: f.tier, score: f.score,
    phone: f.phone || "", contact_form_url: f.contact_form_url || f.contact_path || "",
    contact_name: f.contact_name || "", contact_title: f.contact_title || "",
    website: f.website, personalization_note: (f.seo_weakness || f.evidence[0] || "").slice(0, 300),
  }));
writeFileSync(
  join(OUT, "solar-attorney-call-list.csv"),
  toCsv(callList, ["company_name", "contact_name", "contact_title", "phone", "city", "state", "tier", "score", "contact_form_url", "website", "personalization_note"]),
);

// Anything with no email, no phone and no form would otherwise fall off both
// lists and be silently lost — including good firms whose site was blocked.
const unreachable = master.firms
  .filter((f) => f.tier !== "X" && !isRealEmail(f.email) && !f.phone && !f.contact_form_url && !f.contact_path)
  .sort((a, b) => b.raw_score - a.raw_score)
  .map((f) => ({
    company_name: f.firm_name, city: f.city, state: f.state, tier: f.tier, score: f.score,
    website: f.website, solar_page_url: f.solar_page_url,
    why: f.website ? "site unreadable or publishes no contact route" : "no website located",
    next_step: "look up in the state bar directory, or call the number on their court filings",
    evidence: (f.evidence[0] || "").slice(0, 200),
  }));
if (unreachable.length) {
  writeFileSync(
    join(OUT, "solar-attorney-needs-manual-lookup.csv"),
    toCsv(unreachable, ["company_name", "city", "state", "tier", "score", "website", "solar_page_url", "why", "next_step", "evidence"]),
  );
}

master.enriched_at = new Date().toISOString();
writeFileSync(join(OUT, "solar-attorney-master.json"), JSON.stringify(master, null, 2));

// ----------------------------------------------------------------- report

const contactable = master.firms.filter((f) => f.tier !== "X");
const tally = (p) => contactable.filter(p).length;
console.log(`contact files read:      ${filesRead} (${contactRows.length} firm records)`);
console.log(`joined onto master:      ${enriched}`);
console.log(`fetch-blocked sites:     ${blocked}`);
console.log(`invalid emails dropped:  ${dropped}`);
console.log("");
console.log(`NEW emails found:        ${newEmails}`);
console.log(`named decision makers:   ${dmFound}`);
console.log(`WRONG emails corrected:  ${corrected}`);
console.log("");
console.log(`contactable firms:       ${contactable.length}`);
console.log(`  with a real email:     ${tally((f) => isRealEmail(f.email))}`);
console.log(`  email is a direct line:${tally((f) => f.email_type === "decision_maker_direct")}`);
console.log(`  phone/form only:       ${tally((f) => !isRealEmail(f.email))}`);
console.log("");
console.log(`SEND LIST (outreach-ready.csv): ${rows.length}`);
console.log(`CALL LIST (call-list.csv):      ${callList.length}`);
const byTier = {};
rows.forEach((r) => (byTier[r.tier] = (byTier[r.tier] || 0) + 1));
console.log(`send list by tier: ${JSON.stringify(byTier)}`);
console.log(`MANUAL LOOKUP (no route at all):  ${unreachable.length}`);
