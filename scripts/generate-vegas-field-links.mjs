/**
 * Generates the Las Vegas field-team link sheet and printable rep cards.
 *
 * Every link carries the rep in `utm_content`, which the server stores as a
 * durable attribution column, so a booked call can be traced to the person who
 * knocked. No homeowner data ever enters these URLs.
 *
 * Usage: node scripts/generate-vegas-field-links.mjs [rep_code ...]
 *   node scripts/generate-vegas-field-links.mjs rep_marcus rep_dana
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { VEGAS_METRO_CITIES, vegasFieldTeamUrl } from '../shared/vegasCampaign.ts';

const OUT = '/home/ubuntu/solar-freedom-deliverables/las-vegas/field-links';
const reps = process.argv.slice(2).filter((value) => /^[a-z0-9_-]{1,40}$/i.test(value));
if (reps.length === 0) reps.push('rep_example');

await fs.mkdir(OUT, { recursive: true });

const rows = [];
for (const rep of reps) {
  for (const city of VEGAS_METRO_CITIES) {
    rows.push({
      rep,
      city: city.name,
      slug: city.slug,
      hasBookingButton: city.bookingControls ? 'yes' : 'no',
      url: vegasFieldTeamUrl(city.slug, rep),
    });
  }
}

// Simple CSV; the URLs contain no commas or quotes.
const header = 'rep,city,slug,page_has_direct_booking_button,url';
const csv = [header, ...rows.map((r) => [r.rep, r.city, r.slug, r.hasBookingButton, r.url].join(','))].join('\n') + '\n';
await fs.writeFile(path.join(OUT, 'vegas-field-links.csv'), csv);

// One printable card per rep and city, sized for a folded door hanger.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cards = rows.map((r) => `
  <section class="card">
    <p class="kicker">No-obligation contract review</p>
    <h1>${esc(r.city)} homeowners</h1>
    <p class="lead">Paying for solar and the bill, the performance or the contract terms do not match what you were promised?</p>
    <div class="qr"><img src="qr-${esc(r.rep)}-${esc(r.slug)}.png" alt="QR code linking to the ${esc(r.city)} solar contract review page" /></div>
    <p class="cta">Scan to choose a call time</p>
    <p class="fine">${esc(r.rep)} &middot; ${esc(r.city)}<br/>Solar Freedom is an independent consumer-help service. Cancellation is not guaranteed.</p>
  </section>`).join('');

await fs.writeFile(path.join(OUT, 'rep-cards.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>Las Vegas field-team cards</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #f4f4f5; color: #18181b; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; padding: 16px; }
  .card { background: #fff; border: 2px solid #18181b; border-radius: 14px; padding: 20px; break-inside: avoid; text-align: center; }
  .kicker { margin: 0 0 6px; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: #b45309; font-weight: 700; }
  h1 { margin: 0 0 10px; font-size: 24px; line-height: 1.15; }
  .lead { margin: 0 0 14px; font-size: 13px; line-height: 1.45; color: #3f3f46; }
  .qr { display: flex; justify-content: center; }
  .qr img { width: 190px; height: 190px; }
  .cta { margin: 12px 0 6px; font-size: 16px; font-weight: 800; }
  .fine { margin: 0; font-size: 10px; line-height: 1.4; color: #71717a; }
  @media print { body { background: #fff; } .grid { gap: 0; padding: 0; } .card { border-radius: 0; page-break-after: always; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; } }
</style></head>
<body><div class="grid">${cards}</div></body></html>
`);

console.log(`Wrote ${rows.length} field links for ${reps.length} rep(s).`);
console.log(`CSV:   ${path.join(OUT, 'vegas-field-links.csv')}`);
console.log(`Cards: ${path.join(OUT, 'rep-cards.html')}`);
console.log('\nGenerate the matching QR PNGs with: pnpm exec tsx scripts/generate-vegas-qr.ts');
