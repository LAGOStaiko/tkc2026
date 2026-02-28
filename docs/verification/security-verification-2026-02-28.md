# Security Verification Report (2026-02-28)

## Scope
- PR security hardening verification round for Pages Functions + React/Vite.
- Goal: leave machine-verifiable evidence so manual checks are minimized.
- Secret/PII policy during verification: no real tokens/keys/names/emails/phones used in commands or artifacts.

## A) Repository Meta / Scripts

### Package manager
- Detected: `pnpm` (`pnpm-lock.yaml` present)

### package.json scripts

| Script | Command | Used in this round |
|---|---|---|
| `dev` | `vite` | No (Functions runtime unavailable in current env) |
| `build` | `tsc -b && vite build` | Yes |
| `lint` | `eslint .` | Yes |
| `preview` | `vite preview` | No |
| `format:check` | `prettier --check .` | No |
| `format` | `prettier --write .` | No |
| `knip` | `knip` | No |
| `test` | `vitest run` | Yes |
| `test:watch` | `vitest` | No |

## B) Quality Gates

| Step | Command | Result | Evidence |
|---|---|---|---|
| install | `pnpm i --frozen-lockfile` | PASS | `artifacts/verification-install.log` |
| lint | `pnpm lint` | PASS (after retry) | `artifacts/verification-lint.log` |
| typecheck | `pnpm exec tsc -b --pretty false` | PASS | `artifacts/verification-typecheck.log` |
| unit test | `pnpm test` | PASS (`6 files`, `61 tests`) | `artifacts/verification-test.log` |
| build | `pnpm build` | PASS | `artifacts/verification-build.log` |

### Key output summary
- Test suite: `61 passed, 0 failed`.
- Build: success, with non-blocking chunk-size warning from Vite.
- Lint: success.
- Typecheck: success.

## C) Security-Critical Automated Tests

### 1) `parseBoundedInt` and default regression
- File: `tests/number.test.ts`
  - `undefined`, `""`, `"   "` => fallback
  - `"0"` => min clamp
  - high values => max clamp
  - GAS network defaults preserved (`timeout=12000`, retries=`1`)
- File: `tests/rate-limit.test.ts`
  - Register defaults preserved at `10min / 30` when env missing
  - Blank env strings still use fallback defaults

### 2) Register request guards
- File: `tests/register-route-security.test.ts`
  - non-JSON Content-Type => 415
  - oversized request (Content-Length 20000) => 413
  - `Sec-Fetch-Site: cross-site` in enforce mode => 403
  - `Origin` exact-match enforcement (no substring/partial match) => 403
  - `REGISTER_CSRF_MODE` behavior verified:
    - `off`: allowed
    - `log-only`: allowed + warning path
    - `enforce`: blocked when invalid

### 3) Turnstile mode/verification behavior
- File: `tests/register-route-security.test.ts`
  - production + `TURNSTILE_MODE=required` + missing secret => 503 (fail-closed)
  - `conditional` + missing secret => pass-through behavior
  - verify `success=false` => 400 (`Turnstile verification failed`)
  - hostname mismatch with expected hostnames => 400
  - network failure during siteverify => 502 (`Turnstile verification unavailable`)

### 4) Ops auth
- File: `tests/ops-auth.test.ts`
  - multi-key auth (`OPS_OPERATOR_KEY` comma-separated) => pass on each valid key
  - mismatched key => 401
  - IP allowlist mismatch => 403
  - constant-time compare unit checks:
    - exact match true
    - different lengths false
    - same length different values false

## D) Runtime Smoke

### Attempt result
- Command attempted:
  - `pnpm exec wrangler --version`
- Result: FAIL (`wrangler` not found in current environment)
- Evidence: `artifacts/security-smoke.log`

### Fallback delivered
- Added executable plan script:
  - `scripts/security-smoke.sh`
- Script covers:
  - wrong Content-Type request
  - >16KB payload request
  - cross-site fetch metadata request
- Output target:
  - `artifacts/security-smoke.log`

## Failures / Fixes / Re-runs

1. Lint command timed out in tool wrapper (not ESLint failure)
- Initial: timeout from runner
- Action: re-run with longer timeout
- Re-run: PASS

2. Typecheck marker command had PowerShell pipe syntax error
- Initial: command wrapper syntax error
- Action: corrected command syntax and re-ran typecheck
- Re-run: PASS (`typecheck_done`)

3. Runtime smoke via local Functions was unavailable
- Initial: `wrangler` missing
- Action: created `scripts/security-smoke.sh` for reproducible manual execution once runtime is available
- Status: fallback ready, documented

## Evidence Files Produced
- `artifacts/verification-install.log`
- `artifacts/verification-lint.log`
- `artifacts/verification-typecheck.log`
- `artifacts/verification-test.log`
- `artifacts/verification-build.log`
- `artifacts/security-smoke.log`
- `scripts/security-smoke.sh`

## PII/Secret Logging Check
- Verification logs include only synthetic payloads.
- Logged security events observed in tests (`ops_auth_failure`) contain:
  - `event`, `reason`, `path`, `cfRay`, `ts`
  - no operator key/token raw values
  - no user PII fields (name/email/phone)
