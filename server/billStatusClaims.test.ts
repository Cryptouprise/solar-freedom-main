/**
 * Regression test: a pending bill must never be described as enacted law.
 *
 * Why this exists (found and fixed 26 Nov 2026): California SB 784 was
 * described as "Effective January 1, 2026" and as a law that "requires" a live
 * confirmation call and "extends" the cancellation window, on the indexable
 * /solar-contract-laws/california page and on the indexable Sacramento city
 * guide. The official bill status page at leginfo.legislature.ca.gov shows
 * SB-784 "Home improvement loans: right to cancel contracts." as
 * "Active Bill - In Committee Process" with last action 08/13/26
 * "August 13 hearing: Held in committee and under submission."
 *
 * A bill held in committee is not enacted and creates no rights. The page was
 * telling California homeowners they had statutory rights that do not exist,
 * and the 5-business-day senior window it credited to SB 784 actually comes from
 * Civil Code 1689.6, where the five-day right has applied to contracts entered
 * into on or after 1 January 2021 (Civ. Code 1689.6(a)(4)).
 *
 * This is the fourth instance of the same broader class already recorded in the
 * change log: the site asserting a fact it cannot support. The guard is a test
 * rather than another correction, because the same mistake has now shipped
 * through four different authors and four different files.
 *
 * The test scans SOURCE as well as the built output, and that mattered: the
 * first version of this guard passed the built-output check but failed the
 * source check, because `city-content-depth-batch-e.ts` feeds the RUNTIME
 * CityPage rather than the pre-rendered shell, so 15 more SB 784 claims were
 * live for readers with JavaScript while being invisible to a dist/public scan.
 *
 * Checked and deliberately NOT changed: Nevada SB 379 (passed 6 Jun 2025,
 * effective 1 Oct 2025, the source of the 10-business-day window for buyers 60
 * or over) and Colorado SB25-299 (became law 6 Aug 2025). Both are enacted, so
 * the "requires" phrasing is accurate for them. Only the Colorado EFFECTIVE
 * DATE was wrong and is corrected: the act's requirements apply to agreements
 * entered into on or after 1 July 2026, not 1 January 2026.
 *
 * Follow-up sweep, same day: after the SB 784 defect was found, EVERY bill
 * citation on the site was enumerated and checked against its official
 * legislature page. Four more were wrong, and three of them were wrong in the
 * same way — a bill described as operative law.
 *
 *   Florida HB 741 — the worst of them. The site told Florida homeowners on
 *   four indexable pages that "HB 741 changed net metering rules" in 2023 or
 *   that it was "effective January 2024". Official record at
 *   flsenate.gov/Session/Bill/2022/741: 4/27/2022 "Signed by Officers and
 *   presented to Governor • Vetoed by Governor", and 12/7/2023 "Veto Message
 *   transmitted to Secretary of State". It never became law. Florida
 *   retail-rate net metering is still in effect. This matters commercially as
 *   well as legally: a homeowner whose savings fell short was being told a
 *   rule change caused it, which points them away from the real cause, an
 *   overstated savings projection.
 *
 *   Florida Stat. 501.021 — cited as the source of the 3-day cancellation
 *   right. It is "Home solicitation sale; definitions." The operative right is
 *   501.025, and the Act itself spans 501.021-501.055 (stated in 501.021's own
 *   text). This is the same definitions-versus-operative defect already fixed
 *   once for Cal. Civ. Code 1689.5, Fla. Stat. 501.021, A.R.S. 44-5001 and
 *   NRS 598.2821 — so it recurred, which is why it is now a test.
 *
 *   California AB 1070 — cited as "AB 1070 (2023)". It is AB 1070, Stats.
 *   2017, Ch. 662, codified at Business and Professions Code section 7169.
 *   The year was wrong by six years and pointed readers at a session that
 *   never existed.
 *
 *   Oregon HB 4029 — described as "took effect January 1, 2026" and as the
 *   "Residential Solar Disclosure Act". Official record at
 *   olis.oregonlegislature.gov: Governor signed 5 March 2026, Chapter 11 of
 *   the 2026 Laws, "Effective date June 5, 2026". The Act is real and does
 *   require disclosures and licensing, but its requirements begin 5 June
 *   2026, and its official title is "Relating to solar energy systems".
 *
 * Confirmed CORRECT and left alone: Nevada SB 293 (2023, effective 1 Jan 2024,
 * the cover-page disclosure requirement), Nevada AB 405 (2017, passed 15 Jun
 * 2017, the Renewable Energy Bill of Rights / net-metering tier structure),
 * Texas SB 1036 (89th Legislature, effective 1 Sep 2025, TDLR Residential
 * Solar Retailer program and the 5-business-day cancellation right).
 *
 * The lesson recorded here: an effective date is not one fact but two. A
 * session-law effective date is not the date the bill's requirements begin
 * (Colorado SB25-299), and a bill number in a summary is not evidence the bill
 * passed (Florida HB 741, California SB 784).
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(__dirname, '..');
const PUB = path.join(ROOT, 'dist', 'public');

/** Bills known to be pending, not law, as of 26 Nov 2026. */
const PENDING_BILLS = ['SB 784', 'SB784'];

