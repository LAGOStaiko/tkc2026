import { z } from "zod";
import { badRequest, ok, serverError } from "../../_lib/response";
import { callGasJson } from "../../_lib/gas";
import { requireOpsAuth } from "../../_lib/ops-auth";

const schema = z.object({
  snapshotId: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().min(1, "snapshotId is required")
  ),
});

export const onRequestPost = async ({ request, env }) => {
  try {
    const authError = requireOpsAuth(env, request);
    if (authError) return authError;

    const body = (await request.json().catch(() => ({}))) as unknown;
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "Invalid payload");
    }

    const gas = await callGasJson(env, "opsRollback", {}, {
      snapshotId: parsed.data.snapshotId,
    });
    return ok({ data: gas.data });
  } catch (err) {
    return serverError(err);
  }
};
