export interface _Env {
  GAS_WEBAPP_URL: string; // e.g. https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
  GAS_API_KEY: string;    // shared secret (same as GAS Script Properties API_KEY)
}

export type GasAction =
  | "site"
  | "schedule"
  | "results"
  | "content"
  | "showcaseSongs"
  | "songPools"
  | "register"
  | "pubCommit"
  | "opsFeed"
  | "opsUpsert"
  | "opsExport"
  | "opsInit"
  | "opsGuide"
  | "opsSwissRebuildStandings"
  | "opsSwissNextRound"
  | "opsRoundClose"
  | "opsInlineGuide"
  | "opsBeginnerGuide"
  | "opsFirstTimeSetup"
  | "opsValidate"
  | "opsPublish"
  | "opsRollback"
  | "opsListSnapshots"
  | "opsPublishLog";

export async function callGas(env: _Env, action: GasAction, params?: Record<string, unknown>, payload?: unknown) {
  if (!env.GAS_WEBAPP_URL) throw new Error("Missing env.GAS_WEBAPP_URL");
  if (!env.GAS_API_KEY) throw new Error("Missing env.GAS_API_KEY");

  const body = JSON.stringify({
    apiKey: env.GAS_API_KEY,
    action,
    params: params ?? {},
    payload: payload ?? null,
  });

  // Apps Script Web App often responds with a 302 redirect for POST.
  // We handle it manually (and then follow with GET to the Location).
  const res1 = await fetch(env.GAS_WEBAPP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    redirect: "manual",
  });

  if (res1.status >= 300 && res1.status < 400) {
    const loc = res1.headers.get("location") ?? res1.headers.get("Location");
    if (!loc) throw new Error("GAS redirect without Location header");

    const res2 = await fetch(loc, { method: "GET", redirect: "follow" });
    return res2;
  }

  return res1;
}

type GasResponse = {
  ok?: boolean;
  data?: unknown;
  error?: unknown;
  details?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export async function callGasJson(env: _Env, action: GasAction, params?: Record<string, unknown>, payload?: unknown) {
  const res = await callGas(env, action, params, payload);
  const text = await res.text();

  // GAS should always return JSON, but guard anyway.
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response from GAS (status ${res.status}): ${text.slice(0, 200)}`);
  }

  if (!isRecord(parsed)) {
    throw new Error(`Non-object response from GAS (status ${res.status}): ${text.slice(0, 200)}`);
  }

  const response = parsed as GasResponse;
  if (response.ok !== true) {
    const msg = typeof response.error === "string" ? response.error : "GAS returned ok=false";
    const details = response.details ? JSON.stringify(response.details).slice(0, 500) : "";
    throw new Error(details ? `${msg}: ${details}` : msg);
  }

  return response;
}
