import { forbidden, unauthorized } from "./response";

type OpsEnv = {
  OPS_OPERATOR_KEY?: string;
  OPS_ALLOWED_IPS?: string;
};

function logAuthFailure(request: Request, reason: string) {
  const cfRay = request.headers.get("cf-ray") ?? "-";
  const url = new URL(request.url);
  // eslint-disable-next-line no-console
  console.warn(
    JSON.stringify({
      event: "ops_auth_failure",
      reason,
      path: url.pathname,
      cfRay,
      ts: new Date().toISOString(),
    })
  );
}

export function readOpsKey(request: Request) {
  const fromHeader =
    request.headers.get("X-OPS-Key") ?? request.headers.get("x-ops-key");
  if (fromHeader?.trim()) return fromHeader.trim();

  const auth = request.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice("Bearer ".length).trim();
    if (token) return token;
  }

  return "";
}

function parseOpsOperatorKeys(raw: string | undefined) {
  return String(raw ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function constantTimeEquals(left: string, right: string) {
  const encoder = new TextEncoder();
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  const maxLen = Math.max(a.length, b.length);

  let diff = a.length === b.length ? 0 : 1;
  for (let i = 0; i < maxLen; i += 1) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

function ipv4ToInt(ip: string) {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return null;
    const n = Number(part);
    if (!Number.isInteger(n) || n < 0 || n > 255) return null;
    value = (value << 8) | n;
  }
  return value >>> 0;
}

function matchesCidr(ip: string, cidrRule: string) {
  const [base, prefixText] = cidrRule.split("/");
  if (!base || prefixText === undefined) return false;

  const ipInt = ipv4ToInt(ip);
  const baseInt = ipv4ToInt(base.trim());
  if (ipInt === null || baseInt === null) return false;

  const prefix = Number(prefixText.trim());
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;

  if (prefix === 0) return true;
  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
}

function isIpv6(ip: string) {
  return ip.includes(":");
}

export function isIpAllowed(ip: string, rules: string[]) {
  if (!rules.length) return true;
  if (!ip) return false;

  for (const rawRule of rules) {
    const rule = rawRule.trim();
    if (!rule) continue;
    if (rule.includes("/")) {
      if (matchesCidr(ip, rule)) return true;
      continue;
    }

    if (isIpv6(rule) || isIpv6(ip)) {
      if (rule.toLowerCase() === ip.toLowerCase()) return true;
      continue;
    }

    if (ipv4ToInt(rule) !== null && rule === ip) return true;
  }

  return false;
}

function getClientIp(request: Request) {
  const cfIp = request.headers.get("CF-Connecting-IP");
  if (cfIp?.trim()) return cfIp.trim();
  const forwarded = request.headers.get("X-Forwarded-For");
  if (forwarded?.trim()) {
    return forwarded.split(",")[0]?.trim() ?? "";
  }
  return "";
}

export function requireOpsAuth(env: OpsEnv, request: Request): Response | null {
  const expectedKeys = parseOpsOperatorKeys(env.OPS_OPERATOR_KEY);
  if (!expectedKeys.length) {
    logAuthFailure(request, "missing_server_config");
    return unauthorized("Server is not configured for ops auth");
  }

  const provided = readOpsKey(request);
  if (!provided) {
    logAuthFailure(request, "no_key_provided");
    return unauthorized("Invalid operator key");
  }

  const keyMatched = expectedKeys.some((expected) =>
    constantTimeEquals(provided, expected)
  );
  if (!keyMatched) {
    logAuthFailure(request, "key_mismatch");
    return unauthorized("Invalid operator key");
  }

  const ipRules = String(env.OPS_ALLOWED_IPS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (ipRules.length > 0) {
    const ip = getClientIp(request);
    if (!isIpAllowed(ip, ipRules)) {
      logAuthFailure(request, "ip_not_allowed");
      return forbidden("Forbidden");
    }
  }

  return null;
}
