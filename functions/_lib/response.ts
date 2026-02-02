export function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json; charset=UTF-8");
  }
  // Security defaults (safe even for same-origin)
  if (!headers.has("X-Content-Type-Options")) headers.set("X-Content-Type-Options", "nosniff");
  if (!headers.has("Referrer-Policy")) headers.set("Referrer-Policy", "same-origin");

  return new Response(JSON.stringify(data), { ...init, headers });
}

export function ok(data: unknown) {
  return json({ ok: true, ...data }, { status: 200 });
}

export function badRequest(message: string, details?: unknown) {
  return json({ ok: false, error: message, details }, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return json({ ok: false, error: message }, { status: 401 });
}

export function serverError(err: unknown) {
  // Avoid leaking internal error details to clients. Cloudflare logs will still capture this.
  // eslint-disable-next-line no-console
  console.error(err);
  return json({ ok: false, error: "Internal Server Error" }, { status: 500 });
}
