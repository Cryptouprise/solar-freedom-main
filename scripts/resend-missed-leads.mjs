/**
 * Preview unconfirmed CRM deliveries by default. Never creates website leads.
 * Send only after CRM deduplication by website_lead_id is configured and checked:
 * node scripts/resend-missed-leads.mjs --send --ack-crm-deduplication --limit=25
 */
import mysql from "mysql2/promise";

const args = process.argv.slice(2);
const send = args.includes("--send");
const limit = Number(args.find(arg => arg.startsWith("--limit="))?.split("=")[1] ?? 25);
if (!Number.isInteger(limit) || limit < 1 || limit > 100 || args.some(arg => !["--send", "--ack-crm-deduplication"].includes(arg) && !arg.startsWith("--limit="))) {
  console.error("Use --limit=1..100; sending requires --send --ack-crm-deduplication.");
  process.exit(1);
}
if (send && !args.includes("--ack-crm-deduplication")) {
  console.error("Confirm CRM deduplicates website_lead_id before sending; uncertain deliveries can otherwise duplicate contacts or actions.");
  process.exit(1);
}
if (!process.env.DATABASE_URL || (send && !process.env.GHL_WEBHOOK_URL)) {
  console.error("DATABASE_URL is required; GHL_WEBHOOK_URL is also required to send.");
  process.exit(1);
}

const conn = await mysql.createConnection(process.env.DATABASE_URL);
let locked = false;
try {
  // A connection-scoped lock serializes manual retries across machines.
  if (send) {
    const [[lock]] = await conn.execute("SELECT GET_LOCK('sf_crm_manual_retry', 0) AS acquired");
    if (Number(lock.acquired) !== 1) throw new Error("Another manual recovery is running");
    locked = true;
  }
  // Wait for initial submissions to finish; the marker alone is not an outbox lock.
  const [unsent] = await conn.query(
    `SELECT * FROM leads WHERE ghlWebhookSent = 0 AND createdAt < DATE_SUB(NOW(), INTERVAL 10 MINUTE) ORDER BY createdAt ASC LIMIT ${limit}`
  );
  console.log(`${send ? "Recovering" : "PREVIEW ONLY:"} ${unsent.length} unconfirmed deliveries older than 10 minutes (maximum ${limit}).`);
  let sent = 0, failed = 0;
  for (const lead of unsent) {
    if (!send) { console.log(`Lead #${lead.id}`); continue; }
    const [[current]] = await conn.execute("SELECT ghlWebhookSent FROM leads WHERE id = ?", [lead.id]);
    if (!current || current.ghlWebhookSent !== 0) continue;
    const callbackOnly = lead.intent === "requested_callback_only_v1";
    try {
      const response = await fetch(process.env.GHL_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": `sf-lead-${lead.id}` },
        body: JSON.stringify({
          website_lead_id: String(lead.id),
          first_name: lead.firstName || "", last_name: lead.lastName || "",
          email: lead.email || "", phone: lead.phone || "",
          full_name: `${lead.firstName || ""} ${lead.lastName || ""}`.trim(),
          solar_company: lead.solarCompany || "", problem_type: lead.problemType || "",
          contract_type: lead.contractType || "", monthly_payment: lead.monthlyPayment || "",
          intent: lead.intent || "", source: lead.sourcePage || "solar-freedom",
          form_name: lead.formName || "main_contact_form",
          consent_scope: callbackOnly ? "requested_callback_only_v1" : "unknown_do_not_expand",
          callback_request: callbackOnly ? "1" : "0",
          marketing_consent: "0", trigger_sms_confirmation: "0",
          resent: "true", resent_reason: "manual_unconfirmed_delivery_recovery",
        }),
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await conn.execute("UPDATE leads SET ghlWebhookSent = 1 WHERE id = ? AND ghlWebhookSent = 0", [lead.id]);
      sent++;
      console.log(`Confirmed lead #${lead.id}`);
    } catch {
      failed++;
      // Never log contact details, URLs with credentials, or response bodies.
      console.error(`Lead #${lead.id} remains unconfirmed; reconcile CRM before retrying.`);
    }
  }
  console.log(`Confirmed ${sent}; unconfirmed ${failed}. No marketing or SMS requested.`);
  if (failed) process.exitCode = 1;
} finally {
  if (locked) await conn.execute("SELECT RELEASE_LOCK('sf_crm_manual_retry')");
  await conn.end();
}
