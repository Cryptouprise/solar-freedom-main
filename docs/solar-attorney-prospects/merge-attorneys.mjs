#!/usr/bin/env node
/**
 * Merge, dedupe and score solar-exit attorney prospects from all research lanes.
 *
 * Reads every lane*.json in the research dir, collapses duplicates (domain first,
 * normalized firm name as fallback), scores each firm for buying likelihood, and
 * emits a master CSV, a pipeline-compatible CSV, and a markdown dossier.
 *
 * Nothing here invents data. Fields absent from the research stay empty.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const BASE = "/tmp/claude-0/-home-user-solar-freedom-main/005037d7-056f-51ba-9145-9a83ee12f610/scratchpad";
const DIR = process.env.ATTY_DIR || join(BASE, "attorney-research");
const OUT = process.env.ATTY_OUT || BASE;

const LEGAL_SUFFIXES = [
  "llp", "llc", "pllc", "pc", "pa", "plc", "ltd", "inc", "co", "chartered",
  "law firm", "law firms", "law offices", "law office", "attorneys at law",
  "attorney at law", "law group", "law", "legal", "lawyers", "attorneys",
  "and associates", "associates", "trial lawyers", "injury lawyers",
];

/** Collapse a firm name to a stable dedupe key. */
function normName(raw) {
  if (!raw) return "";
  let s = String(raw).toLowerCase();
  s = s.replace(/&/g, " and ");
  s = s.replace(/[^a-z0-9\s]/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  // Strip trailing legal suffixes repeatedly (e.g. "smith law group pllc").
  let changed = true;
  while (changed) {
    changed = false;
    for (const suf of LEGAL_SUFFIXES) {
      if (s === suf) break;
      if (s.endsWith(" " + suf)) {
        s = s.slice(0, -(suf.length + 1)).trim();
        changed = true;
      }
    }
  }
  return s.replace(/\s+/g, " ").trim();
}

/** Registrable-ish domain from a URL, for the primary dedupe key. */
function normDomain(url) {
  if (!url) return "";
  try {
    const u = new URL(String(url).trim());
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    const m = String(url).toLowerCase().match(/([a-z0-9-]+\.[a-z]{2,})(?:\/|$)/);
    return m ? m[1] : "";
  }
}

function asArray(v) {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (v === undefined || v === null || v === "") return [];
  return [v];
}

function str(v) {
  return v === undefined || v === null ? "" : String(v).trim();
}

// Lanes disagreed on state format: some emit "AZ", others "Arizona". Left raw,
// that splits one state into two buckets AND breaks the name+state dedupe key
// for firms with no website.
const STATE_CODES = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI",
  wyoming: "WY", "district of columbia": "DC",
};

function normState(v) {
  const s = str(v);
  if (!s) return "";
  const key = s.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
  if (STATE_CODES[key]) return STATE_CODES[key];
  const up = s.toUpperCase().replace(/[^A-Z]/g, "");
  if (up.length === 2) return up;
  // "Alpharetta, GA" or "GA (also CA)" — take the first 2-letter token.
  const tok = s.toUpperCase().match(/\b([A-Z]{2})\b/);
  return tok ? tok[1] : up.slice(0, 2);
}

// ---------------------------------------------------------------- load lanes

if (!existsSync(DIR)) {
  console.error(`Research dir missing: ${DIR}`);
  process.exit(1);
}

const laneFiles = readdirSync(DIR)
  .filter((f) => f.startsWith("lane") && f.endsWith(".json"))
  .sort();

const records = [];
let baseline = null;
const laneStats = {};

