# TKC2026 Security File Map

## Register Path
- `src/components/tkc/apply-page.tsx`
  - Apply form UI, client validation, Turnstile token wiring, submit UX mapping
- `functions/api/register.ts`
  - Register endpoint hardening, schema validation, conditional Turnstile verification, request guards
- `functions/_lib/request-guards.ts`
  - JSON content-type enforcement, body size guard, request-context checks
- `functions/_lib/sanitize.ts`
  - Spreadsheet formula injection protection
- `shared/register-limits.ts`
  - Register payload field limits

## Shared Backend Security Utilities
- `functions/_lib/response.ts`
  - Common JSON response helpers + security headers + `withNoStore`
- `functions/_lib/number.ts`
  - Shared bounded integer parsing with fallback-safe behavior
- `functions/_lib/rate-limit.ts`
  - Rate limiting core (KV + in-memory fallback)
- `functions/_lib/gas.ts`
  - GAS transport, timeout/retry control, tier-aware endpoint selection

## Ops Security
- `functions/_lib/ops-auth.ts`
  - Multi-key auth, constant-time compare, optional IP allowlist
- `functions/api/ops/*.ts`
  - Ops endpoints (all guarded by `requireOpsAuth`)

## Headers / Policy Reference
- `public/_headers`
  - Static asset and page header policy reference
  - Note: not applied to Pages Functions responses

## Primary Delivery Set (Minimum)
1. `src/components/tkc/apply-page.tsx`
2. `functions/api/register.ts`
3. `functions/_lib/request-guards.ts`
4. `functions/_lib/rate-limit.ts`
5. `functions/_lib/ops-auth.ts`
6. `functions/_lib/response.ts`
7. `functions/_lib/number.ts`
8. `functions/_lib/gas.ts`
9. `public/_headers`
10. `docs/security-handover-2026-02-28.md`
