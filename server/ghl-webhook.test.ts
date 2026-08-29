import { describe, it, expect } from 'vitest';

/**
 * GHL_WEBHOOK_URL is deployment configuration, not source code.
 *
 * This file previously asserted the variable was present, which made it fail on
 * every checkout without the secret — including a clean checkout of main — so in
 * practice it was permanently red and signalled nothing. Two different things
 * were conflated: whether a value is configured (an environment question) and
 * whether a configured value is well formed (a real check that should run
 * wherever a value exists).
 *
 * They are now separate, using the same explicit opt-in the live probe below
 * already used. Skips show up as skips in the test report rather than as
 * assertions that quietly pass.
 */
describe('GHL Webhook URL', () => {
  const url = process.env.GHL_WEBHOOK_URL;
  const requireConfiguration = process.env.RUN_LIVE_GHL_TESTS === '1';

  // Runs anywhere a URL is configured, including CI when the secret is set.
  it.runIf(Boolean(url))('is a valid leadconnectorhq webhook-trigger URL', () => {
    expect(url).toContain('leadconnectorhq.com');
    expect(url).toContain('webhook-trigger');
  });

  // Only environments that own the CRM configuration are required to have it.
  it.runIf(requireConfiguration)('has GHL_WEBHOOK_URL configured', () => {
    expect(url).toBeTruthy();
  });

  const liveProbe = requireConfiguration ? it : it.skip;

  liveProbe('GHL webhook endpoint accepts an explicit integration probe', async () => {
    const res = await fetch(process.env.GHL_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'Vitest',
        last_name: 'Check',
        phone: '0000000000',
        email: 'vitest@breakyoursolarcontract.com',
        source: 'vitest-validation',
        form_name: 'webhook-test',
      }),
      signal: AbortSignal.timeout(8000),
    });
    expect(res.ok).toBe(true);
  }, 10000);
});