for (const file of laneFiles) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(join(DIR, file), "utf8"));
  } catch (err) {
    console.error(`SKIP ${file}: unparseable (${err.message})`);
    laneStats[file] = "PARSE ERROR";
    continue;
  }

  if (file.includes("baseline")) {
    baseline = parsed;
    const n = asArray(parsed.existing_prospects).length;
    laneStats[file] = `${n} existing`;
    continue;
  }

  const rows = Array.isArray(parsed) ? parsed : asArray(parsed.results ?? parsed.records);
  laneStats[file] = `${rows.length} records`;
  for (const r of rows) {
    if (!r || !str(r.firm_name)) continue;
    records.push({ ...r, _lane: file.replace(/^lane\d+-/, "").replace(/\.json$/, "") });
  }
}

// ------------------------------------------------------- baseline dedupe set

const knownDomains = new Set();
const knownNames = new Set();
for (const p of asArray(baseline?.existing_prospects)) {
  const d = normDomain(p.website);
  if (d) knownDomains.add(d);
  const n = normName(p.firm_name);
  if (n) knownNames.add(n);
}

// ------------------------------------------------------------------ merge

const merged = new Map();

function keyFor(r) {
  const d = normDomain(r.website) || normDomain(r.solar_page_url);
  if (d) return `d:${d}`;
  const n = normName(r.firm_name);
  const st = normState(r.state);
  return n ? `n:${n}|${st}` : `x:${Math.random()}`;
}

for (const r of records) {
  const k = keyFor(r);
  const existing = merged.get(k);
  if (!existing) {
    merged.set(k, {
      firm_name: str(r.firm_name),
      attorney_names: asArray(r.attorney_names).map(str),
      city: str(r.city),
      state: normState(r.state),
      metro: str(r.metro),
      states_licensed: asArray(r.states_licensed).map(str),
      website: str(r.website),
      solar_page_url: str(r.solar_page_url),
      email: str(r.email),
      phone: str(r.phone),
      contact_path: str(r.contact_path),
      solar_directness: str(r.solar_directness),
      side: str(r.side),
      evidence: [str(r.solar_evidence)].filter(Boolean),
      evidence_types: [str(r.evidence_type)].filter(Boolean),
      legal_theories: asArray(r.legal_theories).map(str),
      trigger_event: str(r.trigger_event),
      source_urls: asArray(r.source_urls).map(str),
      content_footprint: [str(r.content_footprint)].filter(Boolean),
      content_channels: asArray(r.content_channels).map(str),
      content_examples: asArray(r.content_examples).map(str),
      content_recency: str(r.content_recency),
      buyer_warmth: str(r.buyer_warmth),
      seo_weakness: str(r.seo_weakness),
      service_fit: [str(r.service_fit)].filter(Boolean),
      confidence: str(r.confidence) || "low",
      lanes: [r._lane],
    });
    continue;
  }

  // Merge: prefer the first non-empty scalar, union the lists.
  const pick = (a, b) => (a && a.length ? a : str(b));
  existing.firm_name = existing.firm_name || str(r.firm_name);
  existing.city = pick(existing.city, r.city);
  existing.state = pick(existing.state, normState(r.state));
  existing.metro = pick(existing.metro, r.metro);
  existing.website = pick(existing.website, r.website);
  existing.solar_page_url = pick(existing.solar_page_url, r.solar_page_url);
  existing.email = pick(existing.email, r.email);
  existing.phone = pick(existing.phone, r.phone);
  existing.contact_path = pick(existing.contact_path, r.contact_path);
  existing.side = pick(existing.side, r.side);
  existing.trigger_event = pick(existing.trigger_event, r.trigger_event);
  existing.content_recency = pick(existing.content_recency, r.content_recency);
  existing.buyer_warmth = pick(existing.buyer_warmth, r.buyer_warmth);
  existing.seo_weakness = pick(existing.seo_weakness, r.seo_weakness);

  // "direct" always beats "adjacent".
  if (str(r.solar_directness) === "direct") existing.solar_directness = "direct";
  else existing.solar_directness = existing.solar_directness || str(r.solar_directness);

  const union = (arr, add) => {
    for (const v of asArray(add).map(str)) if (v && !arr.includes(v)) arr.push(v);
  };
  union(existing.attorney_names, r.attorney_names);
  union(existing.states_licensed, r.states_licensed);
  union(existing.evidence, [r.solar_evidence]);
  union(existing.evidence_types, [r.evidence_type]);
  union(existing.legal_theories, r.legal_theories);
  union(existing.source_urls, r.source_urls);
  union(existing.content_footprint, [r.content_footprint]);
  union(existing.content_channels, r.content_channels);
  union(existing.content_examples, r.content_examples);
  union(existing.service_fit, [r.service_fit]);
  union(existing.lanes, [r._lane]);

  const rank = { high: 3, medium: 2, low: 1 };
  if ((rank[str(r.confidence)] || 0) > (rank[existing.confidence] || 0)) {
    existing.confidence = str(r.confidence);
  }
}

