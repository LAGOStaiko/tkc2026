import { ok, serverError, tooManyRequests } from "../_lib/response";
import { callGasJson } from "../_lib/gas";
import { hitRateLimit, buildRateLimitConfig, getClientIp, type RateLimitEnv } from "../_lib/rate-limit";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=300",
};

const rateConfig = (env: RateLimitEnv) =>
  buildRateLimitConfig(env, {
    prefix: "api-site:rate-limit",
    defaultWindowMs: 60_000, // 1 minute
    defaultMax: 180,         // 180 requests per minute
  });

export const onRequestGet = async ({ env, request }) => {
  try {
    const rate = await hitRateLimit(getClientIp(request), env as RateLimitEnv, rateConfig(env));
    if (rate.limited) return tooManyRequests("Too many requests", rate.retryAfter);

    const gas = await callGasJson(env, "site");
    return ok({ data: gas.data }, { headers: CACHE_HEADERS });
  } catch (err) {
    return serverError(err);
  }
};
