import { ok, serverError } from "../_lib/response";
import { callGasJson } from "../_lib/gas";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=3, s-maxage=5, stale-while-revalidate=10",
};

export const onRequestGet = async ({ env }) => {
  try {
    const gas = await callGasJson(env, "results");
    const fullData = gas.data as Record<string, unknown> | undefined;
    const arcadeArchive2026 = fullData?.arcadeArchive2026 ?? null;
    return ok({ data: { arcadeArchive2026 } }, { headers: CACHE_HEADERS });
  } catch (err) {
    return serverError(err);
  }
};