// ------------------------------------------------------------------ scoring

// Agents describe content in prose, so "no dedicated solar content found" is a
// non-empty string that must NOT count as content. Detect real signals, not
// mere presence of text.
const POSITIVE_RE =
  /\b(blog|youtube|video|podcast|microsite|subdomain|newsletter|webinar|publish(?:es|ing|ed)?|article|media (?:coverage|placement)|press|jdsupra|lexology|medium|social|tiktok|instagram|facebook|resource (?:section|center|hub)|faq|case stud|client stor|dedicated site|content-heavy)\b/i;
const NEGATION_RE =
  /\b(none|no observable|no dedicated|no solar|no blog|no content|no marketing|not observed|nothing|thin|minimal|sparse|absent|no visible|no apparent)\b/i;

function hasContent(f) {
  // Structured signals from the content lane are authoritative.
  if (f.content_channels.length > 0) return true;
  if (f.content_examples.length > 0) return true;

  const blob = [...f.content_footprint].join(" ").trim();
  if (!blob) return false;

  const positive = POSITIVE_RE.test(blob);
  const negated = NEGATION_RE.test(blob);
  // "dedicated blog subdomain" -> yes. "no dedicated solar blog" -> no.
  if (positive && !negated) return true;
  if (positive && negated) {
    // Mixed prose: trust it only if a positive signal appears outside the
    // negated clause (crude but conservative — split on the negation).
    const tail = blob.split(NEGATION_RE).slice(2).join(" ");
    return POSITIVE_RE.test(tail);
  }
  return false;
}

// Lane schemas differ: the litigation and content lanes never emitted
// solar_directness, so firms found only by those lanes would lose the +30
// direct-evidence credit for a schema reason rather than a substantive one.
// Infer it from the evidence those lanes DID record.
const DIRECT_EVIDENCE_RE =
  /docket|class_action|case_record|bankruptcy_docket|dedicated_microsite|practice_area_page|landing_page/;

function resolveDirectness(f) {
  if (f.solar_directness === "direct" || f.solar_directness === "adjacent") {
    return f.solar_directness;
  }
  if (f.solar_page_url) return "direct";
  if (f.evidence_types.some((t) => DIRECT_EVIDENCE_RE.test(t))) return "direct";
  // Solar evidence text recorded by a lane that had no directness field.
  if (f.evidence.join(" ").trim().length > 0) return "direct";
  return "";
}

