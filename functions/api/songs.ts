import { ok, serverError, tooManyRequests } from "../_lib/response";
import { callGasJson } from "../_lib/gas";
import { hitRateLimit, buildRateLimitConfig, getClientIp, type RateLimitEnv } from "../_lib/rate-limit";
import { withEdgeCache } from "../_lib/edge-cache";

const rateConfig = (env: RateLimitEnv) =>
  buildRateLimitConfig(env, {
    prefix: "api-songs:rate-limit",
    defaultWindowMs: 60_000,
    defaultMax: 60,
  });

export const onRequestGet = async ({ env, request, waitUntil }) => {
  return withEdgeCache(
    { request, waitUntil },
    { ttlSeconds: 180 },
    async () => {
      try {
        const rate = await hitRateLimit(getClientIp(request), env as RateLimitEnv, rateConfig(env));
        if (rate.limited) return tooManyRequests("Too many requests", rate.retryAfter);

        const gas = await callGasJson(env, "showcaseSongs");
        return ok({ data: gas.data });
      } catch (err) {
        return serverError(err);
      }
    },
  );
};
