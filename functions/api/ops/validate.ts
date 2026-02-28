import { z } from "zod";
import { badRequest, ok, serverError, withNoStore } from "../../_lib/response";
import { callGasJson } from "../../_lib/gas";
import { requireOpsAuth } from "../../_lib/ops-auth";

const schema = z.object({
  season: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().min(1).optional()
  ),
  region: z.preprocess(
    (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
    z.enum(["all", "seoul", "daejeon", "gwangju", "busan"]).optional()
  ),
});

export const onRequestPost = async ({ request, env }) => {
  const noStoreInit = withNoStore();
  try {
    const authError = requireOpsAuth(env, request);
    if (authError) return authError;

    const body = (await request.json().catch(() => ({}))) as unknown;
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return badRequest(
        parsed.error.issues[0]?.message ?? "Invalid payload",
        undefined,
        noStoreInit
      );
    }

    const gas = await callGasJson(env, "opsValidate", {}, {
      season: parsed.data.season ?? "2026",
      region: parsed.data.region ?? "all",
    });
    return ok({ data: gas.data }, noStoreInit);
  } catch (err) {
    return serverError(err, noStoreInit);
  }
};