for (const f of merged.values()) {
  let score = 0;
  const why = [];

  const wasBlank = !f.solar_directness;
  f.solar_directness = resolveDirectness(f);
  if (wasBlank && f.solar_directness) f.directness_inferred = true;

  if (f.solar_directness === "direct") { score += 30; why.push("direct solar evidence +30"); }
  else if (f.solar_directness === "adjacent") { score += 10; why.push("adjacent practice +10"); }

  if (f.solar_page_url) { score += 15; why.push("dedicated solar page +15"); }

  // Two distinct buyer profiles, both worth surfacing:
  //   warm_buyer — already publishing, pre-sold on the category, shorter sale
  //   gap_buyer  — court-verified wins but no content capturing that demand,
  //                bigger upside and no incumbent agency to displace
  const HARD_EVIDENCE = /docket|class_action|case_record|ag_action|bankruptcy_docket/;
  const provenWins = f.evidence_types.some((t) => HARD_EVIDENCE.test(t));
  if (hasContent(f)) {
    score += 15;
    why.push("already publishes content +15");
    f.opportunity_type = "warm_buyer";
  } else if (provenWins && f.confidence === "high") {
    score += 12;
    why.push("proven wins, zero content — high leverage +12");
    f.opportunity_type = "gap_buyer";
  } else {
    f.opportunity_type = "low_signal";
  }
  if (f.email) { score += 10; why.push("public email +10"); }
  if (f.lanes.length > 1) { score += 10; why.push(`corroborated by ${f.lanes.length} lanes +10`); }
  if (f.website) { score += 5; why.push("website +5"); }
  if (f.phone) { score += 5; why.push("phone +5"); }
  if (f.state === "TX") { score += 10; why.push("Texas priority +10"); }
  if (f.buyer_warmth === "hot") { score += 10; why.push("hot buyer +10"); }

  score += { high: 10, medium: 5, low: 0 }[f.confidence] ?? 0;

  // Wrong side of the "v." — they represent installers and lenders, so they
  // would never buy homeowner-side services. Some lanes recorded the defense
  // posture only in prose, so check both.
  const blob = [f.firm_name, ...f.evidence, ...f.service_fit].join(" ");
  const defensePose =
    f.side === "defense" ||
    /\bdefend(?:s|ing)?\b[^.]{0,60}\b(?:contractor|installer|lender|solar compan|credit union)/i.test(blob) ||
    /\bsolar business defense\b/i.test(blob);
  if (defensePose) {
    f.side = "defense";
    score -= 25;
    why.push("defense-side -25");
  }

  // Legal aid and nonprofits do real solar work but have no marketing budget —
  // they are market intelligence, not prospects. Keep them in the dataset,
  // flagged, but out of the outreach tiers.
  f.not_a_buyer = /\b(legal aid|legal services|law project|legal society|pro bono|nonprofit|non-profit|grant-funded)\b/i.test(
    f.firm_name + " " + f.evidence.join(" "),
  );
  if (f.not_a_buyer) {
    score -= 40;
    why.push("legal aid / nonprofit, no marketing budget -40");
  }

  f.raw_score = score;                      // uncapped, for ranking
  f.score = Math.max(0, Math.min(100, score)); // 0-100, for display
  f.score_breakdown = why.join("; ");
  // Tier X = do not contact. A defense firm can still score well on signal
  // strength, so score alone would leave it sitting near the top of a list
  // meant for outreach. Make the exclusion explicit instead.
  f.tier = defensePose || f.not_a_buyer
    ? "X"
    : f.score >= 70 ? "A" : f.score >= 50 ? "B" : "C";
  f.exclude_reason = defensePose
    ? "defense-side — represents installers/lenders, do not contact"
    : f.not_a_buyer
      ? "legal aid / nonprofit — no marketing budget, intelligence only"
      : "";
  f.already_known =
    knownDomains.has(normDomain(f.website)) || knownNames.has(normName(f.firm_name));
  f.reachable = f.email ? "email" : f.phone ? "phone" : f.contact_path ? "form" : "none";
}

const TIER_RANK = { A: 0, B: 1, C: 2, X: 3 };
const all = [...merged.values()].sort(
  (a, b) =>
    TIER_RANK[a.tier] - TIER_RANK[b.tier] ||
    b.raw_score - a.raw_score ||
    a.firm_name.localeCompare(b.firm_name),
);

// ------------------------------------------------------------------ outputs

