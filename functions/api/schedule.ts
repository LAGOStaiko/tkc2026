import { ok, serverError } from "../_lib/response";
import { callGasJson } from "../_lib/gas";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=20, s-maxage=90, stale-while-revalidate=120",
};

export const onRequestGet = async ({ env }) => {
  try {
    const gas = await callGasJson(env, "schedule");
    return ok({ data: gas.data }, { headers: CACHE_HEADERS });
  } catch (err) {
    return serverError(err);
  }
};
