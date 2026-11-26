import { describe, expect, it } from "vitest";
import {
  CHANGE_LOG,
  changeLogByClass,
  pendingMeasurements,
  recurringClasses,
  type ChangeEntry,
} from "../shared/changeLog";

/**
 * The owner asked to always be able to see what changed, why, and how the conclusion
 * was reached — and to never repeat the same mistake. A log that is only maintained by
 * good intentions decays within weeks, so these tests enforce the rules that make the
 * log worth reading:
 *
 *   1. Every entry carries dated, numbered evidence. "Improved the title" is not
 *      evidence; "ranks 10.5 for 'tesla ucc termination', 14 impressions" is.
 *   2. Every entry states how the conclusion was reached.
 *   3. Every entry names the command that proved it.
 *   4. Any class of defect that has occurred more than once must carry a guard that
 *      fails the build if it recurs. This is the rule that turns a correction into a
 *      prevention.
 *   5. A change targeting a metric must not be judged before its window closes.
 */

const DATE_RE = /\b(20\d{2}-\d{2}-\d{2}|on \d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}|\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) 20\d{2})\b/i;
const NUMBER_RE = /\b\d[\d,.]*\b/;

describe("change log entries are usable as a record", () => {
  it("has at least one entry", () => {
    expect(CHANGE_LOG.length).toBeGreaterThan(0);
  });

  it("uses ISO dates in a sortable form", () => {
    for (const entry of CHANGE_LOG) {
      expect(entry.date, entry.title).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("names the files it changed", () => {
    for (const entry of CHANGE_LOG) {
      expect(entry.changed.length, entry.title).toBeGreaterThan(0);
      for (const line of entry.changed) {
        expect(line.trim().length, entry.title).toBeGreaterThan(8);
      }
    }
  });

  it("gives evidence containing both a number and a date", () => {
    // Without a number the reason is an opinion. Without a date it cannot be
    // re-checked later, which is how stale claims survive in copy.
    for (const entry of CHANGE_LOG) {
      expect(entry.evidence, `${entry.title} — needs a number`).toMatch(NUMBER_RE);
      expect(entry.evidence, `${entry.title} — needs a date`).toMatch(DATE_RE);
    }
  });

  it("explains how the conclusion was reached", () => {
    for (const entry of CHANGE_LOG) {
      expect(entry.reasoning.length, entry.title).toBeGreaterThan(80);
    }
  });

  it("names the exact command that verified the change", () => {
    for (const entry of CHANGE_LOG) {
      expect(entry.verifiedBy.length, entry.title).toBeGreaterThan(15);
      // "tested" or "verified" alone is not a command.
      expect(entry.verifiedBy.trim().toLowerCase(), entry.title).not.toBe("tested");
      expect(entry.verifiedBy.trim().toLowerCase(), entry.title).not.toBe("verified");
    }
  });

  it("never records an unverified claim as a shipped change", () => {
    // An "unverified" entry may exist as a record of what must NOT ship, but it
    // must say so. Anything presented as a completed change must be measured or
    // verified against a primary source.
    for (const entry of CHANGE_LOG) {
      if (entry.confidence === "unverified") {
        expect(
          `${entry.evidence} ${entry.reasoning}`.toLowerCase(),
          `${entry.title} — an unverified entry must state that it did not ship`,
        ).toMatch(/not ship|must not ship|withheld|did not ship/);
      }
    }
  });
});

describe("recurring defect classes must carry a guard", () => {
  it("gives every repeated class a recurrence guard", () => {
    // This is the rule that matters most. If a class of defect has happened more
    // than once, correcting it was demonstrably not enough.
    const recurring = new Set(recurringClasses());
    const offenders: string[] = [];
    for (const entry of CHANGE_LOG) {
      if (recurring.has(entry.class) && !entry.preventsRecurrence) {
        offenders.push(`${entry.class}: ${entry.title}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("requires the guard to be specific, not a promise to be careful", () => {
    const vague = /^(be careful|remember|double.?check|review|pay attention)/i;
    for (const entry of CHANGE_LOG) {
      if (!entry.preventsRecurrence) continue;
      expect(entry.preventsRecurrence, entry.title).not.toMatch(vague);
      expect(entry.preventsRecurrence.length, entry.title).toBeGreaterThan(40);
    }
  });

  it("keeps accuracy as a tracked recurring class", () => {
    // Citation errors have shipped three times (AB 458, NRS 704.7801, and four
    // state sections). If this ever stops being a recurring class it should be
    // because the guard works, not because the entries were deleted.
    const byClass = changeLogByClass();
    expect(byClass.accuracy?.length ?? 0).toBeGreaterThan(1);
  });
});

describe("no result is claimed before its window closes", () => {
  it("keeps pending measurements out of any reported outcome", () => {
    // A ranking change cannot be judged on the day it ships. Entries that target a
    // metric carry the date the comparison becomes fair.
    const entriesWithTargets = CHANGE_LOG.filter(e => e.measureAfter);
    for (const entry of entriesWithTargets) {
      expect(entry.measureAfter, entry.title).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("reports a change as pending until its measurement date passes", () => {
    const before = pendingMeasurements("2026-11-26");
    const after = pendingMeasurements("2099-01-01");
    // A change shipped 26 Nov 2026 cannot be judged on the day it shipped, so at
    // least one entry must still be pending at that date, and nothing may remain
    // pending forever.
    expect(before.length).toBeGreaterThan(0);
    expect(after.length).toBe(0);
  });
});

describe("the log stays readable", () => {
  it("gives every entry a short, specific title", () => {
    for (const entry of CHANGE_LOG) {
      expect(entry.title.length, entry.title).toBeGreaterThan(15);
      expect(entry.title.length, entry.title).toBeLessThan(120);
      expect(entry.title.trim(), entry.title).toBe(entry.title);
    }
  });

  it("does not contain duplicate entries", () => {
    const seen = new Set<string>();
    for (const entry of CHANGE_LOG) {
      const key = `${entry.date}::${entry.title}`;
      expect(seen.has(key), `duplicate entry: ${key}`).toBe(false);
      seen.add(key);
    }
  });

  it("uses only the declared classes", () => {
    const allowed = new Set([
      "content",
      "SEO",
      "defect",
      "accuracy",
      "infrastructure",
      "conversion",
    ]);
    for (const entry of CHANGE_LOG) {
      expect(allowed.has(entry.class), `${entry.title} — unknown class ${entry.class}`).toBe(true);
    }
  });
});

// Type-level check: the exported entry type stays compatible with the data.
const _typecheck: ChangeEntry[] = CHANGE_LOG;
void _typecheck;
