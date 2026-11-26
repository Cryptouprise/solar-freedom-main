#!/usr/bin/env python3
"""
Render the site traffic trend chart from Search Console data.

Pulls 60 days of daily impressions and clicks, plots them with the two 30-day
windows the change log quotes, and writes a PNG. Reads Search Console directly
so the chart can never disagree with the written report.
"""
import json, os, subprocess, sys
from datetime import date, timedelta
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.dates import DateFormatter
import matplotlib.dates as mdates

OUT = "/home/ubuntu/solar-freedom-deliverables/seo-2026-11-26/traffic-trend-2026-11-26.png"

# Reuse the Node script's own auth rather than reimplementing JWT signing.
node = r'''
import { createSign } from 'crypto';
const key = JSON.parse(process.env.GA4_SERVICE_ACCOUNT_JSON);
const SITE = 'sc-domain%3Abreakyoursolarcontract.com';
const b64 = (s) => Buffer.from(s).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
const now = Math.floor(Date.now()/1000);
const h = b64(JSON.stringify({alg:'RS256',typ:'JWT'}));
const p = b64(JSON.stringify({iss:key.client_email,scope:'https://www.googleapis.com/auth/webmasters.readonly',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600}));
const s = createSign('RSA-SHA256'); s.update(`${h}.${p}`);
const sig = s.sign(key.private_key,'base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
const t = await (await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:`${h}.${p}.${sig}`})})).json();
const iso = (d) => d.toISOString().slice(0,10);
const end = iso(new Date(Date.now()-3*864e5));
const start = iso(new Date(new Date(end+'T00:00:00Z').getTime()-59*864e5));
const r = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${SITE}/searchAnalytics/query`,{method:'POST',headers:{Authorization:`Bearer ${t.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({startDate:start,endDate:end,dimensions:['date'],rowLimit:500})});
const j = await r.json();
if(!r.ok) throw new Error(JSON.stringify(j));
console.log(JSON.stringify({start,end,rows:j.rows||[]}));
'''
res = subprocess.run(["node", "--input-type=module", "-e", node], capture_output=True, text=True,
                     cwd="/home/ubuntu/solar-freedom")
if res.returncode != 0:
    print(res.stderr[:2000]); sys.exit(1)
data = json.loads(res.stdout)
rows = data["rows"]
dates = [date.fromisoformat(r["keys"][0]) for r in rows]
impr = [r["impressions"] for r in rows]
clk = [r["clicks"] for r in rows]

fig, ax1 = plt.subplots(figsize=(13, 6), dpi=150)
fig.patch.set_facecolor("#0D0F14")
ax1.set_facecolor("#0D0F14")

ax1.bar(dates, impr, color="#F97316", alpha=0.55, width=0.8, label="Impressions (left)")
ax1.set_ylabel("Impressions / day", color="#F8FAFC", fontsize=11)
ax1.tick_params(axis="y", colors="#94A3B8")
ax1.tick_params(axis="x", colors="#94A3B8")
ax1.set_ylim(0, max(impr) * 1.25)

ax2 = ax1.twinx()
ax2.plot(dates, clk, color="#38BDF8", linewidth=2.2, marker="o", markersize=3.4, label="Clicks (right)")
ax2.set_ylabel("Clicks / day", color="#38BDF8", fontsize=11)
ax2.tick_params(axis="y", colors="#38BDF8")
ax2.set_ylim(0, max(max(clk) * 1.6, 4))

# shade the two windows the change log quotes
mid = dates[0] + timedelta(days=29)
ax1.axvspan(dates[0], mid, color="#64748B", alpha=0.10)
ax1.axvspan(mid, dates[-1], color="#F97316", alpha=0.06)
ax1.axvline(mid, color="#64748B", linestyle="--", linewidth=1, alpha=0.7)
ax1.text(dates[0] + timedelta(days=1), max(impr) * 1.13, "prior 30 days", color="#94A3B8", fontsize=9)
ax1.text(mid + timedelta(days=1), max(impr) * 1.13, "recent 30 days", color="#F97316", fontsize=9)

ax1.xaxis.set_major_locator(mdates.WeekdayLocator(byweekday=mdates.MO))
ax1.xaxis.set_major_formatter(DateFormatter("%b %d"))
for lb in ax1.get_xticklabels():
    lb.set_rotation(45); lb.set_ha("right")
ax1.grid(axis="y", color="#1E293B", linewidth=0.7)

ax1.set_title("breakyoursolarcontract.com — Search Console, daily impressions and clicks\n"
              f"{data['start']} to {data['end']}  (3-day Search Console lag applied)",
              color="#F8FAFC", fontsize=13, pad=14)

l1, la1 = ax1.get_legend_handles_labels()
l2, la2 = ax2.get_legend_handles_labels()
leg = ax1.legend(l1 + l2, la1 + la2, loc="upper left", facecolor="#111827",
                 edgecolor="#334155", labelcolor="#F8FAFC", fontsize=10)
for sp in ax1.spines.values(): sp.set_color("#334155")
for sp in ax2.spines.values(): sp.set_color("#334155")

fig.tight_layout()
os.makedirs(os.path.dirname(OUT), exist_ok=True)
fig.savefig(OUT, facecolor=fig.get_facecolor())
print("wrote", OUT)
print(f"days {len(dates)}  total impressions {sum(impr)}  total clicks {sum(clk)}")
