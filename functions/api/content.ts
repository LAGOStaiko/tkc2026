import { badRequest, ok, serverError, tooManyRequests } from "../_lib/response";
import { callGasJson } from "../_lib/gas";
import { hitRateLimit, buildRateLimitConfig, getClientIp, type RateLimitEnv } from "../_lib/rate-limit";
import { withEdgeCache } from "../_lib/edge-cache";

const ALLOWED_PAGES = new Set(["home", "console", "arcade", "contact"]);

const rateConfig = (env: RateLimitEnv) =>
  buildRateLimitConfig(env, {
    prefix: "api-content:rate-limit",
    defaultWindowMs: 60_000,
    defaultMax: 60,
  });

export const onRequestGet = async ({ env, request, waitUntil }) => {
  const url = new URL(request.url);
  const page = (url.searchParams.get("page") || "").trim();

  if (!ALLOWED_PAGES.has(page)) {
    return badRequest("Invalid page. Use one of: home, console, arcade, contact");
  }

  return withEdgeCache(
    { request, waitUntil },
    {
      ttlSeconds: 300,
      cacheKeyUrl: (u) => `${u.origin}${u.pathname}?page=${page}`,
    },
    async () => {
      try {
        const rate = await hitRateLimit(getClientIp(request), env as RateLimitEnv, rateConfig(env));
        if (rate.limited) return tooManyRequests("Too many requests", rate.retryAfter);

        const gas = await callGasJson(env, "content", { page });
        return ok({ data: gas.data });
      } catch (err) {
        return serverError(err);
      }
    },
  );
};
