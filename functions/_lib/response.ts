export function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json; charset=UTF-8");
  }
  // Security defaults (safe even for same-origin)
  if (!headers.has("X-Content-Type-Options")) headers.set("X-Content-Type-Options", "nosniff");
  if (!headers.has("Referrer-Policy")) {
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  }

  return new Response(JSON.stringify(data), { ...init, headers });
}

export function withNoStore(init: ResponseInit = {}): ResponseInit {
  const headers = new Headers(init.headers);
  if (!headers.has("Cache-Control")) {
    headers.set("Cache-Control", "no-store");
  }
  return { ...init, headers };
}

export function ok(data: unknown, init: ResponseInit = {}) {
  return json({ ok: true, ...data }, { status: 200, ...init });
}

export function badRequest(
  message: string,
  details?: unknown,
  init: ResponseInit = {}
) {
  return json({ ok: false, error: message, details }, { status: 400, ...init });
}

export function forbidden(message = "Forbidden", init: ResponseInit = withNoStore()) {
  return json({ ok: false, error: message }, { status: 403, ...init });
}

export function unsupportedMediaType(
  message = "Unsupported Media Type",
  init: ResponseInit = {}
) {
  return json({ ok: false, error: message }, { status: 415, ...init });
}

export function payloadTooLarge(
  message = "Payload Too Large",
  init: ResponseInit = {}
) {
  return json({ ok: false, error: message }, { status: 413, ...init });
}

export function tooManyRequests(
  message = "Too Many Requests",
  retryAfter?: number,
  init: ResponseInit = {}
) {
  const headers = new Headers(init.headers);
  if (retryAfter !== undefined) {
    headers.set("Retry-After", String(retryAfter));
  }
  return json({ ok: false, error: message }, { status: 429, ...init, headers });
}

export function unauthorized(message = "Unauthorized", init: ResponseInit = withNoStore()) {
  return json({ ok: false, error: message }, { status: 401, ...init });
}

export function serviceUnavailable(
  message = "Service Unavailable",
  init: ResponseInit = {}
) {
  return json({ ok: false, error: message }, { status: 503, ...init });
}

export function badGateway(message = "Bad Gateway", init: ResponseInit = {}) {
  return json({ ok: false, error: message }, { status: 502, ...init });
}

export function noContent(init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has("X-Content-Type-Options")) {
    headers.set("X-Content-Type-Options", "nosniff");
  }
  if (!headers.has("Referrer-Policy")) {
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  }
  return new Response(null, { ...init, headers, status: 204 });
}

export function serverError(err: unknown, init: ResponseInit = {}) {
  // Avoid leaking internal error details to clients. Cloudflare logs will still capture this.
  // eslint-disable-next-line no-console
  console.error(err);
  return json({ ok: false, error: "Internal Server Error" }, { status: 500, ...init });
}