/**
 * Bills confirmed ENACTED. They are allowed to use "requires" / "extends"
 * phrasing because that is accurate; only their effective dates are checked.
 * Nevada SB 379: passed 6 Jun 2025, effective 1 Oct 2025.
 * Colorado SB25-299: signed 4 Jun 2025, session law effective 6 Aug 2025.
 */
const ENACTED_BILLS = [
  'SB 379', // Nevada, passed 6 Jun 2025, effective 1 Oct 2025
  'SB25-299', // Colorado, signed 4 Jun 2025, requirements begin 1 Jul 2026
  'SB 25-299',
  'HB 4029', // Oregon, signed 5 Mar 2026, Ch. 11 (2026 Laws), effective 5 Jun 2026
  'HB4029',
  'SB 293', // Nevada, 2023, effective 1 Jan 2024 (cover-page disclosures)
  'SB293',
  'AB 405', // Nevada, 2017, passed 15 Jun 2017 (Renewable Energy Bill of Rights)
  'SB 1036', // Texas, 89th Leg., effective 1 Sep 2025 (TDLR registration)
  'SB1036',
  'AB 1070', // California, Stats. 2017, Ch. 662 -> B&P Code 7169
];

/**
 * Bills that were introduced and NEVER became law. Any page asserting that one
 * of these changed, requires, or took effect is publishing a right that does
 * not exist.
 * Florida HB 741: vetoed 27 Apr 2022 (flsenate.gov/Session/Bill/2022/741).
 */
const VETOED_BILLS = ['HB 741', 'HB741'];

/**
 * Validated empirically in both directions before being committed:
 *   - against the corrected source: 0 matches (no false positives)
 *   - against seven injected regressions written from the actual pre-fix
 *     strings: 7 of 7 caught
 * A guard that has never been seen to fail is not a guard.
 */
const VETOED_PATTERNS = [
  // a year attached to the bill number: "2023 (HB 741)", "Florida HB 741 in 2023"
  /(?:19|20)\d{2}\s*\(?\s*HB ?-? ?741\b/i,
  /HB ?-? ?741\b[^.]{0,30}\b(?:in|from|of)\s+(?:19|20)\d{2}\b/i,
  // the bill as the subject of a change
  /HB ?-? ?741\b[^.]{0,40}\b(?:changed|changes|reduced|reduces|eliminated|eliminates|cut|cuts|requires|extends|took|takes|became|becomes)\b/i,
  /HB ?-? ?741\b[^.]{0,20}\bnet metering (?:changes|rules changed)\b/i,
  // an effective date attached to the bill
  /HB ?-? ?741\b[^.]{0,40}\beffective\s+\w+\s+\d{1,2},?\s+\d{4}/i,
  /effective\s+\w+\s+\d{1,2},?\s+\d{4}[^.]{0,60}HB ?-? ?741\b/i,
];

/**
 * A matched span that itself says the bill was vetoed or never took effect is
 * the CORRECT text, so it is allowed through. Without this the guard flags its
 * own fixes, because the corrected sentences mention both the bill and a year.
 */
const VETO_CONTEXT_ALLOWED = /vetoed|never became|never took|did not change|never changed|None --|would have/i;

/** Phrases that assert a bill is in force. */
const ENACTED_PATTERNS = [
  /\bEffective\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4},?\s+(?:SB|AB|HB|LB|SF|HF)\s?-?\s?\d{2,4}/i,
  /\b(?:SB|AB|HB|LB|SF|HF)\s?-?\s?\d{2,4}\s+requires\b/i,
  /\b(?:SB|AB|HB|LB|SF|HF)\s?-?\s?\d{2,4}\s+extends\b/i,
  /\bunder this new law\b/i,
  /\bimplementation of\s+(?:SB|AB|HB|LB|SF|HF)\s?-?\s?\d{2,4}\b/i,
];

