/**
 * Edge Cache utility using Cloudflare Cache API.
 *
 * Caches successful (200) responses at the edge to reduce GAS calls.
 * All Cache API errors are swallowed (fail-open) so the API always works.
 */

/* ── Types ── */

export type EdgeCacheContext = {
  request: Request;
  waitUntil: (promise: Promise<unknown>) => void;
};

export type EdgeCacheOptions = {
  /** Edge cache TTL in seconds. Browser always gets max-age=0 (revalidate). */
  ttlSeconds: number;
  /**
   * Optional function to build a normalised cache key URL.
   * Receives the original request URL and should return a clean URL string
   * with only the query params that matter for this endpoint.
   * If omitted, default key is origin + pathname (all query params removed).
   */
  cacheKeyUrl?: (url: URL) => string;
};

const MIN_TTL = 5;

/* ── Helpers ── */

function clampTtl(ttl: number): number {
  if (!Number.isFinite(ttl) || ttl < MIN_TTL) return MIN_TTL;
  return Math.floor(ttl);
}

/** Strip all query params → use origin+pathname only. */
function stripQuery(url: URL): string {
  return `${url.origin}${url.pathname}`;
}

function buildCacheKey(request: Request, cacheKeyUrl?: (url: URL) => string): Request {
  try {
    const url = new URL(request.url);
    const key = cacheKeyUrl ? cacheKeyUrl(url) : stripQuery(url);
    return new Request(key, { method: "GET" });
  } catch {
    // Fallback: use origin+pathname from request URL directly
    return new Request(request.url.split("?")[0], { method: "GET" });
  }
}

function applyCacheHeaders(response: Response, ttlSeconds: number): Response {
  const ttl = clampTtl(ttlSeconds);
  const headers = new Headers(response.headers);
  // Browser: always revalidate. Edge: cache for ttlSeconds.
  headers.set(
    "Cache-Control",
    `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=${Math.max(ttl, 30)}`
  );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/* ── Public API ── */

/**
 * Wrap an API handler with edge caching.
 *
 * 1. Check Cloudflare edge cache → hit → return immediately
 * 2. Miss → run handler (rate-limit + GAS call)
 * 3. If handler returns 200, store in edge cache
 * 4. Cache API errors are silently ignored (fail-open)
 */
export async function withEdgeCache(
  ctx: EdgeCacheContext,
  options: EdgeCacheOptions,
  handler: () => Promise<Response>,
): Promise<Response> {
  const { ttlSeconds, cacheKeyUrl } = options;
  const cacheKey = buildCacheKey(ctx.request, cacheKeyUrl);

  // 1. Try edge cache
  try {
    const cache = caches.default;
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  } catch {
    // fail-open: cache unavailable, proceed to handler
  }

  // 2. Run handler (rate-limit + GAS)
  const response = await handler();

  // 3. Cache only successful responses
  if (response.status === 200) {
    const toCache = applyCacheHeaders(response.clone(), ttlSeconds);
    try {
      const cache = caches.default;
      ctx.waitUntil(cache.put(cacheKey, toCache));
    } catch {
      // fail-open: cache write failed, response still returned
    }
  }

  // 4. Apply consistent cache headers to the live response too
  if (response.status === 200) {
    return applyCacheHeaders(response, ttlSeconds);
  }

  return response;
}
