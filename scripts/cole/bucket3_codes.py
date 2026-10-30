#!/usr/bin/env python3
"""Cole Property Group - Bucket 3, stream 1: open Metro Nashville code violations.

Pulls OPEN usable code cases from the Metro Nashville ArcGIS layer, joins the
county Parcels layer for owner + mailing address + appraisal, scores and dedupes,
and writes CSV + JSON. Stdlib only. Run daily.

  python3 scripts/cole/bucket3_codes.py --out out/cole

Env (optional): SUPABASE_URL, SUPABASE_SERVICE_KEY -> also upserts into s3_distress.
"""
import argparse, csv, datetime as dt, json, os, re, sys, time, urllib.parse, urllib.request

VIOL = "https://services2.arcgis.com/HdTo6HJqh92wn4D8/arcgis/rest/services/Property_Standards_Violations_2/FeatureServer/0/query"
PARC = "https://services2.arcgis.com/HdTo6HJqh92wn4D8/arcgis/rest/services/Parcels_view/FeatureServer/0/query"
USABLE = ["Codes Housing Request", "Codes High Grass and Weeds", "CA Codes Case", "Landlord Registration Violation"]
STREET_WORDS = r"\b(ave|avenue|st|street|rd|road|dr|drive|ct|court|pike|pk|ln|lane|blvd|way|cir|circle|pl|place|trl|trail|hwy)\b"
TZ = dt.timezone(dt.timedelta(hours=-5))  # America/Chicago (CDT); good enough for pulled_at


def get(url, params):
    for attempt in range(4):
        try:
            data = urllib.parse.urlencode(params).encode()
            with urllib.request.urlopen(urllib.request.Request(url, data=data), timeout=90) as r:
                j = json.loads(r.read())
            if "error" in j:
                raise RuntimeError(j["error"])
            return j
        except Exception as e:  # noqa
            if attempt == 3:
                raise
            time.sleep(2 ** attempt)


def page(url, where, fields):
    out, offset = [], 0
    while True:
        j = get(url, {"where": where, "outFields": ",".join(fields), "returnGeometry": "false",
                      "resultOffset": offset, "resultRecordCount": 2000, "f": "json"})
        feats = j.get("features", [])
        out += [f["attributes"] for f in feats]
        if not j.get("exceededTransferLimit") and len(feats) < 2000:
            return out
        offset += len(feats)


def norm_addr(a, z):
    a = (a or "").lower()
    a = re.sub(STREET_WORDS, "", a)
    a = re.sub(r"[^a-z0-9]", "", a)
    return f"{a}{(z or '')[:5]}"


