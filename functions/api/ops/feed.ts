import { ok, serverError } from "../../_lib/response";
import { callGasJson } from "../../_lib/gas";
import { requireOpsAuth } from "../../_lib/ops-auth";

const CACHE_HEADERS = {
  "Cache-Control": "private, no-store",
  Vary: "Authorization, X-OPS-Key",
};

export const onRequestGet = async ({ request, env }) => {
  try {
    const authErr = requireOpsAuth(env, request);
    if (authErr) return authErr;
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
