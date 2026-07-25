import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { sql } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('No DATABASE_URL'); process.exit(1); }

const conn = await mysql.createConnection(DATABASE_URL);

// Total and GHL breakdown
const [rows] = await conn.execute('SELECT ghlWebhookSent, COUNT(*) as cnt FROM leads GROUP BY ghlWebhookSent');
console.log('=== GHL Webhook Status ===');
rows.forEach(r => {
  console.log(`  ghlWebhookSent=${r.ghlWebhookSent}: ${r.cnt} leads`);
});

// Recent leads
const [recent] = await conn.execute('SELECT id, firstName, lastName, ghlWebhookSent, sourcePage, createdAt FROM leads ORDER BY createdAt DESC LIMIT 15');
console.log('\n=== Recent 15 Leads ===');
recent.forEach(l => {
  const sent = l.ghlWebhookSent === 1 ? '✓ GHL' : '✗ NOT SENT';
  console.log(`  #${l.id} ${l.firstName} ${l.lastName} | ${sent} | ${l.sourcePage || 'unknown'} | ${l.createdAt}`);
});

// Leads this week
const [thisWeek] = await conn.execute("SELECT COUNT(*) as cnt FROM leads WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
console.log(`\nLeads this week: ${thisWeek[0].cnt}`);

// Leads total
const [totalRow] = await conn.execute("SELECT COUNT(*) as cnt FROM leads");
console.log(`Total leads ever: ${totalRow[0].cnt}`);

await conn.end();
