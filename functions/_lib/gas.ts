export interface Env {
  GAS_WEBAPP_URL: string; // e.g. https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
  GAS_API_KEY: string;    // shared secret (same as GAS Script Properties API_KEY)
}

export type GasAction = "site" | "schedule" | "results" | "content" | "register";

export async function callGas(env: Env, action: GasAction, params?: Record<string, unknown>, payload?: unknown) {
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

export async function callGasJson(env: Env, action: GasAction, params?: Record<string, unknown>, payload?: unknown) {
  const res = await callGas(env, action, params, payload);
  const text = await res.text();

  // GAS should always return JSON, but guard anyway.
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response from GAS (status ${res.status}): ${text.slice(0, 200)}`);
  }

  if (!parsed || parsed.ok !== true) {
    const msg = parsed?.error ? String(parsed.error) : "GAS returned ok=false";
    const details = parsed?.details ? JSON.stringify(parsed.details).slice(0, 500) : "";
    throw new Error(details ? `${msg}: ${details}` : msg);
  }

  return parsed;
}
