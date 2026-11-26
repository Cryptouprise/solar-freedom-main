#!/usr/bin/env node
/**
 * Reconcile the blogPosts table with the code.
 *
 * WHY: the runtime DB overlay (server/seo-meta.ts -> applyDbOverlayToPrerendered)
 * lets a database row override the title and description that the repo defines.
 * Every one of the 25 rows currently differs from the code, so SEO title work
 * done in the repo never reaches a visitor or a crawler.
 *
 * WHAT IT DOES
 *   - For posts that also exist in the code: clear the DB metaTitle/metaDescription
 *     so the code value is served. This is reversible (originals are printed and
 *     written to a JSON file before any write).
 *   - For posts that exist ONLY in the database: leave them completely alone.
 *     They are published content with no code fallback, so clearing their meta
 *     would strip the only title they have. They are reported instead.
 *
 * Usage:
 *   node scripts/reconcile-blog-db.mjs           # dry run, no writes
 *   node scripts/reconcile-blog-db.mjs --apply   # perform the update
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';

const APPLY = process.argv.includes('--apply');
const BACKUP = '/home/ubuntu/solar-freedom-deliverables/db-meta-backup.json';

// Titles/descriptions that must never be cleared because they are the only
// source. Populated at runtime by checking the code.
const codeSlugs = new Set();
const dir = 'client/src/data';
for (const f of fs.readdirSync(dir).filter(f => f.startsWith('blog') && f.endsWith('.ts'))) {
  const text = fs.readFileSync(`${dir}/${f}`, 'utf8');
  for (const m of text.matchAll(/slug:\s*[`"']([^`"']+)[`"']/g)) codeSlugs.add(m[1]);
}

const c = await mysql.createConnection({ uri: process.env.DATABASE_URL, connectTimeout: 15000 });
const [rows] = await c.query('SELECT slug, metaTitle, metaDescription FROM blogPosts ORDER BY slug');

const backup = [];
const toClear = [];
const dbOnly = [];
for (const r of rows) {
  backup.push({ slug: r.slug, metaTitle: r.metaTitle, metaDescription: r.metaDescription });
  if (codeSlugs.has(r.slug)) toClear.push(r);
  else dbOnly.push(r);
}

console.log(`DB rows: ${rows.length}`);
console.log(`In code (will clear DB override so code wins): ${toClear.length}`);
console.log(`DB-only (untouched, no code fallback exists): ${dbOnly.length}\n`);

console.log('--- WILL CLEAR (code becomes the source) ---');
for (const r of toClear) {
  console.log(`  ${r.slug}`);
  console.log(`    was: ${r.metaTitle}`);
}
console.log('\n--- UNTOUCHED (database-only content) ---');
for (const r of dbOnly) console.log(`  ${r.slug}  "${r.metaTitle}"`);

if (!APPLY) {
  console.log('\nDRY RUN. Re-run with --apply to write.');
  await c.end();
  process.exit(0);
}

fs.mkdirSync('/home/ubuntu/solar-freedom-deliverables', { recursive: true });
fs.writeFileSync(BACKUP, JSON.stringify(backup, null, 2));
console.log(`\nBackup written to ${BACKUP}`);

const slugs = toClear.map(r => r.slug);
if (slugs.length) {
  const [res] = await c.query(
    'UPDATE blogPosts SET metaTitle = NULL, metaDescription = NULL WHERE slug IN (?)',
    [slugs]
  );
  console.log(`Updated ${res.affectedRows} rows.`);
}
await c.end();
