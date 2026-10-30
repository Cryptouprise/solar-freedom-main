#!/usr/bin/env python3
"""Cole Property Group - Bucket 3, stream 2: Nashville Ledger public notices.

Scrapes the Friday Ledger notices page: foreclosure notices (borrower, address,
auction date, first notice date) and court notices (probate "Notice to Creditors":
decedent, county, docket). Pulls each foreclosure detail page for county/trustee.
Stdlib only. Run every Friday afternoon.

  python3 scripts/cole/bucket3_ledger.py --out out/cole            # latest Friday
  python3 scripts/cole/bucket3_ledger.py --date 10/23/2026 --weeks 4
"""
import argparse, csv, datetime as dt, html as H, json, os, re, sys, time, urllib.parse, urllib.request

BASE = "https://www.tnledger.com"
UA = {"User-Agent": "Mozilla/5.0 (compatible; ColePropertyGroup-notices/1.0)"}
TZ = dt.timezone(dt.timedelta(hours=-5))


def fetch(url):
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return r.read().decode("utf-8", "ignore")
        except Exception:
            if i == 3: raise
            time.sleep(2 ** i)


def last_friday(d=None):
    d = d or dt.date.today()
    return d - dt.timedelta(days=(d.weekday() - 4) % 7)


def strip(s):
    return re.sub(r"\s+", " ", H.unescape(re.sub(r"<[^>]+>", " ", s))).strip()


def parse_table(page, table_id):
    m = re.search(rf'<table[^>]*id="{table_id}".*?</table>', page, flags=re.S)
    if not m: return []
    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", m.group(0), flags=re.S)[1:]
    out = []
    for r in rows:
        cells = re.findall(r"<td[^>]*>(.*?)</td>", r, flags=re.S)
        nid = re.search(r"OpenChildFT2\('([A-Z]+\d+)'", r)
        out.append((nid.group(1) if nid else "", [strip(c) for c in cells], cells))
    return out


def us_date(s):
    try: return dt.datetime.strptime(s.strip(), "%m/%d/%Y").date().isoformat()
    except Exception: return ""


def detail(nid, date_str):
    url = f"{BASE}/Search/Details/ViewNotice.aspx?id={nid}&date={urllib.parse.quote(date_str, safe='')}"
    try: txt = strip(fetch(url))
    except Exception: return url, ""
    return url, txt


def county_from(text):
    m = re.search(r"\b([A-Z][a-z]+(?: [A-Z][a-z]+)?) County, Tennessee", text) or re.search(r"COUNTY OF ([A-Z]+)", text)
    return m.group(1).title() if m else ""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="out/cole"); ap.add_argument("--date"); ap.add_argument("--weeks", type=int, default=1)
    ap.add_argument("--details", action="store_true", help="fetch each foreclosure detail page (slower)")
    a = ap.parse_args(); os.makedirs(a.out, exist_ok=True)
    start = dt.datetime.strptime(a.date, "%m/%d/%Y").date() if a.date else last_friday()
    pulled_at = dt.datetime.now(TZ).isoformat(timespec="seconds")
    fc, pr = [], []
    for w in range(a.weeks):
        d = start - dt.timedelta(weeks=w); ds = f"{d.month}/{d.day}/{d.year}"
        page = fetch(f"{BASE}/Notices.aspx?noticesDate={urllib.parse.quote(ds, safe='')}")
        f_rows = parse_table(page, "ContentPane_ForeclosureGridView")
        c_rows = parse_table(page, "ContentPane_CourtGridView")
        print(f"{ds}: {len(f_rows)} foreclosure, {len(c_rows)} court notices", file=sys.stderr)
        for nid, cells, _ in f_rows:
            if len(cells) < 5: continue
            url, txt = detail(nid, ds) if a.details else (f"{BASE}/Search/Details/ViewNotice.aspx?id={nid}&date={urllib.parse.quote(ds, safe='')}", "")
            trustee = re.search(r"(?:Substitute|Successor) Trustee[:,]?\s*([A-Z][A-Za-z.,&' ]{3,60})", txt)
            fc.append({"notice_id": nid, "distress_type": "foreclosure_notice", "borrower": cells[1], "property_address": cells[2],
                       "county": county_from(txt), "auction_date": us_date(cells[3]), "first_notice_date": us_date(cells[4]),
                       "days_to_auction": (dt.date.fromisoformat(us_date(cells[3])) - dt.date.today()).days if us_date(cells[3]) else None,
                       "status": "upcoming" if us_date(cells[3]) >= dt.date.today().isoformat() else "advertised_sale_date_passed",
                       "trustee": re.sub(r" Advertised.*$", "", trustee.group(1)).strip() if trustee else "", "source": "Nashville Ledger", "source_url": url,
                       "published": d.isoformat(), "pulled_at": pulled_at, "as_of": d.isoformat()})
        for nid, cells, raw in c_rows:
            if len(cells) < 3: continue
            body = cells[2]
            if "NOTICE TO CREDITORS" not in body.upper() and "ESTATE OF" not in body.upper(): continue
            dec = re.search(r"Estate of ([A-Z][A-Za-z.'\- ]+?),? (?:Deceased|deceased|a/k/a|aka)", body)
            cty = re.search(r"PROBATE COURT OF ([A-Z]+) COUNTY|([A-Z][a-z]+) County, Tennessee|COUNTY OF ([A-Z]+)", body)
            dock = re.search(r"(?:Docket|Case|File) No\.?:?\s*([A-Z0-9\-]+)", body)
            died = re.search(r"who died (?:on )?([A-Z][a-z]+ \d{1,2}, \d{4})", body)
            exec_ = re.search(r"(?:Executor|Executrix|Administrator|Administratrix|Personal Representative)[s]?:?\s*([A-Z][A-Za-z.' ]+)", body)
            pr.append({"notice_id": nid, "distress_type": "probate", "decedent": dec.group(1).strip() if dec else "",
                       "county": (next((g for g in cty.groups() if g), "") if cty else "").title(),
                       "docket": dock.group(1) if dock else "", "date_of_death": died.group(1) if died else "",
                       "executor": exec_.group(1).strip() if exec_ else "", "published": d.isoformat(),
                       "source": "Nashville Ledger court notices", "source_url": f"{BASE}/Search/Details/ViewNotice.aspx?id={nid}&date={urllib.parse.quote(ds, safe='')}",
                       "pulled_at": pulled_at, "as_of": d.isoformat(), "match_hint": "match decedent to assessor Owner; property address unknown"})
    for name, rows in (("s3_foreclosures.csv", fc), ("s3_probate.csv", pr)):
        if rows:
            with open(f"{a.out}/{name}", "w", newline="") as f:
                w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
    with open(f"{a.out}/s3_ledger.json", "w") as f: json.dump({"foreclosures": fc, "probate": pr}, f, default=str)
    counties = {}
    for r in fc: counties[r["county"] or "?"] = counties.get(r["county"] or "?", 0) + 1
    print(json.dumps({"foreclosures": len(fc), "probate": len(pr), "upcoming": sum(1 for r in fc if r["status"] == "upcoming"),
                      "auction_within_30d": sum(1 for r in fc if r["days_to_auction"] is not None and 0 <= r["days_to_auction"] <= 30),
                      "foreclosure_counties": counties}, indent=1))


if __name__ == "__main__":
    main()