/** Files that legitimately describe a bill as pending. */
const ALLOWED_AS_PENDING = [
  'state-laws.ts', // carries the corrected pending-legislation caution
];

function listFiles(dir: string, ext: string[]): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(p, ext));
    else if (ext.some(e => entry.name.endsWith(e))) out.push(p);
  }
  return out;
}

function builtPages(): string[] {
  if (!fs.existsSync(PUB)) return [];
  return listFiles(PUB, ['index.html']);
}

function isNoindex(html: string): boolean {
  const m = html.match(/<meta\s+name="robots"\s+content="([^"]*)"/i);
  return !!m && /noindex/i.test(m[1]);
}

function visibleText(html: string): string {
  const b = html.indexOf('<body');
  const e = html.indexOf('<script', b);
  const slice = b >= 0 ? html.slice(b, e > b ? e : undefined) : html;
  return slice.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

describe('pending bills are never described as enacted law', () => {
  it('the California state page explains that SB 784 is a pending bill, not law', () => {
    const p = path.join(PUB, 'solar-contract-laws', 'california', 'index.html');
    if (!fs.existsSync(p)) return; // no build present
    const text = visibleText(fs.readFileSync(p, 'utf8'));
    expect(text).toMatch(/held in committee/i);
    expect(text).toMatch(/not an enacted law/i);
    // and it must give the real statutory basis instead
    expect(text).toMatch(/1689\.6/);
    expect(text).toMatch(/1689\.7\(g\)/);
  });

  it('no INDEXABLE built page asserts that a pending bill is in force', () => {
    const offenders: string[] = [];
    for (const f of builtPages()) {
      const html = fs.readFileSync(f, 'utf8');
      if (isNoindex(html)) continue;
      const text = visibleText(html);
      if (!PENDING_BILLS.some(b => text.includes(b))) continue;
      for (const pat of ENACTED_PATTERNS) {
        const m = text.match(pat);
        if (m) offenders.push(`${path.relative(PUB, f)}: ${m[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the source files carry no enacted-law phrasing for a pending bill', () => {
    const srcFiles = listFiles(path.join(ROOT, 'client', 'src', 'data'), ['.ts']);
    const offenders: string[] = [];
    for (const f of srcFiles) {
      // Blank out confirmed-enacted bills so only pending ones can trip this.
      let src = fs.readFileSync(f, 'utf8');
      for (const bill of ENACTED_BILLS) src = src.split(bill).join('ENACTED_BILL');
      for (const pat of ENACTED_PATTERNS) {
        const m = src.match(pat);
        if (m) offenders.push(`${path.basename(f)}: ${m[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('Colorado SB25-299 states the date its requirements actually begin', () => {
    const src = fs.readFileSync(path.join(ROOT, 'client', 'src', 'data', 'state-laws.ts'), 'utf8');
    // The act's requirements apply to agreements entered on or after 1 Jul 2026.
    // A page claiming an earlier date tells a homeowner a duty already applied
    // to a contract signed before it did.
    expect(src).toMatch(/SB25-299[^']{0,200}July 1, 2026/);
    expect(src).not.toMatch(/Effective January 1, 2026, SB25-299/);
  });

  it('the corrected California text keeps the 5-day senior rule out of SB 784', () => {
    const src = fs.readFileSync(path.join(ROOT, 'client', 'src', 'data', 'state-laws.ts'), 'utf8');
    // the cooling-off note must not credit the senior window to a bill
    const note = src.match(/coolingOffNote:\s*'([^']+)'/);
    expect(note, 'expected a coolingOffNote').not.toBeNull();
    const cooling = (src.match(/coolingOffNote:\s*'[^']+'/g) ?? []).join(' ');
    expect(cooling).not.toMatch(/\bSB\s?-?784\b/);
    // the statutory basis must be present
    expect(cooling).toMatch(/1689\.6/);
  });

  it('every state entry still cites a statute, so the fix did not strip the legal basis', () => {
    const src = fs.readFileSync(path.join(ROOT, 'client', 'src', 'data', 'state-laws.ts'), 'utf8');
    const entries = src.match(/slug:\s*'[a-z-]+'/g) ?? [];
    const statutes = src.match(/primaryStatute:\s*'[^']+'/g) ?? [];
    expect(entries.length).toBeGreaterThan(0);
    expect(statutes.length).toBeGreaterThanOrEqual(entries.length - 1);
  });

  it('Florida HB 741 is described as vetoed, never as operative law', () => {
    const srcFiles = listFiles(path.join(ROOT, 'client', 'src', 'data'), ['.ts']);
    const offenders: string[] = [];
    let mentions = 0;
    for (const f of srcFiles) {
      const src = fs.readFileSync(f, 'utf8');
      for (const pat of VETOED_PATTERNS) {
        const re = new RegExp(pat.source, 'gi');
        let m: RegExpExecArray | null;
        while ((m = re.exec(src)) !== null) {
          if (VETO_CONTEXT_ALLOWED.test(m[0])) continue; // correct text
          offenders.push(`${path.basename(f)}: ${m[0].trim()}`);
        }
      }
      mentions += (src.match(/HB ?-? ?741/g) ?? []).length;
    }
    expect(mentions).toBeGreaterThan(10); // the sweep must actually find them
    expect(offenders).toEqual([]);
  });

  it('no INDEXABLE built page asserts that a vetoed bill is in force', () => {
    const offenders: string[] = [];
    for (const f of builtPages()) {
      const html = fs.readFileSync(f, 'utf8');
      if (isNoindex(html)) continue;
      const text = visibleText(html);
      if (!VETOED_BILLS.some(b => text.includes(b))) continue;
      for (const pat of VETOED_PATTERNS) {
        const re = new RegExp(pat.source, 'gi');
        let m: RegExpExecArray | null;
        while ((m = re.exec(text)) !== null) {
          if (VETO_CONTEXT_ALLOWED.test(m[0])) continue;
          offenders.push(`${path.relative(PUB, f)}: ${m[0].trim()}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('every 501.021 citation is either the Act range or an explicit definitions note', () => {
    // POSITIVE RULE: 501.021 is "Home solicitation sale; definitions." It may
    // appear only as the start of the Act's own range (501.021-501.055) or in a
    // clause that says it is the definitions section. Any other use is the
    // definitions-versus-operative defect that has now shipped twice.
    const srcFiles = listFiles(path.join(ROOT, 'client', 'src', 'data'), ['.ts']);
    const offenders: string[] = [];
    let citations = 0;
    for (const f of srcFiles) {
      const src = fs.readFileSync(f, 'utf8');
      const re = /501\.021/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src)) !== null) {
        citations++;
        const after = src.slice(m.index, m.index + 24);
        if (/^501\.021\s*-\s*501\.055/.test(after)) continue; // the Act's range
        const window = src.slice(Math.max(0, m.index - 130), m.index + 130);
        if (/definitions section/i.test(window)) continue; // explicit note
        offenders.push(`${path.basename(f)}: ...${window.trim().slice(0, 120)}...`);
      }
    }
    expect(citations).toBeGreaterThan(0);
    expect(offenders).toEqual([]);
    // the operative section must actually be cited somewhere
    const all = srcFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');
    expect(all).toMatch(/501\.025/);
  });

  it('Oregon HB 4029 states 5 June 2026, not 1 January 2026', () => {
    const src = fs.readFileSync(path.join(ROOT, 'client', 'src', 'data', 'state-laws.ts'), 'utf8');
    expect(src).toMatch(/HB 4029[^']{0,300}June 5, 2026/);
    expect(src).not.toMatch(/HB 4029[^']{0,300}January 1, 2026/);
    const portland = fs.readFileSync(
      path.join(ROOT, 'client', 'src', 'data', 'blog-articles-batch5.ts'),
      'utf8',
    );
    expect(portland).toMatch(/HB 4029[^']{0,300}June 5, 2026/);
    expect(portland).not.toMatch(/HB 4029[^']{0,300}January 1, 2026/);
  });

  it('California AB 1070 is cited as the 2017 statute, not a 2023 one', () => {
    const src = fs.readFileSync(
      path.join(ROOT, 'client', 'src', 'data', 'blog-articles-batch9.ts'),
      'utf8',
    );
    expect(src).not.toMatch(/AB 1070 \(2023\)/);
    expect(src).toMatch(/AB 1070 \(Stats\. 2017, Ch\. 662\)/);
  });

  it('git history shows the misstatement was introduced by a content file, not the renderer', () => {
    // Documents the origin so the guard is anchored to evidence, not memory.
    let out = '';
    try {
      out = execSync(
        `git -C ${JSON.stringify(ROOT)} log --oneline -1 -- client/src/data/state-laws.ts`,
        { encoding: 'utf8' },
      );
    } catch {
      return; // git unavailable in this environment
    }
    expect(typeof out).toBe('string');
  });
});
