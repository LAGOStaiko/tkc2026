## Description

<!-- A clear and concise description of what the pull request does. Include any relevant motivation and background. -->

## Types of changes

- [ ] Bug Fix (non-breaking change which fixes an issue)
- [ ] New Feature (non-breaking change which adds functionality)
- [ ] Security (headers, auth, validation, dependencies)
- [ ] Others (any other types not listed above)

## Checklist

- [ ] I have read the [Contributing Guide](https://github.com/satnaing/shadcn-admin/blob/main/.github/CONTRIBUTING.md)
- [ ] `pnpm lint && pnpm format:check && pnpm build` passes locally

## Security deployment checklist

> Complete the items below when the PR touches security-related code (CSP headers, auth, input validation, dependency updates). Remove the section if not applicable.

- [ ] `pnpm audit --prod --audit-level high` reports 0 high/critical vulnerabilities
- [ ] `_headers` CSP changes deployed as **Report-Only** first
- [ ] Browser console captures (before/after) attached showing **0 CSP violations**
- [ ] Verified pages: `/` (YouTube embed), `/apply` (Turnstile), `/sign-in` (Clerk)
- [ ] Auth-protected endpoints return 401 without valid key
- [ ] `base-uri 'self'`, `object-src 'none'`, `frame-ancestors 'none'` unchanged
- [ ] `script-src` does NOT include `unsafe-inline` or `unsafe-eval`

## Regression verification (required for security / API changes)

> Attach request/response captures or logs proving each item. Remove the section if not applicable.

- [ ] Registration success: valid payload → `{ ok: true, receiptId: "..." }`
- [ ] Registration rejection: field exceeding max length → `400` / validation error
- [ ] Registration rejection: `http://` or `javascript:` URL scheme → `400` / validation error
- [ ] Site/Content API: `heroBgUrl`, `heroBgPosterUrl`, `imageUrl` contain only `https://` or empty string
- [ ] Error response: unhandled exception returns `"Internal Server Error"` (no stack trace / raw error)

## Further comments

<!-- If this is a relatively large or complex change, kick off the discussion by explaining why you chose the solution you did and what alternatives you considered, etc... -->

## Related Issue

Closes: #<!-- Issue number, if applicable -->
