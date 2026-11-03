import { describe, expect, it } from 'vitest';
import {
  computeRemainingPayments,
  MAX_MONTHLY_PAYMENT,
  MAX_YEARS_REMAINING,
} from '../shared/remainingPayments';

/**
 * A 20-case matrix for the calculator's remaining-payments arithmetic.
 *
 * The motivating defect: a competitor calculator in this market returns
 * "Annual Savings $1,051,200" for a $150 monthly bill. Any figure of that shape
 * is a red flag, and the way to prevent our own version is a fixed matrix that
 * pins the expected output for representative and adversarial inputs.
 *
 * The matrix deliberately includes the inputs that a naive `parseFloat` would
 * mishandle, because those are the ones that produce confident wrong numbers
 * rather than visible failures.
 */

const cases: Array<{
  name: string;
  payment: string | number;
  years: string | number;
  expectedTotal: number;
  expectedIncomplete: boolean;
}> = [
  // ── Ordinary in-range inputs ───────────────────────────────────────────────
  { name: 'typical Las Vegas lease', payment: '176', years: '20', expectedTotal: 42_240, expectedIncomplete: false },
  { name: 'round payment, full term', payment: '150', years: '25', expectedTotal: 45_000, expectedIncomplete: false },
  { name: 'high payment, short remaining', payment: '320', years: '5', expectedTotal: 19_200, expectedIncomplete: false },
  { name: 'low payment, long remaining', payment: '85', years: '15', expectedTotal: 15_300, expectedIncomplete: false },
  { name: 'one year left', payment: '200', years: '1', expectedTotal: 2_400, expectedIncomplete: false },
  { name: 'fractional years', payment: '200', years: '2.5', expectedTotal: 6_000, expectedIncomplete: false },
  { name: 'single dollar payment', payment: '1', years: '1', expectedTotal: 12, expectedIncomplete: false },

  // ── Currency formatting the user may paste or the field may supply ─────────
  { name: 'dollar sign and comma', payment: '$1,250', years: '10', expectedTotal: 150_000, expectedIncomplete: false },
  { name: 'comma only', payment: '2,000', years: '3', expectedTotal: 72_000, expectedIncomplete: false },
  { name: 'surrounding whitespace', payment: '  176  ', years: ' 20 ', expectedTotal: 42_240, expectedIncomplete: false },
  { name: 'decimal payment', payment: '176.50', years: '12', expectedTotal: 25_416, expectedIncomplete: false },

  // ── The parseFloat traps: these must NOT produce a number ─────────────────
  { name: 'trailing letters must not parse', payment: '150abc', years: '10', expectedTotal: 0, expectedIncomplete: true },
  { name: 'leading letters must not parse', payment: 'abc150', years: '10', expectedTotal: 0, expectedIncomplete: true },
  { name: 'negative payment rejected', payment: '-150', years: '10', expectedTotal: 0, expectedIncomplete: true },
  { name: 'empty payment', payment: '', years: '10', expectedTotal: 0, expectedIncomplete: true },
  { name: 'empty years', payment: '150', years: '', expectedTotal: 0, expectedIncomplete: true },
  { name: 'non-numeric years', payment: '150', years: 'twenty', expectedTotal: 0, expectedIncomplete: true },
  { name: 'zero payment', payment: '0', years: '10', expectedTotal: 0, expectedIncomplete: true },
  { name: 'years as a dollar amount is rejected as out of range', payment: '150', years: '25,000', expectedTotal: 0, expectedIncomplete: true },
  { name: 'payment above the sanity ceiling', payment: String(MAX_MONTHLY_PAYMENT + 1), years: '10', expectedTotal: 0, expectedIncomplete: true },
];

describe('calculator remaining-payments matrix', () => {
  it('has exactly the 20 documented cases', () => {
    expect(cases).toHaveLength(20);
  });

  for (const testCase of cases) {
    it(`${testCase.name}: ${testCase.payment} x ${testCase.years}`, () => {
      const result = computeRemainingPayments({
        monthlyPayment: testCase.payment,
        yearsRemaining: testCase.years,
      });
      expect(result.total).toBe(testCase.expectedTotal);
      expect(result.incomplete).toBe(testCase.expectedIncomplete);
    });
  }

  it('never describes the figure as savings', () => {
    const result = computeRemainingPayments({ monthlyPayment: '150', yearsRemaining: '25' });
    expect(result.label.toLowerCase()).not.toContain('sav');
    expect(result.label).toBe('$45,000 remaining');
  });

  it('returns an actionable prompt rather than a zero when input is missing', () => {
    const result = computeRemainingPayments({ monthlyPayment: '', yearsRemaining: '' });
    expect(result.total).toBe(0);
    expect(result.incomplete).toBe(true);
    expect(result.label).toContain('Add payment and years');
  });

  it('produces no absurd figure for the $150-per-month case that broke a competitor', () => {
    // The competitor's calculator reports $1,051,200 for this input. The correct
    // figure for 25 years is $45,000, and the ceiling on any single case here is
    // $48,000,000 (the maximum payment times the maximum years). Asserting the
    // exact expected value is what catches a regression.
    const result = computeRemainingPayments({ monthlyPayment: '150', yearsRemaining: '25' });
    expect(result.total).toBe(45_000);
    expect(result.total).toBeLessThan(1_000_000);
  });

  it('treats a missing field as incomplete rather than crashing or guessing', () => {
    // A React state field can be undefined before hydration. This must produce an
    // incomplete state, never a confident number and never a thrown error.
    const result = computeRemainingPayments({ monthlyPayment: '150' } as never);
    expect(result.total).toBe(0);
    expect(result.incomplete).toBe(true);
  });

  it('keeps the sanity ceilings at the documented values', () => {
    expect(MAX_MONTHLY_PAYMENT).toBe(100_000);
    expect(MAX_YEARS_REMAINING).toBe(40);
  });
});
