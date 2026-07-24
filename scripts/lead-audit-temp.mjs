import mysql from 'mysql2/promise';
const url = process.env.DATABASE_URL;
const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:\/]+):?(\d+)?\/([^?]+)/);
const [, user, password, host, port, database] = match;
const conn = await mysql.createConnection({ host, user, password, database, port: port ? parseInt(port) : 3306, ssl: { rejectUnauthorized: false } });

// Get ALL leads with full details
const [all] = await conn.execute(`
  SELECT id, firstName, lastName, email, phone, solarCompany, problemType, intent, sourcePage, sourceUrl, ghlWebhookSent, status, createdAt
  FROM leads
  ORDER BY createdAt DESC
`);

console.log(`\nTOTAL LEADS: ${all.length}\n`);

// Check for duplicates by email
const emailMap = {};
const phoneMap = {};
for (const r of all) {
  if (r.email) emailMap[r.email] = (emailMap[r.email] || 0) + 1;
  if (r.phone) phoneMap[r.phone] = (phoneMap[r.phone] || 0) + 1;
}
const dupEmails = Object.entries(emailMap).filter(([,c]) => c > 1);
const dupPhones = Object.entries(phoneMap).filter(([,c]) => c > 1);
console.log(`Duplicate emails: ${dupEmails.length}`);
dupEmails.forEach(([e, c]) => console.log(`  ${e}: ${c}x`));
console.log(`Duplicate phones: ${dupPhones.length}`);
dupPhones.forEach(([p, c]) => console.log(`  ${p}: ${c}x`));

// Check GHL webhook sent status
const ghlSent = all.filter(r => r.ghlWebhookSent === 1 || r.ghlWebhookSent === true);
const ghlNotSent = all.filter(r => !r.ghlWebhookSent);
console.log(`\nGHL webhook sent: ${ghlSent.length} / ${all.length}`);
console.log(`GHL webhook NOT sent: ${ghlNotSent.length}`);

// Show all leads from last 30 days with full details
console.log('\n── ALL LEADS (last 30 days, full detail) ───────────────────────────');
const recent = all.filter(r => new Date(r.createdAt) >= new Date('2026-06-24'));
for (const r of recent) {
  const date = new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  console.log(`\n  [${r.id}] ${date}`);
  console.log(`    Name:    ${r.firstName} ${r.lastName}`);
  console.log(`    Email:   ${r.email || 'NONE'}`);
  console.log(`    Phone:   ${r.phone || 'NONE'}`);
  console.log(`    Company: ${r.solarCompany || 'NONE'}`);
  console.log(`    Issue:   ${r.problemType || 'NONE'}`);
  console.log(`    Intent:  ${r.intent || 'NONE'}`);
  console.log(`    Source:  ${r.sourcePage || r.sourceUrl || 'NONE'}`);
  console.log(`    GHL:     ${r.ghlWebhookSent ? 'SENT ✓' : 'NOT SENT ✗'}`);
  console.log(`    Status:  ${r.status}`);
}

await conn.end();
