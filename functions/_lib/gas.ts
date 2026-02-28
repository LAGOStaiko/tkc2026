import { parseBoundedInt } from "./number";

export interface _Env {
  // Default GAS endpoint (legacy + fallback)
  GAS_WEBAPP_URL?: string; // e.g. https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
  // Optional tier-specific endpoints for prod/staging/edit separation.
  GAS_WEBAPP_URL_PRODUCTION?: string;
  GAS_WEBAPP_URL_STAGING?: string;
  GAS_WEBAPP_URL_EDIT?: string;
  // Deployment tier selector. Examples: production, staging, edit.
  TKC_ENV_TIER?: string;
  // Networking controls for upstream GAS calls.
  GAS_FETCH_TIMEOUT_MS?: string | number;
  GAS_FETCH_RETRIES?: string | number;
  GAS_API_KEY: string; // shared secret (same as GAS Script Properties API_KEY)
}

export type GasAction =
  | "site"
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

export type DeploymentTier = "production" | "staging" | "edit";

const DEFAULT_FETCH_TIMEOUT_MS = 12_000;
const MIN_FETCH_TIMEOUT_MS = 2_000;
const MAX_FETCH_TIMEOUT_MS = 30_000;
const DEFAULT_READ_RETRIES = 1;
const MAX_READ_RETRIES = 2;

const RETRYABLE_READ_ACTIONS = new Set<GasAction>([
  "site",
  "results",
  "content",
  "showcaseSongs",
  "songPools",
  "opsFeed",
  "opsValidate",
  "opsListSnapshots",
  "opsPublishLog",
]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const pickFirst = (...values: Array<string | undefined>) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

export function resolveDeploymentTier(env: _Env): DeploymentTier {
  const raw = String(env.TKC_ENV_TIER ?? "")
    .trim()
    .toLowerCase();

  if (["staging", "stage", "preview", "test", "testing", "qa"].includes(raw)) {
    return "staging";
  }
  if (["edit", "editor", "ops", "operation"].includes(raw)) {
    return "edit";
  }
  return "production";
}

export function resolveGasWebAppUrl(env: _Env) {
  const tier = resolveDeploymentTier(env);
  if (tier === "staging") {
    return pickFirst(env.GAS_WEBAPP_URL_STAGING, env.GAS_WEBAPP_URL);
  }
  if (tier === "edit") {
    // Edit tier can intentionally point to a dedicated endpoint, but defaults to prod/fallback.
    return pickFirst(
      env.GAS_WEBAPP_URL_EDIT,
      env.GAS_WEBAPP_URL_PRODUCTION,
      env.GAS_WEBAPP_URL
    );
  }
  return pickFirst(env.GAS_WEBAPP_URL_PRODUCTION, env.GAS_WEBAPP_URL);
}

export function resolveGasNetworkConfig(env: _Env, action: GasAction) {
  const timeoutMs = parseBoundedInt(
    env.GAS_FETCH_TIMEOUT_MS,
    DEFAULT_FETCH_TIMEOUT_MS,
    MIN_FETCH_TIMEOUT_MS,
    MAX_FETCH_TIMEOUT_MS
  );
  const readRetries = parseBoundedInt(
    env.GAS_FETCH_RETRIES,
    DEFAULT_READ_RETRIES,
    0,
    MAX_READ_RETRIES
  );
  const maxRetries = RETRYABLE_READ_ACTIONS.has(action) ? readRetries : 0;
  return { timeoutMs, readRetries, maxRetries };
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const isRetryableStatus = (status: number) => status === 429 || status >= 500;

async function requestGasOnce(
  gasWebAppUrl: string,
  body: string,
  timeoutMs: number
) {
  // Apps Script Web App often responds with a 302 redirect for POST.
  // We handle it manually (and then follow with GET to the Location).
  const res1 = await fetchWithTimeout(
    gasWebAppUrl,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      redirect: "manual",
    },
    timeoutMs
  );

  if (res1.status >= 300 && res1.status < 400) {
    const loc = res1.headers.get("location") ?? res1.headers.get("Location");
    if (!loc) throw new Error("GAS redirect without Location header");
    return fetchWithTimeout(loc, { method: "GET", redirect: "follow" }, timeoutMs);
  }

  return res1;
}

export async function callGas(env: _Env, action: GasAction, params?: Record<string, unknown>, payload?: unknown) {
  const gasWebAppUrl = resolveGasWebAppUrl(env);
  if (!gasWebAppUrl) {
    throw new Error(
      "Missing GAS endpoint. Set GAS_WEBAPP_URL or tier-specific GAS_WEBAPP_URL_* env."
    );
  }
  const apiKey = env.GAS_API_KEY?.trim();
  if (!apiKey) throw new Error("Missing env.GAS_API_KEY");

  const { timeoutMs, maxRetries } = resolveGasNetworkConfig(env, action);

  const body = JSON.stringify({
    apiKey,
    action,
    params: params ?? {},
    payload: payload ?? null,
  });

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const res = await requestGasOnce(gasWebAppUrl, body, timeoutMs);
      if (attempt < maxRetries && isRetryableStatus(res.status)) {
        await sleep(150 * (attempt + 1));
        continue;
      }
      return res;
    } catch (error) {
      if (attempt < maxRetries) {
        await sleep(150 * (attempt + 1));
        continue;
      }
      throw error;
    }
  }

  throw new Error("GAS request failed");
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
