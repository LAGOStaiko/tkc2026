import type { _Env } from "./gas";
import { parseBoundedInt } from "./number";

export type KvNamespaceLike = {
  get: (key: string) => Promise<string | null>;
  put: (
    key: string,
    value: string,
    options?: { expirationTtl?: number }
  ) => Promise<void>;
};

export type RateLimitEnv = _Env & {
  RATE_LIMIT_KV?: KvNamespaceLike;
  RATE_LIMIT_WINDOW_MS?: string | number;
  RATE_LIMIT_MAX?: string | number;
};

export type RateLimitConfig = {
  windowMs: number;
  max: number;
  kvPrefix: string;
};

type RateLimitResult = {
  limited: boolean;
  retryAfter: number;
};

const CLEANUP_INTERVAL = 100;
const stores = new Map<
  string,
  Map<string, { count: number; resetAt: number }>
>();
const counters = new Map<string, number>();

function getStore(prefix: string) {
  let store = stores.get(prefix);
  if (!store) {
    store = new Map();
    stores.set(prefix, store);
  }
  return store;
}

function cleanupExpiredEntries(
  store: Map<string, { count: number; resetAt: number }>
) {
  const now = Date.now();
  for (const [ip, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(ip);
    }
  }
}

function hitRateLimitInMemory(
  ip: string,
  config: RateLimitConfig
): RateLimitResult {
  const store = getStore(config.kvPrefix);
  const counter = (counters.get(config.kvPrefix) ?? 0) + 1;
  counters.set(config.kvPrefix, counter);

  if (counter >= CLEANUP_INTERVAL) {
    counters.set(config.kvPrefix, 0);
    cleanupExpiredEntries(store);
  }

  const now = Date.now();
  const entry = store.get(ip);
  if (!entry || entry.resetAt <= now) {
    store.set(ip, { count: 1, resetAt: now + config.windowMs });
    return { limited: false, retryAfter: Math.ceil(config.windowMs / 1000) };
  }

  entry.count += 1;
  const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
  return { limited: entry.count > config.max, retryAfter };
}

async function hitRateLimitWithKv(
  ip: string,
  kv: KvNamespaceLike,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowNo = Math.floor(now / config.windowMs);
  const resetAt = (windowNo + 1) * config.windowMs;
  const retryAfter = Math.max(1, Math.ceil((resetAt - now) / 1000));
  const key = `${config.kvPrefix}:${ip}:${windowNo}`;

  const raw = await kv.get(key);
  const current = Number(raw ?? "0");
  const safeCurrent = Number.isFinite(current) && current > 0 ? current : 0;
  const next = safeCurrent + 1;

  await kv.put(key, String(next), { expirationTtl: retryAfter + 60 });

  return { limited: next > config.max, retryAfter };
}

export async function hitRateLimit(
  ip: string,
  env: RateLimitEnv,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const kv = env.RATE_LIMIT_KV;
  if (kv) {
    try {
      return await hitRateLimitWithKv(ip, kv, config);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("rate_limit_kv_error", error);
    }
  }
  return hitRateLimitInMemory(ip, config);
}

export function buildRateLimitConfig(
  env: RateLimitEnv,
  overrides: {
    prefix: string;
    defaultWindowMs?: number;
    defaultMax?: number;
  }
): RateLimitConfig {
  const tier = String(env.TKC_ENV_TIER ?? "production")
    .trim()
    .toLowerCase();
  return {
    windowMs: parseBoundedInt(
      env.RATE_LIMIT_WINDOW_MS,
      overrides.defaultWindowMs ?? 60_000,
      60_000,
      3_600_000
    ),
    max: parseBoundedInt(
      env.RATE_LIMIT_MAX,
      overrides.defaultMax ?? 60,
      1,
      1000
    ),
    kvPrefix: tier ? `${overrides.prefix}:${tier}` : overrides.prefix,
  };
}

export function getClientIp(request: Request): string {
  const cfIp = request.headers.get("CF-Connecting-IP");
  if (cfIp) return cfIp.trim();
  const forwarded = request.headers.get("X-Forwarded-For");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return "unknown";
}
