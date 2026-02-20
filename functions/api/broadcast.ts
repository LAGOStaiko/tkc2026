import { ok, serverError, tooManyRequests } from "../_lib/response";
import { callGasJson } from "../_lib/gas";
import { hitRateLimit, buildRateLimitConfig, getClientIp, type RateLimitEnv } from "../_lib/rate-limit";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=3, s-maxage=5, stale-while-revalidate=10",
};

const rateConfig = (env: RateLimitEnv) =>
  buildRateLimitConfig(env, {
    prefix: "api-broadcast:rate-limit",
    defaultWindowMs: 60_000,
    defaultMax: 60,
  });

export const onRequestGet = async ({ env, request }) => {
  try {
    const rate = await hitRateLimit(getClientIp(request), env as RateLimitEnv, rateConfig(env));
    if (rate.limited) return tooManyRequests("Too many requests", rate.retryAfter);

    const gas = await callGasJson(env, "results");
    const fullData = gas.data as Record<string, unknown> | undefined;
    const arcadeArchive2026 = fullData?.arcadeArchive2026 ?? null;
    return ok({ data: { arcadeArchive2026 } }, { headers: CACHE_HEADERS });
  } catch (err) {
    return serverError(err);
  }
};
