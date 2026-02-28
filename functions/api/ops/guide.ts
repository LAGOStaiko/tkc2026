import { z } from "zod";
import { badRequest, ok, serverError, withNoStore } from "../../_lib/response";
import { callGasJson } from "../../_lib/gas";
import { requireOpsAuth } from "../../_lib/ops-auth";

const guideSchema = z.object({
  overwrite: z.boolean().optional(),
  sheetName: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().min(1).optional()
  ),
});

export const onRequestPost = async ({ request, env }) => {
  const noStoreInit = withNoStore();
  try {
    const authError = requireOpsAuth(env, request);
    if (authError) return authError;

    const body = (await request.json().catch(() => ({}))) as unknown;
    const parsed = guideSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(
        parsed.error.issues[0]?.message ?? "Invalid payload",
        undefined,
        noStoreInit
      );
    }

    const params: Record<string, unknown> = {
      overwrite: parsed.data.overwrite ?? true,
    };
    if (parsed.data.sheetName) params.sheetName = parsed.data.sheetName;

    const gas = await callGasJson(env, "opsGuide", params);
    return ok({ data: gas.data }, noStoreInit);
  } catch (err) {
    return serverError(err, noStoreInit);
  }
};
