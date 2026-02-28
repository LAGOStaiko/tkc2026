#!/usr/bin/env bash
set -euo pipefail

# Usage:
# 1) Start Pages Functions locally (example):
#    npx wrangler pages dev dist --compatibility-date=2026-02-28
# 2) In another shell:
#    BASE_URL=http://127.0.0.1:8788 bash scripts/security-smoke.sh
#
# Notes:
# - This script intentionally uses synthetic payloads only.
# - Do not pass real names/emails/phones in test payloads.

BASE_URL="${BASE_URL:-http://127.0.0.1:8788}"
OUT_FILE="${OUT_FILE:-artifacts/security-smoke.log}"
mkdir -p "$(dirname "$OUT_FILE")"

echo "[security-smoke] started $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee "$OUT_FILE"
echo "[security-smoke] base_url=$BASE_URL" | tee -a "$OUT_FILE"

small_payload='{"division":"console","website":"","turnstileToken":"","name":"Test User","phone":"010-0000-0000","email":"test@example.com","nickname":"tester","videoLink":"https://example.com/v","spectator":false,"isMinor":false,"consentLink":"","privacyAgree":true}'

status_non_json=$(
  curl -sS -o /tmp/security-smoke-non-json.out -w "%{http_code}" \
    -X POST "$BASE_URL/api/register" \
    -H "Content-Type: text/plain" \
    --data "$small_payload" || true
)
echo "[case non-json-content-type] status=$status_non_json" | tee -a "$OUT_FILE"

large_blob="$(head -c 17000 < /dev/zero | tr '\0' 'a')"
large_payload="{\"division\":\"console\",\"website\":\"\",\"turnstileToken\":\"\",\"name\":\"$large_blob\",\"phone\":\"010-0000-0000\",\"email\":\"test@example.com\",\"nickname\":\"tester\",\"videoLink\":\"https://example.com/v\",\"spectator\":false,\"isMinor\":false,\"consentLink\":\"\",\"privacyAgree\":true}"
status_large=$(
  curl -sS -o /tmp/security-smoke-large.out -w "%{http_code}" \
    -X POST "$BASE_URL/api/register" \
    -H "Content-Type: application/json" \
    --data "$large_payload" || true
)
echo "[case body-too-large] status=$status_large" | tee -a "$OUT_FILE"

status_cross_site=$(
  curl -sS -o /tmp/security-smoke-cross-site.out -w "%{http_code}" \
    -X POST "$BASE_URL/api/register" \
    -H "Content-Type: application/json" \
    -H "Sec-Fetch-Site: cross-site" \
    -H "Origin: https://evil.example.test" \
    --data "$small_payload" || true
)
echo "[case cross-site-fetch-metadata] status=$status_cross_site" | tee -a "$OUT_FILE"

echo "[security-smoke] completed $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$OUT_FILE"
