import { parseBoundedInt } from "./number";

export type RegisterGuardEnv = {
  TKC_ENV_TIER?: string;
  REGISTER_CSRF_MODE?: string;
  ALLOWED_ORIGINS?: string;
  REGISTER_MAX_BODY_BYTES?: string | number;
};

export type RegisterCsrfMode = "off" | "log-only" | "enforce";

const DEFAULT_REGISTER_MAX_BODY_BYTES = 16 * 1024;
const REGISTER_MAX_BODY_BYTES_MIN = 1 * 1024;
const REGISTER_MAX_BODY_BYTES_MAX = 256 * 1024;

type ReadJsonResult =
  | { ok: true; data: unknown }
  | { ok: false; status: 400 | 413; error: string };

export function resolveRegisterCsrfMode(env: RegisterGuardEnv): RegisterCsrfMode {
  const raw = String(env.REGISTER_CSRF_MODE ?? "")
    .trim()
    .toLowerCase();
  if (raw === "off" || raw === "log-only" || raw === "enforce") {
    return raw;
  }

  const tier = String(env.TKC_ENV_TIER ?? "production")
    .trim()
    .toLowerCase();
  if (["staging", "stage", "preview", "test", "testing", "qa", "edit", "editor", "ops", "operation"].includes(tier)) {
    return "log-only";
  }
  return "enforce";
}

export function resolveRegisterMaxBodyBytes(env: RegisterGuardEnv): number {
  return parseBoundedInt(
    env.REGISTER_MAX_BODY_BYTES,
    DEFAULT_REGISTER_MAX_BODY_BYTES,
    REGISTER_MAX_BODY_BYTES_MIN,
    REGISTER_MAX_BODY_BYTES_MAX
  );
}

export function isJsonContentType(request: Request): boolean {
  const contentType = request.headers.get("content-type");
  if (!contentType) return false;
  return /^application\/json(?:\s*;|$)/i.test(contentType.trim());
}

export async function readJsonBodyWithLimit(
  request: Request,
  maxBytes: number
): Promise<ReadJsonResult> {
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader.trim());
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      return {
        ok: false,
        status: 413,
        error: "Request body is too large",
      };
    }
  }

  if (!request.body) {
    return { ok: false, status: 400, error: "Invalid JSON body" };
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          // no-op
        }
        return {
          ok: false,
          status: 413,
          error: "Request body is too large",
        };
      }
      chunks.push(decoder.decode(value, { stream: true }));
    }
    chunks.push(decoder.decode());
  } catch {
    return { ok: false, status: 400, error: "Invalid JSON body" };
  }

  const text = chunks.join("");
  if (!text.trim()) return { ok: false, status: 400, error: "Invalid JSON body" };

  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400, error: "Invalid JSON body" };
  }
}

function normalizeOrigin(value: string): string | null {
  try {
    const origin = new URL(value).origin;
    return origin.toLowerCase();
  } catch {
    return null;
  }
}

function parseAllowedOrigins(raw: string | undefined): Set<string> {
  const list = String(raw ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const origins = new Set<string>();
  for (const item of list) {
    const normalized = normalizeOrigin(item);
    if (normalized) origins.add(normalized);
  }
  return origins;
}

type RequestContextCheckResult = {
  allowed: boolean;
  mode: RegisterCsrfMode;
  reason?: string;
};

export function validateRegisterRequestContext(
  request: Request,
  env: RegisterGuardEnv
): RequestContextCheckResult {
  const mode = resolveRegisterCsrfMode(env);
  if (mode === "off") return { allowed: true, mode };

  const secFetchSite = String(request.headers.get("Sec-Fetch-Site") ?? "")
    .trim()
    .toLowerCase();
  if (secFetchSite === "cross-site") {
    return handleFailure(
      request,
      mode,
      "fetch_metadata_cross_site"
    );
  }

  const allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS);

  const originHeader = request.headers.get("Origin");
  if (originHeader) {
    const origin = normalizeOrigin(originHeader);
    if (!origin || !allowedOrigins.has(origin)) {
      return handleFailure(request, mode, "origin_not_allowed");
    }
    return { allowed: true, mode };
  }

  const refererHeader = request.headers.get("Referer");
  if (refererHeader) {
    const refererOrigin = normalizeOrigin(refererHeader);
    if (!refererOrigin || !allowedOrigins.has(refererOrigin)) {
      return handleFailure(request, mode, "referer_origin_not_allowed");
    }
    return { allowed: true, mode };
  }

  return handleFailure(request, mode, "missing_origin_and_referer");
}

function handleFailure(
  request: Request,
  mode: RegisterCsrfMode,
  reason: string
): RequestContextCheckResult {
  if (mode === "log-only") {
    const cfRay = request.headers.get("cf-ray") ?? "-";
    const url = new URL(request.url);
    // eslint-disable-next-line no-console
    console.warn(
      JSON.stringify({
        event: "register_request_context_warning",
        mode,
        reason,
        path: url.pathname,
        cfRay,
        ts: new Date().toISOString(),
      })
    );
    return { allowed: true, mode };
  }
  return { allowed: false, mode, reason };
}