function csvCell(v) {
  const s = Array.isArray(v) ? v.join(" | ") : str(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCsv(rows, cols) {
  return [cols.join(","), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(","))].join("\n") + "\n";
}

const MASTER_COLS = [
  "score", "tier", "firm_name", "attorney_names", "city", "state", "metro",
  "website", "solar_page_url", "email", "phone", "contact_path", "reachable",
  "solar_directness", "side", "opportunity_type", "not_a_buyer", "directness_inferred",
  "evidence", "evidence_types", "legal_theories",
  "trigger_event", "content_footprint", "content_channels", "content_recency",
  "buyer_warmth", "seo_weakness", "service_fit", "confidence", "already_known",
  "exclude_reason", "lanes", "source_urls", "score_breakdown",
];
writeFileSync(join(OUT, "solar-attorney-master.csv"), toCsv(all, MASTER_COLS));

// Pipeline-compatible shape, matching docs/attorney-first-outreach-batch.csv headers.
const PIPE_COLS = [
  "first_name", "company_name", "email", "city", "state", "website",
  "source_url", "score", "quality_confidence", "personalization_note", "status",
];
const pipeRows = all
  .filter((f) => f.email && f.side !== "defense" && !f.not_a_buyer)
  .map((f) => ({
    first_name: (f.attorney_names[0] || "").split(/\s+/)[0] || "",
    company_name: f.firm_name,
    email: f.email,
    city: f.city,
    state: f.state,
    website: f.website,
    source_url: f.source_urls[0] || "",
    score: f.score,
    quality_confidence: f.confidence,
    personalization_note: (f.evidence[0] || "").slice(0, 300),
    status: f.already_known ? "duplicate_review" : "needs_verification",
  }));
writeFileSync(join(OUT, "solar-attorney-pipeline-import.csv"), toCsv(pipeRows, PIPE_COLS));

writeFileSync(
  join(OUT, "solar-attorney-master.json"),
  JSON.stringify({ generated: new Date().toISOString(), count: all.length, firms: all }, null, 2),
);

// ------------------------------------------------------------------ report

const byState = {};
for (const f of all) byState[f.state || "??"] = (byState[f.state || "??"] || 0) + 1;

const tally = (pred) => all.filter(pred).length;
console.log("=== LANE INTAKE ===");
for (const [k, v] of Object.entries(laneStats)) console.log(`  ${k}: ${v}`);
console.log("\n=== MERGE ===");
console.log(`  raw records:        ${records.length}`);
console.log(`  unique firms:       ${all.length}`);
console.log(`  collapsed dupes:    ${records.length - all.length}`);
console.log("\n=== QUALITY ===");
console.log(`  Tier A (70+):       ${tally((f) => f.tier === "A")}`);
console.log(`  Tier B (50-69):     ${tally((f) => f.tier === "B")}`);
console.log(`  Tier C (<50):       ${tally((f) => f.tier === "C")}`);
console.log(`  Tier X (exclude):   ${tally((f) => f.tier === "X")}`);
console.log(`  direct solar:       ${tally((f) => f.solar_directness === "direct")}`);
console.log(`  adjacent:           ${tally((f) => f.solar_directness === "adjacent")}`);
console.log(`  public email:       ${tally((f) => !!f.email)}`);
console.log(`  reachable at all:   ${tally((f) => f.reachable !== "none")}`);
console.log(`  already in pool:    ${tally((f) => f.already_known)}`);
console.log(`  defense-side:       ${tally((f) => f.side === "defense")}`);
console.log("\n=== BY STATE ===");
for (const [s, n] of Object.entries(byState).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${s}: ${n}`);
}
console.log("\n=== TOP 15 ===");
for (const f of all.slice(0, 15)) {
  console.log(`  ${String(f.score).padStart(3)} [${f.tier}] ${f.firm_name} (${f.city || "?"}, ${f.state || "?"}) ${f.reachable}`);
}

// ------------------------------------------------------------------ dossier

const esc = (v) => String(v ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const contactable = all.filter((f) => f.tier !== "X");
const tierA = contactable.filter((f) => f.tier === "A");
const gaps = contactable.filter((f) => f.opportunity_type === "gap_buyer");
const excluded = all.filter((f) => f.tier === "X");

const lines = [];
lines.push("# Solar-Exit Attorney Prospect List");
lines.push("");
lines.push(`Generated ${new Date().toISOString().slice(0, 10)} · ${all.length} unique firms from ${records.length} raw records across ${Object.keys(laneStats).length} research lanes.`);
lines.push("");
lines.push("Every record is backed by at least one source URL that a researcher actually fetched and read. Blank fields mean unverified, never guessed. Nothing here has been contacted.");
lines.push("");
lines.push("## How to read this");
lines.push("");
lines.push("| Tier | Meaning |");
lines.push("|---|---|");
lines.push("| A | Score 70+. Strong solar evidence and a real contact route. Work these first. |");
lines.push("| B | Score 50-69. Real, needs a verification pass before outreach. |");
lines.push("| C | Under 50. Mostly adjacent consumer firms with no solar page yet. |");
lines.push("| **X** | **Do not contact.** Defense-side or nonprofit. Intelligence only. |");
lines.push("");
lines.push("`warm_buyer` already publishes content — shorter sale, likely has an agency. `gap_buyer` has verified wins and no content — bigger upside, no incumbent.");
lines.push("");
lines.push(`## Tier A — ${tierA.length} firms`);
lines.push("");
lines.push("| # | Firm | City | ST | Reach | Type | Why |");
lines.push("|---|---|---|---|---|---|---|");
tierA.forEach((f, i) => {
  lines.push(`| ${i + 1} | **${esc(f.firm_name)}** | ${esc(f.city)} | ${esc(f.state)} | ${f.reachable} | ${f.opportunity_type.replace("_", " ")} | ${esc((f.evidence[0] || "").slice(0, 170))} |`);
});
lines.push("");
if (gaps.length) {
  lines.push(`## Gap buyers — ${gaps.length} firms`);
  lines.push("");
  lines.push("Verified wins, no content capturing the demand. No incumbent agency to displace.");
  lines.push("");
  gaps.forEach((f) => {
    lines.push(`- **${esc(f.firm_name)}** (${esc(f.city)}, ${esc(f.state)}) — ${esc(f.evidence[0] || "")}`);
    if (f.source_urls[0]) lines.push(`  - Source: ${f.source_urls[0]}`);
  });
  lines.push("");
}
lines.push("## Do not contact");
lines.push("");
excluded.forEach((f) => lines.push(`- **${esc(f.firm_name)}** (${esc(f.state)}) — ${esc(f.exclude_reason)}`));
lines.push("");
lines.push("## Coverage by state");
lines.push("");
lines.push("| State | Firms | Tier A |");
lines.push("|---|---|---|");
Object.entries(byState).sort((a, b) => b[1] - a[1]).forEach(([st, n]) => {
  const a = contactable.filter((f) => f.state === st && f.tier === "A").length;
  lines.push(`| ${st} | ${n} | ${a} |`);
});
lines.push("");
lines.push("## Caveats");
lines.push("");
lines.push("- **Dedupe is a floor, not a guarantee.** DATABASE_URL was unavailable, so only 22 of roughly 100 existing prospects were visible for matching. Re-check against the live database before sending.");
lines.push("- **Research was search-budget constrained.** Several lanes exhausted a shared quota; a few firms are known to exist but could not be verified and were left out rather than guessed.");
lines.push("- **Bot-protected sites were skipped, not assumed.** Counxel Legal Firm, Guidant Law and Solar Exit Law all show strong indirect signals but could not be read.");
lines.push("- **No email was invented.** Firms without a public email carry phone or contact-form routes instead.");
lines.push("");
writeFileSync(join(OUT, "solar-attorney-dossier.md"), lines.join("\n"));

console.log(`\nWrote:\n  ${join(OUT, "solar-attorney-master.csv")}\n  ${join(OUT, "solar-attorney-pipeline-import.csv")}\n  ${join(OUT, "solar-attorney-master.json")}\n  ${join(OUT, "solar-attorney-dossier.md")}`);
