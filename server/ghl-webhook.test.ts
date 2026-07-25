import { describe, it, expect } from 'vitest';

describe('GHL Webhook URL', () => {
  it('GHL_WEBHOOK_URL env var is set and is a valid leadconnectorhq URL', () => {
    const url = process.env.GHL_WEBHOOK_URL;
    expect(url).toBeTruthy();
    expect(url).toContain('leadconnectorhq.com');
    expect(url).toContain('webhook-trigger');
  });

  it('GHL webhook endpoint responds with 200', async () => {
    const url = process.env.GHL_WEBHOOK_URL!;
    const res = await fetch(url, {
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
