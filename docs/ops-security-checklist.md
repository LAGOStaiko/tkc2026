# Ops Security Checklist

## Pre-Deployment
- [ ] `OPS_OPERATOR_KEY` is set (comma-separated keys allowed for rotation).
- [ ] Old and new keys overlap during rotation window.
- [ ] `OPS_ALLOWED_IPS` is set if fixed operator egress IPs are available.
- [ ] `TURNSTILE_MODE` is explicitly configured for the target environment.
- [ ] `TURNSTILE_SECRET_KEY` exists when `TURNSTILE_MODE=required`.
- [ ] `ALLOWED_ORIGINS` includes exact production and staging origins.

## Register API Controls
- [ ] `REGISTER_CSRF_MODE` is `enforce` in production.
- [ ] `REGISTER_MAX_BODY_BYTES` is set (or default 16KB is accepted).
- [ ] Register route returns `Cache-Control: no-store`.
- [ ] Known Turnstile messages are preserved for frontend mapping:
  - `Turnstile verification required`
  - `Turnstile verification failed`

## Turnstile Validation
- [ ] `TURNSTILE_EXPECTED_HOSTNAMES` is set for production domains.
- [ ] (Optional) `TURNSTILE_EXPECTED_ACTION` is set and frontend action is aligned.
- [ ] Verify timeout behavior and upstream error handling (`502/503`) in staging.

## Rate Limit Operations
- [ ] `RATE_LIMIT_KV` binding is configured for distributed consistency.
- [ ] `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX` are tuned for event load.
- [ ] `429` trend monitoring is enabled before and during the tournament.
- [ ] NAT-heavy environments are accounted for (max tuned with Turnstile required).

## Logging and Privacy
- [ ] No key/token/PII payload values are logged.
- [ ] Structured security logs include only safe metadata (reason/path/cf-ray/timestamp).

## Validation After Deploy
- [ ] `/api/register` non-JSON request returns `415`.
- [ ] Oversized register request returns `413`.
- [ ] Cross-site register request blocked in enforce mode (`403`).
- [ ] Ops request with invalid key returns `401`.
- [ ] Ops request outside allowlist returns `403` when allowlist is enabled.
