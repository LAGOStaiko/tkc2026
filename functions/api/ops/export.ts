import { z } from "zod";
import { badRequest, ok, serverError } from "../../_lib/response";
import { callGasJson } from "../../_lib/gas";
import { requireOpsAuth } from "../../_lib/ops-auth";

const exportSchema = z.object({
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
  try {
    const authError = requireOpsAuth(env, request);
    if (authError) return authError;

    const body = (await request.json().catch(() => ({}))) as unknown;
    const parsed = exportSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "Invalid payload");
    }

    const payload = {
      season: parsed.data.season ?? "2026",
      region: parsed.data.region ?? "all",
    };

    const gas = await callGasJson(env, "opsExport", {}, payload);
    return ok({ data: gas.data });
  } catch (err) {
    return serverError(err);
  }
};
