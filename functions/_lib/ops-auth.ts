import { unauthorized } from "./response";

type OpsEnv = {
  OPS_OPERATOR_KEY?: string;
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

export function requireOpsAuth(env: OpsEnv, request: Request): Response | null {
  const expected = env.OPS_OPERATOR_KEY?.trim();
  if (!expected) {
    logAuthFailure(request, "missing_server_config");
    return unauthorized("Server is not configured for ops auth");
  }

  const provided = readOpsKey(request);
  if (!provided) {
    logAuthFailure(request, "no_key_provided");
    return unauthorized("Invalid operator key");
  }
  if (provided !== expected) {
    logAuthFailure(request, "key_mismatch");
    return unauthorized("Invalid operator key");
  }

  return null;
}
