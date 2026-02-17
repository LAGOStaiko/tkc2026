import { badRequest, ok, serverError, tooManyRequests } from "../_lib/response";
import { callGasJson } from "../_lib/gas";
import { hitRateLimit, buildRateLimitConfig, getClientIp, type RateLimitEnv } from "../_lib/rate-limit";

const ALLOWED_PAGES = new Set(["home", "console", "arcade", "contact"]);
const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=60, s-maxage=180, stale-while-revalidate=180",
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

    const url = new URL(request.url);
    const page = (url.searchParams.get("page") || "").trim();

    if (!ALLOWED_PAGES.has(page)) {
      return badRequest("Invalid page. Use one of: home, console, arcade, contact");
    }

    const gas = await callGasJson(env, "content", { page });
    return ok({ data: gas.data }, { headers: CACHE_HEADERS });
  } catch (err) {
    return serverError(err);
  }
};
