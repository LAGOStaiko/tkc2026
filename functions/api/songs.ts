import { ok, serverError } from "../_lib/response";
import { callGasJson } from "../_lib/gas";

const CACHE_HEADERS = {
  // Short cache to absorb burst traffic while keeping near real-time updates.
  "Cache-Control": "public, max-age=5, s-maxage=20, stale-while-revalidate=30",
};

export const onRequestGet = async ({ env }) => {
  try {
    const gas = await callGasJson(env, "showcaseSongs");
    return ok({ data: gas.data }, { headers: CACHE_HEADERS });
  } catch (err) {
    return serverError(err);
  }
};
