import { z } from "zod";
import { badRequest, ok, serverError, withNoStore } from "../../_lib/response";
import { callGasJson } from "../../_lib/gas";
import { requireOpsAuth } from "../../_lib/ops-auth";

const upsertSchema = z.object({
  stage: z
    .enum([
      "online",
      "swissMatch",
      "swissStanding",
      "decider",
      "seeding",
      "qualifier",
      "finalA",
      "finalB",
      "finalMatch",
    ])
    .optional(),
  season: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().min(1).optional()
  ),
  region: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().optional()
  ),
  keyFields: z.array(z.string()).optional(),
  row: z.record(z.string(), z.unknown()),
});

export const onRequestPost = async ({ request, env }) => {
  const noStoreInit = withNoStore();
  try {
    const authError = requireOpsAuth(env, request);
    if (authError) return authError;

    const body = (await request.json().catch(() => null)) as unknown;
    if (!body) return badRequest("Invalid JSON body", undefined, noStoreInit);

    const parsed = upsertSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(
        parsed.error.issues[0]?.message ?? "Invalid payload",
        undefined,
        noStoreInit
      );
    }

    const gas = await callGasJson(env, "opsUpsert", {}, parsed.data);
    return ok({ data: gas.data }, noStoreInit);
  } catch (err) {
    return serverError(err, noStoreInit);
  }
};
