import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Nevada citation integrity.
 *
 * Two wrong citations shipped in customer-facing copy and were verified wrong
 * against primary sources before being corrected:
 *
 *  - AB 458 (2025, Chapter 254) is the solar-powered AFFORDABLE HOUSING bill. It
 *    authorises affordable-housing systems to participate in net metering. It is
 *    not a consumer-protection vehicle and cannot void a homeowner's contract.
 *  - NRS 704.7801 is a DEFINITIONS section ("As used in NRS 704.7801 to
 *    704.7828... the words and terms defined in NRS 704.7802 to 704.7819"). It
 *    imposes no disclosure duty on solar companies.
 *
 * The correct anchors are NRS 598.98216 (3-business-day rescission, 10 for 60+),
 * NRS 598.982148 (3-year voidability for licence defects), NRS 598.9822
 * (knowing non-compliance makes the agreement voidable) and NRS 598.9819 /
 * 598.982183 (utility-rate disclaimers).
 */

const DATA_DIR = path.join(process.cwd(), 'client/src/data');

function readAllSourceFiles(): Array<{ file: string; text: string }> {
  return fs
    .readdirSync(DATA_DIR)
    .filter((name) => name.endsWith('.ts') || name.endsWith('.json'))
    .map((name) => ({
      file: name,
      text: fs.readFileSync(path.join(DATA_DIR, name), 'utf8'),
    }));
}

describe('Nevada solar citations', () => {
  it('never presents AB 458 as a consumer-protection or cancellation vehicle', () => {
    for (const { file, text } of readAllSourceFiles()) {
      expect(text, `${file} still cites AB 458`).not.toMatch(/AB\s?458/);
    }
  });

  it('never presents NRS 704.7801 as a solar disclosure statute', () => {
    for (const { file, text } of readAllSourceFiles()) {
      expect(text, `${file} still cites NRS 704.7801`).not.toMatch(/704\.7801/);
    }
  });

  it('never presents SB 440 as the solar consumer-protection statute', () => {
    // SB 440 (2025) is the HOA and utility-timeline bill. The solar lending,
    // leasing and rescission rewrite is SB 379.
    for (const file of ['state-laws.ts', 'blog-articles-batch5.ts']) {
      const text = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
      expect(text, `${file} still cites SB 440`).not.toMatch(/SB\s?440/);
    }
  });

  it('keeps the verified Nevada anchors present in the state-law page', () => {
    const text = fs.readFileSync(path.join(DATA_DIR, 'state-laws.ts'), 'utf8');
    for (const anchor of ['598.98216', '598.982148', '598.9822', '598.9819']) {
      expect(text, `state-laws.ts is missing ${anchor}`).toContain(anchor);
    }
    // The senior window is the single clearest differentiation point in the
    // Nevada market and must not be silently dropped.
    expect(text).toMatch(/60 or older/i);
  });

  it('hedges the demand-charge date rather than asserting a fixed start', () => {
    const text = fs.readFileSync(path.join(DATA_DIR, 'state-laws.ts'), 'utf8');
    expect(text).toMatch(/1 January 2027/);
    expect(text).toMatch(/appeal/i);
    // The superseded April 2026 start date must not be presented as current.
    expect(text).not.toMatch(/Daily Demand Charge[s]? (is|are) (now )?in effect/i);
  });

  it('does not overstate NRS 598.982148 beyond its power-purchase-agreement scope', () => {
    // Verified 2026-11-03 against the statutory title and SB 440 Sec. 14.4:
    // "Power purchase agreement voidable by host customer if solar installation
    // company is not properly licensed or acting within monetary limit of
    // license". The three-year licence-defect rule is written for PPAs.
    //
    // An earlier draft said "the loan, lease or power purchase agreement is
    // voidable for three years", which extends a PPA-specific remedy to leases
    // and financed purchases. That is a precision defect in customer-facing
    // legal copy, and in this niche it is exactly the kind of overstatement that
    // damages credibility with an attorney or a sharp homeowner.
    const files = ['state-laws.ts', 'blog-articles-batch15.ts'];
    const overstatements = [
      /loan,\s*lease\s*or\s*power\s*purchase\s*agreement\s*is\s*voidable/i,
      /loan,\s*lease\s*or\s*PPA\s*is\s*voidable/i,
      /an\s+agreement\s+is\s+voidable\s+for\s+three\s+years/i,
    ];
    for (const file of files) {
      const text = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
      for (const pattern of overstatements) {
        expect(text, `${file} overstates the NRS 598.982148 scope`).not.toMatch(pattern);
      }
      // The corrected copy must name the PPA scope explicitly.
      expect(text, `${file} should name the PPA scope of 598.982148`).toMatch(
        /power\s+purchase\s+agreement\s+is\s+voidable/i,
      );
    }
  });
});
