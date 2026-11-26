#!/usr/bin/env node
/**
 * Escapes unescaped apostrophes inside single-quoted TypeScript strings within
 * the Freedom Forever article block only.
 *
 * WHY A SCANNER: a naive replace cannot tell an apostrophe from a string
 * terminator. "the installer's failure.' }" and "the debtors' project" both
 * have a letter before the quote, so a regex either misses one or breaks the
 * other. The reliable rule is what follows the quote: a terminator is followed
 * (after optional spaces) by a comma, brace, bracket or paren; anything else is
 * part of the prose.
 */
import fs from "node:fs";
import path from "node:path";

const FILE = path.resolve(process.cwd(), "client/src/data/blog-articles-batch9.ts");
let src = fs.readFileSync(FILE, "utf8");

const START = src.indexOf("slug: 'freedom-forever-solar-bankruptcy-what-homeowners-can-do-2026'");
if (START === -1) throw new Error("Freedom Forever slug not found");
const END = src.indexOf("\n  },\n", START);
if (END === -1) throw new Error("Freedom Forever object end not found");

let block = src.slice(START, END);
const TERMINATORS = new Set([",", "}", "]", ")"]);

let out = "";
let inString = false;
let escaped = 0;

for (let i = 0; i < block.length; i++) {
  const ch = block[i];

  if (!inString) {
    out += ch;
    if (ch === "'") inString = true;
    continue;
  }

  if (ch === "\\") {
    // Copy the escape and the escaped char verbatim
    out += ch + (block[i + 1] ?? "");
    i++;
    continue;
  }

  if (ch === "'") {
    // Decide: terminator or apostrophe?
    let j = i + 1;
    while (j < block.length && (block[j] === " " || block[j] === "\t")) j++;
    const next = block[j];
    if (TERMINATORS.has(next) || next === undefined || next === "\n") {
      // Real terminator
      out += ch;
      inString = false;
      continue;
    }
    // Apostrophe inside prose — escape it
    out += "\\'";
    escaped++;
    continue;
  }

  out += ch;
}

src = src.slice(0, START) + out + src.slice(END);
fs.writeFileSync(FILE, src);
console.log(`Escaped ${escaped} apostrophe(s) in the Freedom Forever block.`);
