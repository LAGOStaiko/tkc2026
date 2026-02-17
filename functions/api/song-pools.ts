import { ok, serverError, tooManyRequests } from "../_lib/response";
import { callGasJson } from "../_lib/gas";
import { hitRateLimit, buildRateLimitConfig, getClientIp, type RateLimitEnv } from "../_lib/rate-limit";

const CACHE_HEADERS = {
  // Short cache to absorb burst traffic while keeping near real-time updates.
  "Cache-Control": "public, max-age=5, s-maxage=20, stale-while-revalidate=30",
};

const rateConfig = (env: RateLimitEnv) =>
  buildRateLimitConfig(env, {
    prefix: "api-read:rate-limit",
    defaultWindowMs: 60_000,
    defaultMax: 60,
  });

export const onRequestGet = async ({ env, request }) => {
  try {
    const rate = await hitRateLimit(getClientIp(request), env as RateLimitEnv, rateConfig(env));
    if (rate.limited) return tooManyRequests("Too many requests", rate.retryAfter);

    const gas = await callGasJson(env, "songPools");
    return ok({ data: gas.data }, { headers: CACHE_HEADERS });
  } catch (err) {
    return serverError(err);
  }
};