def ms_to_date(ms):
    return dt.datetime.fromtimestamp(ms / 1000, dt.timezone.utc).date().isoformat() if ms else ""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="out/cole")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    pulled_at = dt.datetime.now(TZ).isoformat(timespec="seconds")

    sub = ",".join(f"'{s}'" for s in USABLE)
    viol = page(VIOL, f"Status='OPEN' AND Subtype_Description IN ({sub})",
                ["Request_Nbr", "Date_Received", "Property_APN", "Property_Address", "City", "ZIP",
                 "Property_Owner", "Reported_Problem", "Status", "Last_Activity_Date", "Last_Activity",
                 "Violations_Noted", "Lat", "Lon", "Subtype_Description"])
    print(f"open usable violations: {len(viol)}", file=sys.stderr)

    # group by property (normalized address + zip)
    props = {}
    for v in viol:
        k = norm_addr(v["Property_Address"], str(v.get("ZIP") or ""))
        p = props.setdefault(k, {"cases": [], "apn": None, "addr": v["Property_Address"], "zip": str(v.get("ZIP") or "")[:5],
                                 "city": v.get("City"), "lat": v.get("Lat"), "lon": v.get("Lon")})
        p["cases"].append(v)
        if v.get("Property_APN") and not p["apn"]:
            p["apn"] = str(v["Property_APN"]).strip()
    print(f"distinct properties: {len(props)}", file=sys.stderr)

    # parcel join: by APN where present, else by house+street match
    apns = sorted({p["apn"] for p in props.values() if p["apn"]})
    parcels = {}
    PF = ["STANPAR", "ParID", "Owner", "OwnDate", "SalePrice", "OwnAddr1", "OwnAddr2", "OwnCity", "OwnState", "OwnZip",
          "PropAddr", "PropHouse", "PropStreet", "PropZip", "Acres", "LUCode", "LUDesc", "LandAppr", "ImprAppr", "TotlAppr", "Zoning"]
    for i in range(0, len(apns), 150):
        chunk = apns[i:i + 150]
        inlist = ",".join(f"'{x}'" for x in chunk)
        for r in page(PARC, f"STANPAR IN ({inlist})", PF):
            parcels[str(r.get("STANPAR") or "").strip()] = r
    # address fallback for props with no APN
    noapn = [p for p in props.values() if not p["apn"]]
    print(f"properties without APN (address fallback): {len(noapn)}", file=sys.stderr)
    addr_idx = {}
    if noapn:
        houses = sorted({re.match(r"\s*(\d+)", p["addr"] or "").group(1) for p in noapn if re.match(r"\s*\d+", p["addr"] or "")})
        for i in range(0, len(houses), 200):
            inlist = ",".join(f"'{h}'" for h in houses[i:i + 200])
            for r in page(PARC, f"PropHouse IN ({inlist})", PF):
                addr_idx[norm_addr(r.get("PropAddr"), str(r.get("PropZip") or ""))] = r

    today = dt.date.today()
    rows = []
    for k, p in props.items():
        r = parcels.get(p["apn"]) if p["apn"] else addr_idx.get(k)
        r = r or {}
        tot = r.get("TotlAppr") or 0
        land_share = round((r.get("LandAppr") or 0) / tot, 3) if tot else None
        own_street = (r.get("OwnAddr1") or "").strip().lower()
        prop_street = (r.get("PropAddr") or p["addr"] or "").strip().lower()
        absentee = bool(own_street) and own_street[:12] != prop_street[:12]
        owndate = ms_to_date(r.get("OwnDate"))
        tenure = round((today - dt.date.fromisoformat(owndate)).days / 365.25, 1) if owndate else None
        housing = any(c["Subtype_Description"] == "Codes Housing Request" for c in p["cases"])
        oldest = min(c["Date_Received"] or 0 for c in p["cases"])
        days_open = (today - dt.date.fromisoformat(ms_to_date(oldest))).days if oldest else None

        score = 1
        if housing: score += 3
        if absentee: score += 2
        if land_share is not None and land_share >= 0.6: score += 2
        if len(p["cases"]) > 1: score += 1
        if (r.get("ImprAppr") or 0) and r.get("ImprAppr") < 50000: score += 1
        if tenure and tenure >= 10: score += 1
        if days_open and days_open > 180: score += 1
        score = max(1, min(10, score))

        rows.append({
            "parcel_id": r.get("STANPAR") or p["apn"] or "",
            "property_address": r.get("PropAddr") or p["addr"],
            "city": p["city"], "zip": r.get("PropZip") or p["zip"], "county": "Davidson",
            "distress_type": "code_violation_open", "status": "open",
            "open_case_count": len(p["cases"]),
            "case_numbers": "; ".join(str(c["Request_Nbr"]) for c in p["cases"]),
            "case_types": "; ".join(sorted({c["Subtype_Description"] for c in p["cases"]})),
            "violations_noted": " | ".join(filter(None, (c.get("Violations_Noted") for c in p["cases"])))[:500],
            "first_received": ms_to_date(oldest), "days_open": days_open,
            "owner_name": r.get("Owner") or (p["cases"][0].get("Property_Owner") or ""),
            "owner_mailing": ", ".join(filter(None, [r.get("OwnAddr1"), r.get("OwnAddr2"), r.get("OwnCity"), r.get("OwnState"), str(r.get("OwnZip") or "")])),
            "absentee_flag": "Y" if absentee else "N",
            "last_sale_date": owndate, "tenure_years": tenure, "last_sale_price": r.get("SalePrice"),
            "land_use": r.get("LUDesc"), "zoning": r.get("Zoning"), "acres": r.get("Acres"),
            "land_appraisal": r.get("LandAppr"), "improvement_appraisal": r.get("ImprAppr"), "total_appraisal": tot or None,
            "land_share": land_share, "score": score,
            "lat": p["lat"], "lon": p["lon"],
            "source": "Metro Nashville Property Standards Violations (ArcGIS)",
            "source_url": "https://data.nashville.gov", "pulled_at": pulled_at, "as_of": today.isoformat(),
        })

    # owner-level dedupe view: one row per owner with property count
    owners = {}
    for row in rows:
        on = re.sub(r"[^a-z0-9]", "", (row["owner_name"] or "").lower()) or f"unknown-{row['parcel_id']}"
        o = owners.setdefault(on, {"owner_name": row["owner_name"], "owner_mailing": row["owner_mailing"], "properties": 0, "best_score": 0, "addresses": []})
        o["properties"] += 1; o["best_score"] = max(o["best_score"], row["score"]); o["addresses"].append(row["property_address"])

    rows.sort(key=lambda x: (-x["score"], -(x["days_open"] or 0)))
    with open(f"{a.out}/s3_codes_properties.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
    with open(f"{a.out}/s3_codes_properties.json", "w") as f:
        json.dump(rows, f, default=str)
    ol = sorted(owners.values(), key=lambda o: (-o["properties"], -o["best_score"]))
    with open(f"{a.out}/s3_codes_owners.csv", "w", newline="") as f:
        w = csv.writer(f); w.writerow(["owner_name", "owner_mailing", "properties", "best_score", "addresses"])
        for o in ol: w.writerow([o["owner_name"], o["owner_mailing"], o["properties"], o["best_score"], " | ".join(o["addresses"])])

    matched = sum(1 for x in rows if x["owner_mailing"])
    print(json.dumps({"properties": len(rows), "parcel_matched": matched, "owners": len(owners),
                      "absentee": sum(1 for x in rows if x["absentee_flag"] == "Y"),
                      "score_ge_7": sum(1 for x in rows if x["score"] >= 7),
                      "multi_property_owners": sum(1 for o in ol if o["properties"] > 1)}, indent=1))

    if os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_SERVICE_KEY"):
        url = os.environ["SUPABASE_URL"].rstrip("/") + "/rest/v1/s3_distress?on_conflict=parcel_id,distress_type"
        hdr = {"apikey": os.environ["SUPABASE_SERVICE_KEY"], "Authorization": "Bearer " + os.environ["SUPABASE_SERVICE_KEY"],
               "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates"}
        for i in range(0, len(rows), 500):
            req = urllib.request.Request(url, data=json.dumps(rows[i:i + 500], default=str).encode(), headers=hdr, method="POST")
            urllib.request.urlopen(req, timeout=120).read()
        print("supabase upsert done", file=sys.stderr)


if __name__ == "__main__":
    main()
