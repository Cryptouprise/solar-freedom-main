#!/usr/bin/env node
/**
 * Corrects company status values in client/src/data/companies.ts that were
 * factually wrong as of 26 Nov 2026. Each change is backed by a primary or
 * official source read on that date. Idempotent: safe to re-run.
 *
 * Also adds a `statusNote` and `statusSource` field to each corrected company
 * so the UI can show WHY the status is what it is, and a reader can check it.
 */
import fs from "node:fs";
import path from "node:path";

const FILE = path.resolve(process.cwd(), "client/src/data/companies.ts");
let src = fs.readFileSync(FILE, "utf8");

// slug -> { status, statusNote, statusSource }
const FIXES = {
  "titan-solar": {
    status: "Bankrupt",
    statusNote:
      "Ceased operations 13 June 2024 and filed Chapter 7. The Nevada State Contractors Board suspended its licence on 18 June 2024 and later revoked it.",
    statusSource: "https://www.pv-tech.org/us-residential-installer-titan-solar-power-shuts-down-business/",
  },
  "freedom-forever": {
    status: "Bankrupt",
    statusNote:
      "Filed Chapter 11 on 15 April 2026 and converted to Chapter 7 liquidation on 7 August 2026 after its sale fell through. A trustee administers the estate; general claims were due 16 October 2026.",
    statusSource: "https://elevenflo.com/cases/freedom-forever-llc-13674/analysis",
  },
  sunnova: {
    status: "Bankrupt",
    statusNote:
      "Filed Chapter 11 on 8 June 2025 and sold substantially all assets. Sunnova has ceased independent operations; SunStrong Management services most in-service systems. Payment terms did not change for existing customers.",
    statusSource: "https://www.sunnova.com/",
  },
  "mosaic-solar": {
    status: "Bankrupt",
    statusNote:
      "Mosaic Sustainable Finance Corporation filed Chapter 11 on 6 June 2025. The plan took effect 22 September 2025 and loan servicing moved to Solar Servicing LLC, a Forbright Bank unit. The loans themselves were not cancelled.",
    statusSource: "https://cases.ra.kroll.com/MOSAIC",
  },
  "sunlight-financial": {
    status: "Acquired",
    statusNote:
      "Completed a prepackaged Chapter 11 restructuring in December 2023 and emerged under new ownership. Sunlight Financial LLC still operates and still services the loans; the bankruptcy did not cancel them.",
    statusSource: "https://www.bankruptcydata.com/feeds/blog/bankrupt-solar-companies",
  },
};

function escapeTs(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

let changed = 0;
for (const [slug, fix] of Object.entries(FIXES)) {
  const startMarker = `slug: "${slug}"`;
  const start = src.indexOf(startMarker);
  if (start === -1) {
    console.log(`SKIP  ${slug} — slug not found`);
    continue;
  }
  // Find the end of this company object: the next "\n  },\n" after start
  const end = src.indexOf("\n  },", start);
  if (end === -1) {
    console.log(`SKIP  ${slug} — object end not found`);
    continue;
  }
  const block = src.slice(start, end);

  // Replace the status line
  const statusRe = /status:\s*"[^"]*"/;
  if (!statusRe.test(block)) {
    console.log(`SKIP  ${slug} — no status field in block`);
    continue;
  }
  let newBlock = block.replace(statusRe, `status: "${fix.status}"`);

  // Remove any pre-existing statusNote/statusSource so re-runs stay clean
  newBlock = newBlock
    .replace(/\n\s*statusNote:\s*"(?:[^"\\]|\\.)*",?/g, "")
    .replace(/\n\s*statusSource:\s*"(?:[^"\\]|\\.)*",?/g, "");

  // Insert statusNote + statusSource right after the status line
  newBlock = newBlock.replace(
    /(status:\s*"[^"]*",)/,
    `$1\n    statusNote: "${escapeTs(fix.statusNote)}",\n    statusSource: "${escapeTs(fix.statusSource)}",`
  );

  if (newBlock !== block) {
    src = src.slice(0, start) + newBlock + src.slice(end);
    changed++;
    console.log(`FIXED ${slug} -> ${fix.status}`);
  } else {
    console.log(`OK    ${slug} — already correct`);
  }
}

// Add the two new fields to the CompanyData interface if absent
if (!src.includes("statusNote?:")) {
  src = src.replace(
    /(\n  status: string;[^\n]*\n)/,
    `$1  statusNote?: string; // why the status is what it is, dated by statusSource\n  statusSource?: string; // primary source URL for the status\n`
  );
  console.log("Added statusNote/statusSource to the CompanyData interface");
}

fs.writeFileSync(FILE, src);
console.log(`\n${changed} status value(s) changed.`);
