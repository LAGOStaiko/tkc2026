import { ok, serverError } from "../_lib/response";
import { callGasJson } from "../_lib/gas";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=60, s-maxage=180, stale-while-revalidate=300",
};

export const onRequestGet = async ({ env }) => {
  try {
    const gas = await callGasJson(env, "songPools");
    return ok({ data: gas.data }, { headers: CACHE_HEADERS });
  } catch (err) {
    return serverError(err);
  }
};
