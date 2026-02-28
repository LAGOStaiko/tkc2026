import { z } from "zod";
import { badRequest, ok, serverError, withNoStore } from "../../_lib/response";
import { callGasJson } from "../../_lib/gas";
import { requireOpsAuth } from "../../_lib/ops-auth";

const initSchema = z.object({
  scope: z.enum(["ops", "all"]).optional(),
});

export const onRequestPost = async ({ request, env }) => {
  const noStoreInit = withNoStore();
  try {
    const authError = requireOpsAuth(env, request);
    if (authError) return authError;

    const body = (await request.json().catch(() => ({}))) as unknown;
    const parsed = initSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(
        parsed.error.issues[0]?.message ?? "Invalid payload",
        undefined,
        noStoreInit
      );
    }

    const params = { scope: parsed.data.scope ?? "ops" };
    const gas = await callGasJson(env, "opsInit", params);
    return ok({ data: gas.data }, noStoreInit);
  } catch (err) {
    return serverError(err, noStoreInit);
  }
};
