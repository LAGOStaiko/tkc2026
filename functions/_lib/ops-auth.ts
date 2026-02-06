import { unauthorized } from "./response";

type OpsEnv = {
  OPS_OPERATOR_KEY?: string;
};

export function readOpsKey(request: Request) {
  const fromHeader = request.headers.get("X-OPS-Key") ?? request.headers.get("x-ops-key");
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
    return unauthorized("Server is not configured for ops auth");
  }

  const provided = readOpsKey(request);
  if (!provided || provided !== expected) {
    return unauthorized("Invalid operator key");
  }

  return null;
}
