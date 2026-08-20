#!/usr/bin/env bash
# Read-only GoHighLevel collector. Stores raw API responses for reproducible reporting.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/reports/operator-review/ghl"
mkdir -p "$OUT"

TOKEN="${ghlapi:-${api:-}}"
LOCATION_ID="${GHL_LOCATION_ID:-${location_id:-WBEbDUNxKL5GyxIUjjdZ}}"
BASE="https://services.leadconnectorhq.com"
VERSION="2021-07-28"
NOW_UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
START_7D="$(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%SZ)"
START_28D="$(date -u -d '28 days ago' +%Y-%m-%dT%H:%M:%SZ)"
END_UTC="$(date -u -d '1 day' +%Y-%m-%dT23:59:59Z)"

if [[ -z "$TOKEN" ]]; then
  printf '%s\n' 'No GoHighLevel token was found in ghlapi or api.' > "$OUT/error.txt"
  exit 2
fi

fetch() {
  local url="$1"
  local output="$2"
  curl --silent --show-error --fail --max-time 20 \
    -H "Authorization: Bearer $TOKEN" \
    -H "Version: $VERSION" \
    -H "Content-Type: application/json" \
    "$url" > "$output"
}

fetch "$BASE/locations/$LOCATION_ID" "$OUT/location.json"
fetch "$BASE/contacts/?locationId=$LOCATION_ID&limit=100&sortBy=dateAdded&sortOrder=desc" "$OUT/contacts_recent.json"
fetch "$BASE/opportunities/pipelines?locationId=$LOCATION_ID" "$OUT/pipelines.json"
fetch "$BASE/opportunities/search?location_id=$LOCATION_ID&limit=100" "$OUT/opportunities_recent.json"
fetch "$BASE/calendars/events?locationId=$LOCATION_ID&startDate=$START_28D&endDate=$END_UTC&limit=100" "$OUT/appointments_28d.json"
fetch "$BASE/conversations/search?locationId=$LOCATION_ID&limit=100&startAfterDate=$START_28D" "$OUT/conversations_28d.json"

cat > "$OUT/manifest.json" <<EOF
{
  "collected_at_utc": "$NOW_UTC",
  "location_id": "$LOCATION_ID",
  "windows": {
    "seven_day_start": "$START_7D",
    "twenty_eight_day_start": "$START_28D",
    "end": "$END_UTC"
  },
  "scope": "read-only contacts, pipelines, opportunities, appointments, and conversations"
}
EOF

printf '%s\n' "Collected GoHighLevel evidence in $OUT"
