/**
 * Remaining-payments arithmetic for the solar contract calculator.
 *
 * Why this is its own module: a competitor calculator in this market returns
 * "Annual Savings $1,051,200" for a $150 monthly bill — a figure that is not
 * merely wrong but absurd. That kind of error destroys trust instantly, and it is
 * exactly the kind of defect that hides inside a React component where no test
 * can reach it.
 *
 * This module computes a deliberately narrow thing: the total of the payments
 * that remain under the entered terms. It is NOT a savings figure, NOT a payoff
 * quote, and NOT a settlement estimate. The caller must label it that way.
 *
 * Extracted from client/src/pages/CancellationCalculator.tsx so the arithmetic
 * can be tested against a fixed case matrix in server/calculatorMatrix.test.ts.
 */

export interface RemainingPaymentsInput {
  /** Monthly payment in dollars, as entered by the user. */
  monthlyPayment: string | number;
  /** Whole or partial years remaining, as entered by the user. */
  yearsRemaining: string | number;
}

export interface RemainingPaymentsResult {
  /** Total dollars remaining, rounded to whole dollars. Zero when inputs are unusable. */
  total: number;
  /** Human-readable label. Never describes the figure as savings. */
  label: string;
  /** True when at least one input was missing or non-numeric. */
  incomplete: boolean;
}

/** Upper bound on a single monthly payment, in dollars. */
export const MAX_MONTHLY_PAYMENT = 100_000;
/** Upper bound on years remaining. A 25-year solar term is the practical ceiling. */
export const MAX_YEARS_REMAINING = 40;

/**
 * Parse a user-entered numeric string without the classic parseFloat trap.
 *
 * `parseFloat("150abc")` returns 150, and `parseFloat("")` returns NaN. Both
 * silently produce plausible-looking output. This returns null instead, so the
 * caller can show an incomplete state rather than a confident wrong number.
 */
function parseAmount(value: string | number | null | undefined): number | null {
  // Defensive: a React state field can be undefined before hydration, and an
  // uncontrolled input can hand back null. Neither should throw.
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const trimmed = value.trim().replace(/[$,]/g, '');
  if (trimmed === '') return null;
  // Reject anything that is not a plain non-negative decimal.
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function computeRemainingPayments(input: RemainingPaymentsInput): RemainingPaymentsResult {
  const payment = parseAmount(input.monthlyPayment);
  const years = parseAmount(input.yearsRemaining);

  const paymentUsable = payment !== null && payment > 0 && payment <= MAX_MONTHLY_PAYMENT;
  const yearsUsable = years !== null && years > 0 && years <= MAX_YEARS_REMAINING;

  if (!paymentUsable || !yearsUsable) {
    return {
      total: 0,
      label: 'Add payment and years to see remaining payments',
      incomplete: true,
    };
  }

  const total = Math.round(payment * years * 12);
  return {
    total,
    label: `$${total.toLocaleString('en-US')} remaining`,
    incomplete: false,
  };
}
