#!/usr/bin/env node
/**
 * Adds contextual in-body internal links to the ADT Solar complaints page.
 *
 * WHY (Search Console, 1 Sep - 22 Nov 2026):
 *   /blog/adt-solar-complaints is our single largest near-winner: 1,828
 *   impressions across 34 queries and only 4 clicks. Top queries:
 *     "adt solar reviews"           856 impr, pos 12.5, 0 clicks
 *     "adt solar customer service"  223 impr, pos 10.9, 2 clicks
 *     "tesla vs adt solar"          118 impr, pos 10.4, 0 clicks
 *   A page at position 10-12 with a 0.2% CTR is not losing on relevance, it is
 *   losing on authority. Nothing in the codebase linked to it: a repo-wide grep
 *   for its slug returned exactly one hit, its own definition. It is an orphan.
 *
 *   RelatedSlugs cannot fix this. client/src/pages/BlogPost.tsx calls
 *   getRelatedPosts(slug, 3), so any slug beyond the third is never rendered.
 *   The link has to live in body copy to be crawled as a real contextual link.
 *
 * Placement rationale — the link is added where the reader has just been told
 * their installer is gone, which is exactly when "what happened to the others"
 * is the live question. Two anchors:
 *   - Sunrun complaints (California) page: the company-collapse passage.
 *   - Vivint / NRG transition page: the "installer is no longer the party you
 *     signed with" passage.
 * Both are topically adjacent to ADT's own story (ADT's parent exited
 * residential solar), so the link reads as help, not as link-building.
 *
 * Idempotent.
 */
import fs from "node:fs";

const TARGET = "/blog/adt-solar-complaints";
const MARK = "[ADT Solar complaints and reviews]";

const JOBS = [
  {
    file: "client/src/data/blog-articles-batch6.ts",
    slug: "sunrun-complaints-california",
    // Anchor on a stable phrase inside the object, then append a sentence.
    anchor: "Sunrun",
    build: (src, slugIdx) => {
      // Find the end of the first content paragraph to append after it.
      const cIdx = src.indexOf("content: [", slugIdx);
      if (cIdx === -1) return null;
      const pEnd = src.indexOf("},", cIdx);
      if (pEnd === -1) return null;
      const sentence = `\n      { type: 'p', content: 'If what you actually want is a sense of how these failures compare across installers, the [ADT Solar complaints and reviews](${TARGET}) page lays out what happened when a national security company exited residential solar entirely — and what that meant for the homeowners holding its contracts.' },`;
      return { at: pEnd + 2, text: sentence };
    },
  },
  {
    file: "client/src/data/blog-articles-batch10.ts",
    slug: "vivint-solar-complaints-2026-cancellation-guide",
    build: (src, slugIdx) => {
      const cIdx = src.indexOf("content: [", slugIdx);
      if (cIdx === -1) return null;
      const pEnd = src.indexOf("},", cIdx);
      if (pEnd === -1) return null;
      const sentence = `\n      { type: 'p', content: 'The pattern is not unique to Vivint. When a parent company decides residential solar is no longer worth it, homeowners are left holding agreements with an entity that no longer wants the business — the [ADT Solar complaints and reviews](${TARGET}) page documents the clearest recent example and what homeowners did about it.' },`;
      return { at: pEnd + 2, text: sentence };
    },
  },
];

let changed = 0;

for (const job of JOBS) {
  const path = job.file;
  let src = fs.readFileSync(path, "utf8");

  if (src.includes(`(${TARGET})`)) {
    console.log(`SKIP ${job.slug}: link already present in ${path}`);
    continue;
  }

  // Resolve the slug with any of the three quote styles used in the repo.
  let slugIdx = -1;
  for (const q of ["'", '"', "`"]) {
    slugIdx = src.indexOf(`slug: ${q}${job.slug}${q}`);
    if (slugIdx !== -1) break;
  }
  if (slugIdx === -1) {
    console.warn(`WARN ${job.slug}: slug not found in ${path}; skipped.`);
    continue;
  }

  const built = job.build(src, slugIdx);
  if (!built) {
    console.warn(`WARN ${job.slug}: could not locate content array; skipped.`);
    continue;
  }

  src = src.slice(0, built.at) + built.text + src.slice(built.at);
  fs.writeFileSync(path, src);
  console.log(`OK ${job.slug}: added contextual link in ${path}`);
  changed += 1;
}

console.log(`\nDone. ${changed} file(s) modified.`);
