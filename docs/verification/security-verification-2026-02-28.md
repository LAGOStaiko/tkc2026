# Security Verification - 2026-02-28

## Live smoke (prod)

- Tested at (KST): `2026-03-01 07:38 KST` (converted from live response Date)
- Target URL: `https://tkc2026.net/api/register`

### Result summary

| Case | Request condition | Expected | Actual |
|---|---|---|---|
| 415 Unsupported Media Type | `Content-Type: text/plain` | 415 | PASS |
| 413 Payload Too Large | `big.json` around `20KB` | 413 | PASS |
| 403 Forbidden | `Origin: https://evil.example`, `Sec-Fetch-Site: cross-site`, `REGISTER_CSRF_MODE=enforce` | 403 | PASS |

### Confirmed security headers

- `Cache-Control: no-store`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Content-Type-Options: nosniff`

### Artifacts summary (raw files kept under `artifacts/`)

- `artifacts/smoke-415.txt`: status `415`, confirmed the 3 security headers above.
- `artifacts/smoke-403.txt`: status `403`, confirmed the 3 security headers above.
- `artifacts/smoke-413.txt`: raw file is not currently present in this repository.

## Operational close-out checklist

- [ ] Remove or strictly limit (IP only) Cloudflare Access `/api/*` bypass policy after testing.
- [ ] Ensure `ALLOWED_ORIGINS` contains origin only, with no trailing slash (`https://tkc2026.net`).
- [ ] Confirm final `REGISTER_CSRF_MODE` value (`log-only` vs `enforce`).
- [ ] Confirm final `TURNSTILE_MODE`/`TURNSTILE_SECRET` values (recommend `required` in production).
- [ ] Redeploy after binding `RATE_LIMIT_KV`.

## Turnstile recovery & verification

### Actions taken

- Cloudflare Turnstile widget was re-created.
- `VITE_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` were re-registered in Production environment variables.
- A redeploy was executed after the variable update.

### Verification checklist

- [ ] Confirm the Turnstile widget is visible on the browser application page.
- [ ] Confirm `/api/register` does not return success (`200`) for requests without a token.
  Example check: `{}` should return `400` (or another non-200 validation/auth failure).
- [ ] Run one real submission using test data and verify the server-side validation path works end-to-end.
  Use a test environment and/or a test sheet when possible.

### Operational cautions

- `ALLOWED_ORIGINS` must contain origin only, with no trailing slash (`https://tkc2026.net`).
- Keep `REGISTER_CSRF_MODE=enforce`.
- Revert any temporary Cloudflare Access `/api/*` bypass policy opened for testing.

### Data handling rule

- Never record keys, tokens, or any PII (name, phone, email, etc.) in this document.

## Clerk removal audit (2026-03-01 KST)

### Commands executed

- `git grep -n -I` (legacy auth keywords + sign-in, sign-up path scan)
- `git ls-files .tanstack/tmp`
- `pnpm run lint`
- `pnpm exec tsc -b --pretty false`
- `pnpm run test`
- `pnpm run build`

### Findings

- Legacy auth keyword references in tracked files: none after cleanup.
- Sign-up path references in tracked files: none.
- `/sign-in` references remain by design as an internal app route (no external auth provider).
- No legacy auth route directory exists under `src/routes`.

### .tanstack/tmp handling

- `.tanstack/tmp` was tracked in git initially.
- Applied: `git rm -r --cached .tanstack/tmp`.
- Added `.tanstack/` to `.gitignore` to prevent re-tracking generated router artifacts.

### CI and docs updates

- Updated `.github/workflows/ci.yml` comment that previously mentioned Clerk login.
- Updated docs/README/CHANGELOG text to remove Clerk-specific references from active guidance.

### Verification evidence

- Lint: PASS (0 errors, 1 warning in `src/main.tsx` fast-refresh rule)
  Evidence: `artifacts/auth-removal-lint.txt`
- TypeScript build check (`tsc -b`): PASS
  Evidence: `artifacts/auth-removal-tsc.txt`
- Tests: PASS (`2` files, `32` tests)
  Evidence: `artifacts/auth-removal-test.txt`
- Production build: PASS
  Evidence: `artifacts/auth-removal-build.txt`

### Clerk complete removal checklist

- [x] Clerk package dependency removed from `package.json` and lockfile.
- [x] Runtime/client imports from Clerk removed from app code.
- [x] Server helper for Clerk auth removed.
- [x] Legacy auth route references removed from tracked source files.
- [x] Generated `.tanstack/tmp` artifacts untracked and ignored.
- [x] CI/docs references updated to non-Clerk wording.
