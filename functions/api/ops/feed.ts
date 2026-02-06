import { ok, serverError } from "../../_lib/response";
import { callGasJson } from "../../_lib/gas";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=3, s-maxage=5, stale-while-revalidate=10",
};

export const onRequestGet = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const season = url.searchParams.get("season")?.trim() || "2026";
    const region = url.searchParams.get("region")?.trim() || "";

    const params: Record<string, unknown> = { season };
    if (region) params.region = region;

    const gas = await callGasJson(env, "opsFeed", params);
    return ok({ data: gas.data }, { headers: CACHE_HEADERS });
  } catch (err) {
    return serverError(err);
  }
};
