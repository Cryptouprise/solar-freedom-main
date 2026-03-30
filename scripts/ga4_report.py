#!/usr/bin/env python3
"""
GA4 Data API report for breakyoursolarcontract.com (property 530239045)
Uses the GOOGLE_WORKSPACE_CLI_TOKEN environment variable for auth.
"""

import os
import json
import urllib.request
import urllib.error
from datetime import datetime, timedelta

PROPERTY_ID = "530239045"
TOKEN = os.environ.get("GOOGLE_WORKSPACE_CLI_TOKEN") or os.environ.get("GOOGLE_DRIVE_TOKEN")
BASE_URL = f"https://analyticsdata.googleapis.com/v1beta/properties/{PROPERTY_ID}:runReport"

def run_report(body):
    req = urllib.request.Request(
        BASE_URL,
        data=json.dumps(body).encode(),
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {"error": e.read().decode()}

# ── 1. Overview: last 24 hours ─────────────────────────────────────────────────
overview = run_report({
    "dateRanges": [{"startDate": "1daysAgo", "endDate": "today"}],
    "metrics": [
        {"name": "activeUsers"},
        {"name": "newUsers"},
        {"name": "sessions"},
        {"name": "screenPageViews"},
        {"name": "eventCount"},
        {"name": "bounceRate"},
        {"name": "averageSessionDuration"},
    ],
    "dimensions": [],
})

# ── 2. Top pages ───────────────────────────────────────────────────────────────
top_pages = run_report({
    "dateRanges": [{"startDate": "1daysAgo", "endDate": "today"}],
    "metrics": [{"name": "screenPageViews"}, {"name": "activeUsers"}],
    "dimensions": [{"name": "pagePath"}, {"name": "pageTitle"}],
    "orderBys": [{"metric": {"metricName": "screenPageViews"}, "desc": True}],
    "limit": 10,
})

# ── 3. Traffic sources ─────────────────────────────────────────────────────────
traffic = run_report({
    "dateRanges": [{"startDate": "1daysAgo", "endDate": "today"}],
    "metrics": [{"name": "sessions"}, {"name": "activeUsers"}],
    "dimensions": [{"name": "sessionDefaultChannelGroup"}],
    "orderBys": [{"metric": {"metricName": "sessions"}, "desc": True}],
})

# ── 4. Events ──────────────────────────────────────────────────────────────────
events = run_report({
    "dateRanges": [{"startDate": "1daysAgo", "endDate": "today"}],
    "metrics": [{"name": "eventCount"}],
    "dimensions": [{"name": "eventName"}],
    "orderBys": [{"metric": {"metricName": "eventCount"}, "desc": True}],
    "limit": 15,
})

# ── 5. Last 7 days overview (for context) ──────────────────────────────────────
week = run_report({
    "dateRanges": [{"startDate": "7daysAgo", "endDate": "today"}],
    "metrics": [
        {"name": "activeUsers"},
        {"name": "newUsers"},
        {"name": "sessions"},
        {"name": "screenPageViews"},
        {"name": "eventCount"},
    ],
    "dimensions": [],
})

# ── Print results ──────────────────────────────────────────────────────────────
print("=" * 60)
print(f"GA4 REPORT — breakyoursolarcontract.com (property {PROPERTY_ID})")
print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S MDT')}")
print("=" * 60)

def get_metric(report, idx):
    try:
        return report["rows"][0]["metricValues"][idx]["value"]
    except (KeyError, IndexError):
        return "0"

if "error" in overview:
    print(f"\nERROR accessing GA4 API: {overview['error']}")
else:
    print("\n── LAST 24 HOURS ──────────────────────────────────────────")
    print(f"  Active Users:          {get_metric(overview, 0)}")
    print(f"  New Users:             {get_metric(overview, 1)}")
    print(f"  Sessions:              {get_metric(overview, 2)}")
    print(f"  Page Views:            {get_metric(overview, 3)}")
    print(f"  Events:                {get_metric(overview, 4)}")
    bounce = float(get_metric(overview, 5)) * 100
    print(f"  Bounce Rate:           {bounce:.1f}%")
    avg_dur = float(get_metric(overview, 6))
    print(f"  Avg Session Duration:  {avg_dur:.0f}s ({avg_dur/60:.1f} min)")

if "error" not in week:
    print("\n── LAST 7 DAYS ────────────────────────────────────────────")
    print(f"  Active Users:  {get_metric(week, 0)}")
    print(f"  New Users:     {get_metric(week, 1)}")
    print(f"  Sessions:      {get_metric(week, 2)}")
    print(f"  Page Views:    {get_metric(week, 3)}")
    print(f"  Events:        {get_metric(week, 4)}")

if "error" not in top_pages and "rows" in top_pages:
    print("\n── TOP PAGES (last 24h) ───────────────────────────────────")
    print(f"  {'Views':>6}  {'Users':>6}  Page")
    print(f"  {'------':>6}  {'------':>6}  ----")
    for row in top_pages.get("rows", []):
        path = row["dimensionValues"][0]["value"]
        title = row["dimensionValues"][1]["value"][:40]
        views = row["metricValues"][0]["value"]
        users = row["metricValues"][1]["value"]
        print(f"  {views:>6}  {users:>6}  {path} ({title})")

if "error" not in traffic and "rows" in traffic:
    print("\n── TRAFFIC SOURCES (last 24h) ─────────────────────────────")
    print(f"  {'Sessions':>8}  {'Users':>6}  Channel")
    print(f"  {'--------':>8}  {'------':>6}  -------")
    for row in traffic.get("rows", []):
        channel = row["dimensionValues"][0]["value"]
        sessions = row["metricValues"][0]["value"]
        users = row["metricValues"][1]["value"]
        print(f"  {sessions:>8}  {users:>6}  {channel}")

if "error" not in events and "rows" in events:
    print("\n── EVENTS (last 24h) ──────────────────────────────────────")
    print(f"  {'Count':>8}  Event")
    print(f"  {'--------':>8}  -----")
    for row in events.get("rows", []):
        event = row["dimensionValues"][0]["value"]
        count = row["metricValues"][0]["value"]
        print(f"  {count:>8}  {event}")

print("\n" + "=" * 60)
