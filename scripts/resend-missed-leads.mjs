/**
 * Retroactively resend all leads where ghlWebhookSent=0 to the GHL webhook.
 * Updates the DB flag to 1 on success.
 */
import mysql from 'mysql2/promise';

const GHL_URL = process.env.GHL_WEBHOOK_URL;
const DB_URL = process.env.DATABASE_URL;

if (!GHL_URL) { console.error('GHL_WEBHOOK_URL not set'); process.exit(1); }
if (!DB_URL) { console.error('DATABASE_URL not set'); process.exit(1); }

const conn = await mysql.createConnection(DB_URL);

// Get all unsent leads
const [unsent] = await conn.execute(
  'SELECT id, firstName, lastName, email, phone, solarCompany, problemType, contractType, monthlyPayment, intent, formName, sourcePage FROM leads WHERE ghlWebhookSent = 0 ORDER BY createdAt ASC'
);

console.log(`Found ${unsent.length} leads to resend to GHL`);

let success = 0, failed = 0;

for (const lead of unsent) {
  try {
    const res = await fetch(GHL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: lead.firstName || '',
        last_name: lead.lastName || '',
        email: lead.email || '',
        phone: lead.phone || '',
        full_name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
        solar_company: lead.solarCompany || '',
        problem_type: lead.problemType || '',
        contract_type: lead.contractType || '',
        monthly_payment: lead.monthlyPayment || '',
        intent: lead.intent || '',
        source: lead.sourcePage || 'breakyoursolarcontract.com',
        form_name: lead.formName || 'main_contact_form',
        'contact.first_name': lead.firstName || '',
        resent: 'true',
        resent_reason: 'webhook_gap_jul15_jul25',
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      // Mark as sent in DB
      await conn.execute('UPDATE leads SET ghlWebhookSent = 1 WHERE id = ?', [lead.id]);
      success++;
      console.log(`  ✓ #${lead.id} ${lead.firstName} ${lead.lastName} (${lead.phone})`);
    } else {
      failed++;
      console.log(`  ✗ #${lead.id} ${lead.firstName} ${lead.lastName} — HTTP ${res.status}`);
    }
  } catch (e) {
    failed++;
    console.log(`  ✗ #${lead.id} ${lead.firstName} ${lead.lastName} — ${e.message}`);
  }

  // Small delay between sends
  await new Promise(r => setTimeout(r, 500));
}

console.log(`\n=== DONE ===`);
console.log(`✓ Successfully sent: ${success}`);
console.log(`✗ Failed: ${failed}`);

await conn.end();
